"use client";

import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  Compass,
  Zap,
  Share2,
  Headphones,
  Moon,
  Sun,
  AlertTriangle,
  Bot,
  Sparkles,
} from "lucide-react";
import { NavigationTab, LearningTwinProfile } from "@/types";
import { ambientAudio } from "@/components/common/SoundEffects";

interface FloatingDockProps {
  currentTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  twin: LearningTwinProfile;
  passConfidence: number;
  hoursRemaining: number;
  onOpenAmbientAudio: () => void;
  onOpenPanicMode: () => void;
  isAudioPlaying?: boolean;
}

export const FloatingDock: React.FC<FloatingDockProps> = ({
  currentTab,
  onTabChange,
  twin,
  passConfidence,
  hoursRemaining,
  onOpenAmbientAudio,
  onOpenPanicMode,
  isAudioPlaying = false,
}) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (document.documentElement.classList.contains("dark")) {
      setIsDark(true);
    }
  }, []);

  // Keyboard shortcut listener: 1: AI Taking, 2: Long-Term, 3: Binge, 4: Uploading
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "1") {
        ambientAudio.playChime("click");
        onTabChange("ai-taking");
      } else if (e.key === "2") {
        ambientAudio.playChime("click");
        onTabChange("long-term");
      } else if (e.key === "3") {
        ambientAudio.playChime("click");
        onTabChange("binge");
      } else if (e.key === "4") {
        ambientAudio.playChime("click");
        onTabChange("uploading");
      } else if (e.key.toLowerCase() === "p") {
        onOpenPanicMode();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onTabChange, onOpenPanicMode]);

  const toggleTheme = () => {
    ambientAudio.playChime("click");
    if (document.documentElement.classList.contains("dark")) {
      document.documentElement.classList.remove("dark");
      setIsDark(false);
    } else {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    }
  };

  return (
    <aside aria-label="Quick Actions and Navigation" className="fixed bottom-4 sm:bottom-6 left-1/2 transform -translate-x-1/2 z-40 w-[96%] max-w-2xl">
      <div className="dock-glass rounded-full p-2 sm:p-2.5 flex items-center justify-between gap-1 sm:gap-2 shadow-2xl transition-all duration-300">
        {/* Left Flank: Ambient Soundscape */}
        <div className="flex items-center gap-1 pl-1">
          <button
            onClick={() => {
              ambientAudio.playChime("click");
              onOpenAmbientAudio();
            }}
            className={`p-2.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all tactile-button ${
              isAudioPlaying
                ? "bg-emerald-500 text-white shadow-sm"
                : "text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800/80"
            }`}
            title="Focus Soundscapes (Rain, Alpha, Lofi)"
          >
            <Headphones className={`w-4 h-4 ${isAudioPlaying ? "animate-pulse" : ""}`} />
            <span className="hidden lg:inline text-[11px]">Audio</span>
          </button>
        </div>

        {/* Center: The Core Switching Options */}
        <nav aria-label="Main Navigation" className="flex items-center gap-1 sm:gap-1.5 bg-stone-100/70 dark:bg-stone-800/60 p-1 rounded-full border border-stone-200/50 dark:border-stone-700/50 overflow-x-auto">
          {/* TAB 1: AI Taking (Main Default) */}
          <button
            onClick={() => {
              ambientAudio.playChime("click");
              onTabChange("ai-taking");
            }}
            className={`relative px-3 sm:px-3.5 py-2 rounded-full text-xs font-bold transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap ${
              currentTab === "ai-taking"
                ? "bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm"
                : "text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200"
            }`}
          >
            <Bot className={`w-4 h-4 ${currentTab === "ai-taking" ? "text-emerald-600 dark:text-emerald-400" : ""}`} />
            <span className="text-[11px] sm:text-xs">AI Taking</span>
            {currentTab === "ai-taking" && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 absolute -bottom-0.5 left-1/2 transform -translate-x-1/2" />
            )}
          </button>

          {/* TAB 2: Long Term Studying */}
          <button
            onClick={() => {
              ambientAudio.playChime("click");
              onTabChange("long-term");
            }}
            className={`relative px-3 sm:px-3.5 py-2 rounded-full text-xs font-bold transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap ${
              currentTab === "long-term"
                ? "bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm"
                : "text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200"
            }`}
          >
            <Compass className={`w-4 h-4 ${currentTab === "long-term" ? "text-indigo-600 dark:text-indigo-400" : ""}`} />
            <span className="text-[11px] sm:text-xs">Long Term</span>
            {currentTab === "long-term" && (
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 absolute -bottom-0.5 left-1/2 transform -translate-x-1/2" />
            )}
          </button>

          {/* TAB 3: Binge Studying (Rescue) */}
          <button
            onClick={() => {
              ambientAudio.playChime("click");
              onTabChange("binge");
            }}
            className={`relative px-3 sm:px-3.5 py-2 rounded-full text-xs font-bold transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap ${
              currentTab === "binge"
                ? "bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm"
                : "text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200"
            }`}
          >
            <Zap className={`w-4 h-4 ${currentTab === "binge" ? "text-rose-500 fill-current" : ""}`} />
            <span className="text-[11px] sm:text-xs">Binge Study</span>
            <span className="hidden sm:inline-flex text-[10px] font-mono bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 px-1.5 py-0.2 rounded-full">
              {passConfidence}%
            </span>
            {currentTab === "binge" && (
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 absolute -bottom-0.5 left-1/2 transform -translate-x-1/2" />
            )}
          </button>

          {/* TAB 4: Uploading */}
          <button
            onClick={() => {
              ambientAudio.playChime("click");
              onTabChange("uploading");
            }}
            className={`relative px-3 sm:px-3.5 py-2 rounded-full text-xs font-bold transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap ${
              currentTab === "uploading"
                ? "bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm"
                : "text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200"
            }`}
          >
            <Share2 className={`w-4 h-4 ${currentTab === "uploading" ? "text-amber-500" : ""}`} />
            <span className="text-[11px] sm:text-xs">Uploading</span>
            {currentTab === "uploading" && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 absolute -bottom-0.5 left-1/2 transform -translate-x-1/2" />
            )}
          </button>
        </nav>

        {/* Right Flank: Panic + Theme */}
        <div className="flex items-center gap-1 pr-1">
          {/* Panic Trigger */}
          <button
            onClick={() => {
              ambientAudio.playChime("panic");
              onOpenPanicMode();
            }}
            className="p-2 sm:px-2.5 sm:py-2 rounded-full bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-xs font-bold flex items-center gap-1 transition-all shadow-sm tactile-button"
            title="I'm Panicking (Press P)"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 fill-rose-600" />
            <span className="hidden xl:inline text-[11px]">Panic</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800/80 transition-colors"
            title="Toggle Light / Dark Mode"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-stone-600" />}
          </button>
        </div>
      </div>
    </aside>
  );
};
