"use client";
import React, { useState, useEffect } from "react";
import {
  getStoredContentDepthMode,
  setStoredContentDepthMode,
  getEffectiveDepthScore,
  type ContentDepthMode,
} from "@/lib/grasping-service";

interface FloatingGraspingGaugeProps {
  isActiveStudyView: boolean;
}

const MODE_LABELS: Record<ContentDepthMode, string> = {
  auto: "Auto",
  low: "Low",
  medium: "Med",
  high: "High",
};

export default function FloatingGraspingGauge({
  isActiveStudyView,
}: FloatingGraspingGaugeProps) {
  const [mode, setMode] = useState<ContentDepthMode>("auto");
  const [score, setScore] = useState(5.0);
  const [expanded, setExpanded] = useState(false);

  /* hydrate from localStorage on mount */
  useEffect(() => {
    const stored = getStoredContentDepthMode();
    setMode(stored);
    setScore(getEffectiveDepthScore(stored));
  }, []);

  /* re-read score whenever mode changes */
  useEffect(() => {
    setScore(getEffectiveDepthScore(mode));
  }, [mode]);

  /* poll score only in auto mode (reflects EWMA updates from interactions) */
  useEffect(() => {
    if (mode !== "auto") return;
    const id = setInterval(() => {
      setScore(getEffectiveDepthScore("auto"));
    }, 3000);
    return () => clearInterval(id);
  }, [mode]);

  const handleModeChange = (m: ContentDepthMode) => {
    setMode(m);
    setStoredContentDepthMode(m);
    setScore(getEffectiveDepthScore(m));
    setExpanded(false);
  };

  if (!isActiveStudyView) return null;

  /* SVG arc math */
  const r = 12;
  const c = 2 * Math.PI * r;
  const pct = ((score - 1) / 9) * 100;
  const offset = c - (pct / 100) * c;
  const color =
    score < 4
      ? "var(--color-accent-red, #ef4444)"
      : score < 7
        ? "var(--color-accent-amber, #f59e0b)"
        : "var(--color-accent-green, #22c55e)";

  return (
    <div className="floating-grasping-gauge" role="status" aria-label={`Content depth ${score.toFixed(1)}`}>
      {/* depth mode popover (renders above the button) */}
      {expanded && (
        <div className="gauge-popover">
          <span className="gauge-popover-title">Depth</span>
          <div className="gauge-mode-btns">
            {(["auto", "low", "medium", "high"] as ContentDepthMode[]).map((m) => (
              <button
                key={m}
                className={`gauge-mode-btn ${mode === m ? "active" : ""}`}
                onClick={() => handleModeChange(m)}
                type="button"
              >
                {MODE_LABELS[m]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* tiny circle -- click to toggle popover */}
      <button
        className="gauge-circle-btn"
        onClick={() => setExpanded((p) => !p)}
        title="Content depth level"
        type="button"
      >
        <svg className="gauge-svg" viewBox="0 0 32 32">
          <circle
            cx="16" cy="16" r={r}
            fill="none"
            stroke="var(--border-muted, #333)"
            strokeWidth="3"
          />
          <circle
            cx="16" cy="16" r={r}
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeDasharray={c}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset .5s ease, stroke .3s ease" }}
          />
        </svg>
        <span className="gauge-center-val">{score.toFixed(1)}</span>
      </button>
    </div>
  );
}
