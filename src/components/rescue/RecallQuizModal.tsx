"use client";

import React, { useState } from "react";
import { CheckCircle2, XCircle, Sparkles, HelpCircle, X, ArrowRight } from "lucide-react";
import confetti from "canvas-confetti";
import { ambientAudio } from "@/components/common/SoundEffects";

interface RecallQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  quiz: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
    conceptTrap: string;
  };
  topicTitle: string;
  onSuccess: () => void;
}

export const RecallQuizModal: React.FC<RecallQuizModalProps> = ({
  isOpen,
  onClose,
  quiz,
  topicTitle,
  onSuccess,
}) => {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const isCorrect = selectedIdx === quiz.correctIndex;

  const handleSubmit = () => {
    if (selectedIdx === null) return;
    setSubmitted(true);

    if (selectedIdx === quiz.correctIndex) {
      ambientAudio.playChime("levelUp");
      confetti({
        particleCount: 55,
        spread: 60,
        origin: { y: 0.65 },
        colors: ["#10B981", "#F59E0B", "#6366F1"],
      });
      onSuccess();
    } else {
      ambientAudio.playChime("click");
    }
  };

  const handleReset = () => {
    setSelectedIdx(null);
    setSubmitted(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/75 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-7 shadow-2xl border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Active Recall Check • {topicTitle}
            </span>
          </div>
          <button
            onClick={handleReset}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4">
          <div className="flex items-start gap-3 mb-4">
            <HelpCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <h3 className="font-semibold text-base sm:text-lg leading-snug">
              {quiz.question}
            </h3>
          </div>

          <div className="space-y-2.5 my-5">
            {quiz.options.map((option, idx) => {
              const isOptionSelected = selectedIdx === idx;
              let btnClass = "border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600 bg-stone-50/50 dark:bg-stone-800/40 text-stone-800 dark:text-stone-200";

              if (submitted) {
                if (idx === quiz.correctIndex) {
                  btnClass = "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-300 font-medium";
                } else if (isOptionSelected) {
                  btnClass = "border-rose-500 bg-rose-50 dark:bg-rose-950/50 text-rose-900 dark:text-rose-300";
                } else {
                  btnClass = "opacity-50 border-stone-200 dark:border-stone-800";
                }
              } else if (isOptionSelected) {
                btnClass = "border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 font-medium shadow-sm";
              }

              return (
                <button
                  key={idx}
                  disabled={submitted}
                  onClick={() => {
                    ambientAudio.playChime("click");
                    setSelectedIdx(idx);
                  }}
                  className={`w-full text-left p-3.5 rounded-2xl border text-sm flex items-center justify-between transition-all ${btnClass}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-stone-200/60 dark:bg-stone-700/60 text-xs font-semibold flex items-center justify-center">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span>{option}</span>
                  </div>
                  {submitted && idx === quiz.correctIndex && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  )}
                  {submitted && isOptionSelected && idx !== quiz.correctIndex && (
                    <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {submitted && (
            <div className="space-y-3 pt-2 animate-in fade-in duration-200">
              <div
                className={`p-4 rounded-2xl border ${
                  isCorrect
                    ? "bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
                    : "bg-amber-50/80 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200"
                }`}
              >
                <div className="flex items-center gap-2 font-semibold text-xs uppercase tracking-wider mb-1">
                  {isCorrect ? (
                    <>
                      <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Brilliant! +60 XP • Pass Confidence +3%</span>
                    </>
                  ) : (
                    <>
                      <HelpCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span>Exam Trap Identified</span>
                    </>
                  )}
                </div>
                <p className="text-xs leading-relaxed mt-1">
                  {quiz.explanation}
                </p>
                <div className="mt-2 text-[11px] font-mono bg-white/70 dark:bg-stone-900/60 p-2 rounded-xl">
                  Trap warning: {quiz.conceptTrap}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex justify-end gap-3">
          {!submitted ? (
            <button
              disabled={selectedIdx === null}
              onClick={handleSubmit}
              className={`px-5 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-all ${
                selectedIdx === null
                  ? "bg-stone-200 dark:bg-stone-800 text-stone-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
              }`}
            >
              <span>Submit Answer</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleReset}
              className="bg-stone-900 dark:bg-stone-100 hover:opacity-90 text-white dark:text-stone-900 px-5 py-2.5 rounded-xl font-medium text-sm transition-all"
            >
              Continue Plan
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
