import { NextResponse } from "next/server";
import { createAdaptiveEvaluation } from "@/lib/ai";
import { assertSessionOwner, handleRouteError, requireUser } from "@/lib/api";
import { sessionStudyMaterial } from "@/lib/study-material";
import { enforceRateLimit, idempotent } from "@/lib/route-utils";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { user, supabase } = await requireUser(request);
    enforceRateLimit(user.id);
    const session = await assertSessionOwner(supabase, params.id);
    const response = await idempotent(supabase, user.id, `/api/sessions/${params.id}/evaluation`, request.headers.get("idempotency-key"), async () => {
      const [{ data: twin }, material] = await Promise.all([
        supabase.from("learning_twin").select("metrics").eq("user_id", user.id).maybeSingle(),
        sessionStudyMaterial(supabase, session.exam_id),
      ]);
      if (!material) return { status: "NEEDS_INPUT", message: "Add and process material before starting an evaluation." };
      const evaluation = await createAdaptiveEvaluation(material, twin?.metrics ?? {});
      const { data: quiz, error: quizError } = await supabase.from("quizzes").insert({ session_id: session.id, kind: "mock" }).select().single();
      if (quizError) throw quizError;
      const { error: itemError } = await supabase.from("quiz_items").insert(evaluation.items.map((item) => ({ quiz_id: quiz.id, q_type: item.q_type, stem: item.stem, options: item.options ?? null, answer: item.answer, rubric: item.rubric, difficulty: item.difficulty, marks: item.marks })));
      if (itemError) throw itemError;
      await supabase.from("rescue_sessions").update({ state: "DIAGNOSING" }).eq("id", session.id);
      return { quiz_id: quiz.id, item_count: evaluation.items.length };
    });
    return NextResponse.json(response, { status: 201 });
  } catch (error) { return handleRouteError(error); }
}
