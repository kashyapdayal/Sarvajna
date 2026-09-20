import { NextResponse } from "next/server";
import { analyzeLearningBehavior } from "@/lib/behavior-agent";
import { handleRouteError, parseBody, requireUser } from "@/lib/api";
import { quickCramFeedbackSchema } from "@/lib/contracts";
import { enforceRateLimit, idempotent } from "@/lib/route-utils";

export async function POST(request: Request) {
  try {
    const { user, supabase } = await requireUser(request);
    enforceRateLimit(user.id);
    const input = parseBody(quickCramFeedbackSchema, await request.json());
    const response = await idempotent(supabase, user.id, "/api/quick-cram/feedback", request.headers.get("idempotency-key"), async () => {
      const { data: twin, error } = await supabase.from("learning_twin").select("version,metrics").eq("user_id", user.id).maybeSingle();
      if (error) throw error;
      const result = analyzeLearningBehavior((twin?.metrics ?? {}) as Record<string, unknown>, input);
      const metrics = { ...result.metrics, last_quick_cram_topic: input.topic, last_recall_ratio: input.correct_ratio };
      const { error: updateError } = await supabase.from("learning_twin").upsert({ user_id: user.id, version: (twin?.version ?? 0) + 1, metrics, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
      if (updateError) throw updateError;
      return { adaptation: result.adaptation };
    });
    return NextResponse.json(response);
  } catch (error) {
    return handleRouteError(error);
  }
}
