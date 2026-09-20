"use client";

import React from "react";
import {
  Clock,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Coffee,
  Bed,
  Layers,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import { StudyBlock } from "@/types";
import { ambientAudio } from "@/components/common/SoundEffects";

interface NowNextLaterProps {
  blocks: StudyBlock[];
  activeBlockIndex: number;
  onSelectBlock: (index: number) => void;
  passConfidence: number;
  passConfidenceDriver: string;
  onTriggerPanic: () => void;
  onOpenStudyRunner: () => void;
}

export const NowNextLater: React.FC<NowNextLaterProps> = ({
  blocks,
  activeBlockIndex,
  onSelectBlock,
  passConfidence,
  passConfidenceDriver,
  onTriggerPanic,
  onOpenStudyRunner,
}) => {
  const currentBlock = blocks[activeBlockIndex] || blocks[0];
  const nextBlock = blocks[activeBlockIndex + 1];
  const laterBlocks = blocks.slice(activeBlockIndex + 2);

  const completedCount = blocks.filter((b) => b.status === "completed").length;
  const progressRatio = `${completedCount}/${blocks.length}`;

  return (
    <div className="space-y-4">
      {/* Top micro progress status banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
            Anti-Overwhelm Stream
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-stone-200/70 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-mono">
            {progressRatio} Completed
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="text-stone-600 dark:text-stone-300">
            Pass Confidence: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{passConfidence}%</strong>
          </span>
          <span className="text-[11px] text-stone-400 hidden sm:inline">
            ({passConfidenceDriver})
          </span>
        </div>
      </div>

      {/* 3 Tasks Max Container */}
      <div className="space-y-3">
        {/* TASK 1: NOW */}
        {currentBlock && (
          <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent dark:from-emerald-950/40 dark:via-emerald-950/20 border-2 border-emerald-500/30 dark:border-emerald-500/30 shadow-sm relative overflow-hidden transition-all">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                NOW FOCUSING
              </span>
              <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-800 dark:text-emerald-300 bg-emerald-100/60 dark:bg-emerald-950/60 px-2.5 py-1 rounded-xl">
                <Clock className="w-3.5 h-3.5" />
                <span>{currentBlock.durationMinutes} min block</span>
              </div>
            </div>

            <div className="mt-2">
              <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                {currentBlock.topicTitle}
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-300 mt-1 line-clamp-2 leading-relaxed">
                {currentBlock.whyThis}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-emerald-500/20">
              <span className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                Target: Read 3-min core note + answer 1 quick check
              </span>
              <button
                onClick={() => {
                  ambientAudio.playChime("click");
                  onOpenStudyRunner();
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-all tactile-button"
              >
                <span>Study This Topic</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* TASK 2: NEXT */}
        {nextBlock ? (
          <div
            onClick={() => {
              ambientAudio.playChime("click");
              onSelectBlock(activeBlockIndex + 1);
            }}
            className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 cursor-pointer transition-all flex items-center justify-between gap-4 group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-700 dark:text-amber-400 shrink-0 font-bold text-xs">
                {nextBlock.type === "RECALL" ? <Sparkles className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                    NEXT UP
                  </span>
                  <span className="text-xs text-stone-400 font-mono">
                    • {nextBlock.durationMinutes}m
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-stone-900 dark:text-stone-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {nextBlock.topicTitle}
                </h4>
              </div>
            </div>

            <span className="text-xs text-stone-400 font-medium group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
              Preview <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-900/40 border border-stone-200 dark:border-stone-800 flex items-center gap-3 text-xs text-stone-500">
            <Coffee className="w-4 h-4 text-amber-500" />
            <span>Next: Scheduled 15-min hydration break & final sweep</span>
          </div>
        )}

        {/* TASK 3: LATER */}
        <div className="p-4 rounded-2xl bg-stone-50/60 dark:bg-stone-900/30 border border-dashed border-stone-300 dark:border-stone-800 flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
          <div className="flex items-center gap-2.5">
            <Layers className="w-4 h-4 text-stone-400" />
            <span>
              <strong>LATER:</strong> {laterBlocks.length} more topics scheduled • Protected Sleep
              (23:30 - 06:30)
            </span>
          </div>
          <span className="font-mono text-[11px] bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-md">
            Sleep intact
          </span>
        </div>
      </div>
    </div>
  );
};
