"use client";

import React from "react";
import { X, Trophy, Sparkles, CheckCircle2, Lock, ArrowRight, BookOpen, ShieldAlert } from "lucide-react";
import { SkillNode } from "@/types";
import { ambientAudio } from "@/components/common/SoundEffects";

interface SkillDetailModalProps {
  skill: SkillNode | null;
  onClose: () => void;
  onStartSkillStudy: (skill: SkillNode) => void;
}

export const SkillDetailModal: React.FC<SkillDetailModalProps> = ({
  skill,
  onClose,
  onStartSkillStudy,
}) => {
  if (!skill) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/75 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-7 shadow-2xl border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
              {skill.category}
            </span>
            <span className="text-xs font-mono text-stone-400">Level {skill.level}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100">
                {skill.title}
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                {skill.description}
              </p>
            </div>
            <div className="flex flex-col items-end shrink-0">
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 bg-amber-50 dark:bg-amber-950/50 px-2 py-1 rounded-xl border border-amber-200 dark:border-amber-900">
                <Sparkles className="w-3.5 h-3.5" />
                +{skill.xpReward} XP
              </span>
              <span className="text-[10px] text-stone-400 mt-1">{skill.difficulty} Difficulty</span>
            </div>
          </div>

          {/* Mastery Bar */}
          <div className="bg-stone-50 dark:bg-stone-800/60 p-3.5 rounded-2xl border border-stone-200 dark:border-stone-700/80">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-stone-700 dark:text-stone-300">
                Current Skill Mastery
              </span>
              <span className="font-mono font-bold text-stone-900 dark:text-stone-100">
                {skill.masteryPercent}%
              </span>
            </div>
            <div className="w-full bg-stone-200 dark:bg-stone-700 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  skill.masteryPercent >= 80
                    ? "bg-emerald-500"
                    : skill.masteryPercent > 0
                    ? "bg-indigo-500"
                    : "bg-stone-400"
                }`}
                style={{ width: `${skill.masteryPercent}%` }}
              />
            </div>
          </div>

          {/* Prerequisites */}
          {skill.prerequisites.length > 0 && (
            <div className="text-xs space-y-1">
              <span className="text-stone-400 font-semibold uppercase tracking-wider text-[10px]">
                Prerequisites Required
              </span>
              <div className="flex flex-wrap gap-1.5">
                {skill.prerequisites.map((prereq, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-mono text-[11px] flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    {prereq}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* High Yield Key Concepts */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 text-xs text-indigo-950 dark:text-indigo-200 space-y-1.5">
            <span className="font-bold flex items-center gap-1.5 text-indigo-900 dark:text-indigo-300">
              <BookOpen className="w-3.5 h-3.5" />
              SkillOS Learning Objectives
            </span>
            <p className="leading-relaxed">
              Master the algorithmic procedures, prove correctness, and pass active recall checks to unlock
              next tier advanced nodes in the Distributed Systems track.
            </p>
          </div>
        </div>

        <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold"
          >
            Close
          </button>
          {skill.status !== "locked" ? (
            <button
              onClick={() => {
                ambientAudio.playChime("click");
                onStartSkillStudy(skill);
                onClose();
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all tactile-button"
            >
              <span>Practice Skill Node</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-stone-400 px-3 py-2 bg-stone-100 dark:bg-stone-800 rounded-xl">
              <Lock className="w-3.5 h-3.5" />
              <span>Complete prerequisites first</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
