"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  MessageSquare,
  BookmarkPlus,
  Compass,
  Flame,
  Layers,
  GraduationCap,
  Shield,
  Zap,
  RotateCw,
  X,
} from "lucide-react";
import { ParagraphSimplifier } from "@/components/common/ParagraphSimplifier";
import {
  generateWheelTopicsForDomain,
  synthesizeResearchFindings,
  WheelTopicItem,
} from "@/lib/research-ai-engine";

export interface ResearchResource {
  id: string;
  title: string;
  provider: string;
  platform: "reddit" | "youtube" | "medium" | "academic" | "github" | "doc";
  url: string;
  duration: string;
  underrated?: boolean;
  description: string;
  popularScore?: string;
}

export interface CommunityComment {
  author: string;
  source: string;
  comment: string;
  upvotes: string;
}

export interface TierFindings {
  level: "beginner" | "intermediate" | "advanced";
  label: string;
  summary: string;
  timeEstimate: string;
  resources: ResearchResource[];
  comments: CommunityComment[];
}

interface AiResearchHubProps {
  onAddToStudyPath: (topic: string, tier: "beginner" | "intermediate" | "advanced", findings: TierFindings) => void;
  onNavigateToStudyPath: () => void;
}

export const AiResearchHub: React.FC<AiResearchHubProps> = ({
  onAddToStudyPath,
  onNavigateToStudyPath,
}) => {
  const [query, setQuery] = useState("");
  const [isResearching, setIsResearching] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [activeTier, setActiveTier] = useState<"beginner" | "intermediate" | "advanced">("beginner");
  const [results, setResults] = useState<{
    beginner: TierFindings;
    intermediate: TierFindings;
    advanced: TierFindings;
  } | null>(null);
  const [addedTiers, setAddedTiers] = useState<Record<string, boolean>>({});

  // ---------------------------------------------------------------------------
  // DISCOVERY WHEEL STATE
  // ---------------------------------------------------------------------------
  const [showWheelModal, setShowWheelModal] = useState(false);
  const [wheelStep, setWheelStep] = useState<"interest" | "wheel">("interest");
  const [wheelInterest, setWheelInterest] = useState("");
  const [wheelTopics, setWheelTopics] = useState<WheelTopicItem[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [winningTopic, setWinningTopic] = useState<WheelTopicItem | null>(null);

  // Audio synthesize click sound (Zero external audio file dependency)
  const playTickSound = () => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.035);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.035);
    } catch {
      // Ignore audio block if user hasn't interacted
    }
  };

  const handleGenerateWheel = (customInterest?: string) => {
    const domain = customInterest || wheelInterest.trim() || "Computer Science";
    const topics = generateWheelTopicsForDomain(domain);
    setWheelTopics(topics);
    setWheelStep("wheel");
    setWinningTopic(null);
    setWheelRotation(0);
  };

  const handleSpinWheel = () => {
    if (isSpinning || wheelTopics.length === 0) return;
    setIsSpinning(true);
    setWinningTopic(null);

    // Pick target slice index (0 to 7)
    const targetIndex = Math.floor(Math.random() * wheelTopics.length);

    // 8 sectors = 45 deg per sector
    // Center of sector targetIndex is at (targetIndex + 0.5) * 45
    // Top pointer is at 270 deg (12 o'clock in polar)
    const targetMidAngle = (targetIndex + 0.5) * 45;
    const normalizedLandingAngle = (270 - targetMidAngle + 360) % 360;

    // Small jitter inside slice (-11 to +11 deg)
    const jitter = (Math.random() - 0.5) * 22;

    // 6 to 9 full spins
    const fullSpins = (6 + Math.floor(Math.random() * 3)) * 360;
    const currentBase = Math.ceil(wheelRotation / 360) * 360;
    const targetRotation = currentBase + fullSpins + normalizedLandingAngle + jitter;

    setWheelRotation(targetRotation);

    // Play periodic tick sounds
    let ticks = 0;
    const interval = setInterval(() => {
      ticks++;
      playTickSound();
      if (ticks > 24) {
        clearInterval(interval);
      }
    }, 150);

    // 4.2s spin duration
    setTimeout(() => {
      clearInterval(interval);
      setIsSpinning(false);
      setWinningTopic(wheelTopics[targetIndex]);
    }, 4300);
  };

  const handleStartResearch = (searchTopic?: string) => {
    const topicToSearch = searchTopic || query.trim();
    if (!topicToSearch) return;

    if (searchTopic) {
      setQuery(searchTopic);
    }

    setIsResearching(true);
    setProgress(5);
    setStatusMessage("Scanning Reddit communities & top discussion threads...");

    const steps = [
      { pct: 25, msg: "Mining r/programming & r/databases for real practitioner consensus..." },
      { pct: 50, msg: "Discovering high-yield YouTube breakdowns & underrated Medium gems..." },
      { pct: 75, msg: "Extracting developer comments, common exam gotchas & edge cases..." },
      { pct: 92, msg: "Synthesizing findings into calibrated Beginner, Intermediate & Advanced tiers..." },
      { pct: 100, msg: "Deep research complete. Curated tiers ready." },
    ];

    steps.forEach((step, idx) => {
      setTimeout(() => {
        setProgress(step.pct);
        setStatusMessage(step.msg);
        if (step.pct === 100) {
          setTimeout(() => {
            setIsResearching(false);
            // Dynamically synthesize tailored curriculum for the exact user search or wheel landing!
            const synthesized = synthesizeResearchFindings(topicToSearch);
            setResults(synthesized);
          }, 450);
        }
      }, 550 + idx * 620);
    });
  };

  const handleAddTierToPath = (tier: "beginner" | "intermediate" | "advanced") => {
    if (!results) return;
    const tierData = results[tier];
    onAddToStudyPath(query || "Database Systems", tier, tierData);
    setAddedTiers((prev) => ({ ...prev, [tier]: true }));
  };

  const shortenLabel = (text: string) => {
    if (text.length <= 19) return text;
    return text.substring(0, 17) + "..";
  };

  return (
    <div className={`research-hero-container ${!results ? "centered-hero" : ""}`}>
      {/* 1. Header & Quote Prompt */}
      <div className="research-header-wrap">
        <h1 className="research-worthy-prompt">
          “Are you worthy of learning more about the thing you just discovered?”
        </h1>
      </div>

      {/* 2. Interactive AI Asking Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleStartResearch();
        }}
        className="research-input-wrapper"
      >
        <Search size={22} style={{ color: "var(--t3)", marginLeft: "14px", flexShrink: 0 }} />
        <input
          type="text"
          className="research-input"
          placeholder="I want to learn about..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={isResearching}
        />
        <button
          type="submit"
          className="research-btn"
          disabled={!query.trim() || isResearching}
        >
          {isResearching ? "Researching..." : "Deep Research"}
        </button>
      </form>

      {/* 3. Small Discovery Comment Below Search Bar */}
      <div className="discovery-prompt-row">
        <button
          type="button"
          className="discovery-prompt-btn"
          onClick={() => {
            setShowWheelModal(true);
            setWheelStep("interest");
            setWheelInterest("");
            setWinningTopic(null);
            setIsSpinning(false);
          }}
        >
          <Sparkles size={14} className="prompt-sparkle-icon" />
          <span>Didn&apos;t discover anything yet? Spin the Wheel of Discovery</span>
        </button>
      </div>

      {/* 4. Researching Progress Bar Panel */}
      {isResearching && (
        <div className="research-progress-panel">
          <div className="progress-step-text">
            <span>{statusMessage}</span>
            <span>{progress}%</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      )}

      {/* 5. Categorized Research Findings */}
      {results && !isResearching && (
        <div style={{ marginTop: "42px" }}>
          {/* Header Row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <h2 style={{ fontFamily: "var(--serif)", fontSize: "22px", fontWeight: 500 }}>
                Synthesized Curricula: {query || "Database Systems"}
              </h2>
            </div>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onNavigateToStudyPath}
              style={{ fontSize: "12.5px" }}
            >
              Open Study Path &rarr;
            </button>
          </div>

          {/* Tier Selection Tabs */}
          <div className="tier-tabs">
            {(["beginner", "intermediate", "advanced"] as const).map((tierKey) => (
              <button
                key={tierKey}
                type="button"
                className={`tier-tab-btn ${activeTier === tierKey ? "active" : ""}`}
                onClick={() => setActiveTier(tierKey)}
              >
                {tierKey.charAt(0).toUpperCase() + tierKey.slice(1)}
              </button>
            ))}
          </div>

          {/* Active Tier Findings Card */}
          {(() => {
            const curTier = results[activeTier];
            const isAdded = addedTiers[activeTier];

            return (
              <div className="tier-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "16px" }}>
                  <div>
                    <div style={{ display: "inline-block", padding: "2px 8px", background: "var(--surface2)", border: "1px solid var(--border-2)", borderRadius: "4px", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", color: "var(--fill)", marginBottom: "8px" }}>
                      {curTier.label}
                    </div>
                    <p style={{ fontSize: "14px", color: "var(--t2)", marginTop: "2px" }}>
                      {curTier.summary}
                    </p>
                    <span style={{ fontSize: "12px", color: "var(--t4)" }}>Est. Study Time: {curTier.timeEstimate}</span>
                  </div>

                  {/* Add to Study Path Button */}
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => handleAddTierToPath(activeTier)}
                    style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                  >
                    {isAdded ? (
                      <>
                        <CheckCircle2 size={15} />
                        <span>Added to Study Path</span>
                      </>
                    ) : (
                      <>
                        <BookmarkPlus size={15} />
                        <span>Add to Study Path</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Popular and Underrated Resources */}
                <div style={{ marginTop: "24px" }}>
                  <h4 style={{ fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px", color: "var(--t3)", marginBottom: "12px" }}>
                    Curated Resources (Popular &amp; Underrated)
                  </h4>

                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {curTier.resources.map((res) => (
                      <div
                        key={res.id}
                        style={{
                          background: "#151515",
                          border: "1px solid var(--border)",
                          borderRadius: "6px",
                          padding: "12px 14px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "14px",
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                            <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "3px", background: "#222", color: "var(--t2)", textTransform: "uppercase", fontWeight: 600 }}>
                              {res.platform}
                            </span>
                            {res.underrated && (
                              <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "3px", background: "rgba(255, 255, 255, 0.12)", color: "var(--text)", fontWeight: 600 }}>
                                Underrated Gem
                              </span>
                            )}
                            {res.popularScore && (
                              <span style={{ fontSize: "11px", color: "var(--t4)" }}>
                                {res.popularScore}
                              </span>
                            )}
                          </div>
                          <a
                            href={res.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ display: "inline-block", color: "var(--text)", fontWeight: 500, fontSize: "13.5px", marginTop: "4px", textDecoration: "none" }}
                          >
                            {res.title}
                          </a>
                          <p style={{ fontSize: "12px", color: "var(--t3)", marginTop: "2px" }}>
                            {res.description}
                          </p>
                          <ParagraphSimplifier
                            originalText={res.description}
                            topicName={res.title}
                          />
                        </div>

                        <a
                          href={res.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-ghost"
                          style={{ padding: "6px 10px", fontSize: "12px", flexShrink: 0 }}
                          title="Open resource"
                        >
                          <ExternalLink size={14} />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Community Discussions & Real Practitioner Comments */}
                <div style={{ marginTop: "28px" }}>
                  <h4 style={{ fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px", color: "var(--t3)", marginBottom: "12px" }}>
                    What Real People Say (Reddit &amp; Video Insights)
                  </h4>

                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {curTier.comments.map((comm, idx) => (
                      <div key={idx} className="community-quote">
                        <div>&ldquo;{comm.comment}&rdquo;</div>
                        <div style={{ marginTop: "6px", fontSize: "11.5px", color: "var(--t3)" }}>
                          — <b>{comm.author}</b> · {comm.source} · {comm.upvotes} agreement
                        </div>
                        <ParagraphSimplifier
                          originalText={comm.comment}
                          topicName={query || "Computer Systems"}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* =====================================================================
          GIANT WHEEL OF DISCOVERY MODAL
          ===================================================================== */}
      {showWheelModal && (
        <div className="wheel-modal-backdrop" onClick={() => !isSpinning && setShowWheelModal(false)}>
          <div className="wheel-modal-card" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="wheel-modal-close-btn"
              onClick={() => !isSpinning && setShowWheelModal(false)}
              disabled={isSpinning}
              aria-label="Close modal"
            >
              <X size={18} />
            </button>

            {/* STEP 1: Area of Interest Intake */}
            {wheelStep === "interest" && (
              <div>
                <div className="wheel-modal-header">
                  <h2 className="wheel-modal-title">What area interests you?</h2>
                  <p className="wheel-modal-subtitle">
                    Specify any field or curiosity. We will curate a balanced discovery wheel featuring
                    high-impact essentials and underrated gems.
                  </p>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (wheelInterest.trim()) {
                      handleGenerateWheel();
                    }
                  }}
                  style={{ display: "flex", flexDirection: "column", gap: "16px" }}
                >
                  <input
                    type="text"
                    className="field-text-input"
                    placeholder="e.g. Cardiology, Operating Systems, Machine Learning, Quantum Physics..."
                    value={wheelInterest}
                    onChange={(e) => setWheelInterest(e.target.value)}
                    autoFocus
                  />

                  {/* Domain Quick Pills */}
                  <div className="interest-pills-row">
                    {[
                      { label: "Cardiology & Heart", val: "Cardiology" },
                      { label: "Computer Science & Systems", val: "Computer Science" },
                      { label: "Artificial Intelligence", val: "Artificial Intelligence" },
                      { label: "Quantum Physics & Space", val: "Quantum Physics" },
                      { label: "Biochemistry & Genetics", val: "Biochemistry" },
                    ].map((pill) => (
                      <button
                        key={pill.val}
                        type="button"
                        className="interest-pill-btn"
                        onClick={() => {
                          setWheelInterest(pill.val);
                          handleGenerateWheel(pill.val);
                        }}
                      >
                        {pill.label}
                      </button>
                    ))}
                  </div>

                  <button
                    type="submit"
                    className="bringe-primary-btn"
                    disabled={!wheelInterest.trim()}
                    style={{ marginTop: "12px", width: "100%", justifyContent: "center" }}
                  >
                    <span>Generate Giant Discovery Wheel &rarr;</span>
                  </button>
                </form>
              </div>
            )}

            {/* STEP 2: The Giant Wheel */}
            {wheelStep === "wheel" && (
              <div>
                <div className="wheel-modal-header">
                  <h2 className="wheel-modal-title">Wheel of Discovery</h2>
                  <p className="wheel-modal-subtitle">
                    Domain: <b>{wheelInterest || "Selected Field"}</b> · 8 curated popular essentials and underrated gems.
                    Spin to select your next deep learning mission.
                  </p>
                </div>

                {/* Wheel Graphic Container */}
                <div className="giant-wheel-stage">
                  <div className="giant-wheel-outer">
                    {/* Pointer at top (12 o'clock) */}
                    <div className="giant-wheel-pointer"></div>

                    {/* Rotating SVG Wheel */}
                    <svg
                      viewBox="-200 -200 400 400"
                      className="wheel-svg-element"
                      onClick={() => !isSpinning && handleSpinWheel()}
                    >
                      <g
                        style={{
                          transform: `rotate(${wheelRotation}deg)`,
                          transition: isSpinning
                            ? "transform 4.2s cubic-bezier(0.12, 0.9, 0.25, 1)"
                            : "transform 0.3s ease",
                          transformOrigin: "0px 0px",
                        }}
                      >
                        {wheelTopics.map((topic, i) => {
                          const rad1 = (i * 45 * Math.PI) / 180;
                          const rad2 = ((i + 1) * 45 * Math.PI) / 180;
                          const x1 = 190 * Math.cos(rad1);
                          const y1 = 190 * Math.sin(rad1);
                          const x2 = 190 * Math.cos(rad2);
                          const y2 = 190 * Math.sin(rad2);
                          const pathData = `M 0 0 L ${x1} ${y1} A 190 190 0 0 1 ${x2} ${y2} Z`;

                          const isUnderrated = topic.kind === "underrated";
                          const sliceFill = isUnderrated ? "#0d2818" : "#1a1a1a";
                          const sliceStroke = isUnderrated ? "#166534" : "#333333";
                          const midAngle = (i + 0.5) * 45;
                          const isUpsideDown = midAngle > 90 && midAngle < 270;

                          return (
                            <g key={topic.id}>
                              <path
                                d={pathData}
                                fill={sliceFill}
                                stroke={sliceStroke}
                                strokeWidth="1.5"
                              />
                              <g transform={`rotate(${midAngle})`}>
                                <text
                                  x="115"
                                  y="4"
                                  textAnchor="middle"
                                  transform={isUpsideDown ? "rotate(180 115 4)" : ""}
                                  fill={isUnderrated ? "#4ade80" : "#ffffff"}
                                  fontSize="9.5"
                                  fontWeight="600"
                                  letterSpacing="0.2"
                                  style={{ pointerEvents: "none" }}
                                >
                                  {shortenLabel(topic.label)}
                                </text>
                                <text
                                  x="162"
                                  y="3.5"
                                  textAnchor="middle"
                                  transform={isUpsideDown ? "rotate(180 162 3.5)" : ""}
                                  fill={isUnderrated ? "#22c55e" : "#9ca3af"}
                                  fontSize="7"
                                  fontWeight="700"
                                  letterSpacing="0.8"
                                  style={{ pointerEvents: "none", textTransform: "uppercase" }}
                                >
                                  {isUnderrated ? "GEM" : "POPULAR"}
                                </text>
                              </g>
                            </g>
                          );
                        })}
                      </g>
                    </svg>

                    {/* Central Spin Button Hub */}
                    <button
                      type="button"
                      className="wheel-center-hub-btn"
                      onClick={handleSpinWheel}
                      disabled={isSpinning}
                    >
                      {isSpinning ? <RotateCw size={20} className="animate-spin" /> : "SPIN"}
                    </button>
                  </div>
                </div>

                {/* Spin Controls & Actions */}
                <div style={{ textAlign: "center", marginTop: "8px" }}>
                  {!winningTopic && (
                    <button
                      type="button"
                      className="bringe-primary-btn"
                      onClick={handleSpinWheel}
                      disabled={isSpinning}
                      style={{ margin: "0 auto", padding: "10px 28px" }}
                    >
                      <span>{isSpinning ? "Spinning..." : "Spin the Wheel"}</span>
                    </button>
                  )}

                  {/* Winning Topic Landing Presentation */}
                  {winningTopic && !isSpinning && (
                    <div className="wheel-winner-card">
                      <div
                        className={`wheel-winner-badge ${
                          winningTopic.kind === "underrated" ? "underrated" : "popular"
                        }`}
                      >
                        {winningTopic.kind === "underrated" ? "Underrated Gem" : "Popular Essential"}
                      </div>
                      <h3 className="wheel-winner-title">{winningTopic.label}</h3>
                      <p className="wheel-winner-desc">{winningTopic.description}</p>
                      <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
                        <button
                          type="button"
                          className="bringe-primary-btn"
                          onClick={() => {
                            setShowWheelModal(false);
                            setQuery(winningTopic.label);
                            handleStartResearch(winningTopic.label);
                          }}
                        >
                          <span>Deep Research This Topic &rarr;</span>
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          onClick={handleSpinWheel}
                          style={{ fontSize: "13px" }}
                        >
                          Spin Again
                        </button>
                      </div>
                    </div>
                  )}

                  <div style={{ marginTop: "16px" }}>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => setWheelStep("interest")}
                      disabled={isSpinning}
                      style={{ fontSize: "12px", color: "var(--t3)" }}
                    >
                      &larr; Choose Different Domain
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
