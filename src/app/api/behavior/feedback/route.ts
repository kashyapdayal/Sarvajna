import { NextResponse } from "next/server";
import { analyzeLearningBehavior } from "@/lib/behavior-agent";
import { assertSessionOwner, handleRouteError, parseBody, requireUser } from "@/lib/api";
import { behaviorFeedbackSchema } from "@/lib/contracts";
import { enforceRateLimit, idempotent } from "@/lib/route-utils";

export async function POST(request: Request) {
  try {
    const { user, supabase } = await requireUser(request);
    enforceRateLimit(user.id);
    const input = parseBody(behaviorFeedbackSchema, await request.json());
    const session = await assertSessionOwner(supabase, input.session_id);
    const response = await idempotent(supabase, user.id, "/api/behavior/feedback", request.headers.get("idempotency-key"), async () => {
      const { data: twin } = await supabase.from("learning_twin").select("version,metrics").eq("user_id", user.id).maybeSingle();
      const result = analyzeLearningBehavior((twin?.metrics ?? {}) as Record<string, unknown>, input);
      const { error: twinError } = await supabase.from("learning_twin").upsert({ user_id: user.id, version: (twin?.version ?? 0) + 1, metrics: result.metrics, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
      if (twinError) throw twinError;
      await supabase.from("events").insert({ user_id: user.id, session_id: session.id, type: "behavior_feedback", payload: input });
      await supabase.from("agent_runs").insert({ session_id: session.id, agent: "R12", output: result, status: "ok" });
      return result;
    });
    return NextResponse.json(response);
  } catch (error) { return handleRouteError(error); }
}
