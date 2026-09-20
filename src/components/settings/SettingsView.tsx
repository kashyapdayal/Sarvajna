"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Brain,
  Download,
  Moon,
  Sun,
  LogOut,
  RotateCcw,
  CheckCircle2,
  FileText,
  Clock,
  Zap,
  Flame,
  Shield,
  Languages,
  Activity,
  Award,
  Sparkles,
  Sliders,
} from "lucide-react";
import { LearningTwinProfile } from "@/types";
import { ambientAudio } from "@/components/common/SoundEffects";
import {
  GraspingTelemetry,
  getStoredGraspingTelemetry,
  setStoredGraspingScore,
  getStoredSimplificationLang,
  setStoredSimplificationLang,
  SUPPORTED_LANGUAGES,
  getStoredTheme,
  setStoredTheme,
} from "@/lib/grasping-service";

interface SettingsViewProps {
  twin: LearningTwinProfile;
  onLogout: () => void;
  onResetOnboarding: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  twin,
  onLogout,
  onResetOnboarding,
}) => {
  const [initialDataTxt, setInitialDataTxt] = useState<string>("");
  const [downloaded, setDownloaded] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<"dark" | "light">("dark");
  const [graspingData, setGraspingData] = useState<GraspingTelemetry>(getStoredGraspingTelemetry());
  const [simplificationLang, setSimplificationLang] = useState<string>("en_eli5");
  const [customScoreInput, setCustomScoreInput] = useState<number>(4.8);

  useEffect(() => {
    // Load grasping telemetry
    const telemetry = getStoredGraspingTelemetry();
    setGraspingData(telemetry);
    setCustomScoreInput(telemetry.scoreOutOf10);

    // Load language preference
    const lang = getStoredSimplificationLang();
    setSimplificationLang(lang);

    // Load theme preference
    const theme = getStoredTheme();
    setCurrentTheme(theme);
    setStoredTheme(theme);

    const rawTxt = localStorage.getItem("student_initial_data_txt");
    if (rawTxt) {
      setInitialDataTxt(rawTxt);
    } else {
      const sample = `========================================================
SARVAJNA ADAPTIVE CAPABILITY ASSESSMENT REPORT
Generated for: ${twin.name || "Student"}
Date: ${new Date().toISOString()}
========================================================

1. COGNITIVE CAPACITY & TIME BUDGET
- Study Hours Available Per Day: 3.5 hrs
- Chronotype: ${twin.chronotype}
- Focus Span Before Drifting: ${twin.focusSpanMinutes} mins
- Attention Style: ${twin.weakStyle}

2. PEDAGOGICAL PREFERENCES
- Learning Style: Visual & Practice-based
- Concept Grasping Speed: ${twin.prefers}
- Feedback Preference: High-Yield Exam Hooks & Direct Verification

3. ALL-TIME GRASPING TELEMETRY (REAL-TIME ENGINE)
- Current Grasping Level: ${telemetry.scoreOutOf10} / 10
- All-time Evaluated Interactions: ${telemetry.totalInteractions}
- Mock Tests Completed: ${telemetry.mockTestsCompleted}
- Descriptive Writing Accuracy: ${telemetry.avgWrittenScorePercent}%
- Retention Multiplier: 1.25x

========================================================
STATUS: PROFILE ACTIVE & SYNCHRONIZED TO NEURAL ENGINE
========================================================`;
      setInitialDataTxt(sample);
    }
  }, [twin]);

  const handleDownloadTxt = () => {
    ambientAudio.playChime("levelUp");
    const element = document.createElement("a");
    const file = new Blob([initialDataTxt], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = "student_initial_data.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  };

  const handleToggleTheme = (theme: "dark" | "light") => {
    ambientAudio.playChime("click");
    setCurrentTheme(theme);
    setStoredTheme(theme);
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    ambientAudio.playChime("click");
    const newLang = e.target.value;
    setSimplificationLang(newLang);
    setStoredSimplificationLang(newLang);
    setGraspingData((prev) => ({ ...prev, simplificationLang: newLang }));
  };

  const handleScoreChange = (newScore: number) => {
    ambientAudio.playChime("click");
    setCustomScoreInput(newScore);
    setStoredGraspingScore(newScore);
    setGraspingData((prev) => ({ ...prev, scoreOutOf10: newScore }));
  };

  const isLowGrasp = graspingData.scoreOutOf10 < 5.0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-28 pt-2 px-2 sm:px-4">
      {/* 1. Header */}
      <div className="settings-panel-card">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-stone-800/40 text-stone-200">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              Settings &amp; Adaptive Profile
            </h1>
            <p className="text-xs" style={{ color: "var(--t3)" }}>
              Manage your all-time Grasping Intelligence, simplification languages, and white+greenish theme appearance.
            </p>
          </div>
        </div>
      </div>

      {/* 2. PURE ALL-TIME GRASPING & ATTENTION INTELLIGENCE MATRIX */}
      <div className="settings-panel-card space-y-5">
        <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5" style={{ color: "var(--fill)" }} />
            <div>
              <h2 className="text-base font-bold">
                All-Time Attention &amp; Grasping Intelligence Matrix
              </h2>
              <span className="text-xs" style={{ color: "var(--t3)" }}>
                Calculated by AI from your mock tests, response velocity, and descriptive answers
              </span>
            </div>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full border" style={{ borderColor: "var(--border)", color: "var(--fill)" }}>
            Real-Time Telemetry Active
          </span>
        </div>

        {/* Primary Grasping Score Gauge */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center p-5 rounded-2xl" style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}>
          <div className="sm:col-span-1 text-center sm:text-left">
            <span className="text-[11px] uppercase tracking-wider block font-mono" style={{ color: "var(--t3)" }}>
              All-Time Grasping Score
            </span>
            <div className="text-4xl font-bold font-mono mt-1" style={{ color: "var(--t1)" }}>
              {graspingData.scoreOutOf10.toFixed(1)} <span className="text-xl font-normal" style={{ color: "var(--t3)" }}>/ 10</span>
            </div>
            <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full" style={{
              background: isLowGrasp ? "rgba(234, 179, 8, 0.15)" : "rgba(34, 197, 94, 0.15)",
              color: isLowGrasp ? "#eab308" : "#22c55e",
            }}>
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {isLowGrasp
                  ? "Grasping < 5.0 (Auto-Simplification Active)"
                  : "Grasping >= 5.0 (College Standard)"}
              </span>
            </div>
          </div>

          <div className="sm:col-span-2 space-y-3">
            <p className="text-xs leading-relaxed" style={{ color: "var(--t2)" }}>
              {isLowGrasp
                ? "Your calculated grasping power is currently under 5 on the scale of 10. The AI automatically unlocks the “Simplify with AI” option beneath complex paragraphs and explanations to provide everyday analogies in your selected language."
                : "Your calculated grasping power is in the intermediate-to-honors tier. The AI delivers rigorous university exam-level proofs, while keeping the “Simplify with AI” option available on demand."}
            </p>

            {/* Quick Calibration Slider */}
            <div className="space-y-1.5 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
              <div className="flex justify-between text-xs" style={{ color: "var(--t3)" }}>
                <span>Manual baseline calibration:</span>
                <span className="font-mono font-bold" style={{ color: "var(--t1)" }}>
                  {customScoreInput.toFixed(1)} / 10
                </span>
              </div>
              <input
                type="range"
                min="1.0"
                max="10.0"
                step="0.1"
                value={customScoreInput}
                onChange={(e) => handleScoreChange(parseFloat(e.target.value))}
                className="w-full cursor-pointer accent-emerald-600"
              />
              <div className="flex justify-between text-[10px]" style={{ color: "var(--t4)" }}>
                <span>1.0 (High-School Intuition / ELI5)</span>
                <span>5.0 (Threshold)</span>
                <span>10.0 (University Honors)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Breakdown Telemetry Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl" style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}>
            <span className="text-[11px] block" style={{ color: "var(--t3)" }}>
              Mock Tests &amp; Quizzes
            </span>
            <span className="font-bold text-sm block mt-1" style={{ color: "var(--t1)" }}>
              {graspingData.mockTestsCompleted} Completed
            </span>
          </div>

          <div className="p-3.5 rounded-2xl" style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}>
            <span className="text-[11px] block" style={{ color: "var(--t3)" }}>
              Writing Exam Accuracy
            </span>
            <span className="font-bold text-sm block mt-1" style={{ color: "var(--t1)" }}>
              {graspingData.avgWrittenScorePercent}% Avg Marks
            </span>
          </div>

          <div className="p-3.5 rounded-2xl" style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}>
            <span className="text-[11px] block" style={{ color: "var(--t3)" }}>
              Attention Span
            </span>
            <span className="font-bold text-sm block mt-1" style={{ color: "var(--t1)" }}>
              {twin.focusSpanMinutes} mins Focus
            </span>
          </div>

          <div className="p-3.5 rounded-2xl" style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}>
            <span className="text-[11px] block" style={{ color: "var(--t3)" }}>
              Processing Velocity
            </span>
            <span className="font-bold text-sm block mt-1" style={{ color: "var(--t1)" }}>
              {graspingData.responseVelocity} Paced
            </span>
          </div>
        </div>
      </div>

      {/* 3. SIMPLIFICATION LANGUAGE SETTING */}
      <div className="settings-panel-card space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b" style={{ borderColor: "var(--border)" }}>
          <Languages className="w-5 h-5" style={{ color: "var(--fill)" }} />
          <div>
            <h2 className="text-base font-bold">
              AI Simplification Language &amp; Translation
            </h2>
            <p className="text-xs" style={{ color: "var(--t3)" }}>
              Choose which language you want the AI to translate and explain complex paragraphs when you tap “Simplify”.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl space-y-3" style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}>
          <label className="text-xs font-bold block" style={{ color: "var(--t1)" }}>
            Target Simplification Language:
          </label>
          <select
            className="field-select-dropdown"
            value={simplificationLang}
            onChange={handleLanguageChange}
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.label}
              </option>
            ))}
          </select>
          <p className="text-[11.5px] leading-relaxed" style={{ color: "var(--t3)" }}>
            When you tap <b>“Simplify with AI”</b> under any topic in the Main Page, Bringe Study, or Study Path, the engine breaks down the technical concept into a friendly, plain-language analogy translated into your chosen tongue.
          </p>
        </div>
      </div>

      {/* 4. THEME SETTING: DARK MODE VS WHITE + GREENISH LIGHT MODE */}
      <div className="settings-panel-card space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b" style={{ borderColor: "var(--border)" }}>
          <Sun className="w-5 h-5 text-amber-500" />
          <div>
            <h2 className="text-base font-bold">
              Appearance &amp; Color Theme
            </h2>
            <p className="text-xs" style={{ color: "var(--t3)" }}>
              Switch between deep minimalist dark mode and the crisp white mode with a clean greenish touch.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Dark Mode Tile */}
          <div
            className={`p-4 rounded-2xl cursor-pointer transition-all border ${
              currentTheme === "dark"
                ? "ring-2 ring-emerald-500 border-emerald-500"
                : "border-stone-800 hover:border-stone-700"
            }`}
            style={{ background: "#0e0e0e" }}
            onClick={() => handleToggleTheme("dark")}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-stone-100 font-bold text-sm">
                <Moon className="w-4 h-4 text-stone-400" />
                <span>Dark Mode</span>
              </div>
              {currentTheme === "dark" && (
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              )}
            </div>
            <p className="text-xs text-stone-400">
              Deep obsidian black palette with subtle gray borders and high contrast.
            </p>
          </div>

          {/* White + Greenish Touch Tile */}
          <div
            className={`p-4 rounded-2xl cursor-pointer transition-all border ${
              currentTheme === "light"
                ? "ring-2 ring-emerald-600 border-emerald-600"
                : "border-stone-300 hover:border-emerald-300"
            }`}
            style={{ background: "#ffffff" }}
            onClick={() => handleToggleTheme("light")}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-stone-900 font-bold text-sm">
                <Sun className="w-4 h-4 text-emerald-600" />
                <span>White + Greenish Touch</span>
              </div>
              {currentTheme === "light" && (
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              )}
            </div>
            <p className="text-xs text-stone-600">
              Clean, crisp white interface accented with natural emerald green highlights and mint badges.
            </p>
          </div>
        </div>
      </div>

      {/* 5. Assessment File Exporter */}
      <div className="settings-panel-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b" style={{ borderColor: "var(--border)" }}>
          <div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" style={{ color: "var(--fill)" }} />
              <h2 className="text-base font-bold">
                Assessment File (student_initial_data.txt)
              </h2>
            </div>
            <p className="text-xs mt-0.5" style={{ color: "var(--t3)" }}>
              Private telemetry export containing all-time grasping benchmarks.
            </p>
          </div>

          <button
            onClick={handleDownloadTxt}
            className="bringe-primary-btn"
            style={{ padding: "8px 16px", fontSize: "12px" }}
          >
            {downloaded ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Downloaded!</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Download .txt</span>
              </>
            )}
          </button>
        </div>

        <pre className="p-4 rounded-2xl font-mono text-xs overflow-x-auto max-h-52 leading-relaxed select-all" style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--t2)" }}>
          {initialDataTxt}
        </pre>
      </div>

      {/* 6. Account & Reset Actions */}
      <div className="settings-panel-card space-y-3">
        <h2 className="text-base font-bold">
          Account Actions
        </h2>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-3.5 rounded-2xl gap-3" style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}>
          <div>
            <span className="text-xs font-bold block" style={{ color: "var(--t1)" }}>
              Recalibrate Onboarding
            </span>
            <span className="text-[11px]" style={{ color: "var(--t3)" }}>
              Reset course selections, study pace, and cognitive preferences.
            </span>
          </div>

          <button
            onClick={onResetOnboarding}
            className="btn btn-ghost"
            style={{ fontSize: "12px", border: "1px solid var(--border)" }}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retake Onboarding</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-3.5 rounded-2xl gap-3" style={{ background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.25)" }}>
          <div>
            <span className="text-xs font-bold block" style={{ color: "#ef4444" }}>
              Sign Out
            </span>
            <span className="text-[11px]" style={{ color: "#f87171" }}>
              Clear session and return to authentication landing screen.
            </span>
          </div>

          <button
            onClick={onLogout}
            className="btn"
            style={{ background: "#ef4444", color: "#ffffff", fontSize: "12px", borderRadius: "6px" }}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
