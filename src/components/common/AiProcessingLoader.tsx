"use client";

import React, { useEffect, useState } from "react";
import { Sparkles, Brain, Cpu, Search, CheckCircle } from "lucide-react";

interface AiProcessingLoaderProps {
  statusStages?: string[];
  durationMs?: number;
  onComplete?: () => void;
  title?: string;
  subtitle?: string;
}

const defaultStages = [
  "Scanning sources & authoritative curriculum...",
  "Structuring conceptual hierarchy...",
  "Curating for your baseline cognitive level...",
  "Synthesizing high-yield exam hooks & active recall cards...",
  "Finalizing adaptive learning blueprint...",
];

export const AiProcessingLoader: React.FC<AiProcessingLoaderProps> = ({
  statusStages = defaultStages,
  durationMs = 2800,
  onComplete,
  title = "SkillOS Neural Engine",
  subtitle = "Synthesizing customized learning path & high-yield insights",
}) => {
  const [progress, setProgress] = useState(8);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);

  useEffect(() => {
    const intervalMs = 50;
    const totalSteps = durationMs / intervalMs;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const currentPct = Math.min(100, Math.round((step / totalSteps) * 100));
      setProgress(currentPct);

      const stageIndex = Math.min(
        statusStages.length - 1,
        Math.floor((currentPct / 100) * statusStages.length)
      );
      setCurrentStageIndex(stageIndex);

      if (step >= totalSteps) {
        clearInterval(timer);
        setTimeout(() => {
          if (onComplete) onComplete();
        }, 200);
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [durationMs, statusStages, onComplete]);

  return (
    <div className="w-full max-w-xl mx-auto p-6 sm:p-8 rounded-3xl bg-white/90 dark:bg-stone-900/90 backdrop-blur-xl border border-stone-200/80 dark:border-stone-800 shadow-xl space-y-6 animate-in fade-in zoom-in-95 duration-300">
      {/* Top Header with Pulsing Glow */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500/20 via-indigo-500/20 to-amber-500/20 dark:from-emerald-900/40 dark:to-indigo-900/40 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Brain className="w-6 h-6 animate-pulse" />
          </div>
          {/* Subtle orbiting dot */}
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500" />
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 truncate">
              {title}
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 font-semibold">
              {progress}%
            </span>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 truncate">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="w-full bg-stone-100 dark:bg-stone-800 h-2.5 rounded-full overflow-hidden p-0.5 border border-stone-200/60 dark:border-stone-700/60">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500 transition-all duration-150 ease-out shadow-sm"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-stone-400 font-mono">
          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
            {statusStages[currentStageIndex]}
          </span>
          <span>{Math.round((progress / 100) * (durationMs / 1000))}s</span>
        </div>
      </div>

      {/* Particle & Thinking Wave Indicators */}
      <div className="grid grid-cols-4 gap-2 pt-2 border-t border-stone-100 dark:border-stone-800/80">
        <div className="flex items-center gap-1.5 text-[11px] text-stone-500 dark:text-stone-400">
          <Search className="w-3 h-3 text-emerald-500" />
          <span className="truncate">RAG Search</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-stone-500 dark:text-stone-400">
          <Cpu className="w-3 h-3 text-indigo-500" />
          <span className="truncate">Embedding</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-stone-500 dark:text-stone-400">
          <Brain className="w-3 h-3 text-amber-500" />
          <span className="truncate">Cognitive Fit</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-stone-500 dark:text-stone-400">
          <CheckCircle className="w-3 h-3 text-emerald-500" />
          <span className="truncate">Validation</span>
        </div>
      </div>
    </div>
  );
};
