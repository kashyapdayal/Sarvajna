"use client";

import React, { useState } from "react";
import {
  Cloud,
  Lock,
  Unlock,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  BookOpen,
  Clock,
  Compass,
  Zap,
  Layers,
  ShieldAlert,
  X,
  Play,
  Award,
} from "lucide-react";
import { StudyPathIsland } from "@/types";
import { ambientAudio } from "@/components/common/SoundEffects";

interface CloudJourneyMapProps {
  islands: StudyPathIsland[];
  onStartLearningTopic: (topicTitle: string) => void;
  onToggleTopicStatus?: (topicId: string) => void;
}

export const CloudJourneyMap: React.FC<CloudJourneyMapProps> = ({
  islands,
  onStartLearningTopic,
  onToggleTopicStatus,
}) => {
  const [selectedIsland, setSelectedIsland] = useState<StudyPathIsland | null>(null);
  const [filter, setFilter] = useState<"all" | "unlocked" | "locked" | "completed">("all");

  const completedCount = islands.filter((i) => i.status === "completed").length;
  const unlockedCount = islands.filter((i) => i.status === "unlocked").length;

  const filteredIslands = islands.filter((island) => {
    if (filter === "all") return true;
    return island.status === filter;
  });

  const handleSelectIsland = (island: StudyPathIsland) => {
    ambientAudio.playChime("click");
    setSelectedIsland(island);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-28 pt-2 px-2 sm:px-4">
      {/* 1. Atmospheric Sky Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-100 via-indigo-50 to-purple-100 dark:from-slate-900 dark:via-indigo-950/70 dark:to-slate-900 border border-sky-200/80 dark:border-indigo-900/60 p-6 sm:p-8 shadow-sm">
        {/* Decorative Floating Clouds */}
        <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-white/40 dark:bg-sky-500/10 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full bg-purple-200/30 dark:bg-purple-900/20 blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 dark:bg-stone-900/80 backdrop-blur-md border border-sky-200 dark:border-indigo-800 text-sky-800 dark:text-sky-300 text-xs font-bold uppercase tracking-wider">
              <Cloud className="w-3.5 h-3.5 text-sky-500" />
              <span>Atmospheric Learning Journey</span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Cloud & Fog Study Path
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-xl">
              Traverse the cognitive stepping stones. As you master concepts, the fog dissolves to unveil higher-order principles and exam mastery.
            </p>
          </div>

          {/* Journey Metrics */}
          <div className="flex items-center gap-3 bg-white/80 dark:bg-stone-900/80 backdrop-blur-md p-4 rounded-2xl border border-sky-200/80 dark:border-indigo-900/80 shrink-0">
            <div className="text-center px-3 border-r border-slate-200 dark:border-slate-800">
              <div className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                {completedCount}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase">
                Mastered
              </div>
            </div>

            <div className="text-center px-3 border-r border-slate-200 dark:border-slate-800">
              <div className="text-xl sm:text-2xl font-extrabold text-amber-500 dark:text-amber-400 font-mono">
                {unlockedCount}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase">
                In Progress
              </div>
            </div>

            <div className="text-center px-3">
              <div className="text-xl sm:text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
                {islands.length}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase">
                Total Islands
              </div>
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="relative z-10 flex items-center gap-2 mt-6 overflow-x-auto text-xs pb-1">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
            Filter:
          </span>
          {(["all", "unlocked", "completed", "locked"] as const).map((t) => (
            <button
              key={t}
              onClick={() => {
                ambientAudio.playChime("click");
                setFilter(t);
              }}
              className={`px-3 py-1.5 rounded-xl font-semibold capitalize whitespace-nowrap transition-all ${
                filter === t
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm"
                  : "bg-white/70 dark:bg-stone-800/70 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-stone-800"
              }`}
            >
              {t === "all" ? "All Stepping Stones" : t}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Visual Stepping Stones / Islands Journey Map */}
      <div className="relative py-8 px-4 sm:px-8 bg-gradient-to-b from-sky-50/50 via-slate-50 to-indigo-50/40 dark:from-slate-950/60 dark:via-stone-900 dark:to-indigo-950/30 rounded-3xl border border-sky-100 dark:border-stone-800/80 shadow-sm overflow-hidden">
        {/* Subtle SVG Path connecting islands */}
        <div className="relative space-y-12">
          {filteredIslands.map((island, index) => {
            const isCompleted = island.status === "completed";
            const isUnlocked = island.status === "unlocked";
            const isLocked = island.status === "locked";
            const isEven = index % 2 === 0;
            const isInitialStep = index === 0;
            const hasSmoke = index > 0;

            return (
              <div
                key={island.id}
                className={`flex flex-col md:flex-row items-center ${
                  isEven ? "md:justify-start" : "md:justify-end"
                }`}
              >
                <div
                  onClick={() => handleSelectIsland(island)}
                  className={`w-full md:w-[460px] relative rounded-3xl p-6 transition-all duration-300 cursor-pointer group shadow-sm hover:shadow-lg overflow-hidden ${
                    isCompleted
                      ? "bg-white/95 dark:bg-stone-900/95 border-2 border-emerald-500/80 hover:border-emerald-500"
                      : isUnlocked
                      ? "bg-white/95 dark:bg-stone-900/95 border-2 border-indigo-400 dark:border-indigo-500/80 hover:border-indigo-500"
                      : "bg-slate-100/80 dark:bg-stone-900/60 border border-slate-200/80 dark:border-stone-800"
                  }`}
                >
                  {/* ANIMATED SMOKE LAYER (Inside all steps OTHER than the initial step) */}
                  {hasSmoke && (
                    <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none z-10">
                      {/* Billowing Smoke Puff 1 */}
                      <div
                        className="absolute -top-1/3 -left-1/3 w-[170%] h-[170%] rounded-full blur-2xl opacity-50 dark:opacity-35 animate-smoke-1"
                        style={{
                          background:
                            "radial-gradient(circle at 40% 40%, rgba(186, 230, 253, 0.55) 0%, rgba(224, 242, 254, 0.35) 30%, rgba(199, 210, 254, 0.2) 60%, transparent 75%)",
                        }}
                      />
                      {/* Counter-Swirling Smoke Puff 2 */}
                      <div
                        className="absolute -bottom-1/3 -right-1/3 w-[170%] h-[170%] rounded-full blur-3xl opacity-45 dark:opacity-30 animate-smoke-2"
                        style={{
                          background:
                            "radial-gradient(circle at 60% 60%, rgba(224, 231, 255, 0.6) 0%, rgba(199, 210, 254, 0.3) 40%, rgba(147, 197, 253, 0.18) 65%, transparent 80%)",
                        }}
                      />
                      {/* Drifting Mist Layer 3 */}
                      <div
                        className="absolute inset-0 w-full h-full blur-xl opacity-35 dark:opacity-25 animate-smoke-3"
                        style={{
                          background:
                            "radial-gradient(ellipse at center, rgba(241, 245, 249, 0.65) 0%, rgba(203, 213, 225, 0.25) 55%, transparent 85%)",
                        }}
                      />
                    </div>
                  )}

                  {/* FOG OVERLAY for locked topics */}
                  {isLocked && (
                    <div className="absolute inset-0 z-20 rounded-3xl backdrop-blur-md bg-gradient-to-r from-sky-100/85 via-slate-200/80 to-sky-100/85 dark:from-slate-900/90 dark:via-indigo-950/85 dark:to-slate-900/90 flex flex-col items-center justify-center p-6 text-center space-y-2 border border-sky-200/60 dark:border-indigo-900/40">
                      <div className="w-10 h-10 rounded-2xl bg-white/80 dark:bg-stone-800/80 flex items-center justify-center text-slate-500 dark:text-slate-400 shadow-sm">
                        <Lock className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                        Shrouded in Fog
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs">
                        Complete prerequisite stepping stones to dissolve the clouds over this domain.
                      </p>
                    </div>
                  )}

                  {/* UNLOCKED: Clouds Parting Glowing Aura */}
                  {isUnlocked && (
                    <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-indigo-500/20 via-sky-400/20 to-purple-500/20 -z-10 blur-sm group-hover:blur-md transition-all" />
                  )}

                  {/* Island Card Header */}
                  <div className="relative z-10 flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            isCompleted
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : isUnlocked
                              ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300"
                              : "bg-slate-200 text-slate-600 dark:bg-stone-800 dark:text-stone-400"
                          }`}
                        >
                          Tier {island.level} • {island.category}
                        </span>

                        {isInitialStep ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200/60 dark:border-emerald-800">
                            Initial Step
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-50 dark:bg-slate-800 text-sky-700 dark:text-sky-300 font-medium border border-sky-200/60 dark:border-slate-700 flex items-center gap-1">
                            <Cloud className="w-3 h-3 text-sky-500 animate-pulse" />
                            Smoke Zone
                          </span>
                        )}

                        {island.addedFromDiscovery && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800">
                            Discovered
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {island.title}
                      </h3>
                    </div>

                    {/* Status Badge */}
                    <div className="shrink-0">
                      {isCompleted ? (
                        <div className="w-9 h-9 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                      ) : isUnlocked ? (
                        <div className="w-9 h-9 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center shadow-sm">
                          <Unlock className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="w-9 h-9 rounded-2xl bg-slate-100 dark:bg-stone-800 text-slate-400 flex items-center justify-center">
                          <Lock className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="relative z-10 text-xs text-slate-600 dark:text-slate-300 mt-2.5 line-clamp-2 leading-relaxed">
                    {island.description}
                  </p>

                  {/* Island Footer */}
                  <div className="relative z-10 flex items-center justify-between pt-4 mt-4 border-t border-slate-100 dark:border-stone-800 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {island.estMinutes} mins
                    </span>

                    <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                      +{island.xpReward} XP
                    </span>

                    <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-semibold group-hover:translate-x-1 transition-transform">
                      <span>Explore</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Sleek Introductory Panel (Drawer / Modal) */}
      {selectedIsland && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-slate-200 dark:border-stone-800 max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-stone-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 text-xs font-bold">
                    Tier {selectedIsland.level} Island
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {selectedIsland.estMinutes} minutes
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {selectedIsland.title}
                </h2>
              </div>

              <button
                onClick={() => setSelectedIsland(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-stone-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Brief Intro */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Brief Introduction
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-stone-800/50 p-4 rounded-2xl border border-slate-200/60 dark:border-stone-700/60">
                {selectedIsland.description}
              </p>
            </div>

            {/* Key Concepts Preview */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-500" />
                <span>Key Concepts Preview</span>
              </h3>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                {selectedIsland.keyConcepts.map((concept, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-stone-800/40"
                  >
                    <span className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                    <span>{concept}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Prerequisites */}
            {selectedIsland.prerequisites && selectedIsland.prerequisites.length > 0 && (
              <div className="text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Prerequisites:{" "}
                </span>
                {selectedIsland.prerequisites.join(" • ")}
              </div>
            )}

            {/* Actions */}
            <div className="pt-4 border-t border-slate-100 dark:border-stone-800 flex items-center justify-between gap-3">
              {onToggleTopicStatus && (
                <button
                  onClick={() => {
                    onToggleTopicStatus(selectedIsland.id);
                    setSelectedIsland((prev) =>
                      prev
                        ? {
                            ...prev,
                            status: prev.status === "completed" ? "unlocked" : "completed",
                          }
                        : null
                    );
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-stone-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-stone-800 transition-colors flex items-center gap-1.5"
                >
                  <Award className="w-3.5 h-3.5 text-amber-500" />
                  <span>
                    {selectedIsland.status === "completed" ? "Mark Incomplete" : "Mark Mastered"}
                  </span>
                </button>
              )}

              <button
                onClick={() => {
                  setSelectedIsland(null);
                  onStartLearningTopic(selectedIsland.title);
                }}
                className="flex-1 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Start Learning</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
