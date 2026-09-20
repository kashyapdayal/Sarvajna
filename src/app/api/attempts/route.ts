import { NextResponse } from "next/server";
import { handleRouteError, parseBody, requireUser } from "@/lib/api";
import { attemptSchema } from "@/lib/contracts";
import { enforceRateLimit, idempotent } from "@/lib/route-utils";

const normalized = (value: unknown) => JSON.stringify(value).trim().toLowerCase();

export async function POST(request: Request) {
  try {
    const { user, supabase } = await requireUser(request);
    enforceRateLimit(user.id);
    const input = parseBody(attemptSchema, await request.json());
    const response = await idempotent(supabase, user.id, "/api/attempts", request.headers.get("idempotency-key"), async () => {
      const { data: item, error } = await supabase.from("quiz_items").select("id,answer,marks,quiz_id,quizzes!inner(session_id,topic_id)").eq("id", input.quiz_item_id).single();
      if (error || !item) throw new Error("NOT_FOUND");
      const correct = normalized(item.answer) === normalized(input.response);
      const score = correct ? Number(item.marks) : 0;
      const { data: attempt, error: attemptError } = await supabase.from("attempts").insert({
        user_id: user.id, quiz_item_id: item.id, response: input.response, correct, score, time_ms: input.time_ms, hints_used: input.hints, confidence_self: input.confidence_self,
      }).select().single();
      if (attemptError) throw attemptError;
      const quiz = Array.isArray(item.quizzes) ? item.quizzes[0] : item.quizzes;
      if (!correct) await supabase.from("mistakes").insert({ user_id: user.id, attempt_id: attempt.id, topic_id: quiz?.topic_id, error_type: "recall", explanation: "This recall item needs one short correction pass." });
      if (quiz?.session_id) await supabase.from("events").insert({ user_id: user.id, session_id: quiz.session_id, type: "quiz_answer", payload: { quiz_item_id: item.id, correct, score, time_ms: input.time_ms } });
      return { attempt, correct, score, feedback: correct ? "Correct. Keep moving." : "Not quite. Review the short note, then try one more recall item." };
    });
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
