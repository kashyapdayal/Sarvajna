"use client";

import React, { useState } from "react";
import {
  Sparkles,
  CheckCircle2,
  Lock,
  ChevronRight,
  Flame,
  Award,
  Zap,
  Layers,
  Star,
} from "lucide-react";
import { SkillNode } from "@/types";
import { SkillDetailModal } from "./SkillDetailModal";
import { ambientAudio } from "@/components/common/SoundEffects";

interface SkillQuestMapProps {
  skills: SkillNode[];
  onSelectSkillForStudy: (skill: SkillNode) => void;
}

export const SkillQuestMap: React.FC<SkillQuestMapProps> = ({
  skills,
  onSelectSkillForStudy,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [activeModalSkill, setActiveModalSkill] = useState<SkillNode | null>(null);

  const categories = ["All", "Core Database", "Architecture", "Query Tuning", "Distributed"];

  const filteredSkills = selectedCategory === "All"
    ? skills
    : skills.filter((s) => s.category === selectedCategory);

  const masteredCount = skills.filter((s) => s.status === "mastered").length;

  return (
    <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-5 sm:p-7 shadow-sm transition-all space-y-6">
      {/* Top Map Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100 dark:border-stone-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 fill-current" />
              Skill Tree & Quest Map
            </span>
            <span className="text-xs text-stone-400 font-mono">
              {masteredCount} of {skills.length} Mastered
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100 mt-1">
            Database Mastery Quest Line
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Unlock nodes as you verify concepts. Adaptive gating opens tier-4 query optimization.
          </p>
        </div>

        {/* Categories Pill Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                ambientAudio.playChime("click");
                setSelectedCategory(cat);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-sm"
                  : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Skill Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSkills.map((skill, idx) => {
          const isMastered = skill.status === "mastered";
          const isAvailable = skill.status === "available";
          const isLocked = skill.status === "locked";

          return (
            <div
              key={skill.id}
              onClick={() => {
                ambientAudio.playChime("click");
                setActiveModalSkill(skill);
              }}
              className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer relative group flex flex-col justify-between ${
                isMastered
                  ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60 hover:border-emerald-300"
                  : isAvailable
                  ? "bg-white dark:bg-stone-800/60 border-stone-200 dark:border-stone-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md"
                  : "bg-stone-50/50 dark:bg-stone-900/40 border-stone-200/60 dark:border-stone-800 opacity-60 hover:opacity-80"
              }`}
            >
              <div>
                {/* Node Level and Status Badge */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-semibold">
                    Tier {skill.level}
                  </span>

                  {isMastered && (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-950/70 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Mastered
                    </span>
                  )}

                  {isAvailable && (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-900">
                      <Zap className="w-3 h-3 fill-current" />
                      +{skill.xpReward} XP
                    </span>
                  )}

                  {isLocked && (
                    <span className="flex items-center gap-1 text-[11px] text-stone-400 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-full">
                      <Lock className="w-3 h-3" />
                      Locked
                    </span>
                  )}
                </div>

                {/* Title and Category */}
                <h3 className="font-bold text-sm sm:text-base text-stone-900 dark:text-stone-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {skill.title}
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 line-clamp-2 leading-relaxed">
                  {skill.description}
                </p>
              </div>

              {/* Progress Bar & Footer */}
              <div className="pt-4 mt-3 border-t border-stone-100 dark:border-stone-800/80">
                <div className="flex items-center justify-between text-[11px] text-stone-500 mb-1.5">
                  <span>Mastery</span>
                  <span className="font-mono font-semibold">{skill.masteryPercent}%</span>
                </div>
                <div className="w-full bg-stone-200 dark:bg-stone-700 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isMastered
                        ? "bg-emerald-500"
                        : isAvailable
                        ? "bg-indigo-500"
                        : "bg-stone-400"
                    }`}
                    style={{ width: `${skill.masteryPercent}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Skill Detail Modal */}
      <SkillDetailModal
        skill={activeModalSkill}
        onClose={() => setActiveModalSkill(null)}
        onStartSkillStudy={onSelectSkillForStudy}
      />
    </div>
  );
};
