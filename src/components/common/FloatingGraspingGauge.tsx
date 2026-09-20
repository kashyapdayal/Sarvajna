"use client";

import React, { useState, useEffect } from "react";
import { getStoredGraspingScore } from "@/lib/grasping-service";

interface FloatingGraspingGaugeProps {
  currentView?: string;
  topicName?: string;
}

export const FloatingGraspingGauge: React.FC<FloatingGraspingGaugeProps> = ({
  currentView,
  topicName,
}) => {
  const [baseScore, setBaseScore] = useState<number>(() => getStoredGraspingScore());
  const [fluctuationOffset, setFluctuationOffset] = useState<number>(0);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  // Live gentle continuous fluctuation
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      const wave = Math.sin(now / 3200) * 0.26;
      const noise = ((now % 1000) / 1000 - 0.5) * 0.14;
      setFluctuationOffset(Math.round((wave + noise) * 10) / 10);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  const liveScore = Math.max(1.2, Math.min(9.8, Math.round((baseScore + fluctuationOffset) * 10) / 10));
  const depthPercent = Math.round(liveScore * 10);

  // Content Difficulty Tier mapping
  const getDifficultyInfo = (s: number) => {
    if (s >= 7.5) {
      return {
        label: "Honors Rigor",
        sub: "Advanced proofs & derivations",
        color: "#22c55e",
      };
    }
    if (s >= 4.8) {
      return {
        label: "Applied Standard",
        sub: "College core with worked examples",
        color: "#60a5fa",
      };
    }
    return {
      label: "Intuition Mode",
      sub: "ELI5 analogies & fundamental concepts",
      color: "#f59e0b",
    };
  };

  const difficulty = getDifficultyInfo(liveScore);
  const radius = 21;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - liveScore / 10);

  return (
    <div
      className="floating-grasping-gauge"
      style={{
        cursor: "pointer",
        borderColor: "var(--border-2)",
      }}
      onClick={() => setIsExpanded((prev) => !prev)}
      title="Click to toggle AI Depth details"
    >
      {/* Tiny SVG Circular Bar */}
      <div className="gauge-circle-wrap">
        <svg className="gauge-svg" width="52" height="52" viewBox="0 0 52 52">
          <circle className="gauge-bg-circle" cx="26" cy="26" r={radius} />
          <circle
            className="gauge-progress-circle"
            cx="26"
            cy="26"
            r={radius}
            style={{
              stroke: difficulty.color,
              strokeDasharray: `${circumference}`,
              strokeDashoffset: `${strokeDashoffset}`,
            }}
          />
        </svg>
        <div className="gauge-center-val">
          <span className="gauge-val-num">{liveScore.toFixed(1)}</span>
          <span className="gauge-val-denom">/10</span>
        </div>
      </div>

      {/* Difficulty and Telemetry Description */}
      {isExpanded ? (
        <div className="gauge-info-col">
          <div className="gauge-info-tag">
            <span
              className="gauge-pulse-dot"
              style={{ background: difficulty.color, boxShadow: `0 0 8px ${difficulty.color}` }}
            />
            <span>AI Content Difficulty</span>
          </div>
          <div className="gauge-status-label" style={{ color: "var(--text)" }}>
            Current Level: <b style={{ color: difficulty.color }}>{difficulty.label}</b>
          </div>
          <div className="gauge-depth-sub">
            Adjusting content depth to {depthPercent}%
          </div>
        </div>
      ) : (
        <div style={{ fontSize: "11px", color: "var(--t3)", fontFamily: "var(--mono)" }}>
          {difficulty.label}
        </div>
      )}
    </div>
  );
};
