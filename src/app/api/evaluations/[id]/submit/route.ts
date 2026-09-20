import { NextResponse } from "next/server";
import { gradeWrittenAnswer } from "@/lib/ai";
import { analyzeLearningBehavior } from "@/lib/behavior-agent";
import { handleRouteError, parseBody, requireUser } from "@/lib/api";
import { evaluationSubmitSchema } from "@/lib/contracts";
import { enforceRateLimit, idempotent } from "@/lib/route-utils";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { user, supabase } = await requireUser(request);
    enforceRateLimit(user.id);
    const input = parseBody(evaluationSubmitSchema, await request.json());
    const response = await idempotent(supabase, user.id, `/api/evaluations/${params.id}/submit`, request.headers.get("idempotency-key"), async () => {
      const { data: quiz, error: quizError } = await supabase.from("quizzes").select("id,session_id,quiz_items(id,q_type,stem,answer,rubric,marks)").eq("id", params.id).single();
      if (quizError || !quiz) throw new Error("NOT_FOUND");
      const items = new Map((quiz.quiz_items ?? []).map((item) => [item.id, item]));
      let earned = 0;
      let available = 0;
      const results = [];
      for (const answer of input.answers) {
        const item = items.get(answer.quiz_item_id);
        if (!item) continue;
        available += Number(item.marks);
        let ratio = 0;
        let feedback = "";
        let errorType = "recall";
        if (item.q_type === "mcq") {
          ratio = Number(item.answer) === Number(answer.response) ? 1 : 0;
          feedback = ratio ? "Correct." : "Review the matching concept, then retry one recall question.";
        } else {
          const grade = await gradeWrittenAnswer(item.stem, String(item.answer), item.rubric ?? "Award credit for the core idea.", String(answer.response));
          ratio = grade.score_ratio; feedback = grade.feedback; errorType = grade.error_type;
        }
        const score = Number((ratio * Number(item.marks)).toFixed(2));
        earned += score;
        const { data: attempt, error: attemptError } = await supabase.from("attempts").insert({ user_id: user.id, quiz_item_id: item.id, response: answer.response, correct: ratio >= .7, score, time_ms: answer.time_ms, hints_used: 0 }).select().single();
        if (attemptError) throw attemptError;
        if (ratio < .7) await supabase.from("mistakes").insert({ user_id: user.id, attempt_id: attempt.id, error_type: errorType, explanation: feedback });
        results.push({ quiz_item_id: item.id, score, max_marks: item.marks, feedback });
      }
      const ratio = available ? earned / available : 0;
      const { data: twin } = await supabase.from("learning_twin").select("version,metrics").eq("user_id", user.id).maybeSingle();
      const behavior = analyzeLearningBehavior((twin?.metrics ?? {}) as Record<string, unknown>, { correct_ratio: ratio, time_spent_min: Math.round(input.answers.reduce((sum, answer) => sum + answer.time_ms, 0) / 60_000), feels_difficult: ratio < .5 });
      await supabase.from("learning_twin").upsert({ user_id: user.id, version: (twin?.version ?? 0) + 1, metrics: behavior.metrics, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
      await supabase.from("events").insert({ user_id: user.id, session_id: quiz.session_id, type: "evaluation_completed", payload: { score_ratio: ratio } });
      await supabase.from("agent_runs").insert({ session_id: quiz.session_id, agent: "R12", output: behavior, status: "ok" });
      return { score: earned, max_score: available, score_ratio: Number(ratio.toFixed(3)), results, adaptation: behavior.adaptation };
    });
    return NextResponse.json(response);
  } catch (error) { return handleRouteError(error); }
}
