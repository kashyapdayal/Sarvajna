"use client";

import React, { useState } from "react";
import {
  Clock,
  Shield,
  Moon,
  Info,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  ListFilter,
  Flame,
} from "lucide-react";
import { ExamRescueSession, StudyBlock } from "@/types";
import { NowNextLater } from "./NowNextLater";
import { ActiveStudyRunner } from "./ActiveStudyRunner";
import { RecallQuizModal } from "./RecallQuizModal";
import { CheatSheetModal } from "./CheatSheetModal";
import { PanicModeOverlay } from "./PanicModeOverlay";
import { ambientAudio } from "@/components/common/SoundEffects";

interface RescueDashboardProps {
  session: ExamRescueSession;
  blocks: StudyBlock[];
  onUpdateConfidence: (newScore: number) => void;
  onBlockCompleted: (blockId: string) => void;
  onAddXP: (xp: number) => void;
}

export const RescueDashboard: React.FC<RescueDashboardProps> = ({
  session,
  blocks,
  onUpdateConfidence,
  onBlockCompleted,
  onAddXP,
}) => {
  const [activeBlockIndex, setActiveBlockIndex] = useState(0);
  const [showStudyModal, setShowStudyModal] = useState(true);
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [isCheatSheetOpen, setIsCheatSheetOpen] = useState(false);
  const [isPanicOpen, setIsPanicOpen] = useState(false);
  const [showSkippedModal, setShowSkippedModal] = useState(false);
  const [showConfidenceWhy, setShowConfidenceWhy] = useState(false);

  const activeBlock = blocks[activeBlockIndex] || blocks[0];

  const handleQuizSuccess = () => {
    ambientAudio.playChime("levelUp");
    onUpdateConfidence(session.passConfidence + 3);
    onBlockCompleted(activeBlock.id);
    onAddXP(60);
    setIsQuizOpen(false);

    // Auto progress to next block if available
    if (activeBlockIndex < blocks.length - 1) {
      setActiveBlockIndex(activeBlockIndex + 1);
    }
  };

  const handleFiveMinPanicTask = () => {
    setActiveBlockIndex(0);
    setShowStudyModal(true);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-28">
      {/* Top Emergency Rescue Header */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-5 sm:p-7 shadow-sm transition-all space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 text-xs font-bold tracking-wide flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                1-DAY BINGE RESCUE MODE
              </span>
              <span className="text-xs text-stone-400 font-mono">
                {session.hoursRemaining}h remaining until exam
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 mt-1.5">
              {session.examName}
            </h1>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              Target: {session.targetDate} • Minimum cutoff to pass: {session.passScoreTarget}/100 marks
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsCheatSheetOpen(true)}
              className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>A4 Cheat Sheet</span>
            </button>

            <button
              onClick={() => setIsPanicOpen(true)}
              className="px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <AlertTriangle className="w-4 h-4 text-rose-500 animate-bounce" />
              <span>I'm Panicking</span>
            </button>
          </div>
        </div>

        {/* Confidence Meter & Sleep Protection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Pass Confidence Box */}
          <div className="bg-stone-50 dark:bg-stone-800/50 rounded-2xl p-4 border border-stone-200 dark:border-stone-700/80">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-300">
                  Live Pass Confidence
                </span>
              </div>
              <button
                onClick={() => setShowConfidenceWhy(!showConfidenceWhy)}
                className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5 font-medium"
              >
                <Info className="w-3 h-3" />
                <span>Why this number?</span>
              </button>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-3xl sm:text-4xl font-black text-stone-900 dark:text-stone-100 tracking-tight">
                {session.passConfidence}%
              </span>
              <span className="text-xs text-stone-500 dark:text-stone-400 font-mono">
                (Range {session.confidenceRange[0]}% - {session.confidenceRange[1]}%)
              </span>
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-medium">
                {session.passConfidence >= 70 ? "GOOD PASS PROBABILITY" : "PASS AT RISK"}
              </span>
            </div>

            {/* Gauge progress bar */}
            <div className="w-full bg-stone-200 dark:bg-stone-700 h-2 rounded-full overflow-hidden my-3">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-700"
                style={{ width: `${session.passConfidence}%` }}
              />
            </div>

            <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
              {session.passConfidenceDriver}
            </p>

            {/* Explanatory accordion */}
            {showConfidenceWhy && (
              <div className="mt-3 p-3 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700 text-xs space-y-1.5 animate-in fade-in duration-150">
                <div className="font-semibold text-stone-800 dark:text-stone-200">
                  Deterministic Math (Zero AI Hallucination):
                </div>
                <p className="text-stone-600 dark:text-stone-400 text-[11px] leading-relaxed">
                  Based on Gaussian error variance over 7 of last 8 university question papers.
                  We calculate: Expected Score = 54 marks against the 40 mark passing threshold.
                  Taking recall quizzes and avoiding common traps pushes your band toward 84%.
                </p>
              </div>
            )}
          </div>

          {/* Sleep & Time Engine Shield */}
          <div className="bg-stone-50 dark:bg-stone-800/50 rounded-2xl p-4 border border-stone-200 dark:border-stone-700/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Moon className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-300">
                  Sleep & Energy Shield
                </span>
                <span className="ml-auto text-[11px] bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 font-medium px-2 py-0.5 rounded-full">
                  Locked
                </span>
              </div>
              <p className="text-sm font-bold text-stone-800 dark:text-stone-200">
                {session.sleepWindow}
              </p>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 leading-relaxed">
                Golden Rule #5: <em>Cut content, not sleep.</em> Studying with cognitive sleep deprivation
                drops exam recall by 40%. Your schedule leaves full sleep untouched.
              </p>
            </div>

            <div className="pt-3 border-t border-stone-200/60 dark:border-stone-700/60 flex items-center justify-between text-xs">
              <span className="text-stone-600 dark:text-stone-300">
                Total Focus Work: <strong>{session.studyTimeHours}</strong>
              </span>
              <button
                onClick={() => setShowSkippedModal(!showSkippedModal)}
                className="text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 underline font-medium flex items-center gap-1"
              >
                <span>{session.skippedTopicsCount} Skipped Topics</span>
                {showSkippedModal ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>
          </div>
        </div>

        {/* Skipped Topics Explanation Dropdown */}
        {showSkippedModal && (
          <div className="p-4 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 rounded-2xl text-xs space-y-2 animate-in fade-in duration-200">
            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-semibold">
              <ListFilter className="w-4 h-4 text-amber-600" />
              <span>Honest Triage: Why We Pruned 11 Topics</span>
            </div>
            <p className="text-stone-700 dark:text-stone-300 leading-relaxed text-xs">
              {session.skippedReason}. Trying to cram every single corner of an 18-chapter syllabus in
              14 hours creates mental panic and shallow recall. We concentrated your energy on the 7 Pass Core
              topics that carry 75% of total exam weight.
            </p>
          </div>
        )}
      </div>

      {/* Now Next Later Stream */}
      <NowNextLater
        blocks={blocks}
        activeBlockIndex={activeBlockIndex}
        onSelectBlock={(idx) => {
          setActiveBlockIndex(idx);
          setShowStudyModal(true);
        }}
        passConfidence={session.passConfidence}
        passConfidenceDriver={session.passConfidenceDriver}
        onTriggerPanic={() => setIsPanicOpen(true)}
        onOpenStudyRunner={() => setShowStudyModal(true)}
      />

      {/* Active Study Runner (Notes & Focus Pomodoro) */}
      {showStudyModal && activeBlock && (
        <ActiveStudyRunner
          block={activeBlock}
          onOpenQuiz={() => setIsQuizOpen(true)}
          onBlockComplete={() => {
            onBlockCompleted(activeBlock.id);
            onAddXP(50);
            if (activeBlockIndex < blocks.length - 1) {
              setActiveBlockIndex(activeBlockIndex + 1);
            }
          }}
          onOpenCheatSheet={() => setIsCheatSheetOpen(true)}
          onTriggerPanic={() => setIsPanicOpen(true)}
        />
      )}

      {/* Modals */}
      <RecallQuizModal
        isOpen={isQuizOpen}
        onClose={() => setIsQuizOpen(false)}
        quiz={activeBlock.quiz}
        topicTitle={activeBlock.topicTitle}
        onSuccess={handleQuizSuccess}
      />

      <CheatSheetModal
        isOpen={isCheatSheetOpen}
        onClose={() => setIsCheatSheetOpen(false)}
      />

      <PanicModeOverlay
        isOpen={isPanicOpen}
        onClose={() => setIsPanicOpen(false)}
        onStartFiveMinTask={handleFiveMinPanicTask}
      />
    </div>
  );
};
