import { NextResponse } from "next/server";
import { assertSessionOwner, handleRouteError, requireUser } from "@/lib/api";
import { focusMinutes, triageTopics } from "@/lib/rescue-engine";
import { enforceRateLimit, hoursUntil, idempotent } from "@/lib/route-utils";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { user, supabase } = await requireUser(request);
    enforceRateLimit(user.id);
    const session = await assertSessionOwner(supabase, params.id);
    const response = await idempotent(supabase, user.id, `/api/sessions/${params.id}/triage`, request.headers.get("idempotency-key"), async () => {
      const [{ data: exam, error: examError }, { data: topicRows, error: topicError }, { data: twin }] = await Promise.all([
        supabase.from("exams").select("exam_start,pass_percent,total_marks").eq("id", session.exam_id).single(),
        supabase.from("topics").select("id,title,unit,complexity,topic_stats(p_appear,avg_marks,expected_marks)").eq("exam_id", session.exam_id),
        supabase.from("learning_twin").select("metrics").eq("user_id", user.id).maybeSingle(),
      ]);
      if (examError) throw examError;
      if (topicError) throw topicError;
      if (!topicRows?.length) return { status: "NEEDS_INPUT", message: "Add or confirm topics before creating a rescue plan." };
      const metrics = (twin?.metrics ?? {}) as { declared_hours?: number; topic_mastery?: Record<string, number> };
      const mastery = metrics.topic_mastery ?? {};
      const topics = topicRows.map((topic) => {
        const stats = Array.isArray(topic.topic_stats) ? topic.topic_stats[0] : topic.topic_stats;
        return {
          id: topic.id, title: topic.title, unit: topic.unit, complexity: topic.complexity,
          pAppear: Number(stats?.p_appear ?? 0.02), avgMarks: Number(stats?.avg_marks ?? 1),
          expectedMarks: Number(stats?.expected_marks ?? 0), mastery: Number(mastery[topic.id] ?? 0),
        };
      });
      const studyMinutes = focusMinutes(hoursUntil(exam.exam_start), metrics.declared_hours);
      const triage = triageTopics(topics, studyMinutes, Number(exam.pass_percent), Number(exam.total_marks), !twin);
      const { error } = await supabase.from("rescue_sessions").update({
        state: "TRIAGED", triage, predicted_score: triage.expectedScore, sigma: triage.sigma, pass_confidence: triage.passConfidence,
      }).eq("id", session.id);
      if (error) throw error;
      await supabase.from("events").insert({ user_id: user.id, session_id: session.id, type: "triage_completed", payload: { status: triage.status } });
      return triage;
    });
    return NextResponse.json(response);
  } catch (error) {
    return handleRouteError(error);
  }
}
