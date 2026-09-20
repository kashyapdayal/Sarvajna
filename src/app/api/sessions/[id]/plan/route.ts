import { NextResponse } from "next/server";
import { assertSessionOwner, handleRouteError, requireUser } from "@/lib/api";
import { makePlan, TriageItem } from "@/lib/rescue-engine";
import { enforceRateLimit, idempotent } from "@/lib/route-utils";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { supabase } = await requireUser(request);
    const session = await assertSessionOwner(supabase, params.id);
    const version = new URL(request.url).searchParams.get("version") ?? session.plan_version;
    const { data, error } = await supabase.from("plan_blocks").select("*,topics(id,title,key)")
      .eq("session_id", session.id).eq("plan_version", version).order("seq");
    if (error) throw error;
    return NextResponse.json({ plan_version: Number(version), blocks: data ?? [] });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { user, supabase } = await requireUser(request);
    enforceRateLimit(user.id);
    const session = await assertSessionOwner(supabase, params.id);
    const response = await idempotent(supabase, user.id, `/api/sessions/${params.id}/plan`, request.headers.get("idempotency-key"), async () => {
      const triage = session.triage as { selected?: TriageItem[]; status?: string } | null;
      if (!triage?.selected?.length) return { status: "NEEDS_INPUT", message: "Run triage after topics are ready before building the plan." };
      const [{ data: exam, error: examError }, { data: twin }] = await Promise.all([
        supabase.from("exams").select("exam_start").eq("id", session.exam_id).single(),
        supabase.from("learning_twin").select("metrics").eq("user_id", user.id).maybeSingle(),
      ]);
      if (examError) throw examError;
      const metrics = (twin?.metrics ?? {}) as { focus_span_min?: number };
      const blocks = makePlan(triage.selected, new Date(), new Date(exam.exam_start), metrics.focus_span_min ?? 25);
      const version = session.plan_version + 1;
      const rows = blocks.map((block) => ({ ...block, session_id: session.id, plan_version: version }));
      const { error: insertError } = await supabase.from("plan_blocks").insert(rows);
      if (insertError) throw insertError;
      const { error: updateError } = await supabase.from("rescue_sessions").update({ state: "PLANNED", plan_version: version }).eq("id", session.id);
      if (updateError) throw updateError;
      await supabase.from("events").insert({ user_id: user.id, session_id: session.id, type: "plan_created", payload: { plan_version: version } });
      return { plan_version: version, blocks };
    });
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
