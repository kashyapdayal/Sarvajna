"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Lock,
  Unlock,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Clock,
  Zap,
  Layers,
  ChevronRight,
  Award,
  X,
  Compass,
} from "lucide-react";
import { ParagraphSimplifier } from "@/components/common/ParagraphSimplifier";
import { synthesizeCurriculum } from "@/lib/bringe-ai-engine";

export interface PathStage {
  id: number;
  title: string;
  subtitle: string;
  category: string;
  mins: number;
  xp: number;
  status: "unlocked" | "completed" | "locked";
  difficulty: "standard" | "hard" | "reinforce";
  concepts: string[];
  diagnostic: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
}

interface GamifiedStudyPathProps {
  topicTitle?: string;
  onGainXP: (amount: number) => void;
  onOpenRescueSheet: () => void;
  onNavigateToMain?: () => void;
}

const INITIAL_STAGES: PathStage[] = [
  {
    id: 1,
    title: "Relational Schema & Functional Dependencies",
    subtitle: "Stage 01 · Launchpad",
    category: "Foundations",
    mins: 25,
    xp: 60,
    status: "unlocked", // Initial stage is shown
    difficulty: "standard",
    concepts: [
      "Relation schema vs relation state",
      "Functional dependency closure X -> Y",
      "Candidate key discovery algorithm",
    ],
    diagnostic: {
      question: "If relation R(A, B, C) has functional dependency A -> B and B -> C, what is the candidate key?",
      options: ["A", "B", "A and C", "None of the above"],
      correctIndex: 0,
      explanation: "Since A -> B and B -> C, attribute closure A+ = {A, B, C}. A determines every attribute in R, making A the candidate key.",
    },
  },
  {
    id: 2,
    title: "Database Normalization (1NF to BCNF)",
    subtitle: "Stage 02 · Veiled in Fog",
    category: "Data Integrity",
    mins: 35,
    xp: 80,
    status: "locked", // Hidden by fog
    difficulty: "standard",
    concepts: [
      "1NF: Atomic domain values",
      "2NF: Elimination of partial dependencies",
      "3NF: Elimination of transitive dependencies",
      "BCNF: Every determinant must be a superkey",
    ],
    diagnostic: {
      question: "Which condition strictly separates BCNF from 3NF?",
      options: [
        "In BCNF, every determinant must be a superkey without exception",
        "3NF forbids multi-valued dependencies",
        "BCNF allows partial dependencies if indexed",
        "They are mathematically identical",
      ],
      correctIndex: 0,
      explanation: "3NF allows X -> Y if Y is a prime attribute even if X is not a superkey. BCNF removes this exception: X MUST be a superkey.",
    },
  },
  {
    id: 3,
    title: "ACID Transactions & Two-Phase Locking (2PL)",
    subtitle: "Stage 03 · Veiled in Fog",
    category: "Concurrency",
    mins: 40,
    xp: 95,
    status: "locked", // Hidden by fog
    difficulty: "standard",
    concepts: [
      "Atomicity and Write-Ahead Logging (WAL)",
      "Conflict serializability & precedence graphs",
      "Growing and shrinking lock phases",
    ],
    diagnostic: {
      question: "What does the Rigorous Two-Phase Locking protocol guarantee?",
      options: [
        "Conflict serializability and strict recoverability",
        "Deadlock freedom without aborts",
        "Zero disk writes during commit",
        "Instant lock releases during computation",
      ],
      correctIndex: 0,
      explanation: "Rigorous 2PL holds all exclusive and shared locks until transaction termination, guaranteeing conflict serializability and cascade-free recovery.",
    },
  },
  {
    id: 4,
    title: "B+ Tree Indexing & Range Scan Mechanics",
    subtitle: "Stage 04 · Veiled in Fog",
    category: "Storage Engines",
    mins: 45,
    xp: 110,
    status: "locked", // Hidden by fog
    difficulty: "standard",
    concepts: [
      "Leaf node doubly-linked pointers",
      "Balanced tree fan-out & disk I/O bounds",
      "Cascading split mitigation",
    ],
    diagnostic: {
      question: "Why do B+ trees outperform standard binary search trees on disk storage?",
      options: [
        "High fan-out yields very shallow trees, minimizing mechanical disk seeks",
        "B+ trees require zero memory buffers",
        "B+ trees avoid sorting keys",
        "Binary trees do not support equality lookups",
      ],
      correctIndex: 0,
      explanation: "High fan-out (e.g. 100 to 500 children per node) keeps tree height at 3 or 4 for millions of records, reducing slow disk seeks to O(1) page transfers.",
    },
  },
  {
    id: 5,
    title: "Distributed Consensus & CAP Trade-Offs",
    subtitle: "Stage 05 · Master Stage",
    category: "Distributed",
    mins: 55,
    xp: 150,
    status: "locked", // Hidden by fog
    difficulty: "standard",
    concepts: [
      "Two-Phase Commit (2PC) coordinator failure modes",
      "Quorum consensus: R + W > N",
      "Linearizability vs Eventual Consistency",
    ],
    diagnostic: {
      question: "Under network partition (P in CAP), what must an ACID distributed database sacrifice?",
      options: [
        "Availability (some nodes reject requests to preserve consistency)",
        "Consistency (nodes accept conflicting writes)",
        "Partition tolerance",
        "Encryption at rest",
      ],
      correctIndex: 0,
      explanation: "ACID databases choose CP (Consistency + Partition Tolerance), rejecting writes or entering read-only mode if quorum cannot be proven.",
    },
  },
];

function buildStagesForTopic(topic: string): PathStage[] {
  const cleanTopic = topic.trim();
  const curriculum = synthesizeCurriculum({
    subject: cleanTopic,
    area: "",
    department: "",
    examHoursRemaining: 12,
    studyBudgetHours: 6,
    passMarkTarget: 40,
    sleepHours: 7,
    questionStyle: "mixed",
  });

  if (!curriculum || curriculum.length === 0) {
    return [];
  }

  return curriculum.slice(0, 5).map((top, idx) => ({
    id: idx + 1,
    title: top.name,
    subtitle: `Stage 0${idx + 1} · ${idx === 0 ? "Launchpad" : idx === Math.min(5, curriculum.length) - 1 ? "Master Stage" : "Veiled in Fog"}`,
    category: top.subtopic || "Core Invariants",
    mins: top.durationMins || 30,
    xp: 50 + idx * 25,
    status: idx === 0 ? ("unlocked" as const) : ("locked" as const),
    difficulty: "standard" as const,
    concepts: top.keyPoints ? top.keyPoints.slice(0, 3) : [top.subtopic],
    diagnostic: {
      question: top.mcq?.question || `What constitutes the governing mechanism in ${top.name}?`,
      options: top.mcq?.options || [
        "Preservation of first-principles invariant relationships",
        "Non-deterministic random state transition",
        "Legacy convention superseded in modern systems",
        "None of the above",
      ],
      correctIndex: top.mcq?.correctIndex ?? 0,
      explanation: top.mcq?.explanation || `${top.name} forms a core examination pillar requiring first-principles derivation.`,
    },
  }));
}

export const GamifiedStudyPath: React.FC<GamifiedStudyPathProps> = ({
  topicTitle = "",
  onGainXP,
  onOpenRescueSheet,
  onNavigateToMain,
}) => {
  const [stages, setStages] = useState<PathStage[]>(() => {
    if (!topicTitle || !topicTitle.trim()) return [];
    return buildStagesForTopic(topicTitle);
  });
  const [selectedStage, setSelectedStage] = useState<PathStage | null>(null);

  useEffect(() => {
    if (!topicTitle || !topicTitle.trim()) {
      setStages([]);
    } else {
      setStages(buildStagesForTopic(topicTitle));
    }
  }, [topicTitle]);

  // Challenge drawer states
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; text: string } | null>(null);

  // Hidden telemetry tracking: response time and score
  const startTimeRef = useRef<number>(Date.now());
  const [stageStartTime, setStageStartTime] = useState<number>(Date.now());

  const handleOpenStage = (stage: PathStage) => {
    if (stage.status === "locked") return;
    setSelectedStage(stage);
    setSelectedOption(null);
    setHasSubmitted(false);
    setFeedback(null);
    setStageStartTime(Date.now());
  };

  // Submit diagnostic challenge & trigger adaptive tuning
  const handleVerifyAnswer = () => {
    if (!selectedStage || selectedOption === null) return;

    const timeSpentSeconds = Math.max(5, Math.round((Date.now() - stageStartTime) / 1000));
    const isCorrect = selectedOption === selectedStage.diagnostic.correctIndex;

    setHasSubmitted(true);

    if (isCorrect) {
      setFeedback({
        isCorrect: true,
        text: `Accurate — ${selectedStage.diagnostic.explanation}`,
      });

      // Adaptive Tuning: Analyze user response pattern
      const nextStageDifficulty: "standard" | "hard" | "reinforce" =
        timeSpentSeconds < 35 ? "hard" : "standard";

      // Mark current completed, unlock next and adapt it
      setTimeout(() => {
        const updated = stages.map((stg, i) => {
          if (stg.id === selectedStage.id) {
            return { ...stg, status: "completed" as const };
          }
          // Unlock immediately following stage and dissolve its fog
          if (stg.id === selectedStage.id + 1) {
            return {
              ...stg,
              status: "unlocked" as const,
              difficulty: nextStageDifficulty,
              xp: nextStageDifficulty === "hard" ? stg.xp + 35 : stg.xp,
            };
          }
          return stg;
        });

        setStages(updated);
        onGainXP(selectedStage.xp);
      }, 700);
    } else {
      setFeedback({
        isCorrect: false,
        text: `Needs revision — ${selectedStage.diagnostic.explanation}`,
      });
    }
  };

  // -------------------------------------------------------------------------
  // UNINITIALIZED / NULL STATE: Only initialize if given from Main page
  // -------------------------------------------------------------------------
  if (!topicTitle || !topicTitle.trim() || stages.length === 0) {
    return (
      <div className="gamified-map-wrap" style={{ textAlign: "center", padding: "48px 24px 80px" }}>
        <div
          style={{
            width: "68px",
            height: "68px",
            borderRadius: "50%",
            background: "var(--surface2)",
            border: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 18px",
            color: "var(--t3)",
          }}
        >
          <Compass size={32} />
        </div>
        <div
          style={{
            display: "inline-block",
            fontSize: "11px",
            fontFamily: "var(--mono)",
            letterSpacing: "1.2px",
            textTransform: "uppercase",
            padding: "4px 12px",
            borderRadius: "999px",
            background: "var(--surface2)",
            color: "var(--t3)",
            border: "1px solid var(--border)",
            marginBottom: "12px",
          }}
        >
          Status: Null / Uninitialized
        </div>
        <h2
          style={{
            fontFamily: "var(--serif)",
            fontSize: "26px",
            fontWeight: 500,
            margin: "0 0 12px",
            color: "var(--text)",
          }}
        >
          Study Path Not Initialized
        </h2>
        <p
          style={{
            color: "var(--t2)",
            fontSize: "14px",
            maxWidth: "480px",
            margin: "0 auto 24px",
            lineHeight: 1.6,
          }}
        >
          The study plan is empty by default until initiated. Search or discover an exam topic in the AI Deep Research hub on the Main Page and click &ldquo;Add to Study Path&rdquo; to generate your personalized stepping-stone curriculum.
        </p>
        {onNavigateToMain && (
          <button
            type="button"
            className="bringe-primary-btn"
            style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
            onClick={onNavigateToMain}
          >
            <span>Explore Topics on Main Page</span>
            <ArrowRight size={15} />
          </button>
        )}
      </div>
    );
  }

  const completedCount = stages.filter((s) => s.status === "completed").length;
  const unlockedCount = stages.filter((s) => s.status === "unlocked").length;
  const lockedCount = stages.filter((s) => s.status === "locked").length;
  const totalXpEarnable = stages.reduce((acc, s) => acc + s.xp, 0);
  const progressPercent = Math.round((completedCount / stages.length) * 100);

  return (
    <div className="gamified-map-wrap">
      {/* Roadmap Overview Metrics Banner */}
      <div className="path-overview-banner">
        <div className="path-overview-top">
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "4px 10px",
                background: "var(--surface2)",
                border: "1px solid var(--border)",
                borderRadius: "4px",
                fontSize: "11.5px",
                color: "var(--t2)",
                textTransform: "uppercase",
                letterSpacing: "1px",
                marginBottom: "6px",
              }}
            >
              <Compass size={13} />
              <span>Gamified Adaptive Curriculum</span>
            </div>
            <h1 style={{ fontFamily: "var(--serif)", fontSize: "28px", fontWeight: 500, margin: 0, color: "var(--text)" }}>
              {topicTitle} · Stepping-Stone Progression
            </h1>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "13px", color: "var(--t3)", fontFamily: "var(--mono)" }}>
              {completedCount} of {stages.length} Milestones Conquered ({progressPercent}%)
            </span>
          </div>
        </div>

        <div className="path-progress-bar-wrap">
          <div className="path-progress-bar-fill" style={{ width: `${progressPercent}%` }} />
        </div>

        <div className="path-metrics-grid">
          <div className="path-metric-card">
            <span className="path-metric-val">{stages.length}</span>
            <span className="path-metric-lbl">Total Milestones</span>
          </div>
          <div className="path-metric-card">
            <span className="path-metric-val" style={{ color: "var(--accent-green)" }}>{completedCount}</span>
            <span className="path-metric-lbl">Conquered Stages</span>
          </div>
          <div className="path-metric-card">
            <span className="path-metric-val" style={{ color: "#60a5fa" }}>{lockedCount}</span>
            <span className="path-metric-lbl">Veiled in Cloud</span>
          </div>
          <div className="path-metric-card">
            <span className="path-metric-val" style={{ color: "#f59e0b" }}>+{totalXpEarnable} XP</span>
            <span className="path-metric-lbl">Total Mastery XP</span>
          </div>
        </div>
      </div>

      {/* Stepping Stones Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
        {stages.map((stage, idx) => {
          const isInitial = idx === 0;
          const isLocked = stage.status === "locked";
          const isCompleted = stage.status === "completed";
          const isUnlocked = stage.status === "unlocked";

          return (
            <div
              key={stage.id}
              className={`stage-card ${stage.status}`}
              onClick={() => !isLocked && handleOpenStage(stage)}
              style={{
                cursor: isLocked ? "not-allowed" : "pointer",
              }}
            >
              {/* Content of the stage */}
              <div style={{ position: "relative", zIndex: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px", flexWrap: "wrap", gap: "12px" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                      <span
                        style={{
                          fontFamily: "var(--mono)",
                          fontSize: "13px",
                          background: "var(--surface2)",
                          border: "1px solid var(--border)",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          color: isCompleted ? "var(--accent-green)" : "var(--text)",
                          fontWeight: 600,
                        }}
                      >
                        STAGE 0{stage.id}
                      </span>
                      <span style={{ fontSize: "12px", color: "var(--t3)", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>
                        {stage.category}
                      </span>
                      {stage.difficulty === "hard" && (
                        <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "4px", background: "rgba(239, 68, 68, 0.12)", color: "#f87171", border: "1px solid rgba(239, 68, 68, 0.3)" }}>
                          Adaptive Challenge (+35 XP)
                        </span>
                      )}
                    </div>
                    <h3 style={{ fontSize: "20px", fontWeight: 600, margin: "0", color: "var(--text)", lineHeight: "1.4" }}>
                      {stage.title}
                    </h3>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "13.5px", color: "var(--t2)", fontFamily: "var(--mono)" }}>
                      {stage.mins} min &bull; +{stage.xp} XP
                    </span>
                    {isUnlocked && (
                      <button
                        type="button"
                        className="bringe-primary-btn"
                        style={{ padding: "8px 16px", fontSize: "13px" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenStage(stage);
                        }}
                      >
                        <span>Start Mission</span>
                        <ArrowRight size={14} />
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "14px" }}>
                  {stage.concepts.map((concept, ci) => (
                    <span
                      key={ci}
                      style={{
                        fontSize: "13px",
                        padding: "4px 11px",
                        background: "var(--surface2)",
                        border: "1px solid var(--border)",
                        borderRadius: "6px",
                        color: "var(--t2)",
                      }}
                    >
                      {concept}
                    </span>
                  ))}
                </div>

                {isCompleted && (
                  <div style={{ marginTop: "16px", display: "flex", alignItems: "center", gap: "8px", fontSize: "13.5px", color: "var(--accent-green)", fontWeight: 500 }}>
                    <CheckCircle2 size={16} />
                    <span>Conquered &bull; Fog dissolved on next milestone</span>
                  </div>
                )}
              </div>

              {/* Fog and Smoke Concealment Overlay for locked stages */}
              {isLocked && (
                <div className="stage-fog-shroud">
                  {/* Billowing Animated Smoke Layers */}
                  <div className="smoke-puff-1"></div>
                  <div className="smoke-puff-2"></div>

                  {/* Shroud Seal */}
                  <div className="fog-lock-badge">
                    <Lock size={12} />
                    <span>Shrouded in Cloud</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Stage Challenge Drawer (#dw style) */}
      {selectedStage && (
        <div className="dw open" id="stage-challenge-drawer">
          <div className="dw-bg" onClick={() => setSelectedStage(null)}></div>
          <aside className="dw-panel">
            <button
              className="dw-x"
              type="button"
              onClick={() => setSelectedStage(null)}
            >
              CLOSE
            </button>

            <div className="ol" style={{ fontSize: "12.5px" }}>{selectedStage.subtitle}</div>
            <h3 style={{ margin: "6px 0 8px", fontSize: "24px", fontWeight: 500 }}>{selectedStage.title}</h3>
            <div style={{ fontSize: "14.5px", color: "var(--t3)", marginBottom: "22px" }}>
              {selectedStage.mins} min · +{selectedStage.xp} XP reward
            </div>

            {/* Core concepts to verify */}
            <div className="dwsec">
              <h4 style={{ fontSize: "12.5px" }}>Key Conceptual Anchors</h4>
              {selectedStage.concepts.map((concept, i) => (
                <div key={i} className="dwrow" style={{ fontSize: "14.5px" }}>
                  <span style={{ color: "var(--t4)", marginRight: "8px" }}>&mdash;</span>
                  <span>{concept}</span>
                </div>
              ))}
              <div style={{ marginTop: "12px" }}>
                <ParagraphSimplifier
                  originalText={selectedStage.subtitle + ": " + selectedStage.concepts.join("; ")}
                  topicName={selectedStage.title}
                />
              </div>
            </div>

            {/* Interactive Diagnostic Verification */}
            <div className="dwsec" style={{ marginTop: "24px" }}>
              <h4 style={{ fontSize: "12.5px" }}>Diagnostic Verification</h4>
              <p style={{ fontSize: "16px", color: "var(--text)", marginBottom: "14px", lineHeight: "1.6" }}>
                {selectedStage.diagnostic.question}
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {selectedStage.diagnostic.options.map((opt, oi) => {
                  const isChosen = selectedOption === oi;

                  return (
                    <button
                      key={oi}
                      type="button"
                      disabled={hasSubmitted}
                      onClick={() => setSelectedOption(oi)}
                      style={{
                        padding: "12px 18px",
                        textAlign: "left",
                        background: isChosen ? "var(--surface2)" : "#141414",
                        border: `1px solid ${isChosen ? "var(--t2)" : "var(--border)"}`,
                        borderRadius: "6px",
                        fontSize: "14.5px",
                        color: isChosen ? "var(--text)" : "var(--t2)",
                        cursor: hasSubmitted ? "default" : "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <span style={{ marginRight: "10px", color: "var(--t4)", fontFamily: "var(--mono)" }}>{String.fromCharCode(65 + oi)}.</span>
                      {opt}
                    </button>
                  );
                })}
              </div>

              {/* Feedback readout */}
              {feedback && (
                <div
                  style={{
                    marginTop: "18px",
                    padding: "14px 18px",
                    borderRadius: "6px",
                    background: feedback.isCorrect ? "#122014" : "#201212",
                    border: `1px solid ${feedback.isCorrect ? "#2e5c33" : "#5c2e2e"}`,
                    fontSize: "14.5px",
                    lineHeight: "1.6",
                    color: feedback.isCorrect ? "#a3e6a8" : "#f29b9b",
                  }}
                >
                  <div>{feedback.text}</div>
                  <div style={{ marginTop: "10px" }}>
                    <ParagraphSimplifier
                      originalText={feedback.text}
                      topicName={selectedStage.title}
                    />
                  </div>
                </div>
              )}

              {/* Action Button */}
              <div style={{ marginTop: "22px" }}>
                {!hasSubmitted ? (
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={selectedOption === null}
                    onClick={handleVerifyAnswer}
                    style={{ width: "100%", padding: "12px 20px", fontSize: "14.5px" }}
                  >
                    Submit Answer &amp; Unlock Next
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setSelectedStage(null)}
                    style={{ width: "100%", padding: "12px 20px", fontSize: "14.5px" }}
                  >
                    Close &amp; Return to Map
                  </button>
                )}
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};
