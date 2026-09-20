import { NextResponse } from "next/server";
import { assertSessionOwner, handleRouteError, requireUser } from "@/lib/api";
import { enforceRateLimit, idempotent } from "@/lib/route-utils";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { user, supabase } = await requireUser(request);
    enforceRateLimit(user.id);
    const session = await assertSessionOwner(supabase, params.id);
    const response = await idempotent(supabase, user.id, `/api/sessions/${params.id}/panic`, request.headers.get("idempotency-key"), async () => {
      const { data: nextBlock, error } = await supabase.from("plan_blocks").select("*,topics(title)")
        .eq("session_id", session.id).eq("plan_version", session.plan_version).in("status", ["todo", "active"])
        .in("type", ["LEARN", "RECALL", "REVIEW"]).order("seq").limit(1).maybeSingle();
      if (error) throw error;
      await supabase.from("rescue_sessions").update({ state: "PANIC" }).eq("id", session.id);
      await supabase.from("events").insert({ user_id: user.id, session_id: session.id, type: "panic_pressed", payload: { next_block_id: nextBlock?.id } });
      return {
        breathing_seconds: 60,
        message: "Pause. Take one slow breath. You only need the next small step.",
        next_task: nextBlock ? { id: nextBlock.id, title: (nextBlock.topics as { title?: string } | null)?.title ?? nextBlock.type, minutes: Math.min(5, nextBlock.planned_min), done_condition: nextBlock.done_condition } : null,
      };
    });
    return NextResponse.json(response);
  } catch (error) {
    return handleRouteError(error);
  }
}
