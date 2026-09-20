"use client";

import React, { useState } from "react";
import {
  X,
  Printer,
  Copy,
  Check,
  Download,
  AlertTriangle,
  Lightbulb,
  Clock,
  BookOpen,
  FileText,
  Sparkles,
} from "lucide-react";
import { cheatSheetContent } from "@/data/mockData";
import { ambientAudio } from "@/components/common/SoundEffects";

interface CheatSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CheatSheetModal: React.FC<CheatSheetModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<"all" | "panic" | "formulas" | "traps" | "strategy">("all");
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    ambientAudio.playChime("click");
    const fullText = `=== EXAM EVE CHEAT SHEET: ${cheatSheetContent.examName} ===\n\n` +
      `PANIC CARD (10 LINES):\n${cheatSheetContent.panicCard.join("\n")}\n\n` +
      `FORMULAS:\n${cheatSheetContent.formulas.map((f) => `${f.title}: ${f.formula}`).join("\n")}\n\n` +
      `TRAPS:\n${cheatSheetContent.traps.join("\n")}\n\n` +
      `TIME STRATEGY:\n${cheatSheetContent.timeStrategy.join("\n")}`;

    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    ambientAudio.playChime("click");
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 max-h-[90vh] flex flex-col my-auto animate-in fade-in duration-200">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-stone-100 dark:border-stone-800 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
                A4 Ultra High-Yield
              </span>
              <span className="text-xs text-stone-400">1-Page Print Verified</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold mt-1 text-stone-900 dark:text-stone-100">
              Exam Eve Rescue Cheat Sheet — {cheatSheetContent.examName}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-medium flex items-center gap-1.5 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied!" : "Copy Text"}</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-medium flex items-center gap-1.5 hover:opacity-90 transition-opacity"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Filter Bar */}
        <div className="px-6 py-2.5 bg-stone-50 dark:bg-stone-800/50 border-b border-stone-100 dark:border-stone-800 flex items-center gap-2 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === "all"
                ? "bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-sm"
                : "text-stone-500 hover:text-stone-900 dark:hover:text-stone-200"
            }`}
          >
            Full Sheet (A4 View)
          </button>
          <button
            onClick={() => setActiveTab("panic")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === "panic"
                ? "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 shadow-sm border border-rose-200 dark:border-rose-900"
                : "text-stone-500 hover:text-stone-900 dark:hover:text-stone-200"
            }`}
          >
            10-Line Panic Card
          </button>
          <button
            onClick={() => setActiveTab("formulas")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === "formulas"
                ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 shadow-sm border border-indigo-200 dark:border-indigo-900"
                : "text-stone-500 hover:text-stone-900 dark:hover:text-stone-200"
            }`}
          >
            Formulas & Rules
          </button>
          <button
            onClick={() => setActiveTab("traps")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === "traps"
                ? "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 shadow-sm border border-amber-200 dark:border-amber-900"
                : "text-stone-500 hover:text-stone-900 dark:hover:text-stone-200"
            }`}
          >
            High-Yield Traps
          </button>
          <button
            onClick={() => setActiveTab("strategy")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === "strategy"
                ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 shadow-sm border border-emerald-200 dark:border-emerald-900"
                : "text-stone-500 hover:text-stone-900 dark:hover:text-stone-200"
            }`}
          >
            Exam Hall Clock
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-sm">
          {/* Panic Card */}
          {(activeTab === "all" || activeTab === "panic") && (
            <div className="bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <h3 className="font-bold text-rose-900 dark:text-rose-300 text-sm uppercase tracking-wide">
                  1. The 10-Line Panic Card (Quick Recall Before Entering Hall)
                </h3>
              </div>
              <ol className="space-y-1.5 text-xs text-rose-950 dark:text-rose-200/90 font-mono">
                {cheatSheetContent.panicCard.map((line, idx) => (
                  <li key={idx} className="p-1.5 bg-white/70 dark:bg-stone-900/60 rounded-lg border border-rose-100 dark:border-rose-900/40">
                    {line}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Formulas and Algorithms */}
          {(activeTab === "all" || activeTab === "formulas") && (
            <div className="bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-800 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-bold text-stone-900 dark:text-stone-100 text-sm uppercase tracking-wide">
                  2. Core Formulas & Algorithmic Conditions
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {cheatSheetContent.formulas.map((item, idx) => (
                  <div key={idx} className="p-3 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700/80">
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400 block mb-1">
                      {item.title}
                    </span>
                    <code className="text-stone-800 dark:text-stone-300 font-mono text-[11px] block bg-stone-100 dark:bg-stone-800 p-2 rounded-lg">
                      {item.formula}
                    </code>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Traps */}
          {(activeTab === "all" || activeTab === "traps") && (
            <div className="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <h3 className="font-bold text-amber-900 dark:text-amber-300 text-sm uppercase tracking-wide">
                  3. Avoid Common University Traps (Evaluator Favorite Traps)
                </h3>
              </div>
              <div className="space-y-2 text-xs text-amber-950 dark:text-amber-200/90">
                {cheatSheetContent.traps.map((trap, idx) => (
                  <div key={idx} className="p-2.5 bg-white/70 dark:bg-stone-900/60 rounded-xl border border-amber-100 dark:border-amber-900/40">
                    {trap}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mnemonics */}
          {(activeTab === "all" || activeTab === "formulas") && (
            <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/60 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-bold text-indigo-900 dark:text-indigo-300 text-sm uppercase tracking-wide">
                  4. High-Retention Mnemonics
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                {cheatSheetContent.mnemonics.map((mnem, idx) => (
                  <div key={idx} className="p-3 bg-white dark:bg-stone-900 rounded-xl border border-indigo-100 dark:border-indigo-900/50 text-stone-700 dark:text-stone-300">
                    {mnem}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Exam Hall Strategy */}
          {(activeTab === "all" || activeTab === "strategy") && (
            <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-bold text-emerald-900 dark:text-emerald-300 text-sm uppercase tracking-wide">
                  5. 3-Hour Exam Hall Clock Management
                </h3>
              </div>
              <div className="space-y-2 text-xs text-emerald-950 dark:text-emerald-200/90 font-mono">
                {cheatSheetContent.timeStrategy.map((step, idx) => (
                  <div key={idx} className="p-2.5 bg-white/70 dark:bg-stone-900/60 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
                    {step}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
