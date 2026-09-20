import { NextResponse } from "next/server";
import { handleRouteError, parseBody, requireUser } from "@/lib/api";
import { learningActivitySchema } from "@/lib/contracts";
import { enforceRateLimit, idempotent } from "@/lib/route-utils";

export async function POST(request: Request) {
  try {
    const { user, supabase } = await requireUser(request);
    enforceRateLimit(user.id);
    const input = parseBody(learningActivitySchema, await request.json());
    const response = await idempotent(supabase, user.id, "/api/path/activity", request.headers.get("idempotency-key"), async () => {
      const { error } = await supabase.from("learning_activity").insert({ user_id: user.id, path_item_id: input.path_item_id, type: input.type, duration_ms: input.duration_ms, correct: input.correct });
      if (error) throw error;
      if (input.path_item_id && input.progress !== undefined) {
        const status = input.type === "resource_completed" || input.progress === 1 ? "done" : input.type === "path_skipped" ? "skipped" : "active";
        const { error: updateError } = await supabase.from("learning_path_items").update({ progress: input.progress, status, updated_at: new Date().toISOString() }).eq("id", input.path_item_id);
        if (updateError) throw updateError;
      }
      const { data: twin } = await supabase.from("learning_twin").select("version,metrics").eq("user_id", user.id).maybeSingle();
      const metrics = (twin?.metrics ?? {}) as Record<string, unknown>;
      const previousRetention = Number(metrics.retention_est ?? .5);
      const previousFocus = Number(metrics.focus_span_min ?? 25);
      const nextMetrics = { ...metrics, observed_events: Number(metrics.observed_events ?? 0) + 1 } as Record<string, unknown>;
      if (input.type === "quiz_answer" && input.correct !== undefined) nextMetrics.retention_est = Number((.7 * previousRetention + .3 * Number(input.correct)).toFixed(3));
      if (input.type === "focus_end" && input.duration_ms) nextMetrics.focus_span_min = Math.round(.7 * previousFocus + .3 * Math.min(90, input.duration_ms / 60_000));
      if (input.type === "hint_used") nextMetrics.hint_rate = Number((Number(metrics.hint_rate ?? 0) * .7 + .3).toFixed(3));
      await supabase.from("learning_twin").upsert({ user_id: user.id, version: (twin?.version ?? 0) + 1, metrics: nextMetrics, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
      return { tracked: true, twin: { retention_est: nextMetrics.retention_est, focus_span_min: nextMetrics.focus_span_min } };
    });
    return NextResponse.json(response);
  } catch (error) { return handleRouteError(error); }
}
