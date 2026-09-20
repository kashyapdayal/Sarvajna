"use client";

import React, { useState, useEffect } from "react";
import { Heart, X, CheckCircle2, ArrowRight, ShieldCheck, PhoneCall, Sparkles } from "lucide-react";
import { ambientAudio } from "@/components/common/SoundEffects";

interface PanicModeOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onStartFiveMinTask: () => void;
}

export const PanicModeOverlay: React.FC<PanicModeOverlayProps> = ({
  isOpen,
  onClose,
  onStartFiveMinTask,
}) => {
  const [phase, setPhase] = useState<"breathe" | "action">("breathe");
  const [timer, setTimer] = useState(60);
  const [breathState, setBreathState] = useState<"Inhale" | "Hold" | "Exhale" | "Rest">("Inhale");

  useEffect(() => {
    if (!isOpen) {
      setPhase("breathe");
      setTimer(60);
      return;
    }

    ambientAudio.playChime("panic");

    const countdown = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(countdown);
          setPhase("action");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const breathCycle = setInterval(() => {
      setBreathState((prev) => {
        if (prev === "Inhale") return "Hold";
        if (prev === "Hold") return "Exhale";
        if (prev === "Exhale") return "Rest";
        return "Inhale";
      });
    }, 4000);

    return () => {
      clearInterval(countdown);
      clearInterval(breathCycle);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md transition-all">
      <div className="relative w-full max-w-lg bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 overflow-hidden">
        {/* Background calming aura */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
            <Heart className="w-5 h-5 fill-current animate-pulse" />
            <span className="font-semibold text-sm tracking-wide uppercase">
              Calm Center & Emergency Reset
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {phase === "breathe" ? (
          <div className="py-6 flex flex-col items-center text-center">
            {/* Box Breathing visualizer */}
            <div className="relative my-6 flex items-center justify-center">
              <div className="w-44 h-44 rounded-full border-4 border-emerald-400/30 dark:border-emerald-500/20 flex items-center justify-center animate-breathe">
                <div className="w-32 h-32 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex flex-col items-center justify-center shadow-inner">
                  <span className="text-emerald-700 dark:text-emerald-300 font-bold text-lg tracking-wider">
                    {breathState}
                  </span>
                  <span className="text-xs text-stone-400 font-mono mt-0.5">4 seconds</span>
                </div>
              </div>
            </div>

            <p className="text-stone-600 dark:text-stone-300 text-sm max-w-sm leading-relaxed mb-4">
              Take one slow breath. The panic is just adrenaline. You only need 40 marks to pass.
              We've cut away all the noise.
            </p>

            <div className="flex items-center gap-4 text-xs text-stone-400 mb-6">
              <span>Guided breathing: {timer}s</span>
              <span>•</span>
              <button
                onClick={() => setPhase("action")}
                className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
              >
                Skip breathing & go to task →
              </button>
            </div>
          </div>
        ) : (
          <div className="py-4 space-y-6 animate-in fade-in duration-300">
            <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl p-4 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold text-emerald-900 dark:text-emerald-300 uppercase tracking-wide">
                  Pass Core Protected
                </h4>
                <p className="text-xs text-emerald-800 dark:text-emerald-400/90 mt-1 leading-relaxed">
                  We automatically pruned all non-essential units. Your schedule now focuses exclusively
                  on the 5 highest-yielding topics to secure 45+ marks with protected sleep.
                </p>
              </div>
            </div>

            <div className="bg-stone-50 dark:bg-stone-800/60 rounded-2xl p-5 border border-stone-200 dark:border-stone-700/80">
              <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 mb-2">
                <span className="font-semibold text-stone-800 dark:text-stone-200 uppercase tracking-wider">
                  Your Single 5-Minute Micro-Task
                </span>
                <span className="bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full text-[11px] font-medium">
                  Quick Win (10 Marks)
                </span>
              </div>
              <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">
                Database Normalization: 1NF to BCNF 30-Second Rules
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-400 mt-2 leading-relaxed">
                Read the 4 simple rules and examine 1 worked candidate key decomposition. That's all.
                No endless textbooks. Just 5 minutes.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => {
                  onStartFiveMinTask();
                  onClose();
                }}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <span>Start 5-min Micro Step</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 text-sm font-medium transition-colors"
              >
                I Feel Calmer Now
              </button>
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-[11px] text-stone-400">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Always grounded. No guilt, no blame.
          </span>
          <a
            href="tel:988"
            className="flex items-center gap-1 text-stone-500 hover:text-stone-800 dark:hover:text-stone-300"
            title="Helpline"
          >
            <PhoneCall className="w-3 h-3" />
            <span>Crisis support 988</span>
          </a>
        </div>
      </div>
    </div>
  );
};
