"use client";

import React, { useState, useEffect, useRef } from "react";
import { AppSidebar, NavTabId } from "@/components/navigation/AppSidebar";
import { AiResearchHub, TierFindings } from "@/components/main/AiResearchHub";
import { GamifiedStudyPath } from "@/components/study-path/GamifiedStudyPath";
import { ShareInformationView } from "@/components/community/ShareInformationView";
import { BringeStudyRescue } from "@/components/bringe/BringeStudyRescue";
import { getStoredTheme, setStoredTheme } from "@/lib/grasping-service";

/* ============ TYPES ============ */
interface AuthUser {
  name: string;
  email: string;
  demo?: boolean;
}

interface StudyBlock {
  id: number;
  title: string;
  type: string;
  minutes: number;
  xp: number;
  why: string;
  cond: string;
  state: "todo" | "active" | "done" | "skipped";
}

interface Island {
  name: string;
  status: "done" | "current" | "locked";
  xp: number;
  mins: number;
  prereqs: string[];
  concepts: string[];
  checked: boolean[];
}

interface LearningTwin {
  focus: string;
  speed: string;
  retention: string;
  chrono: string;
  panic: string;
}

interface OnboardingData {
  hours?: string;
  subjects?: string[];
  style?: string;
  conf?: number;
  order?: string;
  focus?: string;
  timeline?: string;
  target?: string;
}

interface AppState {
  auth: AuthUser | null;
  remember: boolean;
  onboarded: boolean;
  ob: OnboardingData;
  xp: number;
  level: number;
  conf: number;
  course: string;
  twin: LearningTwin;
  blocks: StudyBlock[];
  islands: Island[];
  material: boolean;
  plan: boolean;
  view: "main" | "bringe" | "path" | "share" | "settings";
}

const STORAGE_KEY = "skillos_mono_v1";

function freshState(): AppState {
  return {
    auth: null,
    remember: true,
    onboarded: false,
    ob: {},
    xp: 320,
    level: 4,
    conf: 74,
    course: "",
    twin: {
      focus: "25 min",
      speed: "1.1×",
      retention: "68%",
      chrono: "Night",
      panic: "0.30",
    },
    blocks: [
      {
        id: 1,
        title: "Normalization to BCNF",
        type: "Learn",
        minutes: 25,
        xp: 40,
        why: "6 of 8 past papers · avg 12 marks",
        cond: "Read the layered note, then mark it “I got it”.",
        state: "todo",
      },
      {
        id: 2,
        title: "ACID Transactions — flashcards",
        type: "Recall",
        minutes: 10,
        xp: 25,
        why: "7 of 8 past papers · avg 10 marks",
        cond: "Answer 12 cards. Misses are tagged for the morning sweep.",
        state: "todo",
      },
      {
        id: 3,
        title: "B+ Trees — the big picture",
        type: "Learn",
        minutes: 20,
        xp: 35,
        why: "5 of 8 past papers · avg 8 marks",
        cond: "Sketch one B+ tree from memory.",
        state: "todo",
      },
    ],
    islands: [
      {
        name: "SQL Foundations",
        status: "done",
        xp: 50,
        mins: 45,
        prereqs: [],
        concepts: [
          "SELECT, WHERE, ORDER BY",
          "Joins: inner and left",
          "GROUP BY with HAVING",
        ],
        checked: [true, true, true],
      },
      {
        name: "Relational Algebra",
        status: "done",
        xp: 60,
        mins: 40,
        prereqs: ["SQL Foundations"],
        concepts: ["Selection σ", "Projection π", "Join ⋈"],
        checked: [true, true, true],
      },
      {
        name: "ER Modeling",
        status: "done",
        xp: 55,
        mins: 35,
        prereqs: ["Relational Algebra"],
        concepts: [
          "Entities and relations",
          "Keys and cardinality",
          "Total vs partial participation",
        ],
        checked: [true, true, false],
      },
      {
        name: "Normalization",
        status: "current",
        xp: 70,
        mins: 40,
        prereqs: ["ER Modeling"],
        concepts: [
          "Functional dependencies",
          "1NF to BCNF, step by step",
          "Anomalies and why they hurt",
        ],
        checked: [false, false, false],
      },
      {
        name: "ACID Transactions",
        status: "locked",
        xp: 65,
        mins: 35,
        prereqs: ["Normalization"],
        concepts: ["ACID properties", "Commit and rollback", "Isolation levels"],
        checked: [false, false, false],
      },
      {
        name: "B+ Trees",
        status: "locked",
        xp: 75,
        mins: 45,
        prereqs: ["ACID Transactions"],
        concepts: [
          "Structure and fan-out",
          "Leaf linking for ranges",
          "Insert and split",
        ],
        checked: [false, false, false],
      },
      {
        name: "Distributed Consensus",
        status: "locked",
        xp: 90,
        mins: 60,
        prereqs: ["B+ Trees"],
        concepts: ["Two-phase commit", "Quorums", "CAP in one line"],
        checked: [false, false, false],
      },
    ],
    material: false,
    plan: false,
    view: "main", // Default: Main Page shown in front!
  };
}

const PASS_CORE = [
  ["Normalization (1NF to BCNF)", "6/8 papers · avg 12 marks · long-answer", "Must", "25 min · depth L2"],
  ["ACID & concurrency", "7/8 papers · avg 10 marks · short and long", "Must", "25 min · depth L2"],
  ["B+ Trees & indexing", "5/8 papers · avg 8 marks · numerical", "Must", "20 min · depth L1"],
  ["ER modeling", "4/8 papers · avg 6 marks · diagram", "Should", "15 min · depth L1"],
  ["Relational algebra", "3/8 papers · avg 5 marks · short", "Should", "15 min · depth L1"],
];

const TIMELINE = [
  ["8:32 PM", "Learn · Normalization", "25 min · depth L2", false],
  ["8:57 PM", "Recall · ACID flashcards", "10 min · mistakes tagged", false],
  ["9:07 PM", "Break", "10 min · stand, water, no phone", false],
  ["9:17 PM", "Learn · B+ Trees", "20 min · depth L1", false],
  ["9:37 PM", "Build your Rescue Sheet", "15 min · it writes itself as you learn", false],
  ["10:00 PM", "Final sweep", "30 min · Rescue Sheet + tagged misses", false],
  ["11:30 PM", "Sleep — protected", "6 hours · never cut, always earned", true],
  ["8:00 AM", "Morning card", "30 min · panic card + ten flashcards", false],
  ["9:00 AM", "Exam — Database Systems", "You walk in with a plan.", true],
];

const ONBOARDING_QUESTIONS = [
  {
    q: "How much can you study per day?",
    s: "Be honest — the plan adapts to reality, not the ideal.",
    k: "hours" as const,
    opts: ["Under 1 hour", "1–2 hours", "2–4 hours", "4+ hours"],
    two: true,
  },
  {
    q: "Which subjects are you preparing?",
    s: "Pick everything that applies.",
    k: "subjects" as const,
    multi: ["Databases", "Operating Systems", "Networks", "Algorithms", "Mathematics", "Electronics"],
  },
  {
    q: "How do you learn best?",
    s: "Notes and quizzes are ordered around this.",
    k: "style" as const,
    opts: ["Visual diagrams", "Reading notes", "Practice problems", "Video lessons"],
    two: true,
  },
  {
    q: "How confident do you feel right now?",
    s: "No judgment. This seeds your Learning Twin.",
    k: "conf" as const,
    slider: true,
  },
  {
    q: "New concepts click when…",
    s: "We order every lesson accordingly.",
    k: "order" as const,
    opts: ["I see worked examples first", "I read the theory first"],
  },
  {
    q: "What is your focus pattern?",
    s: "It sets the length of your study sprints.",
    k: "focus" as const,
    opts: ["25-minute sprints", "40-minute flow states", "Marathon sessions", "I drift quickly"],
    two: true,
  },
  {
    q: "When is the exam — and the target?",
    s: "“Tomorrow” switches on Exam-Eve Rescue mode.",
    final: true,
  },
];

export default function App() {
  const [mounted, setMounted] = useState(false);
  const [state, setState] = useState<AppState>(freshState);
  const [screen, setScreen] = useState<"login" | "onboarding" | "app">("login");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Login screen states
  const [authTab, setAuthTab] = useState<"signin" | "signup">("signin");
  const [loginName, setLoginName] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [authNote, setAuthNote] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotNote, setForgotNote] = useState("");

  // Onboarding wizard states
  const [obIndex, setObIndex] = useState(0);
  const [obSelSubjects, setObSelSubjects] = useState<string[]>([]);
  const [obSliderConf, setObSliderConf] = useState(50);
  const [obFinalTime, setObFinalTime] = useState("");
  const [obFinalTarget, setObFinalTarget] = useState("");
  const [obCalibrating, setObCalibrating] = useState(false);
  const [obCalibLines, setObCalibLines] = useState<{ title: string; desc: string }[]>([]);

  // Island drawer & modals
  const [activeIslandIdx, setActiveIslandIdx] = useState<number | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [panicOpen, setPanicOpen] = useState(false);
  const [panicCycle, setPanicCycle] = useState(1);
  const [panicPhaseIdx, setPanicPhaseIdx] = useState(0);
  const [panicCount, setPanicCount] = useState(4);

  // Bringe study material state
  const [ingestStatus, setIngestStatus] = useState<string>("");
  const [buildPlanStatus, setBuildPlanStatus] = useState<string>("");
  const [isBuildingPlan, setIsBuildingPlan] = useState(false);
  const [downloadBtnText, setDownloadBtnText] = useState("Download initial data (.txt)");
  const [deleteArmed, setDeleteArmed] = useState(false);
  const [countdownStr, setCountdownStr] = useState("13h 48m");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to persist state
  const saveState = (newState: AppState) => {
    setState(newState);
    try {
      const clone = { ...newState };
      if (!newState.remember) {
        clone.auth = null;
        if (newState.auth) {
          sessionStorage.setItem("skilos_session", JSON.stringify(newState.auth));
        } else {
          sessionStorage.removeItem("skilos_session");
        }
      } else {
        sessionStorage.removeItem("skilos_session");
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(clone));
      if (newState.auth) {
        document.cookie = "skillos_auth=true; path=/; max-age=86400; SameSite=Lax";
      } else {
        document.cookie = "skillos_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      }
    } catch {
      // ignore
    }
  };

  // Exam countdown calculation
  const updateCountdown = () => {
    const examAt = new Date();
    examAt.setDate(examAt.getDate() + 1);
    examAt.setHours(9, 0, 0, 0);
    const ms = examAt.getTime() - Date.now();
    const h = Math.max(0, Math.floor(ms / 36e5));
    const m = Math.max(0, Math.floor((ms % 36e5) / 6e4));
    setCountdownStr(`${h}h ${m}m`);
  };

  // Initial load
  useEffect(() => {
    setMounted(true);
    let loaded: AppState = freshState();
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed) {
          if (!parsed.auth) {
            const sess = sessionStorage.getItem("skilos_session");
            if (sess) parsed.auth = JSON.parse(sess);
          }
          if (!parsed.view) parsed.view = "main";
          loaded = parsed;
        }
      }
      const sidePref = localStorage.getItem("skillos_sidebar_collapsed");
      if (sidePref !== null) {
        setIsSidebarCollapsed(sidePref === "true");
      }
    } catch {
      // ignore
    }

    try {
      setStoredTheme(getStoredTheme());
    } catch {}

    setState(loaded);
    updateCountdown();

    if (typeof window !== "undefined" && window.location.pathname === "/login") {
      setScreen("login");
    } else if (typeof window !== "undefined" && window.location.pathname === "/onboarding") {
      setScreen("onboarding");
    } else if (loaded.auth && loaded.onboarded) {
      setScreen("app");
    } else if (loaded.auth) {
      setScreen("onboarding");
    } else {
      setScreen("login");
    }

    const timer = setInterval(updateCountdown, 30000);
    return () => clearInterval(timer);
  }, []);

  // Panic mode loop
  useEffect(() => {
    if (!panicOpen) return;

    let currentPhase = panicPhaseIdx;
    let currentCycle = panicCycle;
    let secondsLeft = 4;
    setPanicCount(4);

    const countInterval = setInterval(() => {
      secondsLeft -= 1;
      if (secondsLeft > 0) {
        setPanicCount(secondsLeft);
      }
    }, 1000);

    const phaseTimeout = setTimeout(() => {
      clearInterval(countInterval);
      const nextPhase = (currentPhase + 1) % 4;
      if (nextPhase === 0) {
        currentCycle += 1;
        setPanicCycle(currentCycle);
      }
      setPanicPhaseIdx(nextPhase);
    }, 4000);

    return () => {
      clearInterval(countInterval);
      clearTimeout(phaseTimeout);
    };
  }, [panicOpen, panicPhaseIdx, panicCycle]);

  // Keyboard shortcut: ESC closes panic and sheet
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPanicOpen(false);
        setSheetOpen(false);
        setActiveIslandIdx(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!mounted) {
    return <div style={{ background: "#0a0a0a", minHeight: "100vh" }} />;
  }

  /* ============ ACTIONS ============ */

  const handleGainXP = (amt: number) => {
    const newXP = state.xp + amt;
    const newLevel = Math.floor(newXP / 100) + 1;
    const updated: AppState = {
      ...state,
      xp: newXP,
      level: newLevel,
    };
    saveState(updated);
  };

  // Demo Login
  const handleDemoLogin = () => {
    const s = freshState();
    s.auth = { name: "Alex Chen", email: "alex@demo.sarvajna.app", demo: true };
    s.onboarded = true;
    s.material = true;
    s.plan = true;
    s.view = "main";
    saveState(s);
    setScreen("app");
    window.scrollTo(0, 0);
  };

  // Normal Login / Signup
  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (authTab === "signup" && loginName.trim().length < 2) {
      setAuthNote("Please tell us your name.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(loginEmail.trim())) {
      setAuthNote("That email doesn’t look right.");
      return;
    }
    if (loginPass.length < 6) {
      setAuthNote("Passwords need at least 6 characters.");
      return;
    }

    setAuthLoading(true);
    setTimeout(() => {
      setAuthLoading(false);
      const computedName =
        authTab === "signup"
          ? loginName.trim()
          : loginEmail
              .split("@")[0]
              .replace(/[._-]/g, " ")
              .replace(/\b\w/g, (c) => c.toUpperCase());
      const updated: AppState = {
        ...state,
        remember: rememberMe,
        auth: { name: computedName, email: loginEmail.trim(), demo: false },
        view: "main",
      };
      saveState(updated);

      if (updated.onboarded) {
        setScreen("app");
      } else {
        setObIndex(0);
        setObSelSubjects([]);
        setScreen("onboarding");
      }
      window.scrollTo(0, 0);
    }, 650);
  };

  // Forgot Password
  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(forgotEmail.trim())) {
      setForgotNote("Enter a valid email so we can find the account.");
      return;
    }
    setForgotNote("Reset link sent — check your inbox.");
  };

  // Onboarding Finish
  const handleFinishOnboarding = () => {
    setObCalibrating(true);
    const obData: OnboardingData = {
      hours: state.ob.hours || "2–4 hours",
      subjects: obSelSubjects.length ? obSelSubjects : ["Databases"],
      style: state.ob.style || "Practice problems",
      conf: obSliderConf,
      order: state.ob.order || "I see worked examples first",
      focus: state.ob.focus || "25-minute sprints",
      timeline: obFinalTime,
      target: obFinalTarget,
    };

    const focusMap: Record<string, string> = {
      "25-minute sprints": "25 min",
      "40-minute flow states": "40 min",
      "Marathon sessions": "60 min",
      "I drift quickly": "15 min",
    };

    const retMap: Record<string, string> = {
      "Under 1 hour": "52%",
      "1–2 hours": "60%",
      "2–4 hours": "68%",
      "4+ hours": "74%",
    };

    const twin: LearningTwin = {
      focus: focusMap[obData.focus || ""] || "25 min",
      speed: obSliderConf < 40 ? "0.9×" : obSliderConf < 70 ? "1.0×" : "1.1×",
      retention: retMap[obData.hours || ""] || "68%",
      chrono: /Tomorrow/i.test(obData.timeline || "") ? "Night" : "Morning",
      panic: /Tomorrow/i.test(obData.timeline || "") ? "0.45" : "0.25",
    };

    const course = (obData.subjects || []).includes("Databases")
      ? "Database Systems"
      : obData.subjects?.[0] || "Database Systems";
    const conf = Math.min(70, Math.round(34 + (obData.conf ?? 50) * 0.35));

    const lines = [
      { title: "Focus span", desc: twin.focus },
      { title: "Chronotype", desc: twin.chrono },
      { title: "Pace", desc: twin.speed },
      { title: "Twin v1", desc: "saved — it sharpens as you study" },
    ];

    lines.forEach((line, idx) => {
      setTimeout(() => {
        setObCalibLines((prev) => [...prev, line]);
      }, 400 + idx * 480);
    });

    setTimeout(() => {
      const updated: AppState = {
        ...state,
        ob: obData,
        twin,
        course,
        conf,
        onboarded: true,
        view: "main",
      };
      saveState(updated);
      setObCalibrating(false);
      setScreen("app");
      window.scrollTo(0, 0);
    }, 400 + lines.length * 480 + 800);
  };

  // Ingest Material
  const handleIngest = (fileName: string) => {
    setIngestStatus("Reading pages — 24 found");
    setTimeout(() => {
      setIngestStatus("Extracting 18 key topics");
      setTimeout(() => {
        setIngestStatus("Material ready");
        setTimeout(() => {
          setIngestStatus("");
          const updated: AppState = {
            ...state,
            material: true,
          };
          saveState(updated);
        }, 450);
      }, 950);
    }, 850);
  };

  // Build Rescue Plan
  const handleBuildPlan = () => {
    setIsBuildingPlan(true);
    const steps = [
      "Reading your material…",
      "Scoring 18 topics against 8 past papers…",
      "Selecting the Pass Core…",
      "Protecting 6 hours of sleep…",
      "Laying out the timeline…",
    ];
    let i = 0;
    const nextStep = () => {
      if (i >= steps.length) {
        setIsBuildingPlan(false);
        setBuildPlanStatus("");
        const updated: AppState = {
          ...state,
          plan: true,
        };
        saveState(updated);
        return;
      }
      setBuildPlanStatus(steps[i]);
      i += 1;
      setTimeout(nextStep, 820);
    };
    nextStep();
  };

  // Logout
  const handleLogout = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem("skilos_session");
      document.cookie = "skillos_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    } catch {
      // ignore
    }
    setState(freshState());
    setShowForgot(false);
    setAuthNote("");
    setScreen("login");
    window.scrollTo(0, 0);
  };

  // Download Initial Data
  const handleDownloadInitialData = () => {
    const L = "=".repeat(44);
    const txt = [
      L,
      " SARVAJNA",
      " STUDENT INITIAL DATA — private export",
      L,
      `Generated : ${new Date().toLocaleString()}`,
      `Student   : ${state.auth ? state.auth.name : "—"}`,
      `Email     : ${state.auth ? state.auth.email : "—"}`,
      `Course    : ${state.course}`,
      "",
      "CALIBRATION",
      `  Daily study bandwidth : ${state.ob.hours || "2–4 hours"}`,
      `  Subjects              : ${(state.ob.subjects || ["Databases"]).join(", ")}`,
      `  Learning style        : ${state.ob.style || "Practice problems"}`,
      `  Self-confidence       : ${state.ob.conf ?? 50} / 100`,
      `  Concept grasp         : ${state.ob.order || "Examples first"}`,
      `  Focus pattern         : ${state.ob.focus || "25-minute sprints"}`,
      `  Exam timeline         : ${state.ob.timeline || "Tomorrow (rescue)"}`,
      `  Target                : ${state.ob.target || "Just pass"}`,
      "",
      "LEARNING TWIN (v1)",
      `  Focus span     : ${state.twin.focus}`,
      `  Speed factor   : ${state.twin.speed}`,
      `  Retention est. : ${state.twin.retention}`,
      `  Chronotype     : ${state.twin.chrono}`,
      `  Panic index    : ${state.twin.panic}`,
      "",
      `Pass confidence : ${state.conf}% (estimate)`,
      `XP / Level      : ${state.xp} XP · Level ${state.level}`,
      "",
      "This file was generated locally. Your data stays yours.",
      L,
    ].join("\n");

    const blob = new Blob([txt], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "student_initial_data.txt";
    a.click();
    URL.revokeObjectURL(url);
    setDownloadBtnText("Downloaded");
    setTimeout(() => setDownloadBtnText("Download initial data (.txt)"), 1600);
  };

  // Delete Twin
  const handleDeleteTwin = () => {
    if (!deleteArmed) {
      setDeleteArmed(true);
      setTimeout(() => setDeleteArmed(false), 3000);
      return;
    }
    const currentAuth = state.auth;
    const resetState = freshState();
    resetState.auth = currentAuth;
    resetState.onboarded = false;
    saveState(resetState);
    setObIndex(0);
    setObSelSubjects([]);
    setScreen("onboarding");
    setDeleteArmed(false);
  };

  const PHASES_INFO = [
    { label: "Breathe in", action: "grow" },
    { label: "Hold", action: "grow" },
    { label: "Breathe out", action: "shrink" },
    { label: "Hold", action: "shrink" },
  ];

  /* ========================================================================== */
  /* ============================ 1. LOGIN SCREEN ============================= */
  /* ========================================================================== */
  if (screen === "login") {
    return (
      <section id="screen-login" className="screen active">
        <div className="login-bg-watermark" aria-hidden="true">
          <img src="/logo.png" alt="" />
        </div>
        <div className="auth">
          <div className="wordmark">
            <img src="/logo.png" alt="Sarvajña" className="wordmark-logo" />
            <span>Sarvajña</span>
          </div>
          <div className="wordsub">Adaptive Study · Exam-Eve Rescue</div>

          <div className="tabs">
            <button
              className={`tab ${authTab === "signin" ? "on" : ""}`}
              onClick={() => {
                setAuthTab("signin");
                setAuthNote("");
              }}
              type="button"
            >
              Sign In
            </button>
            <button
              className={`tab ${authTab === "signup" ? "on" : ""}`}
              onClick={() => {
                setAuthTab("signup");
                setAuthNote("");
              }}
              type="button"
            >
              Create Account
            </button>
          </div>

          {!showForgot ? (
            <form id="auth-form" onSubmit={handleAuthSubmit} noValidate>
              {authTab === "signup" && (
                <div className="f" id="f-name">
                  <label htmlFor="in-name">Full name</label>
                  <div className="in">
                    <input
                      id="in-name"
                      type="text"
                      placeholder="Alex Chen"
                      autoComplete="name"
                      value={loginName}
                      onChange={(e) => setLoginName(e.target.value)}
                    />
                  </div>
                </div>
              )}
              <div className="f">
                <label htmlFor="in-email">Email</label>
                <div className="in">
                  <input
                    id="in-email"
                    type="email"
                    placeholder="you@campus.edu"
                    autoComplete="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="f pw">
                <label htmlFor="in-pass">Password</label>
                <div className="in">
                  <input
                    id="in-pass"
                    type={showPass ? "text" : "password"}
                    placeholder="At least 6 characters"
                    value={loginPass}
                    onChange={(e) => setLoginPass(e.target.value)}
                  />
                  <button
                    type="button"
                    className="peek"
                    id="peek"
                    onClick={() => setShowPass(!showPass)}
                  >
                    {showPass ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
              <div className="frow">
                <label className="cbx">
                  <input
                    type="checkbox"
                    id="remember"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span className="b"></span>Remember me
                </label>
                <button
                  type="button"
                  className="btn-text"
                  id="forgot"
                  onClick={() => setShowForgot(true)}
                >
                  Forgot password?
                </button>
              </div>

              {authNote && <div className="fnote show" id="fnote">{authNote}</div>}

              <button
                className="btn btn-primary"
                id="auth-go"
                type="submit"
                style={{ width: "100%" }}
                disabled={authLoading}
              >
                {authLoading
                  ? authTab === "signup"
                    ? "Creating…"
                    : "Signing in…"
                  : authTab === "signup"
                  ? "Create Account"
                  : "Sign In"}
              </button>
            </form>
          ) : (
            <form id="fp-form" onSubmit={handleForgotSubmit} noValidate>
              <div className="f">
                <label htmlFor="fp-email">Account email</label>
                <div className="in">
                  <input
                    id="fp-email"
                    type="email"
                    placeholder="you@campus.edu"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                  />
                </div>
              </div>

              {forgotNote && <div className="fnote show" id="fp-note">{forgotNote}</div>}

              <div style={{ display: "flex", gap: "12px" }}>
                <button className="btn btn-primary" type="submit" style={{ flex: 1 }}>
                  Send reset link
                </button>
                <button
                  className="btn btn-ghost"
                  type="button"
                  id="fp-back"
                  onClick={() => {
                    setShowForgot(false);
                    setForgotNote("");
                  }}
                >
                  Back
                </button>
              </div>
            </form>
          )}

          <div className="alt">
            First time here?{" "}
            <button className="btn-text" id="demo" onClick={handleDemoLogin} type="button">
              Open demo student — Alex Chen
            </button>
          </div>
          <p className="quote">“Same exam. Different student. Different plan.”</p>
        </div>
      </section>
    );
  }

  /* ========================================================================== */
  /* ========================= 2. ONBOARDING SCREEN =========================== */
  /* ========================================================================== */
  if (screen === "onboarding") {
    const currentQuestion = ONBOARDING_QUESTIONS[obIndex];
    const isMulti = Boolean(currentQuestion.multi);
    const isSlider = Boolean(currentQuestion.slider);
    const isFinal = Boolean(currentQuestion.final);
    const needsNextButton = isMulti || isSlider || isFinal;

    return (
      <section id="screen-onboarding" className="screen active">
        <div className="ob">
          <div className="ob-top">
            <div className="ob-brand" style={{ display: "flex", alignItems: "center", gap: "9px" }}>
              <img src="/logo.png" alt="Sarvajña" style={{ height: "24px", width: "auto", objectFit: "contain", borderRadius: "4px" }} />
              <span>Sarvajña</span>
            </div>
            <div className="ob-step" id="ob-step">
              Calibration · Step {obIndex + 1} of 7
            </div>
          </div>
          <div className="ob-bar">
            <i id="ob-fill" style={{ width: `${(obIndex / 7) * 100}%` }}></i>
          </div>
          <div className="ob-dots" id="ob-dots">
            {ONBOARDING_QUESTIONS.map((_, i) => (
              <i key={i} className={i <= obIndex ? "on" : ""}></i>
            ))}
          </div>

          <div id="ob-body">
            {!obCalibrating ? (
              <>
                <h3 className="ob-q">{currentQuestion.q}</h3>
                <p className="ob-s">{currentQuestion.s}</p>

                {currentQuestion.opts && !isFinal && (
                  <div className={`opts ${currentQuestion.two ? "two" : ""}`}>
                    {currentQuestion.opts.map((opt) => (
                      <button
                        key={opt}
                        className={`opt ${state.ob[currentQuestion.k as keyof OnboardingData] === opt ? "sel" : ""}`}
                        type="button"
                        onClick={() => {
                          const updatedOb = { ...state.ob, [currentQuestion.k]: opt };
                          setState({ ...state, ob: updatedOb });
                          setTimeout(() => {
                            setObIndex((prev) => prev + 1);
                          }, 320);
                        }}
                      >
                        <span className="sq"></span>
                        {opt}
                      </button>
                    ))}
                  </div>
                )}

                {isMulti && currentQuestion.multi && (
                  <div className="opts two">
                    {currentQuestion.multi.map((subject) => {
                      const isSelected = obSelSubjects.includes(subject);
                      return (
                        <button
                          key={subject}
                          type="button"
                          className={`opt ${isSelected ? "sel" : ""}`}
                          onClick={() => {
                            if (isSelected) {
                              setObSelSubjects(obSelSubjects.filter((s) => s !== subject));
                            } else {
                              setObSelSubjects([...obSelSubjects, subject]);
                            }
                          }}
                        >
                          <span className="sq"></span>
                          {subject}
                        </button>
                      );
                    })}
                  </div>
                )}

                {isSlider && (
                  <div className="slider-w">
                    <div className="sl-v" id="slv">
                      {obSliderConf}
                    </div>
                    <div className="sl-w" id="slw">
                      {obSliderConf < 25
                        ? "Shaky"
                        : obSliderConf < 50
                        ? "Getting there"
                        : obSliderConf < 75
                        ? "Steady"
                        : "Confident"}
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={obSliderConf}
                      id="slr"
                      onChange={(e) => setObSliderConf(+e.target.value)}
                    />
                  </div>
                )}

                {isFinal && (
                  <>
                    <div className="ol" style={{ marginBottom: "10px" }}>
                      Exam timeline
                    </div>
                    <div className="opts two">
                      {[
                        "Tomorrow — rescue me",
                        "Within a week",
                        "This month",
                        "Long-term",
                      ].map((t) => (
                        <button
                          key={t}
                          type="button"
                          className={`opt ${obFinalTime === t ? "sel" : ""}`}
                          onClick={() => setObFinalTime(t)}
                        >
                          <span className="sq"></span>
                          {t}
                        </button>
                      ))}
                    </div>

                    <div className="ol" style={{ margin: "22px 0 10px" }}>
                      Target score
                    </div>
                    <div className="opts three">
                      {["Just pass", "60%", "75%+"].map((g) => (
                        <button
                          key={g}
                          type="button"
                          className={`opt ${obFinalTarget === g ? "sel" : ""}`}
                          onClick={() => setObFinalTarget(g)}
                        >
                          <span className="sq"></span>
                          {g}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                <div className="ob-foot">
                  <button
                    className="ob-back"
                    id="ob-back"
                    type="button"
                    style={{ visibility: obIndex === 0 ? "hidden" : "visible" }}
                    onClick={() => setObIndex((prev) => Math.max(0, prev - 1))}
                  >
                    Back
                  </button>

                  {needsNextButton ? (
                    <button
                      className="btn btn-primary"
                      id="ob-next"
                      type="button"
                      disabled={
                        (isMulti && obSelSubjects.length === 0) ||
                        (isFinal && (!obFinalTime || !obFinalTarget))
                      }
                      onClick={() => {
                        if (isFinal) {
                          handleFinishOnboarding();
                        } else {
                          setObIndex((prev) => prev + 1);
                        }
                      }}
                    >
                      {isFinal ? "Build my Learning Twin" : "Continue"}
                    </button>
                  ) : (
                    <span></span>
                  )}
                </div>
              </>
            ) : (
              <div className="ob-done">
                <div className="ob-q" style={{ margin: 0 }}>
                  Calibrating your Learning Twin
                </div>
                <div className="ofl" id="ofl">
                  {obCalibLines.map((line, idx) => (
                    <div key={idx}>
                      <b>{line.title}</b> — {line.desc}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  /* ========================================================================== */
  /* ============================ 3. APP SCREEN =============================== */
  /* ========================================================================== */
  return (
    <div id="screen-app" className="screen active">
      <div className="shell-layout">
        {/* Animated Sidebar with Bringe, Path, Share, Settings */}
        <AppSidebar
          activeTab={state.view as NavTabId}
          onSelectTab={(tab) => saveState({ ...state, view: tab as any })}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => {
            const next = !isSidebarCollapsed;
            setIsSidebarCollapsed(next);
            try {
              localStorage.setItem("skillos_sidebar_collapsed", String(next));
            } catch {}
          }}
          level={state.level}
          xp={state.xp}
        />

        {/* Main Content Area */}
        <div className="main-content-area">
          {/* Top Bar with Minimal Header */}
          <header className="topnav" style={{ position: "sticky", top: 0, zIndex: 40 }}>
            <div className="nav-in">
              <div
                className="brand"
                style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
                onClick={() => saveState({ ...state, view: "main" })}
              >
                <img src="/logo.png" alt="Sarvajña" style={{ height: "22px", width: "auto", objectFit: "contain", borderRadius: "4px" }} />
                <b>Sarvajña</b>
              </div>

              <div className="nav-meta" style={{ marginLeft: "auto" }}>
                <span className="nm hide-m">
                  Lv <b id="nm-level">{state.level}</b> · <b id="nm-xp">{state.xp}</b> XP
                </span>
                <button
                  className="nm panic"
                  type="button"
                  onClick={() => setPanicOpen(true)}
                >
                  Panic Mode
                </button>
              </div>
            </div>
          </header>

          <main style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
            {/* 1. MAIN PAGE (1-on-1 AI Deep Research Hub) - Shown in Front by Default */}
            {state.view === "main" && (
              <AiResearchHub
                onAddToStudyPath={(topic, tier, findings) => {
                  saveState({
                    ...state,
                    course: topic,
                    view: "path",
                  });
                }}
                onNavigateToStudyPath={() => saveState({ ...state, view: "path" })}
              />
            )}

            {/* 2. BRINGE STUDY VIEW (Exam-Eve Rescue & Last Resort Engine) */}
            {state.view === "bringe" && (
              <section className="view active" id="view-bringe" style={{ padding: "0" }}>
                <BringeStudyRescue
                  onGainXP={handleGainXP}
                  onOpenRescueSheet={() => setSheetOpen(true)}
                  onOpenPanicMode={() => setPanicOpen(true)}
                  userLevel={state.level}
                  userXP={state.xp}
                />
              </section>
            )}

            {/* 3. STUDY PATH (Gamified Fog-Concealed Adaptive Progression) */}
            {state.view === "path" && (
              <section className="view active" id="view-path" style={{ padding: "12px 20px" }}>
                <GamifiedStudyPath
                  topicTitle={state.course}
                  onGainXP={handleGainXP}
                  onOpenRescueSheet={() => setSheetOpen(true)}
                  onNavigateToMain={() => saveState({ ...state, view: "main" })}
                />
              </section>
            )}

            {/* 4. SHARE INFORMATION (Community Notes & Peer Graph) */}
            {state.view === "share" && (
              <section className="view active" id="view-share" style={{ padding: "32px 20px" }}>
                <ShareInformationView />
              </section>
            )}

            {/* 5. SETTINGS (Learning Twin, Data & Recalibration) */}
            {state.view === "settings" && (
              <section className="view active" id="view-settings" style={{ padding: "32px 20px" }}>
                <div className="vh">
                  <h1>Settings</h1>
                </div>
                <div className="set">
                  <div className="ol">Learning Twin</div>
                  <h2>How SkillOS models you</h2>
                  <div id="twin">
                    {[
                      ["Focus span", state.twin.focus],
                      ["Speed factor", state.twin.speed],
                      ["Retention estimate", state.twin.retention],
                      ["Chronotype", state.twin.chrono],
                      ["Panic index", state.twin.panic],
                    ].map((row, i) => (
                      <div key={i} className="kv">
                        <span>{row[0]}</span>
                        <span className="dots"></span>
                        <b>{row[1]}</b>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="set">
                  <div className="ol">Data &amp; privacy</div>
                  <h2>Your data stays yours</h2>
                  <div className="acts">
                    <button
                      className="btn btn-ghost"
                      id="dl"
                      type="button"
                      onClick={handleDownloadInitialData}
                    >
                      {downloadBtnText}
                    </button>
                    <button
                      className="btn btn-ghost"
                      id="del"
                      type="button"
                      onClick={handleDeleteTwin}
                    >
                      {deleteArmed ? "Tap again to confirm" : "Delete my Twin"}
                    </button>
                  </div>
                </div>

                <div className="set">
                  <div className="ol">Session</div>
                  <h2>Recalibrate or sign out</h2>
                  <div className="acts">
                    <button
                      className="btn btn-ghost"
                      id="recal"
                      type="button"
                      onClick={() => {
                        const updated: AppState = { ...state, onboarded: false };
                        saveState(updated);
                        setObIndex(0);
                        setObSelSubjects([]);
                        setScreen("onboarding");
                      }}
                    >
                      Recalibrate assessment
                    </button>
                    <button
                      className="btn btn-ghost"
                      id="out"
                      type="button"
                      onClick={handleLogout}
                    >
                      Log out
                    </button>
                  </div>
                </div>
              </section>
            )}
          </main>
        </div>
      </div>

      {/* ================= RESCUE SHEET MODAL ================= */}
      <div className={`sh ${sheetOpen ? "open" : ""}`} id="sheet">
        <div className="sh-bg" onClick={() => setSheetOpen(false)}></div>
        <div className="sh-panel">
          <div className="sh-head">
            <div>
              <h2>Rescue Sheet</h2>
            </div>
            <div className="sh-acts">
              <button
                className="btn btn-ghost"
                id="print"
                type="button"
                onClick={() => window.print()}
              >
                Save as PDF
              </button>
              <button
                className="btn btn-ghost"
                type="button"
                onClick={() => setSheetOpen(false)}
              >
                Close
              </button>
            </div>
          </div>

          <div className="sh-grid">
            <div className="sh-card full">
              <h3>Panic Card — the ten lines that matter</h3>
              <ul>
                <li>Read the whole paper once before writing anything.</li>
                <li>Answer what you know first — bank the marks early.</li>
                <li>
                  <b>Normalization:</b> kill partial dependencies, then transitive ones.
                </li>
                <li>
                  <b>ACID</b> — all-or-nothing, consistent, isolated, durable.
                </li>
                <li>
                  <b>B+ Tree:</b> data lives in the leaves; leaves are linked.
                </li>
                <li>Lost update? Lock it — two-phase locking.</li>
                <li>
                  ER: box is an entity, diamond is a relation, oval is an attribute.
                </li>
                <li>Write something for every part-question. Partial marks count.</li>
                <li>Watch the clock — roughly 1.5 minutes per mark.</li>
                <li>You made a plan tonight. Trust it. Breathe.</li>
              </ul>
            </div>

            <div className="sh-card">
              <h3>Normalization ladder</h3>
              <ul>
                <li><b>1NF</b> — atomic values, no repeating groups</li>
                <li><b>2NF</b> — 1NF, plus no partial dependency on part of a key</li>
                <li><b>3NF</b> — 2NF, plus no transitive dependency</li>
                <li><b>BCNF</b> — every determinant is a superkey</li>
                <li>Anomalies on insert, update, or delete mean: normalize further</li>
              </ul>
            </div>

            <div className="sh-card">
              <h3>ACID &amp; transactions</h3>
              <ul>
                <li><b>Atomicity</b> — all steps or none</li>
                <li><b>Consistency</b> — valid state to valid state</li>
                <li><b>Isolation</b> — concurrent transactions never see half-work</li>
                <li><b>Durability</b> — a commit survives the crash</li>
                <li>States: active, then committed or aborted</li>
              </ul>
            </div>

            <div className="sh-card">
              <h3>B+ Trees &amp; indexing</h3>
              <ul>
                <li>Balanced — height is O(log n)</li>
                <li>Internal nodes hold keys only; data sits in the leaves</li>
                <li>Leaves are linked, so range scans are fast</li>
                <li>High fan-out means a shallow tree and fewer disk reads</li>
                <li>Strong for both equality and range queries</li>
              </ul>
            </div>

            <div className="sh-card">
              <h3>ER modeling</h3>
              <ul>
                <li>Rectangle — entity · diamond — relation</li>
                <li>Oval — attribute · underline — key</li>
                <li>Double line — total participation</li>
                <li>Cardinalities: 1:1, 1:N, M:N</li>
              </ul>
            </div>

            <div className="sh-card">
              <h3>Concurrency control</h3>
              <ul>
                <li><b>2PL</b> — a growing phase, then a shrinking phase; no releases in between</li>
                <li>2PL prevents lost updates and dirty reads</li>
                <li>Deadlock is a cycle of waits — detect, then abort one</li>
                <li>Timestamp ordering — the oldest transaction wins</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* ================= PANIC MODE OVERLAY ================= */}
      <div className={`pn ${panicOpen ? "open" : ""}`} id="pn">
        <button
          className="pn-x"
          id="pn-x"
          type="button"
          onClick={() => setPanicOpen(false)}
        >
          ESC · EXIT
        </button>
        <div className="pn-in">
          <div className="ring">
            <div
              className={`core ${PHASES_INFO[panicPhaseIdx].action}`}
              id="core"
            >
              <span id="ph-label">{PHASES_INFO[panicPhaseIdx].label}</span>
              <span id="ph-count">{panicCount}</span>
            </div>
          </div>
          <p className="pn-msg">You have a plan. Just do the next small thing.</p>
          <p className="pn-cy" id="pn-cy">
            {panicCycle >= 5
              ? "Five cycles done — steadier? Exit anytime"
              : `Box breathing · Cycle ${panicCycle}`}
          </p>
          <div className="pn-acts">
            <button
              className="btn btn-ghost"
              id="pn-sheet"
              type="button"
              onClick={() => {
                setPanicOpen(false);
                setSheetOpen(true);
              }}
            >
              Open Rescue Sheet
            </button>
            <button
              className="btn btn-ghost"
              id="pn-easy"
              type="button"
              onClick={() => {
                setPanicOpen(false);
                saveState({ ...state, view: "main" });
              }}
            >
              Return to Research Hub
            </button>
            <button
              className="btn btn-primary"
              id="pn-calm"
              type="button"
              onClick={() => setPanicOpen(false)}
            >
              I'm calm now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
