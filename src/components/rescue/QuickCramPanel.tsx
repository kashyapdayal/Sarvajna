"use client";

import { FormEvent, useMemo, useState } from "react";
import { Brain, CheckCircle2, ChevronRight, Clock3, Lightbulb, RotateCcw, Sparkles } from "lucide-react";
import { supabaseBrowser, supabaseBrowserConfigurationError } from "@/lib/supabase-browser";

type StudyMode = "read" | "write" | "practice" | "mixed";
type Topic = {
  key: string;
  title: string;
  summary: string;
  worked_example?: string;
  answer_skeleton?: string[];
  must_know_questions: string[];
};
type Flashcard = { topic_key: string; front: string; back: string; difficulty: number };
type Pack = { topics: Topic[]; flashcards: Flashcard[]; quiz_items: unknown[]; cheat_sheet: string[] };

const modes: Array<{ id: StudyMode; label: string }> = [
  { id: "mixed", label: "Mixed" },
  { id: "read", label: "Read → recall" },
  { id: "write", label: "Write from memory" },
  { id: "practice", label: "Worked problems" },
];

export function QuickCramPanel() {
  const [topic, setTopic] = useState("");
  const [hours, setHours] = useState("4");
  const [mode, setMode] = useState<StudyMode>("mixed");
  const [status, setStatus] = useState("");
  const [pack, setPack] = useState<Pack | null>(null);
  const [topicIndex, setTopicIndex] = useState(0);
  const [step, setStep] = useState<"learn" | "recall" | "retry">("learn");
  const [recallAnswer, setRecallAnswer] = useState("");
  const [answerRevealed, setAnswerRevealed] = useState(false);
  const [reviewNote, setReviewNote] = useState("");
  const [recallStartedAt, setRecallStartedAt] = useState<number | null>(null);

  const activeTopic = pack?.topics[topicIndex] ?? null;
  const activeCard = useMemo(() => {
    if (!pack || !activeTopic) return null;
    return pack.flashcards.find((card) => card.topic_key === activeTopic.key) ?? pack.flashcards[topicIndex] ?? null;
  }, [activeTopic, pack, topicIndex]);

  async function generate(event: FormEvent) {
    event.preventDefault();
    if (!supabaseBrowser) {
      setStatus(supabaseBrowserConfigurationError ?? "Authentication is not configured.");
      return;
    }
    const session = await supabaseBrowser.auth.getSession();
    if (!session.data.session) {
      setStatus("Your session has expired. Please sign in again to build a Cram Mode pack.");
      return;
    }
    setStatus("Selecting Pass Core concepts and preparing your first recall block…");
    setPack(null);
    try {
      const response = await fetch("/api/cram/quick", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.data.session.access_token}` },
        body: JSON.stringify({ topic, hours_remaining: Number(hours), language: "English", study_mode: mode }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setStatus(data?.error?.message_user ?? "We could not build the quick pack.");
        return;
      }
      setPack(data.pack);
      setTopicIndex(0);
      setStep("learn");
      setRecallAnswer("");
      setAnswerRevealed(false);
      setReviewNote("");
      const sourceNote = data.grounded ? "Pass Core is grounded in your uploaded material." : "Pass Core uses online AI-assisted research; verify it against your syllabus.";
      setStatus(data.study_mode !== mode ? `${sourceNote} Your saved performance selected a ${data.study_mode} first block.` : sourceNote);
    } catch {
      setStatus("We could not reach the Cram service. Check your connection and try again.");
    }
  }

  function startRecall() {
    setStep("recall");
    setRecallAnswer("");
    setAnswerRevealed(false);
    setRecallStartedAt(Date.now());
  }

  async function scoreRecall(result: "retry" | "mostly" | "got-it") {
    const retryText = result === "got-it"
      ? "Good retrieval. Recheck this once before sleep and once before the exam."
      : result === "mostly"
        ? "Keep this in rotation: retry it in about 20–40 minutes, then before sleep."
        : "Treat this as a weak point: read the correction, retry in about 20 minutes, then use a similar question.";
    setReviewNote(retryText);
    setStep("retry");
    setStatus(result === "got-it" ? "Recall recorded for this block. Move to one new Pass Core topic, then return here later." : "The next block is shortened so you can correct this without overload.");
    if (!supabaseBrowser || !activeTopic) return;
    const session = await supabaseBrowser.auth.getSession();
    if (!session.data.session) return;
    const correctRatio = result === "got-it" ? 1 : result === "mostly" ? .6 : .2;
    const elapsedMinutes = Math.max(1, Math.round((Date.now() - (recallStartedAt ?? Date.now())) / 60_000));
    try {
      const response = await fetch("/api/quick-cram/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.data.session.access_token}`, "Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify({ topic: activeTopic.title, preferred_format: mode, correct_ratio: correctRatio, time_spent_min: elapsedMinutes, needs_repetition: result !== "got-it" }),
      });
      const data = await response.json().catch(() => null);
      if (response.ok && data?.adaptation?.next_action) setStatus(data.adaptation.next_action);
    } catch {
      setStatus("Your recall result is available in this sprint. We could not sync it to your profile just now.");
    }
  }

  function moveToNextTopic() {
    if (!pack) return;
    setTopicIndex((index) => Math.min(index + 1, pack.topics.length - 1));
    setStep("learn");
    setRecallAnswer("");
    setAnswerRevealed(false);
    setReviewNote("");
  }

  return (
    <section className="rounded-3xl border border-rose-200 bg-rose-50/50 p-4 shadow-sm dark:border-rose-900 dark:bg-rose-950/20 sm:p-5">
      <div className="flex gap-3">
        <div className="rounded-xl bg-rose-100 p-2 text-rose-600 dark:bg-rose-950"><Sparkles className="h-5 w-5" /></div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300">Evidence-based Cram Sprint</p>
          <h2 className="mt-0.5 text-lg font-extrabold text-stone-900 dark:text-stone-100">Build a Pass Core, then prove you can recall it.</h2>
          <p className="mt-1 text-xs text-stone-600 dark:text-stone-300">One topic at a time: learn briefly, close the notes, retrieve it, then revisit weak points later.</p>
        </div>
      </div>

      <form onSubmit={generate} className="mt-4 grid gap-2 sm:grid-cols-[1fr_100px_auto]">
        <input required value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="e.g. Linux process scheduling" className="min-h-11 rounded-xl border border-rose-200 bg-white px-3 text-sm dark:border-rose-900 dark:bg-stone-900" />
        <input required type="number" min="0.5" max="72" step="0.5" value={hours} onChange={(event) => setHours(event.target.value)} className="min-h-11 rounded-xl border border-rose-200 bg-white px-3 text-sm dark:border-rose-900 dark:bg-stone-900" aria-label="Hours remaining" />
        <button className="min-h-11 rounded-xl bg-rose-600 px-4 text-sm font-bold text-white transition hover:bg-rose-700">Build Pass Core</button>
      </form>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-stone-600 dark:text-stone-300">
        <span>First block:</span>
        {modes.map((item) => <button key={item.id} type="button" onClick={() => setMode(item.id)} className={`rounded-full px-2.5 py-1 font-medium transition ${mode === item.id ? "bg-rose-600 text-white" : "bg-white text-stone-600 dark:bg-stone-900 dark:text-stone-300"}`}>{item.label}</button>)}
        <span className="text-stone-400">A starting format, not a permanent learning style.</span>
      </div>

      {status && <p role="status" className="mt-3 text-xs text-stone-600 dark:text-stone-300">{status}</p>}

      {pack && activeTopic && (
        <div className="mt-4 rounded-2xl border border-rose-100 bg-white p-4 dark:border-rose-900 dark:bg-stone-900">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="inline-flex items-center gap-1 font-bold text-rose-700 dark:text-rose-300"><Brain className="h-4 w-4" />Now: {topicIndex + 1} of {pack.topics.length}</span>
            <span className="inline-flex items-center gap-1 text-stone-500"><Clock3 className="h-4 w-4" />Later: retry weak material in 20–40 min</span>
          </div>

          {step === "learn" && (
            <div className="mt-3">
              <h3 className="text-base font-extrabold text-stone-900 dark:text-stone-100">{activeTopic.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-stone-700 dark:text-stone-300">{activeTopic.summary}</p>
              {activeTopic.worked_example && <details className="mt-3 rounded-xl bg-stone-50 p-3 text-sm text-stone-700 dark:bg-stone-800 dark:text-stone-300"><summary className="cursor-pointer font-bold">See one worked example</summary><p className="mt-2 whitespace-pre-wrap">{activeTopic.worked_example}</p></details>}
              {activeTopic.answer_skeleton?.length ? <div className="mt-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-950 dark:bg-amber-950/30 dark:text-amber-100"><p className="font-bold">Written-answer skeleton</p><ol className="mt-1 list-decimal space-y-1 pl-4">{activeTopic.answer_skeleton.map((point) => <li key={point}>{point}</li>)}</ol></div> : null}
              <button onClick={startRecall} className="mt-4 inline-flex min-h-11 items-center gap-1 rounded-xl bg-stone-900 px-4 text-sm font-bold text-white dark:bg-white dark:text-stone-900">Close notes & recall <ChevronRight className="h-4 w-4" /></button>
            </div>
          )}

          {step === "recall" && activeCard && (
            <div className="mt-3">
              <p className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300">Closed-book recall</p>
              <h3 className="mt-1 text-base font-extrabold text-stone-900 dark:text-stone-100">{activeCard.front}</h3>
              <textarea value={recallAnswer} onChange={(event) => setRecallAnswer(event.target.value)} placeholder="Write what you remember before checking…" className="mt-3 min-h-24 w-full rounded-xl border border-stone-200 bg-stone-50 p-3 text-sm dark:border-stone-700 dark:bg-stone-800" />
              {!answerRevealed ? <button onClick={() => setAnswerRevealed(true)} className="mt-3 min-h-11 rounded-xl bg-rose-600 px-4 text-sm font-bold text-white">Compare with answer</button> : <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-900 dark:bg-emerald-950/30"><p className="text-sm font-semibold text-emerald-950 dark:text-emerald-100">{activeCard.back}</p><p className="mt-3 text-xs text-stone-600 dark:text-stone-300">How did your recall compare?</p><div className="mt-2 flex flex-wrap gap-2"><button onClick={() => scoreRecall("retry")} className="min-h-10 rounded-lg border border-rose-200 px-3 text-xs font-bold text-rose-700 dark:border-rose-900 dark:text-rose-300">Missed it</button><button onClick={() => scoreRecall("mostly")} className="min-h-10 rounded-lg border border-amber-200 px-3 text-xs font-bold text-amber-800 dark:border-amber-900 dark:text-amber-200">Mostly</button><button onClick={() => scoreRecall("got-it")} className="min-h-10 rounded-lg bg-emerald-600 px-3 text-xs font-bold text-white">Got it</button></div></div>}
            </div>
          )}

          {step === "retry" && (
            <div className="mt-4 rounded-xl bg-stone-50 p-4 dark:bg-stone-800">
              <div className="flex gap-2"><CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" /><div><h3 className="font-extrabold text-stone-900 dark:text-stone-100">Keep the memory alive</h3><p className="mt-1 text-sm text-stone-700 dark:text-stone-300">{reviewNote}</p></div></div>
              <div className="mt-3 flex flex-wrap gap-2"><button onClick={() => setStep("recall")} className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-stone-200 px-3 text-xs font-bold dark:border-stone-700"><RotateCcw className="h-3.5 w-3.5" />Retry now</button>{topicIndex < pack.topics.length - 1 && <button onClick={moveToNextTopic} className="min-h-10 rounded-lg bg-stone-900 px-3 text-xs font-bold text-white dark:bg-white dark:text-stone-900">Next Pass Core topic</button>}</div>
            </div>
          )}

          <details className="mt-4 border-t border-stone-100 pt-3 text-xs dark:border-stone-800"><summary className="cursor-pointer font-bold text-stone-700 dark:text-stone-300">Exam prompts and revision sheet</summary><div className="mt-3 grid gap-3 md:grid-cols-2"><div><p className="font-bold">Likely practice prompts</p><ul className="mt-1 list-disc space-y-1 pl-4 text-stone-600 dark:text-stone-400">{activeTopic.must_know_questions.slice(0, 3).map((question) => <li key={question}>{question}</li>)}</ul></div><div><p className="font-bold">Cheat-sheet reminders</p><ul className="mt-1 list-disc space-y-1 pl-4 text-stone-600 dark:text-stone-400">{pack.cheat_sheet.slice(0, 5).map((line) => <li key={line}>{line}</li>)}</ul><p className="mt-2 inline-flex items-center gap-1 text-stone-500"><Lightbulb className="h-3.5 w-3.5" />{pack.quiz_items.length} quick test prompts are ready for later.</p></div></div></details>
        </div>
      )}
    </section>
  );
}
