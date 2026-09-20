"use client";

import React, { useState } from "react";
import {
  AlertCircle,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Brain,
  History,
} from "lucide-react";
import { MistakeEntry } from "@/types";
import { ambientAudio } from "@/components/common/SoundEffects";

interface MistakeIntelViewProps {
  mistakes: MistakeEntry[];
  onRetest: (mistakeId: string) => void;
}

export const MistakeIntelView: React.FC<MistakeIntelViewProps> = ({
  mistakes,
  onRetest,
}) => {
  const [activeDrill, setActiveDrill] = useState<string | null>(null);
  const [clearedMistakes, setClearedMistakes] = useState<string[]>([]);

  const handleClearDrill = (id: string) => {
    ambientAudio.playChime("levelUp");
    setClearedMistakes([...clearedMistakes, id]);
    setActiveDrill(null);
    onRetest(id);
  };

  return (
    <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-5 sm:p-7 shadow-sm transition-all space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100 dark:border-stone-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5" />
              Mistake Intelligence (R11)
            </span>
            <span className="text-xs text-stone-400 font-mono">
              {mistakes.length} Logged Traps
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100 mt-1">
            Personal Error Pattern Memory
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            We convert your wrong quiz options into targeted 5-minute correction paths.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
          <ShieldCheck className="w-4 h-4" />
          <span>Zero Shaming • Pure Growth</span>
        </div>
      </div>

      {/* Mistake Entries */}
      <div className="space-y-3">
        {mistakes.map((entry) => {
          const isCleared = clearedMistakes.includes(entry.id) || entry.retested;
          const isCurrentDrill = activeDrill === entry.id;

          return (
            <div
              key={entry.id}
              className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                isCleared
                  ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40"
                  : "bg-stone-50 dark:bg-stone-800/40 border-stone-200 dark:border-stone-700/80"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase font-mono ${
                      entry.errorType === "concept"
                        ? "bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300"
                        : entry.errorType === "careless"
                        ? "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300"
                        : "bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300"
                    }`}
                  >
                    {entry.errorType} error
                  </span>
                  <span className="text-xs font-bold text-stone-900 dark:text-stone-100">
                    {entry.concept}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-stone-400">
                  <span>{entry.examType}</span>
                  <span>•</span>
                  <span>{entry.loggedAt}</span>
                </div>
              </div>

              {/* Diagnosis why */}
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                <strong className="text-stone-800 dark:text-stone-200 font-semibold">Root Cause: </strong>
                {entry.why}
              </p>

              {/* Fix path */}
              <div className="mt-3 p-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-stone-700 dark:text-stone-300">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>
                    <strong>5-Min Fix Path:</strong> {entry.fixPath}
                  </span>
                </div>

                {isCleared ? (
                  <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold text-xs shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Retested & Cleared</span>
                  </span>
                ) : (
                  <button
                    onClick={() => {
                      ambientAudio.playChime("click");
                      setActiveDrill(isCurrentDrill ? null : entry.id);
                    }}
                    className="bg-stone-900 dark:bg-stone-100 hover:opacity-90 text-white dark:text-stone-900 px-3.5 py-1.5 rounded-lg font-semibold text-xs flex items-center gap-1.5 shrink-0 transition-opacity"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>{isCurrentDrill ? "Cancel Drill" : "Retest Now (+30 XP)"}</span>
                  </button>
                )}
              </div>

              {/* Active Mini Drill Inline Simulation */}
              {isCurrentDrill && (
                <div className="mt-3 p-4 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-800 space-y-3 text-xs animate-in fade-in duration-150">
                  <span className="font-bold text-indigo-900 dark:text-indigo-300 block">
                    Quick Verification Check:
                  </span>
                  <p className="text-stone-800 dark:text-stone-200 font-medium">
                    In relation R(A, B, C) with FD: A &rarr; B and B &rarr; C, candidate key is A. Does B &rarr; C violate BCNF?
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleClearDrill(entry.id)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-lg font-semibold transition-colors"
                    >
                      Yes (B is not a super key)
                    </button>
                    <button
                      onClick={() => {
                        ambientAudio.playChime("click");
                        alert("Not quite! In BCNF, the left hand side MUST strictly be a super key. B is not a super key, so it violates BCNF.");
                      }}
                      className="bg-stone-200 dark:bg-stone-700 text-stone-800 dark:text-stone-200 px-3.5 py-1.5 rounded-lg hover:bg-stone-300 dark:hover:bg-stone-600 transition-colors"
                    >
                      No (C is not non-prime)
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
