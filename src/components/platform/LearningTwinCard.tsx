"use client";

import React, { useState } from "react";
import {
  Brain,
  Sparkles,
  Flame,
  Moon,
  Clock,
  Zap,
  Target,
  Shield,
  Activity,
  UserCheck,
  ChevronRight,
  TrendingUp,
  Check,
} from "lucide-react";
import { LearningTwinProfile } from "@/types";
import { ambientAudio } from "@/components/common/SoundEffects";

interface LearningTwinCardProps {
  twin: LearningTwinProfile;
  onAdjustPreferences?: () => void;
}

export const LearningTwinCard: React.FC<LearningTwinCardProps> = ({
  twin,
  onAdjustPreferences,
}) => {
  const [showAdaptiveDetails, setShowAdaptiveDetails] = useState(false);

  const xpProgressPercent = Math.min(100, Math.round((twin.xp / twin.nextLevelXp) * 100));

  return (
    <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-5 sm:p-7 shadow-sm transition-all space-y-6">
      {/* Header: Avatar, Name, Level, XP */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100 dark:border-stone-800">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500/20 via-indigo-500/20 to-amber-500/20 dark:from-emerald-500/30 dark:to-indigo-500/30 border border-stone-200 dark:border-stone-700 flex items-center justify-center text-2xl shadow-inner">
              {twin.avatar}
            </div>
            <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white dark:border-stone-900 flex items-center justify-center text-white">
              <Check className="w-3 h-3 stroke-[3]" />
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">
                {twin.name}'s Learning Twin
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold border border-indigo-200 dark:border-indigo-900">
                AI Twin v2.4
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              <span className="font-semibold text-stone-800 dark:text-stone-200">
                Level {twin.level} Scholar
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                <Flame className="w-3.5 h-3.5 fill-current" />
                {twin.streakDays} Day Streak
              </span>
              <span>•</span>
              <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                {twin.calibration}
              </span>
            </div>
          </div>
        </div>

        {/* Level XP Bar */}
        <div className="w-full sm:w-60 bg-stone-50 dark:bg-stone-800/60 p-3 rounded-2xl border border-stone-200 dark:border-stone-700/80">
          <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
            <span className="text-stone-500 dark:text-stone-400">Level Progress</span>
            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
              {twin.xp} / {twin.nextLevelXp} XP
            </span>
          </div>
          <div className="w-full bg-stone-200 dark:bg-stone-700 h-2 rounded-full overflow-hidden">
            <div
              className="bg-indigo-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${xpProgressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Behavioral Signals Grid (from 8-Q Behavior check) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <Clock className="w-4 h-4 text-emerald-600" />
            <span className="text-[10px] font-mono uppercase">Optimal Block</span>
          </div>
          <div>
            <div className="text-base font-bold text-stone-900 dark:text-stone-100">
              {twin.focusSpanMinutes} mins
            </div>
            <span className="text-[11px] text-stone-500">Pomodoro focus window</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <Moon className="w-4 h-4 text-indigo-500" />
            <span className="text-[10px] font-mono uppercase">Chronotype</span>
          </div>
          <div>
            <div className="text-base font-bold text-stone-900 dark:text-stone-100">
              {twin.chronotype}
            </div>
            <span className="text-[11px] text-stone-500">Peak window: 20:00 - 01:00</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <span className="text-[10px] font-mono uppercase">Speed Factor</span>
          </div>
          <div>
            <div className="text-base font-bold text-stone-900 dark:text-stone-100">
              {twin.speedFactor}x Normal
            </div>
            <span className="text-[11px] text-stone-500">Fast reader on theory</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <Target className="w-4 h-4 text-rose-500" />
            <span className="text-[10px] font-mono uppercase">Vulnerable Style</span>
          </div>
          <div>
            <div className="text-base font-bold text-stone-900 dark:text-stone-100">
              {twin.weakStyle}
            </div>
            <span className="text-[11px] text-stone-500">Generates worked steps</span>
          </div>
        </div>
      </div>

      {/* Adaptive Rules In Play */}
      <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 text-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5 uppercase tracking-wide">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Live Twin Tuning Influences:
          </span>
          <span className="text-[10px] font-mono text-emerald-800 dark:text-emerald-400">
            EMA α = 0.3
          </span>
        </div>
        <p className="text-emerald-950 dark:text-emerald-200/90 leading-relaxed text-xs">
          Because Anu prefers <strong>Examples-First</strong> and finds <strong>Numericals</strong> challenging,
          SkillOS structures study blocks to lead with worked candidate key tables before abstract relational theory,
          and sets evening focus blocks when attention is highest.
        </p>
      </div>
    </div>
  );
};
