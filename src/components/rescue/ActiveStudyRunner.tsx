"use client";

import React, { useState, useEffect } from "react";
import {
  Clock,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  BookOpen,
  Languages,
  CheckCircle,
  HelpCircle,
  FileCheck,
  AlertCircle,
  FileText,
  ChevronRight,
  Flame,
} from "lucide-react";
import { StudyBlock } from "@/types";
import { ambientAudio } from "@/components/common/SoundEffects";

interface ActiveStudyRunnerProps {
  block: StudyBlock;
  onOpenQuiz: () => void;
  onBlockComplete: () => void;
  onOpenCheatSheet: () => void;
  onTriggerPanic: () => void;
}

export const ActiveStudyRunner: React.FC<ActiveStudyRunnerProps> = ({
  block,
  onOpenQuiz,
  onBlockComplete,
  onOpenCheatSheet,
  onTriggerPanic,
}) => {
  const [noteLayer, setNoteLayer] = useState<"30s" | "3m" | "deep">("3m");
  const [timerSeconds, setTimerSeconds] = useState(block.durationMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTransform, setActiveTransform] = useState<{
    paragraphIdx: number;
    type: "simplify" | "example" | "translate";
  } | null>(null);
  const [translatedLang, setTranslatedLang] = useState<"Malayalam" | "Hindi" | "Spanish">("Malayalam");
  const [addedToSheet, setAddedToSheet] = useState(false);

  useEffect(() => {
    setTimerSeconds(block.durationMinutes * 60);
    setIsRunning(false);
    setActiveTransform(null);
  }, [block]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0 && isRunning) {
      setIsRunning(false);
      ambientAudio.playChime("levelUp");
    }
    return () => clearInterval(interval);
  }, [isRunning, timerSeconds]);

  const toggleTimer = () => {
    ambientAudio.playChime("click");
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    ambientAudio.playChime("click");
    setIsRunning(false);
    setTimerSeconds(block.durationMinutes * 60);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const progressPercent = Math.max(
    0,
    Math.min(100, ((block.durationMinutes * 60 - timerSeconds) / (block.durationMinutes * 60)) * 100)
  );

  return (
    <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-5 sm:p-7 shadow-sm transition-all space-y-6">
      {/* Top Banner: Topic title + Focus Timer Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100 dark:border-stone-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
              NOW FOCUSING • {block.depthLevel}
            </span>
            <span className="text-xs text-stone-500 dark:text-stone-400">
              Appeared in {(block.pAppear * 100).toFixed(0)}% PYQs ({block.avgMarks} Marks)
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100">
            {block.topicTitle}
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            {block.whyThis}
          </p>
        </div>

        {/* Tactile Pomodoro Timer */}
        <div className="flex items-center gap-3 bg-stone-50 dark:bg-stone-800/60 p-2.5 rounded-2xl border border-stone-200 dark:border-stone-700 self-start sm:self-auto">
          <div className="relative w-12 h-12 flex items-center justify-center">
            <svg className="w-12 h-12 transform -rotate-90">
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke="currentColor"
                strokeWidth="3.5"
                className="text-stone-200 dark:text-stone-700"
                fill="transparent"
              />
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke="currentColor"
                strokeWidth="3.5"
                className="text-emerald-500 transition-all duration-300"
                strokeDasharray={125.6}
                strokeDashoffset={125.6 - (125.6 * progressPercent) / 100}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 absolute" />
          </div>

          <div className="flex flex-col">
            <span className="font-mono text-lg font-bold tracking-tight text-stone-800 dark:text-stone-200">
              {formatTime(timerSeconds)}
            </span>
            <span className="text-[10px] text-stone-400">Focus Block</span>
          </div>

          <div className="flex items-center gap-1 pl-1">
            <button
              onClick={toggleTimer}
              className="p-2 rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:opacity-90 transition-opacity"
              title={isRunning ? "Pause timer" : "Start timer"}
            >
              {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            </button>
            <button
              onClick={resetTimer}
              className="p-2 rounded-xl text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700/60 transition-colors"
              title="Reset timer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Layer Tabs: 30s | 3 min | Deep */}
      <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
        <div className="flex items-center gap-1.5 p-1 bg-stone-100 dark:bg-stone-800 rounded-xl text-xs font-medium">
          <button
            onClick={() => {
              ambientAudio.playChime("click");
              setNoteLayer("30s");
            }}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              noteLayer === "30s"
                ? "bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm font-semibold"
                : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
            }`}
          >
            30-Sec Hook
          </button>
          <button
            onClick={() => {
              ambientAudio.playChime("click");
              setNoteLayer("3m");
            }}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              noteLayer === "3m"
                ? "bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm font-semibold"
                : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
            }`}
          >
            3-Min Core (High-Yield)
          </button>
          <button
            onClick={() => {
              ambientAudio.playChime("click");
              setNoteLayer("deep");
            }}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              noteLayer === "deep"
                ? "bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm font-semibold"
                : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
            }`}
          >
            Deep (Edge Cases)
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-stone-400">
          <FileCheck className="w-4 h-4 text-emerald-500" />
          <span>Grounded in student notes & PYQs</span>
        </div>
      </div>

      {/* Note Content Display */}
      <div className="space-y-5 text-stone-800 dark:text-stone-200 leading-relaxed text-sm">
        {noteLayer === "30s" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40">
              <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-semibold text-xs uppercase tracking-wider mb-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Executive Definition</span>
              </div>
              <p className="text-stone-800 dark:text-stone-200 font-medium">
                {block.notes.l30s.definition}
              </p>
            </div>

            <div className="bg-stone-50 dark:bg-stone-800/40 p-4 rounded-2xl border border-stone-200 dark:border-stone-800">
              <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider block mb-2">
                Key Fast Takeaways
              </span>
              <ul className="space-y-2">
                {block.notes.l30s.bullets.map((bullet, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/50 text-xs text-emerald-900 dark:text-emerald-300">
              <span className="font-bold mr-1">Exam Hall Hook:</span>
              {block.notes.l30s.examHook}
            </div>
          </div>
        )}

        {noteLayer === "3m" && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Main paragraph with per-paragraph AI actions */}
            <div className="p-4 rounded-2xl bg-stone-50/70 dark:bg-stone-800/30 border border-stone-200 dark:border-stone-800/80 space-y-3">
              <p className="text-stone-800 dark:text-stone-200 leading-relaxed text-sm">
                {block.notes.l3m.explanation}
              </p>

              {/* Per-paragraph AI action bar */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-200/60 dark:border-stone-700/60 text-xs">
                <button
                  onClick={() => {
                    ambientAudio.playChime("click");
                    setActiveTransform(
                      activeTransform?.type === "simplify" ? null : { paragraphIdx: 0, type: "simplify" }
                    );
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 flex items-center gap-1.5 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Simplify English</span>
                </button>

                <button
                  onClick={() => {
                    ambientAudio.playChime("click");
                    setActiveTransform(
                      activeTransform?.type === "example" ? null : { paragraphIdx: 0, type: "example" }
                    );
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 flex items-center gap-1.5 transition-colors"
                >
                  <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Give Intuitive Example</span>
                </button>

                <div className="flex items-center gap-1 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg px-2 py-0.5">
                  <Languages className="w-3.5 h-3.5 text-emerald-600" />
                  <select
                    value={translatedLang}
                    onChange={(e) => setTranslatedLang(e.target.value as any)}
                    className="bg-transparent text-stone-700 dark:text-stone-300 text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="Malayalam">Malayalam</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Spanish">Spanish</option>
                  </select>
                  <button
                    onClick={() => {
                      ambientAudio.playChime("click");
                      setActiveTransform(
                        activeTransform?.type === "translate" ? null : { paragraphIdx: 0, type: "translate" }
                      );
                    }}
                    className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline ml-1"
                  >
                    Translate
                  </button>
                </div>
              </div>

              {/* Dynamic transform popover */}
              {activeTransform && (
                <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs space-y-1 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between text-indigo-900 dark:text-indigo-300 font-semibold uppercase tracking-wider">
                    <span>
                      {activeTransform.type === "simplify" && "Simplified Clarity"}
                      {activeTransform.type === "example" && "Real-World Mental Model"}
                      {activeTransform.type === "translate" && `AI Translation (${translatedLang})`}
                    </span>
                    <span className="text-[10px] text-stone-400 font-mono">Agent R9 Tutor</span>
                  </div>

                  {activeTransform.type === "simplify" && (
                    <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
                      "Think of normalization like cleaning a messy closet. Instead of shoving shirts, shoes,
                      and winter jackets into one overloaded drawer, you create separate tidy organizers linked by simple labels."
                    </p>
                  )}
                  {activeTransform.type === "example" && (
                    <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
                      "Real world example: If a student enrolls in multiple clubs, storing student address in each club row means if they move,
                      you must update 5 rows. Normalization splits Student and Club into separate tables!"
                    </p>
                  )}
                  {activeTransform.type === "translate" && (
                    <p className="text-stone-700 dark:text-stone-300 leading-relaxed font-sans">
                      {translatedLang === "Malayalam"
                        ? "നോർമലൈസേഷൻ എന്നത് ഡാറ്റാബേസിൽ അനാവശ്യമായ ഡ്യൂപ്ലിക്കേഷൻ കുറയ്ക്കാനും ഡാറ്റ കൃത്യമായി സൂക്ഷിക്കാനുമുള്ള ഒരു രീതിയാണ്."
                        : translatedLang === "Hindi"
                        ? "डेटाबेस सामान्यीकरण डेटा की अतिरेकता (redundancy) को कम करने और विसंगतियों को समाप्त करने की एक संरचित प्रक्रिया है।"
                        : "La normalización de bases de datos organiza los datos para reducir la redundancia y evitar anomalías de actualización."}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Worked Example */}
            <div className="p-4 rounded-2xl bg-stone-900 dark:bg-stone-800 text-white space-y-2">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 fill-current" />
                <span>Standard University Worked Problem</span>
              </span>
              <p className="font-mono text-xs text-stone-200 bg-stone-950/70 p-3 rounded-xl border border-stone-800">
                {block.notes.l3m.workedExample}
              </p>
            </div>

            {/* Algorithm Steps */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                Step-by-Step Execution Protocol
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {block.notes.l3m.formulaOrSteps.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-800 text-xs"
                  >
                    {step}
                  </div>
                ))}
              </div>
            </div>

            {/* Common Mistakes & How to Write for Evaluators */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 space-y-2">
                <div className="flex items-center gap-1.5 text-rose-800 dark:text-rose-300 font-semibold text-xs uppercase tracking-wide">
                  <AlertCircle className="w-4 h-4" />
                  <span>3 Common Evaluator Traps</span>
                </div>
                <ul className="space-y-1.5 text-xs text-rose-950 dark:text-rose-200/90">
                  {block.notes.l3m.commonMistakes.map((mistake, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span>•</span>
                      <span>{mistake}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 space-y-2">
                <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-semibold text-xs uppercase tracking-wide">
                  <FileText className="w-4 h-4" />
                  <span>How to Score Full {block.notes.l3m.howToWriteAnswer.marks} Marks</span>
                </div>
                <p className="text-xs text-emerald-950 dark:text-emerald-200/90 leading-relaxed">
                  {block.notes.l3m.howToWriteAnswer.structure}
                </p>
              </div>
            </div>
          </div>
        )}

        {noteLayer === "deep" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-800 space-y-3">
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                Mathematical Nuances & Edge Cases
              </span>
              <ul className="space-y-2 text-xs">
                {block.notes.deep?.edgeCases.map((ec, idx) => (
                  <li key={idx} className="p-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700/60">
                    {ec}
                  </li>
                ))}
              </ul>
              <div className="pt-2 text-[11px] text-stone-500 font-mono">
                Theoretical foundation: {block.notes.deep?.proofOrOrigin}
              </div>
            </div>
          </div>
        )}

        {/* Citations Footer */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-stone-100 dark:border-stone-800 text-xs text-stone-400">
          <div className="flex items-center gap-2">
            <span>Verified Sources:</span>
            {block.notes.citations.map((cite, idx) => (
              <span key={idx} className="bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-md font-mono text-[11px] text-stone-600 dark:text-stone-300">
                {cite}
              </span>
            ))}
          </div>
          <button
            onClick={() => {
              ambientAudio.playChime("click");
              setAddedToSheet(true);
              setTimeout(() => setAddedToSheet(false), 2500);
            }}
            className="text-stone-600 dark:text-stone-300 hover:text-emerald-600 font-medium flex items-center gap-1 transition-colors"
          >
            {addedToSheet ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <Sparkles className="w-3.5 h-3.5 text-amber-500" />}
            <span>{addedToSheet ? "Added to Cheat Sheet!" : "+ Add Key Formula to Cheat Sheet"}</span>
          </button>
        </div>
      </div>

      {/* Bottom Action Dock: Quiz & Complete */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-100 dark:border-stone-800">
        <button
          onClick={onTriggerPanic}
          className="text-xs text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 font-medium flex items-center gap-1.5 transition-colors"
        >
          <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
          <span>Feeling overloaded? Tap for Calm Reset</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenCheatSheet}
            className="px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            View Cheat Sheet
          </button>

          <button
            onClick={onOpenQuiz}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-medium text-xs flex items-center gap-2 shadow-sm transition-all tactile-button"
          >
            <span>Take 3-Min Recall Quiz (+60 XP)</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
