import { NextResponse } from "next/server";
import { assertSessionOwner, handleRouteError, parseBody, requireUser } from "@/lib/api";
import { behaviorSchema } from "@/lib/contracts";
import { enforceRateLimit, idempotent } from "@/lib/route-utils";

export async function POST(request: Request) {
  try {
    const { user, supabase } = await requireUser(request);
    enforceRateLimit(user.id);
    const input = parseBody(behaviorSchema, await request.json());
    await assertSessionOwner(supabase, input.session_id);
    const response = await idempotent(supabase, user.id, "/api/behavior", request.headers.get("idempotency-key"), async () => {
      const metrics = {
        ...input.answers,
        speed_factor: 1,
        retention_est: 0.5,
        plan_adherence: 0,
        observed_sessions: 0,
        topic_mastery: {},
      };
      const { data: twin, error } = await supabase.from("learning_twin")
        .upsert({ user_id: user.id, version: 1, metrics, updated_at: new Date().toISOString() }, { onConflict: "user_id" })
        .select().single();
      if (error) throw error;
      await supabase.from("rescue_sessions").update({ state: "ANALYZING" }).eq("id", input.session_id);
      await supabase.from("events").insert({ user_id: user.id, session_id: input.session_id, type: "behavior_completed", payload: input.answers });
      return { twin };
    });
    return NextResponse.json(response);
  } catch (error) {
    return handleRouteError(error);
  }
}
