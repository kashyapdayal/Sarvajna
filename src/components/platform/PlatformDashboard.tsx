"use client";

import React, { useState } from "react";
import {
  Compass,
  Zap,
  Brain,
  BookMarked,
  CheckCircle2,
  Trophy,
  Sparkles,
  Search,
} from "lucide-react";
import { LearningTwinProfile, SkillNode, MistakeEntry, AntigravitySkill } from "@/types";
import { LearningTwinCard } from "./LearningTwinCard";
import { SkillQuestMap } from "./SkillQuestMap";
import { MistakeIntelView } from "./MistakeIntelView";
import { SkillsDirectory } from "@/components/skills/SkillsDirectory";
import { ResourceExplorer } from "./ResourceExplorer";
import { ambientAudio } from "@/components/common/SoundEffects";

interface PlatformDashboardProps {
  twin: LearningTwinProfile;
  skills: SkillNode[];
  mistakes: MistakeEntry[];
  onSelectSkillForStudy: (skill: SkillNode) => void;
  onRetestMistake: (mistakeId: string) => void;
  onAddXP: (xp: number) => void;
  onActivateAntigravitySkill: (skill: AntigravitySkill) => void;
  activeAntigravitySkill?: AntigravitySkill | null;
}

export const PlatformDashboard: React.FC<PlatformDashboardProps> = ({
  twin,
  skills,
  mistakes,
  onSelectSkillForStudy,
  onRetestMistake,
  onAddXP,
  onActivateAntigravitySkill,
  activeAntigravitySkill,
}) => {
  const [activeTab, setActiveTab] = useState<"resources" | "skills-catalog" | "quest" | "twin" | "mistakes">("resources");
  const [dailyQuests, setDailyQuests] = useState([
    { id: 1, title: "Complete 1 Recall Drill", xp: 50, done: true },
    { id: 2, title: "Review 1 Mistake Pattern", xp: 30, done: false },
    { id: 3, title: "Explore 1 Antigravity Skill", xp: 20, done: false },
  ]);

  const handleToggleQuest = (id: number, xp: number) => {
    ambientAudio.playChime("levelUp");
    setDailyQuests((prev) =>
      prev.map((q) => {
        if (q.id === id) {
          if (!q.done) onAddXP(xp);
          return { ...q, done: !q.done };
        }
        return q;
      })
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-28">
      {/* Top Welcome / Daily Quests Bar */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 p-5 sm:p-7 shadow-sm transition-all space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border border-emerald-200/60 dark:border-emerald-800">
                <Compass className="w-3.5 h-3.5" />
                SkillOS Long-Term Studying
              </span>
              <span className="text-xs text-stone-400">Curriculum & Skills Ecosystem</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 mt-1">
              Long-Term Study & Skills
            </h1>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              Explore 307 Antigravity skills, level up your Learning Twin, and build spaced repetition mastery.
            </p>
          </div>

          {/* Daily Quests Mini Pill Box */}
          <div className="bg-stone-50 dark:bg-stone-800/60 p-3.5 rounded-2xl border border-stone-200/80 dark:border-stone-700/80 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-stone-700 dark:text-stone-300">
              <span className="flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                Daily Skill Quests
              </span>
              <span className="text-[11px] text-amber-600 dark:text-amber-400 font-mono">
                +{dailyQuests.reduce((acc, q) => acc + (q.done ? q.xp : 0), 0)} XP Earned
              </span>
            </div>
            <div className="space-y-1.5">
              {dailyQuests.map((q) => (
                <button
                  key={q.id}
                  onClick={() => handleToggleQuest(q.id, q.xp)}
                  className={`w-full flex items-center justify-between text-left p-1.5 px-2.5 rounded-xl text-xs transition-all ${
                    q.done
                      ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 line-through opacity-80"
                      : "bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className={`w-3.5 h-3.5 ${q.done ? "text-emerald-500" : "text-stone-300"}`} />
                    <span>{q.title}</span>
                  </div>
                  <span className="text-[10px] font-mono text-amber-600 font-semibold">+{q.xp} XP</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex items-center gap-2 pt-2 border-t border-stone-100 dark:border-stone-800 overflow-x-auto text-xs">
          <button
            onClick={() => { ambientAudio.playChime("click"); setActiveTab("resources"); }}
            className={`px-3.5 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${activeTab === "resources" ? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-sm" : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200"}`}
          ><Search className="w-3.5 h-3.5 text-emerald-500" /><span>Resource Explorer</span></button>
          <button
            onClick={() => {
              ambientAudio.playChime("click");
              setActiveTab("skills-catalog");
            }}
            className={`px-3.5 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === "skills-catalog"
                ? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-sm"
                : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200"
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-indigo-400" />
            <span>Antigravity Skills (307)</span>
          </button>

          <button
            onClick={() => {
              ambientAudio.playChime("click");
              setActiveTab("quest");
            }}
            className={`px-3.5 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === "quest"
                ? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-sm"
                : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200"
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Database Quest Tree</span>
          </button>

          <button
            onClick={() => {
              ambientAudio.playChime("click");
              setActiveTab("twin");
            }}
            className={`px-3.5 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === "twin"
                ? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-sm"
                : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200"
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>My Learning Twin</span>
          </button>

          <button
            onClick={() => {
              ambientAudio.playChime("click");
              setActiveTab("mistakes");
            }}
            className={`px-3.5 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === "mistakes"
                ? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-sm"
                : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200"
            }`}
          >
            <BookMarked className="w-3.5 h-3.5" />
            <span>Mistake Memory ({mistakes.length})</span>
          </button>
        </div>
      </div>

      {/* Render Active Sub-view */}
      {activeTab === "resources" && <ResourceExplorer />}
      {activeTab === "skills-catalog" && (
        <SkillsDirectory
          onSelectSkill={onActivateAntigravitySkill}
          selectedSkillId={activeAntigravitySkill?.id}
          onAddXP={onAddXP}
        />
      )}

      {activeTab === "quest" && (
        <SkillQuestMap skills={skills} onSelectSkillForStudy={onSelectSkillForStudy} />
      )}

      {activeTab === "twin" && <LearningTwinCard twin={twin} />}

      {activeTab === "mistakes" && (
        <MistakeIntelView mistakes={mistakes} onRetest={onRetestMistake} />
      )}
    </div>
  );
};
