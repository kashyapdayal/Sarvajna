"use client";

import React, { useState, useEffect } from "react";
import {
  Compass,
  Zap,
  MapPin,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  AlertTriangle,
  Sun,
  Moon,
  Headphones,
  Flame,
  Sparkles,
  BookOpen,
  CheckCircle2,
  FolderOpen,
  LogOut,
  ExternalLink,
} from "lucide-react";
import { NavigationTab, LearningTwinProfile, StudyPathIsland } from "@/types";
import { ambientAudio } from "@/components/common/SoundEffects";

interface SidebarProps {
  currentTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  twin: LearningTwinProfile;
  passConfidence: number;
  studyPathTopics?: StudyPathIsland[];
  onOpenAmbientAudio: () => void;
  onOpenPanicMode: () => void;
  isAudioPlaying?: boolean;
  onLogout?: () => void;
  flyTargetRef?: React.RefObject<HTMLDivElement>;
  onCollapseChange?: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  twin,
  passConfidence,
  studyPathTopics = [],
  onOpenAmbientAudio,
  onOpenPanicMode,
  isAudioPlaying = false,
  onLogout,
  flyTargetRef,
  onCollapseChange,
}) => {
  // Collapsed state persisted in localStorage
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);
  const [isDark, setIsDark] = useState<boolean>(false);

  useEffect(() => {
    // Read localStorage on mount
    const saved = localStorage.getItem("skillos_sidebar_collapsed");
    if (saved !== null) {
      const val = saved === "true";
      setIsCollapsed(val);
      if (onCollapseChange) onCollapseChange(val);
    } else {
      if (onCollapseChange) onCollapseChange(false);
    }

    if (document.documentElement.classList.contains("dark")) {
      setIsDark(true);
    }
  }, [onCollapseChange]);

  const toggleCollapsed = () => {
    ambientAudio.playChime("click");
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("skillos_sidebar_collapsed", String(next));
      if (onCollapseChange) onCollapseChange(next);
      return next;
    });
  };

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

  const navItems = [
    {
      id: "discovery" as NavigationTab,
      label: "Explore resources",
      icon: Compass,
      badge: "Search",
      badgeColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
    },
    {
      id: "bridge" as NavigationTab,
      label: "Cram mode",
      icon: Zap,
      badge: "Exam Eve",
      badgeColor: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
    },
    {
      id: "study-path" as NavigationTab,
      label: "My study path",
      icon: MapPin,
      badge: `${studyPathTopics.length} saved`,
      badgeColor: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300",
    },
    {
      id: "settings" as NavigationTab,
      label: "Settings",
      icon: Settings,
      badge: null,
      badgeColor: "",
    },
  ];

  return (
    <>
      {/* Mobile Top Bar with Hamburger */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white/90 dark:bg-stone-900/90 backdrop-blur-md border-b border-stone-200/80 dark:border-stone-800 px-4 py-2.5 flex items-center justify-between">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-sm tracking-tight text-stone-900 dark:text-stone-100">
            SkillOS
          </span>
        </div>

        <button
          onClick={onOpenPanicMode}
          className="px-2.5 py-1 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 border border-rose-200 text-xs font-bold flex items-center gap-1"
        >
          <AlertTriangle className="w-3.5 h-3.5 fill-current" />
          <span>Panic</span>
        </button>
      </div>

      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-sm transition-opacity"
        />
      )}

      {/* The Sidebar Container (Desktop fixed + Mobile Off-canvas) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-white dark:bg-stone-900 border-r border-stone-200/80 dark:border-stone-800 transition-all duration-300 ease-in-out flex flex-col justify-between shadow-lg lg:shadow-none ${
          isCollapsed ? "w-20" : "w-64 sm:w-72"
        } ${
          isMobileOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Top: Brand & Collapse Toggle */}
        <div>
          <div className="p-4 sm:p-5 flex items-center justify-between border-b border-stone-100 dark:border-stone-800/80">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
                <Sparkles className="w-4 h-4 text-emerald-500" />
              </div>
              {!isCollapsed && (
                <div className="min-w-0 transition-opacity duration-200">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-base tracking-tight text-stone-900 dark:text-stone-100">
                      SkillOS
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      v2.0
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-400 truncate">
                    Adaptive Study Engine
                  </p>
                </div>
              )}
            </div>

            {/* Desktop Collapse Arrow Toggle */}
            <button
              onClick={toggleCollapsed}
              className="hidden lg:flex p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>

            {/* Mobile Close Button */}
            <button
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1.5" aria-label="Main Navigation">
            {navItems.map((item) => {
              const isActive =
                currentTab === item.id ||
                (item.id === "discovery" && currentTab === "ai-taking") ||
                (item.id === "bridge" && currentTab === "binge") ||
                (item.id === "study-path" && currentTab === "long-term") ||
                (item.id === "share" && currentTab === "uploading");

              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    ambientAudio.playChime("click");
                    onTabChange(item.id);
                    setIsMobileOpen(false);
                  }}
                  title={item.label}
                  className={`relative w-full flex items-center gap-3 p-3 rounded-2xl text-xs sm:text-sm font-semibold transition-all duration-200 group text-left ${
                    isActive
                      ? "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-sm"
                      : "text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800/70 hover:text-stone-900 dark:hover:text-stone-100"
                  }`}
                >
                  {/* Subtle active accent indicator bar */}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-r-full bg-emerald-500" />
                  )}

                  <Icon
                    className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                      isActive
                        ? "text-emerald-400 dark:text-emerald-600"
                        : "text-stone-500 dark:text-stone-400"
                    }`}
                  />

                  {!isCollapsed && (
                    <div className="flex-1 flex items-center justify-between min-w-0">
                      <span className="truncate">{item.label}</span>
                      {item.badge && (
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold truncate ${
                            isActive
                              ? "bg-white/20 text-white dark:bg-stone-900/20 dark:text-stone-900"
                              : item.badgeColor
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Study Path Topic Rail (Only in expanded view) */}
          {!isCollapsed && (
            <div
              ref={flyTargetRef}
              className="px-4 py-3 mx-3 my-2 bg-stone-50 dark:bg-stone-800/40 rounded-2xl border border-stone-200/60 dark:border-stone-700/60 space-y-2 transition-all"
            >
              <div className="flex items-center justify-between text-xs font-bold text-stone-700 dark:text-stone-300">
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                  Study Path Tracks
                </span>
                <span className="text-[10px] text-stone-400 font-mono">
                  {studyPathTopics.length} Active
                </span>
              </div>

              <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                {studyPathTopics.slice(0, 5).map((topic) => (
                  <div
                    key={topic.id}
                    onClick={() => {
                      ambientAudio.playChime("click");
                      onTabChange("study-path");
                      setIsMobileOpen(false);
                    }}
                    className={`flex items-center justify-between p-1.5 px-2 rounded-xl text-[11px] cursor-pointer transition-colors ${
                      topic.addedFromDiscovery
                        ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 font-semibold"
                        : "text-stone-600 dark:text-stone-400 hover:bg-stone-200/60 dark:hover:bg-stone-700/60"
                    }`}
                  >
                    <span className="truncate max-w-[140px]">{topic.title}</span>
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        topic.status === "completed"
                          ? "bg-emerald-500"
                          : topic.status === "unlocked"
                          ? "bg-amber-500"
                          : "bg-stone-400"
                      }`}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Section: Twin Profile, Soundscapes, Panic, Theme */}
        <div className="p-3 border-t border-stone-100 dark:border-stone-800/80 space-y-2">
          {/* Quick Soundscapes & Theme Buttons */}
          <div className="flex items-center justify-around gap-1 p-1 bg-stone-100/70 dark:bg-stone-800/50 rounded-2xl">
            <button
              onClick={() => {
                ambientAudio.playChime("click");
                onOpenAmbientAudio();
              }}
              className={`p-2 rounded-xl text-xs font-semibold flex items-center justify-center transition-all ${
                isAudioPlaying
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100"
              }`}
              title="Focus Soundscapes (Rain, Alpha, Lofi)"
            >
              <Headphones className={`w-4 h-4 ${isAudioPlaying ? "animate-pulse" : ""}`} />
            </button>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
              title="Toggle Light / Dark Mode"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-stone-600" />}
            </button>

            <button
              onClick={() => {
                ambientAudio.playChime("panic");
                onOpenPanicMode();
              }}
              className="p-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors"
              title="I'm Panicking (Emergency Drill)"
            >
              <AlertTriangle className="w-4 h-4 fill-current" />
            </button>
          </div>

          {/* User Profile Mini Bar */}
          <div
            onClick={() => {
              ambientAudio.playChime("click");
              onTabChange("settings");
              setIsMobileOpen(false);
            }}
            className="flex items-center gap-2.5 p-2 rounded-2xl hover:bg-stone-100 dark:hover:bg-stone-800/60 cursor-pointer transition-colors"
            title="Open Settings & Calibration"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {twin.name ? twin.name.charAt(0).toUpperCase() : "A"}
            </div>

            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                    {twin.name || "Student"}
                  </span>
                  <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                    Lv.{twin.level}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-stone-400">
                  <span className="flex items-center gap-0.5 text-amber-600 dark:text-amber-400 font-semibold">
                    <Flame className="w-3 h-3 fill-current" />
                    {twin.streakDays}d
                  </span>
                  <span>•</span>
                  <span>{passConfidence}% Pass</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
