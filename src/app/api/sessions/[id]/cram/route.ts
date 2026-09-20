import { NextResponse } from "next/server";
import { createCramPack } from "@/lib/ai";
import { assertSessionOwner, handleRouteError, requireUser } from "@/lib/api";
import { config } from "@/lib/config";
import { sessionStudyMaterial } from "@/lib/study-material";
import { enforceRateLimit, hoursUntil, idempotent } from "@/lib/route-utils";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    if (!config.features.cramMode) return NextResponse.json({ error: { code: "FEATURE_DISABLED", message_user: "Cram Mode is currently unavailable.", message_dev: "FEATURE_CRAM_MODE=false", retryable: false } }, { status: 403 });
    const { user, supabase } = await requireUser(request);
    enforceRateLimit(user.id);
    const session = await assertSessionOwner(supabase, params.id);
    const response = await idempotent(supabase, user.id, `/api/sessions/${params.id}/cram`, request.headers.get("idempotency-key"), async () => {
      const [{ data: exam, error: examError }, sourceText] = await Promise.all([
        supabase.from("exams").select("subject,exam_start").eq("id", session.exam_id).single(),
        sessionStudyMaterial(supabase, session.exam_id),
      ]);
      if (examError) throw examError;
      if (!sourceText) return { status: "NEEDS_INPUT", message: "Upload and process study material before generating your Cram Mode pack." };
      const pack = await createCramPack(exam.subject, hoursUntil(exam.exam_start), sourceText);
      const { data: savedTopics, error: topicError } = await supabase.from("topics").upsert(pack.topics.map((topic) => ({
        exam_id: session.exam_id, key: topic.key, title: topic.title, unit: topic.unit, complexity: topic.complexity, source: "inferred", verified: false,
      })), { onConflict: "exam_id,key" }).select("id,key");
      if (topicError) throw topicError;
      const topicByKey = new Map((savedTopics ?? []).map((topic) => [topic.key, topic.id]));
      const topicStats = pack.topics.flatMap((topic) => {
        const id = topicByKey.get(topic.key);
        return id ? [{ exam_id: session.exam_id, topic_id: id, p_appear: .5, avg_marks: 5, expected_marks: 2.5 }] : [];
      });
      if (topicStats.length) await supabase.from("topic_stats").upsert(topicStats, { onConflict: "exam_id,topic_id" });
      const notes = pack.topics.flatMap((topic) => {
        const topicId = topicByKey.get(topic.key);
        return topicId ? [{ topic_id: topicId, session_id: session.id, layer: "L3m", content_md: topic.summary, citations: topic.citations, grounded: topic.citations.length > 0, verified: false, lang: "en" }] : [];
      });
      if (notes.length) await supabase.from("notes").upsert(notes, { onConflict: "topic_id,session_id,layer,lang" });
      const cards = pack.flashcards.flatMap((card) => {
        const topicId = topicByKey.get(card.topic_key);
        return topicId ? [{ topic_id: topicId, session_id: session.id, front: card.front, back: card.back, difficulty: card.difficulty }] : [];
      });
      if (cards.length) await supabase.from("flashcards").insert(cards);
      const { data: quiz, error: quizError } = await supabase.from("quizzes").insert({ session_id: session.id, kind: "diagnostic" }).select().single();
      if (quizError) throw quizError;
      const quizItems = pack.quiz_items.map((item) => ({ quiz_id: quiz.id, q_type: "mcq", stem: item.stem, options: item.options, answer: item.answer_index, misconception_tag: "rapid-recall", difficulty: item.difficulty, marks: 1 }));
      if (quizItems.length) await supabase.from("quiz_items").insert(quizItems);
      await supabase.from("cheat_sheets").upsert({ session_id: session.id, subject: exam.subject, content: { sections: [{ title: "Cram essentials", items: pack.cheat_sheet }] }, verified: false, version: 1 }, { onConflict: "session_id,version" });
      await supabase.from("rescue_sessions").update({ state: "TRIAGED" }).eq("id", session.id);
      await supabase.from("events").insert({ user_id: user.id, session_id: session.id, type: "cram_pack_ready", payload: { topics: pack.topics.length, flashcards: cards.length } });
      return { status: "READY", topics: pack.topics.length, flashcards: cards.length, quiz_id: quiz.id };
    });
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
