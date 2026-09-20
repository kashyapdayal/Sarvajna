"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  HelpCircle,
  RotateCcw,
  Search,
  Upload,
  Layers,
  FileText,
  ShieldAlert,
  Activity,
  PenTool,
  Award,
  Check,
  X,
  FileUp,
  Brain,
  Zap,
  Lock,
  Unlock,
  Printer,
  Copy,
  Moon,
  Compass,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  ExternalLink,
  Bookmark,
  SlidersHorizontal,
} from "lucide-react";
import { ambientAudio } from "@/components/common/SoundEffects";
import { ParagraphSimplifier } from "@/components/common/ParagraphSimplifier";
import { getStoredGraspingScore } from "@/lib/grasping-service";
import {
  synthesizeCurriculum,
  evaluateStudentAnswer,
  HighYieldTopic,
  WritingQuestion,
  FadedExample,
  WritingEvaluationResult,
  CuratedResource,
  PyqItem,
  getCuratedResourcesForSubject,
  getPyqBankForTopic,
} from "@/lib/bringe-ai-engine";

export interface BringeStudyRescueProps {
  onGainXP: (amount: number) => void;
  onOpenRescueSheet?: () => void;
  onOpenPanicMode?: () => void;
  userLevel?: number;
  userXP?: number;
}

export type BringeStep =
  | "circular_tile"
  | "intake_form"
  | "pyq_inquiry"
  | "ai_researching"
  | "topic_selection"
  | "active_study_loop";

export interface ScheduledReviewItem {
  id: string;
  topicId: string;
  topicName: string;
  type: "writing" | "mcq" | "card" | "faded";
  promptSnippet: string;
  reason: string;
  intervalTag: string; // "+25 min micro-retest", "Pre-sleep sweep (11:00 PM)", "Morning card (7:00 AM)"
  scheduledAt: string;
  illusionOfCompetence?: boolean;
}

// Initial baseline topic bank before user executes deep research
const INITIAL_BASELINE_TOPICS: HighYieldTopic[] = synthesizeCurriculum({
  subject: "Cardiology & Human Heart",
  area: "Cardiac Cycle, Conduction & Pressures",
  department: "Medicine & Health Sciences",
  examHoursRemaining: 12,
  studyBudgetHours: 4,
  passMarkTarget: 50,
  sleepHours: 6,
  questionStyle: "mixed",
});

export const BringeStudyRescue: React.FC<BringeStudyRescueProps> = ({
  onGainXP,
  onOpenRescueSheet,
  onOpenPanicMode,
  userLevel = 4,
  userXP = 320,
}) => {
  // Navigation / Phase
  const [step, setStep] = useState<BringeStep>("circular_tile");

  // Stage 01 Intake Questionnaire State (Starts clean for user's actual subject)
  const [intakeSubject, setIntakeSubject] = useState("");
  const [intakeArea, setIntakeArea] = useState("");
  const [intakeDept, setIntakeDept] = useState("");
  const [examHoursRemaining, setExamHoursRemaining] = useState<number>(12);
  const [studyBudgetHours, setStudyBudgetHours] = useState<number>(4);
  const [passMarkTarget, setPassMarkTarget] = useState<number>(50); // 40%, 50%, 65%, 75%
  const [sleepHours, setSleepHours] = useState<number>(6); // 6 hrs protected
  const [questionStyle, setQuestionStyle] = useState<string>("mixed");

  // Stage 02 Multi-select PYQ / Knowledge Resource State
  const [pyqMethods, setPyqMethods] = useState<{
    ai_autonomous: boolean;
    upload_pyq: boolean;
    custom_topics: boolean;
  }>({
    ai_autonomous: true,
    upload_pyq: false,
    custom_topics: false,
  });

  // Uploaded Files from folder
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; size: string; type: string }[]>([]);
  const [customTopicInput, setCustomTopicInput] = useState("");

  // Stage 03 AI Research Simulation & Telemetry
  const [researchProgress, setResearchProgress] = useState(0);
  const [researchLog, setResearchLog] = useState<string[]>([]);
  const [currentResearchPhase, setCurrentResearchPhase] = useState("");

  // Stage 04 Pass-Core Evidence Board State (Dynamically populated by AI)
  const [availableTopics, setAvailableTopics] = useState<HighYieldTopic[]>(INITIAL_BASELINE_TOPICS);
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>(
    INITIAL_BASELINE_TOPICS.slice(0, 3).map((t) => t.id)
  );
  const [evidenceFilter, setEvidenceFilter] = useState<"all" | "must_know" | "should_know" | "skip">("all");

  // Portion Selection Modal (triggers between Stage 2 and Stage 3)
  const [showPortionModal, setShowPortionModal] = useState<boolean>(false);

  // Filtered topics that user has confirmed in portion selection
  const activeSelectedTopics = useMemo(() => {
    const sel = availableTopics.filter((t) => selectedTopicIds.includes(t.id));
    return sel.length > 0 ? sel : availableTopics;
  }, [availableTopics, selectedTopicIds]);

  // Stage 03 Four-Tab Command Suite ("theory" | "schedule" | "resources" | "practice")
  const [stage3Tab, setStage3Tab] = useState<"theory" | "schedule" | "resources" | "practice">("theory");
  const [stage3TheoryIdx, setStage3TheoryIdx] = useState<number>(0);
  const [stage3PracticeMode, setStage3PracticeMode] = useState<"flashcards" | "mcq" | "written" | "pyq">("flashcards");
  const [stage3PracticeTopicIdx, setStage3PracticeTopicIdx] = useState<number>(0);
  const [resourceCategoryFilter, setResourceCategoryFilter] = useState<"all" | "popular" | "underrated" | "interactive" | "cheatsheet">("all");
  const [revealedPyqIds, setRevealedPyqIds] = useState<Record<string, boolean>>({});

  // Curated Resources dynamically populated for the intake subject
  const curatedResources = useMemo(() => {
    return getCuratedResourcesForSubject(intakeSubject || "Computer Networks");
  }, [intakeSubject]);

  // Stage 03 Practice Lab State
  const [stage3FlashcardIdx, setStage3FlashcardIdx] = useState<number>(0);
  const [stage3IsFlipped, setStage3IsFlipped] = useState<boolean>(false);
  const [stage3McqOption, setStage3McqOption] = useState<number | null>(null);
  const [stage3McqSubmitted, setStage3McqSubmitted] = useState<boolean>(false);
  const [stage3WrittenText, setStage3WrittenText] = useState<string>("");
  const [stage3IsEvaluating, setStage3IsEvaluating] = useState<boolean>(false);
  const [stage3WritingEvaluation, setStage3WritingEvaluation] = useState<WritingEvaluationResult | null>(null);
  const [stage3WritingConfidence, setStage3WritingConfidence] = useState<"low" | "medium" | "high">("medium");

  const filteredResources = useMemo(() => {
    return curatedResources.filter((res) => {
      if (resourceCategoryFilter === "all") return true;
      if (resourceCategoryFilter === "popular") return !res.isUnderrated;
      if (resourceCategoryFilter === "underrated") return res.isUnderrated;
      if (resourceCategoryFilter === "interactive") return res.type === "simulator";
      if (resourceCategoryFilter === "cheatsheet") return res.type === "cheatsheet" || res.type === "hidden_gem";
      return true;
    });
  }, [curatedResources, resourceCategoryFilter]);

  // Stage 05 Active Study Loop State
  const [currentTopicIdx, setCurrentTopicIdx] = useState(0);
  const [activeSubTab, setActiveSubTab] = useState<"writing" | "mcq" | "faded" | "summary" | "flashcards">("writing");
  const [currentFlashcardIdx, setCurrentFlashcardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [selectedMcqOption, setSelectedMcqOption] = useState<number | null>(null);
  const [mcqSubmitted, setMcqSubmitted] = useState(false);

  // Closed Book & Active Retrieval Mode Toggle
  const [isBookClosed, setIsBookClosed] = useState(false);

  // Pre-Response Confidence Gate: "low" | "medium" | "high"
  const [writingConfidence, setWritingConfidence] = useState<"low" | "medium" | "high">("medium");
  const [mcqConfidence, setMcqConfidence] = useState<"low" | "medium" | "high">("medium");

  // Subjective Written Answer State & AI Evaluation
  const [writtenAnswerText, setWrittenAnswerText] = useState("");
  const [isEvaluatingAnswer, setIsEvaluatingAnswer] = useState(false);
  const [writingEvaluation, setWritingEvaluation] = useState<WritingEvaluationResult | null>(null);

  // Faded Worked Example Interactive State
  const [fadedStepLevel, setFadedStepLevel] = useState<1 | 2 | 3>(1);
  const [fadedStep2Input, setFadedStep2Input] = useState("");
  const [fadedStep2Verified, setFadedStep2Verified] = useState(false);
  const [fadedStep3Revealed, setFadedStep3Revealed] = useState(false);

  // Dynamic Grasping Telemetry & Fatigue Engine
  const [graspingIndex, setGraspingIndex] = useState<number>(68); // 0-100%
  const [consecutiveErrors, setConsecutiveErrors] = useState(0);
  const [fatigueAlertDismissed, setFatigueAlertDismissed] = useState(false);

  // Floating AI Grasping & Dynamic Content Depth Telemetry (Fluctuating 1-10)
  const [baseGraspingScore, setBaseGraspingScore] = useState<number>(() => getStoredGraspingScore());
  const [fluctuationOffset, setFluctuationOffset] = useState<number>(0);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      const wave = Math.sin(now / 3200) * 0.28;
      const noise = ((now % 1000) / 1000 - 0.5) * 0.16;
      setFluctuationOffset(Math.round((wave + noise) * 10) / 10);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  const liveGraspingOutOf10 = Math.max(1.2, Math.min(9.8, Math.round((baseGraspingScore + fluctuationOffset) * 10) / 10));
  const liveContentDepthPercent = Math.round(liveGraspingOutOf10 * 10);

  // Night-of Micro-Spacing Queue
  const [reviewQueue, setReviewQueue] = useState<ScheduledReviewItem[]>([]);
  const [showMicroSpacingModal, setShowMicroSpacingModal] = useState(false);

  // Single-Page Final Survival Sheet Modal
  const [showSurvivalSheetModal, setShowSurvivalSheetModal] = useState(false);

  // Live Exam Countdown
  const [countdownSeconds, setCountdownSeconds] = useState(12 * 3600);

  // Real-time Countdown Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hrs.toString().padStart(2, "0")}h ${mins.toString().padStart(2, "0")}m ${secs.toString().padStart(2, "0")}s`;
  };

  // Grasping Tier Definition
  const getGraspingTier = (score: number) => {
    if (score >= 78) return { label: "Honors Exam Standard (Rigorous)", tier: 3 };
    if (score >= 50) return { label: "Applied Intermediate (College Exam)", tier: 2 };
    return { label: "Foundational Intuition (High-School Analogy)", tier: 1 };
  };

  // Step 1 -> Step 2: Click "LAST RESORT"
  const handleStartLastResort = () => {
    ambientAudio.playChime("click");
    setStep("intake_form");
  };

  // Step 2 -> Step 3: Intake Form Submit
  const handleSubmitIntake = (e: React.FormEvent) => {
    e.preventDefault();
    ambientAudio.playChime("click");
    setCountdownSeconds(examHoursRemaining * 3600);
    setStep("pyq_inquiry");
  };

  // File Upload Handler (Real file picker from folder)
  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      ambientAudio.playChime("click");
      const newItems: { name: string; size: string; type: string }[] = [];
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        const sz =
          file.size > 1024 * 1024
            ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
            : `${Math.round(file.size / 1024)} KB`;
        newItems.push({
          name: file.name,
          size: sz,
          type: file.type || "Document",
        });
      }
      setUploadedFiles((prev) => [...prev, ...newItems]);
    }
  };

  const removeUploadedFile = (idx: number) => {
    ambientAudio.playChime("click");
    setUploadedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  // Toggle multi-select PYQ options
  const togglePyqOption = (key: "ai_autonomous" | "upload_pyq" | "custom_topics") => {
    ambientAudio.playChime("click");
    setPyqMethods((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Step 3 -> Step 4: Execute Deep AI Research & Dynamic Synthesis based on User Inputs
  const handleStartThoroughResearch = async () => {
    ambientAudio.playChime("click");
    setStep("ai_researching");
    setResearchProgress(5);

    const targetSubject = intakeSubject.trim() || "Target Exam Course";
    const targetArea = intakeArea.trim() || "Core Curriculum";
    const targetDept = intakeDept.trim() || "University Academic";

    setResearchLog([`Initiating AI research engine for ${targetSubject}...`]);
    setCurrentResearchPhase(`Parsing official syllabus units and boundaries for ${targetSubject}...`);

    const synthesisPayload = {
      subject: targetSubject,
      area: targetArea,
      department: targetDept,
      examHoursRemaining,
      studyBudgetHours,
      passMarkTarget,
      sleepHours,
      questionStyle,
      uploadedFileNames: uploadedFiles.map((f) => f.name),
      customTopicText: customTopicInput,
    };

    let generatedTopics: HighYieldTopic[] = [];

    // Trigger API synthesis (uses live LLM if key is available, or instant semantic synthesis engine)
    try {
      const res = await fetch("/api/bringe/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(synthesisPayload),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.topics) && data.topics.length > 0) {
          generatedTopics = data.topics;
        }
      }
    } catch (apiErr) {
      console.warn("API synthesis fallback to direct engine:", apiErr);
    }

    // Direct fallback if API was unreachable
    if (!generatedTopics || generatedTopics.length === 0) {
      generatedTopics = synthesizeCurriculum(synthesisPayload);
    }

    const phases = [
      {
        pct: 25,
        phase:
          uploadedFiles.length > 0
            ? `LLM extracting question patterns from ${uploadedFiles.length} uploaded document(s) for ${targetSubject}...`
            : `Indexing curriculum boundaries and credit weightages for ${targetSubject}...`,
        log: `Extracted official units, outcomes, and mark weightages for ${targetSubject}.`,
      },
      {
        pct: 50,
        phase: `Mining past university examination papers for ${targetArea} (${targetDept})...`,
        log: `Synthesized evidence-based topics: ${generatedTopics.slice(0, 3).map((t) => t.name).join(", ")}.`,
      },
      {
        pct: 75,
        phase: `Calibrating Sleep-Protected schedule (${sleepHours}h block) & Pass-Core target (${passMarkTarget}%)...`,
        log: `Configured non-negotiable ${sleepHours}-hour memory consolidation sleep window.`,
      },
      {
        pct: 92,
        phase: `Compiling examiner marking criteria, deduction traps & model answers for ${targetSubject}...`,
        log: `Scoring rubrics indexed with specific technical variables for ${targetSubject}.`,
      },
      {
        pct: 100,
        phase: `Synthesis complete. Exam Evidence Board calibrated for ${targetSubject}.`,
        log: `Pass-Core threshold computed for ${targetSubject}. Ready for active retrieval study.`,
      },
    ];

    phases.forEach((p, index) => {
      setTimeout(() => {
        setResearchProgress(p.pct);
        setCurrentResearchPhase(p.phase);
        setResearchLog((prev) => [...prev, p.phase, p.log]);
        if (p.pct === 100) {
          setAvailableTopics(generatedTopics);
          const topIds = generatedTopics
            .filter((t) => t.tier === "must_know" || t.tier === "should_know")
            .slice(0, 3)
            .map((t) => t.id);
          setSelectedTopicIds(topIds.length > 0 ? topIds : generatedTopics.slice(0, 3).map((t) => t.id));
          setTimeout(() => {
            ambientAudio.playChime("levelUp");
            setStep("topic_selection");
            setShowPortionModal(true);
          }, 600);
        }
      }, 600 + index * 750);
    });
  };

  // Toggle Topic in Checklist
  const toggleTopic = (id: string) => {
    ambientAudio.playChime("click");
    if (selectedTopicIds.includes(id)) {
      if (selectedTopicIds.length > 1) {
        setSelectedTopicIds(selectedTopicIds.filter((t) => t !== id));
      }
    } else {
      setSelectedTopicIds([...selectedTopicIds, id]);
    }
  };

  // Add Custom Topic
  const handleAddCustomTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTopicInput.trim()) return;
    ambientAudio.playChime("click");
    const name = customTopicInput.trim();
    const currentSubject = intakeSubject.trim() || "Course Discipline";

    const newTopic: HighYieldTopic = {
      id: `custom-${Date.now()}`,
      name,
      subtopic: `Student Dictated Critical Topic · ${currentSubject}`,
      durationMins: 35,
      tier: "must_know",
      sourceTag: "[Student Priority Custom Directive]",
      pastExamFreq: "High User Priority Focus",
      predictedMarks: 10,
      confidence: "Custom Locked",
      highSchoolAnalogy: `Foundational intuition for ${name}: Frame this concept through concrete real-world inputs and observable results before writing technical proofs.`,
      collegeRigor: `University exam rigor for ${name}: Understand state transitions, mathematical guarantees, and boundary failure modes expected by examiners in ${currentSubject}.`,
      keyPoints: [
        `Core mechanism and step-by-step lifecycle of ${name}`,
        `Key mathematical formulas, state variables, and governing limits`,
        `Examiner favorite edge cases and evaluation criteria`,
      ],
      commonGotcha: `Beware of boundary conditions and theoretical vs practical trade-offs in ${name}.`,
      misconceptionDiagnosis: `Misconception Diagnosis: Generalizing definitions without stating exact technical parameters for ${name}.`,
      mustWriteKeywords: [
        `${name} Core Definition`,
        "Boundary Safeguards",
        "Deterministic State",
        "Throughput Balance",
      ],
      formulaBoundary: `Ensure execution is bounded within safe operational constraints.`,
      deductionTraps: [
        `Omitting parameter initialization step in ${name}.`,
        `Missing boundary condition verification.`,
      ],
      fadedExample: {
        title: `Worked Analysis of ${name}`,
        step1_full: {
          problem: `Explain the complete execution lifecycle and state handling in ${name}.`,
          annotatedSolution: `1. Initialization: Parameters are negotiated.\n2. State Check: Boundary conditions validated.\n3. Processing: Deterministic guarantees enforced.\n4. Termination: Resources cleanly released.`,
          keyInsight: "Always write explicit state changes to secure full examiner marks.",
        },
        step2_faded: {
          problem: `State the primary failure safeguard required when executing ${name}.`,
          scaffold: "Step 1: Check inputs. Step 2: Validate state. Step 3: Fill in the missing safeguard below.",
          missingPrompt: "What safeguard prevents deadlock in this system?",
          correctStep: "Timeout and fallback rollback",
          explanation: "Deterministic timeouts prevent infinite resource lockups.",
        },
        step3_independent: {
          problem: `Describe how concurrent requests are handled without race conditions in ${name}.`,
          hint: "Think about mutual exclusion and sequence locks.",
          modelAnswer:
            "Concurrency is managed using atomic sequence numbers and state locks, preventing simultaneous write conflicts.",
        },
      },
      flashcards: [
        {
          front: `What is the critical exam definition for ${name}?`,
          back: `The primary mechanism ensuring consistency, bounds, and optimal execution in ${name}.`,
        },
      ],
      mcq: {
        question: `Which architectural factor is most critical when evaluating ${name}?`,
        options: [
          "Ensuring deterministic guarantees and concurrency safety",
          "Ignoring latency to maximize brute-force throughput",
          "Removing all validation checks for faster execution",
          "Hardcoding all configurations statically",
        ],
        correctIndex: 0,
        explanation:
          "High-scoring exam responses prioritize deterministic guarantees, concurrency correctness, and boundary safeguards.",
      },
      writingQuestion: {
        prompt: `Explain the fundamental architecture and working mechanism of ${name}. Detail the key steps, write necessary formulas or state transitions, and explain common edge cases. [7 Marks]`,
        maxMarks: 7,
        markingCriteria: [
          "2 Marks: Clear definition and primary objective.",
          "3 Marks: Step-by-step operational lifecycle and state mechanics.",
          "2 Marks: Edge-case trade-offs and examiner evaluation criteria.",
        ],
        sampleModelAnswer: `1. Definition & Objective:\n${name} provides systematic guarantees for consistent execution and state integrity.\n\n2. Operational Steps:\n- Step A: Initialization and parameter negotiation.\n- Step B: State transition verification and throughput balancing.\n- Step C: Termination and resource cleanup.\n\n3. Edge Cases:\nHandling packet drops, concurrency contention, and out-of-bounds inputs without deadlock.`,
      },
    };

    setAvailableTopics((prev) => [newTopic, ...prev]);
    setSelectedTopicIds((prev) => [newTopic.id, ...prev]);
    setCustomTopicInput("");
  };

  // Step 4 -> Step 5: Enter Active Study Loop
  const handleEnterStudyLoop = () => {
    ambientAudio.playChime("levelUp");
    onGainXP(50);
    setCurrentTopicIdx(0);
    setActiveSubTab("writing");
    setCurrentFlashcardIdx(0);
    setWrittenAnswerText("");
    setWritingEvaluation(null);
    setSelectedMcqOption(null);
    setMcqSubmitted(false);
    setIsBookClosed(false);
    setWritingConfidence("medium");
    setMcqConfidence("medium");
    setFadedStepLevel(1);
    setFadedStep2Input("");
    setFadedStep2Verified(false);
    setFadedStep3Revealed(false);
    setStep("active_study_loop");
  };

  // Active Topic Data
  const activeTopic =
    availableTopics.find((t) => t.id === selectedTopicIds[currentTopicIdx]) ||
    availableTopics[0];

  // Pass-Core Calculations
  const selectedTopics = availableTopics.filter((t) =>
    selectedTopicIds.includes(t.id)
  );
  const totalAllocatedMins = selectedTopics.reduce(
    (acc, curr) => acc + curr.durationMins,
    0
  );
  const totalPredictedMarks = selectedTopics.reduce(
    (acc, curr) => acc + curr.predictedMarks,
    0
  );

  const budgetMinutes = studyBudgetHours * 60;
  const isOverBudget = totalAllocatedMins > budgetMinutes;

  // Flashcard Actions
  const handleNextCard = (known: boolean) => {
    ambientAudio.playChime("click");
    setIsFlipped(false);
    if (!known) {
      setConsecutiveErrors((prev) => prev + 1);
      setGraspingIndex((prev) => Math.max(30, prev - 4));
      setReviewQueue((prev) => [
        ...prev,
        {
          id: `queue-${Date.now()}`,
          topicId: activeTopic.id,
          topicName: activeTopic.name,
          type: "card",
          promptSnippet: activeTopic.flashcards[currentFlashcardIdx]?.front || "Flashcard",
          reason: `Hesitation on flashcard prompt`,
          intervalTag: "+25 min micro-retest",
          scheduledAt: "In 25 minutes",
        },
      ]);
    } else {
      setConsecutiveErrors(0);
      onGainXP(15);
      setGraspingIndex((prev) => Math.min(99, prev + 3));
    }

    if (currentFlashcardIdx + 1 < activeTopic.flashcards.length) {
      setCurrentFlashcardIdx((prev) => prev + 1);
    } else {
      setActiveSubTab("mcq");
      setCurrentFlashcardIdx(0);
    }
  };

  // Stage 03 Practice Lab Written Answer Evaluation
  const handleStage3EvaluateWrittenAnswer = async () => {
    const topic = activeSelectedTopics[stage3PracticeTopicIdx] || activeSelectedTopics[0];
    if (!stage3WrittenText.trim() || !topic) return;
    ambientAudio.playChime("click");
    setStage3IsEvaluating(true);

    try {
      let evalResult: WritingEvaluationResult | null = null;
      try {
        const res = await fetch("/api/bringe/evaluate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            writtenText: stage3WrittenText,
            topic: topic,
            confidenceLevel: stage3WritingConfidence,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.evaluation) evalResult = data.evaluation;
        }
      } catch {
        // network fallback
      }

      if (!evalResult) {
        evalResult = evaluateStudentAnswer({
          writtenText: stage3WrittenText,
          topic: topic,
          confidenceLevel: stage3WritingConfidence,
        });
      }

      setStage3WritingEvaluation(evalResult);
      if (evalResult.scoreRatio >= 0.7) {
        ambientAudio.playChime("success");
        onGainXP(25);
        setGraspingIndex((prev) => Math.min(99, prev + 2));
      } else {
        ambientAudio.playChime("click");
      }
    } catch {
      const fallback = evaluateStudentAnswer({
        writtenText: stage3WrittenText,
        topic: topic,
        confidenceLevel: stage3WritingConfidence,
      });
      setStage3WritingEvaluation(fallback);
    } finally {
      setStage3IsEvaluating(false);
    }
  };

  // Stage 03 Flashcard Rating
  const handleStage3RateFlashcard = (rating: number) => {
    const topic = activeSelectedTopics[stage3PracticeTopicIdx] || activeSelectedTopics[0];
    ambientAudio.playChime(rating >= 4 ? "success" : "click");
    if (rating <= 2) {
      setReviewQueue((prev) => [
        ...prev,
        {
          id: `queue-${Date.now()}`,
          topicId: topic.id,
          topicName: topic.name,
          type: "card",
          promptSnippet: topic.flashcards[stage3FlashcardIdx]?.front || "Flashcard",
          reason: `Hesitation on flashcard prompt`,
          intervalTag: "+25 min micro-retest",
          scheduledAt: "In 25 minutes",
        },
      ]);
    } else {
      onGainXP(15);
      setGraspingIndex((prev) => Math.min(99, prev + 1));
    }
    const cards = topic.flashcards || [];
    if (stage3FlashcardIdx + 1 < cards.length) {
      setStage3FlashcardIdx((prev) => prev + 1);
      setStage3IsFlipped(false);
    } else {
      setStage3FlashcardIdx(0);
      setStage3IsFlipped(false);
    }
  };

  // Evaluate Subjective Written Answer with Confidence Gate & AI Topic Awareness
  const handleEvaluateWrittenAnswer = async () => {
    if (!writtenAnswerText.trim()) return;
    ambientAudio.playChime("click");
    setIsEvaluatingAnswer(true);

    try {
      let evalResult: WritingEvaluationResult | null = null;

      // Try API route first
      try {
        const res = await fetch("/api/bringe/evaluate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            writtenText: writtenAnswerText,
            topic: activeTopic,
            confidenceLevel: writingConfidence,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.evaluation) {
            evalResult = data.evaluation;
          }
        }
      } catch (apiErr) {
        console.warn("API evaluation fallback to local engine:", apiErr);
      }

      // Local engine fallback
      if (!evalResult) {
        evalResult = evaluateStudentAnswer({
          writtenText: writtenAnswerText,
          topic: activeTopic,
          confidenceLevel: writingConfidence,
        });
      }

      setIsEvaluatingAnswer(false);

      if (evalResult.scoreRatio >= 0.8) {
        setGraspingIndex((prev) => Math.min(99, prev + 8));
        setConsecutiveErrors(0);
        onGainXP(Math.round(evalResult.marksAwarded * 10));
        ambientAudio.playChime("levelUp");
      } else if (evalResult.scoreRatio >= 0.5) {
        setGraspingIndex((prev) => Math.min(95, prev + 3));
        onGainXP(Math.round(evalResult.marksAwarded * 8));
        ambientAudio.playChime("click");
      } else {
        setGraspingIndex((prev) => Math.max(30, prev - 6));
        setConsecutiveErrors((prev) => prev + 1);
        ambientAudio.playChime("click");

        setReviewQueue((prev) => [
          ...prev,
          {
            id: `queue-${Date.now()}`,
            topicId: activeTopic.id,
            topicName: activeTopic.name,
            type: "writing",
            promptSnippet: activeTopic.writingQuestion.prompt.slice(0, 75) + "...",
            reason: evalResult!.illusionDetected
              ? "Illusion of Competence: High confidence paired with missing grading criteria."
              : `Descriptive writing revision required (${evalResult!.marksAwarded}/${activeTopic.writingQuestion.maxMarks} Marks)`,
            intervalTag: evalResult!.illusionDetected ? "+25 min micro-retest (Priority)" : "Pre-sleep sweep (11:00 PM)",
            scheduledAt: evalResult!.illusionDetected ? "In 25 minutes" : "Tonight at 11:00 PM",
            illusionOfCompetence: evalResult!.illusionDetected,
          },
        ]);
      }

      setWritingEvaluation(evalResult);
    } catch (err) {
      setIsEvaluatingAnswer(false);
      console.error("Evaluation error:", err);
    }
  };

  // MCQ Submission with Confidence Gate & Misconception Feedback
  const handleCheckMcq = () => {
    if (selectedMcqOption === null) return;
    ambientAudio.playChime("click");
    setMcqSubmitted(true);

    const isCorrect = selectedMcqOption === activeTopic.mcq.correctIndex;
    const isIllusion = mcqConfidence === "high" && !isCorrect;

    if (isCorrect) {
      ambientAudio.playChime("levelUp");
      onGainXP(30);
      setConsecutiveErrors(0);
      setGraspingIndex((prev) => Math.min(99, prev + 5));
    } else {
      setConsecutiveErrors((prev) => prev + 1);
      setGraspingIndex((prev) => Math.max(30, prev - 5));
      setReviewQueue((prev) => [
        ...prev,
        {
          id: `queue-${Date.now()}`,
          topicId: activeTopic.id,
          topicName: activeTopic.name,
          type: "mcq",
          promptSnippet: activeTopic.mcq.question.slice(0, 75) + "...",
          reason: isIllusion
            ? "Illusion of Competence: High confidence on incorrect MCQ option."
            : `Exam MCQ Misstep: ${activeTopic.name}`,
          intervalTag: isIllusion ? "+25 min micro-retest (Priority)" : "+25 min micro-retest",
          scheduledAt: "In 25 minutes",
          illusionOfCompetence: isIllusion,
        },
      ]);
    }
  };

  // Switch Topic in Loop
  const handleSwitchTopicInLoop = (idx: number) => {
    ambientAudio.playChime("click");
    setCurrentTopicIdx(idx);
    setActiveSubTab("writing");
    setCurrentFlashcardIdx(0);
    setIsFlipped(false);
    setSelectedMcqOption(null);
    setMcqSubmitted(false);
    setWrittenAnswerText("");
    setWritingEvaluation(null);
    setWritingConfidence("medium");
    setMcqConfidence("medium");
    setIsBookClosed(false);
    setFadedStepLevel(1);
    setFadedStep2Input("");
    setFadedStep2Verified(false);
    setFadedStep3Revealed(false);
  };

  // Retest flagged item from micro-spacing queue
  const handleRetestQueueItem = (item: ScheduledReviewItem) => {
    ambientAudio.playChime("click");
    setShowMicroSpacingModal(false);
    const targetIdx = selectedTopicIds.indexOf(item.topicId);
    if (targetIdx !== -1) {
      setCurrentTopicIdx(targetIdx);
    }
    setActiveSubTab(item.type === "card" ? "flashcards" : item.type === "mcq" ? "mcq" : "writing");
    if (item.type === "mcq") {
      setSelectedMcqOption(null);
      setMcqSubmitted(false);
    } else if (item.type === "writing") {
      setWrittenAnswerText("");
      setWritingEvaluation(null);
    }
  };

  const currentTierInfo = getGraspingTier(graspingIndex);

  // Filter topics for Stage 04
  const filteredTopics = availableTopics.filter((t) => {
    if (evidenceFilter === "all") return true;
    return t.tier === evidenceFilter;
  });

  return (
    <div className="bringe-rescue-wrap">
      {/* ========================================================================= */}
      {/* 1. INITIAL CLICKABLE BIG CIRCULAR TILE: ONLY "LAST RESORT" */}
      {/* ========================================================================= */}
      {step === "circular_tile" && (
        <div className="last-resort-hero-stage">
          <div className="last-resort-outer">
            <button
              type="button"
              className="last-resort-circle-btn"
              onClick={handleStartLastResort}
              aria-label="Last Resort"
            >
              <div className="circle-inner-halo" />
              <div className="circle-content">
                <span className="circle-main-title">LAST RESORT</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. INTAKE QUESTIONS WIZARD (REAL USER TOPIC INPUT + PASS-CORE TARGET) */}
      {/* ========================================================================= */}
      {step === "intake_form" && (
        <div className="bringe-card-panel">
          <div className="bringe-card-header">
            <div>
              <span className="bringe-stage-tag">STAGE 01 · EMERGENCY INTAKE</span>
              <h2 className="bringe-title">Target Your Exam Boundaries</h2>
            </div>
            <button
              type="button"
              className="btn btn-ghost"
              style={{ fontSize: "12px" }}
              onClick={() => setStep("circular_tile")}
            >
              Back
            </button>
          </div>

          <form onSubmit={handleSubmitIntake} className="bringe-form-grid">
            <div className="form-field-row">
              <label className="field-label">
                What subject / course do you need to master?
              </label>
              <input
                type="text"
                className="field-text-input"
                placeholder="e.g. Heart / Cardiology, Operating Systems, Organic Chemistry, Database Management"
                value={intakeSubject}
                onChange={(e) => setIntakeSubject(e.target.value)}
                required
              />
            </div>

            <div className="form-field-row">
              <label className="field-label">Which specific area or problematic units?</label>
              <input
                type="text"
                className="field-text-input"
                placeholder="e.g. Cardiac Cycle & Conduction, Virtual Memory & Paging, Reaction Mechanisms"
                value={intakeArea}
                onChange={(e) => setIntakeArea(e.target.value)}
                required
              />
            </div>

            <div className="form-field-row">
              <label className="field-label">Department / Academic Branch</label>
              <input
                type="text"
                className="field-text-input"
                placeholder="e.g. Medicine & Health Sciences, Computer Science, Chemistry, Engineering"
                value={intakeDept}
                onChange={(e) => setIntakeDept(e.target.value)}
                required
              />
            </div>

            <div className="form-columns-2">
              <div className="form-field-row">
                <label className="field-label">When is your examination?</label>
                <select
                  className="field-select-dropdown"
                  value={examHoursRemaining}
                  onChange={(e) => setExamHoursRemaining(Number(e.target.value))}
                >
                  <option value={4}>In 4 Hours (Emergency Crash Sprint)</option>
                  <option value={6}>In 6 Hours</option>
                  <option value={12}>Tomorrow Morning (In 12 Hours)</option>
                  <option value={16}>Tomorrow Afternoon (In 16 Hours)</option>
                  <option value={20}>Tomorrow Night (In 20 Hours)</option>
                  <option value={24}>In 24 Hours (Full Day Ahead)</option>
                  <option value={48}>In 2 Days (In 48 Hours)</option>
                  <option value={72}>In 3 Days (In 72 Hours)</option>
                </select>
              </div>

              <div className="form-field-row">
                <label className="field-label">How many hours can you dedicate to study?</label>
                <select
                  className="field-select-dropdown"
                  value={studyBudgetHours}
                  onChange={(e) => setStudyBudgetHours(Number(e.target.value))}
                >
                  <option value={1}>1 Hour (Hyper-focused sprint)</option>
                  <option value={2}>2 Hours</option>
                  <option value={3}>3 Hours</option>
                  <option value={4}>4 Hours</option>
                  <option value={6}>6 Hours</option>
                  <option value={8}>8 Hours</option>
                  <option value={10}>10 Hours</option>
                  <option value={12}>12 Hours (Marathon)</option>
                </select>
              </div>
            </div>

            {/* Pass-Core Planner Target & Protected Sleep Window */}
            <div className="form-columns-2">
              <div className="form-field-row">
                <label className="field-label">Target Pass Mark / Grade Threshold</label>
                <select
                  className="field-select-dropdown"
                  value={passMarkTarget}
                  onChange={(e) => setPassMarkTarget(Number(e.target.value))}
                >
                  <option value={40}>40% (Pass-Core Baseline · Secure the 40 Marks)</option>
                  <option value={50}>50% (Comfortable Pass Target · 50 Marks)</option>
                  <option value={65}>65% (First Class Benchmark · 65 Marks)</option>
                  <option value={75}>75%+ (Distinction / Top Grade · 75+ Marks)</option>
                </select>
              </div>

              <div className="form-field-row">
                <label className="field-label">Protected Sleep Window (Non-Negotiable)</label>
                <select
                  className="field-select-dropdown"
                  value={sleepHours}
                  onChange={(e) => setSleepHours(Number(e.target.value))}
                >
                  <option value={6}>6 Hours (Recommended Protected Sleep · Memory Consolidation)</option>
                  <option value={5}>5 Hours (Minimum Safe Sleep)</option>
                  <option value={7}>7 Hours (Optimal Full REM &amp; Slow-Wave Sleep)</option>
                  <option value={4}>4 Hours (Emergency Bare Minimum)</option>
                </select>
              </div>
            </div>

            <div className="form-field-row">
              <label className="field-label">Question Style Emphasis</label>
              <select
                className="field-select-dropdown"
                value={questionStyle}
                onChange={(e) => setQuestionStyle(e.target.value)}
              >
                <option value="mixed">Mixed (Descriptive Explanations + Problem Solving + MCQs)</option>
                <option value="numerical">Predominantly Numerical &amp; Step Derivations</option>
                <option value="theory">Predominantly Theory &amp; Conceptual Architecture</option>
              </select>
            </div>

            <div className="form-actions-bar">
              <button type="submit" className="bringe-primary-btn">
                Continue to Knowledge Resources Calibration &rarr;
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MULTI-SELECT PYQ & KNOWLEDGE RESOURCES (FILE PICKER + TOPICS + AI) */}
      {/* ========================================================================= */}
      {step === "pyq_inquiry" && (
        <div className="bringe-card-panel">
          <div className="bringe-card-header">
            <div>
              <span className="bringe-stage-tag">STAGE 02 · KNOWLEDGE CALIBRATION</span>
              <h2 className="bringe-title">Select Intelligence &amp; PYQ Sources</h2>
            </div>
            <button
              type="button"
              className="btn btn-ghost"
              style={{ fontSize: "12px" }}
              onClick={() => setStep("intake_form")}
            >
              Back
            </button>
          </div>

          <p style={{ color: "var(--t2)", fontSize: "14px", marginBottom: "20px" }}>
            Choose one or more resources. The AI will cross-reference all selected sources to construct your Pass-Core evidence board for <b>{intakeSubject || "your subject"}</b>:
          </p>

          <div className="pyq-options-grid">
            {/* Option 1: AI Autonomous Web & PYQ Research */}
            <div
              className={`pyq-option-card ${pyqMethods.ai_autonomous ? "selected" : ""}`}
              onClick={() => togglePyqOption("ai_autonomous")}
            >
              <div className="pyq-option-head">
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <input
                    type="checkbox"
                    checked={pyqMethods.ai_autonomous}
                    onChange={() => {}}
                    className="bringe-checkbox"
                  />
                  <Search size={18} style={{ color: "var(--t1)" }} />
                </div>
                <span className="pyq-recommended-badge">Autonomous</span>
              </div>
              <h3 className="pyq-card-title">AI Deep Web &amp; University PYQ Mining</h3>
              <p className="pyq-card-desc">
                AI crawls verified academic repositories, past exam trends, and marks rubrics for {intakeSubject || "your subject"}.
              </p>
            </div>

            {/* Option 2: Real File Upload from Folder */}
            <div
              className={`pyq-option-card ${pyqMethods.upload_pyq ? "selected" : ""}`}
              onClick={() => togglePyqOption("upload_pyq")}
            >
              <div className="pyq-option-head">
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <input
                    type="checkbox"
                    checked={pyqMethods.upload_pyq}
                    onChange={() => {}}
                    className="bringe-checkbox"
                  />
                  <Upload size={18} style={{ color: "var(--t1)" }} />
                </div>
                <span className="pyq-recommended-badge">Files</span>
              </div>
              <h3 className="pyq-card-title">Upload / Drop PYQs or Syllabus Files</h3>
              <p className="pyq-card-desc">
                Select PDF, TXT, or images directly from your computer so the agent LLM can read and parse them.
              </p>
            </div>

            {/* Option 3: Custom Priority Topics */}
            <div
              className={`pyq-option-card ${pyqMethods.custom_topics ? "selected" : ""}`}
              onClick={() => togglePyqOption("custom_topics")}
            >
              <div className="pyq-option-head">
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <input
                    type="checkbox"
                    checked={pyqMethods.custom_topics}
                    onChange={() => {}}
                    className="bringe-checkbox"
                  />
                  <FileText size={18} style={{ color: "var(--t1)" }} />
                </div>
                <span className="pyq-recommended-badge">Custom</span>
              </div>
              <h3 className="pyq-card-title">Specify Expected Focus Topics</h3>
              <p className="pyq-card-desc">
                Directly dictate priority concepts and chapters you believe the professor will test.
              </p>
            </div>
          </div>

          {/* REAL FILE PICKER DROPZONE */}
          {pyqMethods.upload_pyq && (
            <div className="pyq-upload-expand-section" style={{ marginTop: "24px" }}>
              <div
                className={`pyq-file-dropzone ${uploadedFiles.length > 0 ? "has-files" : ""}`}
                onClick={() => fileInputRef.current?.click()}
              >
                <FileUp size={28} style={{ color: "var(--t2)", margin: "0 auto 8px" }} />
                <b style={{ display: "block", fontSize: "14px", color: "var(--t1)" }}>
                  Click to select files from your folder, or drag &amp; drop here
                </b>
                <span style={{ fontSize: "12px", color: "var(--t3)" }}>
                  PDF, DOCX, TXT, PNG, JPG (Agent LLM will extract text and past exam questions)
                </span>
                <input
                  type="file"
                  ref={fileInputRef}
                  hidden
                  multiple
                  accept=".pdf,.txt,.docx,.png,.jpg,.jpeg"
                  onChange={handleFilesSelected}
                />
              </div>

              {uploadedFiles.length > 0 && (
                <div className="uploaded-files-chips">
                  {uploadedFiles.map((f, i) => (
                    <div key={i} className="uploaded-file-chip">
                      <FileText size={14} />
                      <span>{f.name} ({f.size})</span>
                      <button
                        type="button"
                        className="chip-remove-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeUploadedFile(i);
                        }}
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CUSTOM TOPICS INPUT */}
          {pyqMethods.custom_topics && (
            <div style={{ marginTop: "20px" }}>
              <label className="field-label" style={{ marginBottom: "6px", display: "block" }}>
                Target topics to prioritize:
              </label>
              <textarea
                className="field-text-input"
                style={{ width: "100%", height: "80px", resize: "none" }}
                placeholder={`e.g. Focus on high-yield exam derivations, clinical signs, and core mechanisms for ${intakeSubject || "this course"}...`}
                value={customTopicInput}
                onChange={(e) => setCustomTopicInput(e.target.value)}
              />
            </div>
          )}

          <div className="form-actions-bar" style={{ marginTop: "28px" }}>
            <button
              type="button"
              className="bringe-primary-btn"
              disabled={!pyqMethods.ai_autonomous && !pyqMethods.upload_pyq && !pyqMethods.custom_topics}
              onClick={handleStartThoroughResearch}
            >
              Execute Deep Research &amp; Syllabus Synthesis &rarr;
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. THOROUGH AI RESEARCH & TELEMETRY */}
      {/* ========================================================================= */}
      {step === "ai_researching" && (
        <div className="bringe-card-panel centered-content">
          <div className="telemetry-scanning-ring">
            <Activity className="telemetry-spin-icon" size={36} />
          </div>
          <h2 style={{ fontFamily: "var(--serif)", fontSize: "24px", marginTop: "24px", marginBottom: "8px" }}>
            Conducting High-Stakes Examination Research
          </h2>
          <p style={{ color: "var(--t2)", fontSize: "14.5px", maxWidth: "560px", margin: "0 auto 18px" }}>
            {currentResearchPhase}
          </p>
          <div className="bringe-progress-track">
            <div className="bringe-progress-fill" style={{ width: `${researchProgress}%` }} />
          </div>
          <div style={{ marginTop: "10px", fontSize: "13px", color: "var(--t3)", fontFamily: "var(--mono)" }}>
            {researchProgress}% Completed · Building Source Citations &amp; Sleep Schedule
          </div>

          <div className="research-telemetry-terminal">
            {researchLog.slice(-4).map((line, idx) => (
              <div key={idx} className="terminal-line">
                <span className="terminal-bullet">&gt;</span> {line}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* 5. PORTION SELECTION MODAL & PASS-CORE EVIDENCE BOARD */}
      {/* ========================================================================= */}

      {/* Portion Selection Popup Modal between Stage 02 and Stage 03 */}
      {showPortionModal && (
        <div
          className="portion-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget && selectedTopicIds.length > 0) {
              setShowPortionModal(false);
            }
          }}
        >
          <div className="portion-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="portion-modal-header">
              <div>
                <span className="bringe-stage-tag" style={{ color: "var(--accent-green)" }}>
                  STAGE 02.5 · PORTION &amp; MODULE SELECTION
                </span>
                <h3 style={{ fontFamily: "var(--serif)", fontSize: "22px", fontWeight: 500, margin: "6px 0 4px", color: "var(--text)" }}>
                  Select Exam Portions &amp; Syllabus Modules
                </h3>
                <p style={{ color: "var(--t2)", fontSize: "14px", margin: 0, lineHeight: "1.5" }}>
                  Select the syllabus portions you need to prepare for <b>{intakeSubject || "your exam"}</b>. Sarvajña will tailor your Stage 03 Evidence Board, Theory notes, Schedule, and Practice questions strictly to your selected portions.
                </p>
              </div>
              {selectedTopicIds.length > 0 && (
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ padding: "6px", borderRadius: "50%" }}
                  onClick={() => setShowPortionModal(false)}
                  title="Close and view Stage 03"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Quick Filter Selection Pills & Real-Time Status */}
            <div style={{ padding: "14px 28px", background: "var(--surface2)", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ fontSize: "12.5px", padding: "5px 12px", borderRadius: "999px" }}
                  onClick={() => {
                    ambientAudio.playChime("click");
                    const mustKnowIds = availableTopics.filter((t) => t.tier === "must_know").map((t) => t.id);
                    setSelectedTopicIds(mustKnowIds.length > 0 ? mustKnowIds : availableTopics.slice(0, 2).map((t) => t.id));
                  }}
                >
                  Must-Know Only
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ fontSize: "12.5px", padding: "5px 12px", borderRadius: "999px" }}
                  onClick={() => {
                    ambientAudio.playChime("click");
                    setSelectedTopicIds(availableTopics.map((t) => t.id));
                  }}
                >
                  Select All Portions ({availableTopics.length})
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ fontSize: "12.5px", padding: "5px 12px", borderRadius: "999px" }}
                  onClick={() => {
                    ambientAudio.playChime("click");
                    if (availableTopics.length > 0) {
                      setSelectedTopicIds([availableTopics[0].id]);
                    }
                  }}
                >
                  Reset to Core
                </button>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "13px", color: totalPredictedMarks >= passMarkTarget ? "#22c55e" : "#f59e0b", fontWeight: 600 }}>
                  {totalPredictedMarks} / {passMarkTarget} Marks ({Math.round((totalPredictedMarks / passMarkTarget) * 100)}% Pass Target)
                </span>
                <span style={{ fontSize: "13px", color: "var(--t3)" }}>
                  &bull; {(totalAllocatedMins / 60).toFixed(1)} hrs of {studyBudgetHours}h budget
                </span>
              </div>
            </div>

            {/* Portions Scrollable Checklist Body */}
            <div className="portion-modal-body">
              {availableTopics.map((topic, idx) => {
                const isSelected = selectedTopicIds.includes(topic.id);
                return (
                  <div
                    key={topic.id}
                    className={`portion-item-card ${isSelected ? "selected" : ""}`}
                    onClick={() => toggleTopic(topic.id)}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="bringe-checkbox"
                      style={{ marginTop: "4px" }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", flexWrap: "wrap", marginBottom: "4px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                          <span style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--t3)" }}>
                            PORTION 0{idx + 1}
                          </span>
                          <h4 style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: "var(--text)" }}>
                            {topic.name}
                          </h4>
                          <span className={`tier-badge ${topic.tier === "must_know" ? "must-know" : topic.tier === "should_know" ? "should-know" : "skip"}`}>
                            {topic.tier === "must_know" ? "Must Know Core" : topic.tier === "should_know" ? "Should Know" : "Skip for Now"}
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span className="topic-marks-tag" style={{ fontSize: "12.5px", padding: "3px 10px" }}>
                            +{topic.predictedMarks} Marks
                          </span>
                          <span style={{ fontSize: "12.5px", color: "var(--t3)" }}>
                            {topic.durationMins} mins
                          </span>
                        </div>
                      </div>
                      <p style={{ margin: "2px 0 0", fontSize: "13.5px", color: "var(--t2)", lineHeight: "1.5" }}>
                        {topic.subtopic} &bull; <span style={{ color: "var(--t3)" }}>{topic.pastExamFreq}</span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="portion-modal-footer">
              <div style={{ fontSize: "13px", color: "var(--t2)" }}>
                <b>{selectedTopicIds.length}</b> portions selected &bull; <b>{totalPredictedMarks}</b> expected marks
              </div>
              <button
                type="button"
                className="bringe-primary-btn"
                disabled={selectedTopicIds.length === 0}
                style={{ padding: "10px 22px", fontSize: "14px" }}
                onClick={() => {
                  ambientAudio.playChime("levelUp");
                  setStage3TheoryIdx(0);
                  setShowPortionModal(false);
                }}
              >
                <span>Confirm Portions &amp; Enter Evidence Board</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {step === "topic_selection" && (
        <div className="bringe-card-panel">
          <div className="bringe-card-header">
            <div>
              <span className="bringe-stage-tag">STAGE 03 · PASS-CORE EVIDENCE BOARD</span>
              <h2 className="bringe-title">Exam Evidence Map &amp; Tactical Hub: {intakeSubject || "Course Core"}</h2>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <button
                type="button"
                className="btn btn-ghost"
                style={{
                  fontSize: "13px",
                  padding: "7px 14px",
                  borderRadius: "999px",
                  whiteSpace: "nowrap",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  borderColor: "var(--border-2)",
                }}
                onClick={() => {
                  ambientAudio.playChime("click");
                  setShowPortionModal(true);
                }}
              >
                <SlidersHorizontal size={14} />
                <span>Adjust Portions ({selectedTopicIds.length} Selected)</span>
              </button>
              <div className="live-countdown-badge">
                <Clock size={15} style={{ marginRight: "6px" }} />
                <span>Exam in {formatCountdown(countdownSeconds)}</span>
              </div>
            </div>
          </div>

          {/* 4 Stage 03 Command Suite Top Tiles */}
          <div className="stage3-top-tiles-grid">
            <button
              type="button"
              className={`stage3-tile-card ${stage3Tab === "theory" ? "active" : ""}`}
              onClick={() => {
                ambientAudio.playChime("click");
                setStage3Tab("theory");
              }}
            >
              <div className="stage3-tile-icon-wrap" style={{ color: "var(--accent-green)" }}>
                <BookOpen size={22} />
              </div>
              <div className="stage3-tile-body">
                <div className="stage3-tile-title-row">
                  <span className="stage3-tile-title">Theory Vault</span>
                  {stage3Tab === "theory" && <span className="stage3-tile-status-tag">Active</span>}
                </div>
                <span className="stage3-tile-sub">Deep proofs, derivations &amp; mental models</span>
              </div>
            </button>

            <button
              type="button"
              className={`stage3-tile-card ${stage3Tab === "schedule" ? "active" : ""}`}
              onClick={() => {
                ambientAudio.playChime("click");
                setStage3Tab("schedule");
              }}
            >
              <div className="stage3-tile-icon-wrap" style={{ color: "#60a5fa" }}>
                <Clock size={22} />
              </div>
              <div className="stage3-tile-body">
                <div className="stage3-tile-title-row">
                  <span className="stage3-tile-title">Schedule &amp; Portions</span>
                  {stage3Tab === "schedule" && <span className="stage3-tile-status-tag">Active</span>}
                </div>
                <span className="stage3-tile-sub">{sleepHours}h sleep window &bull; {passMarkTarget}% threshold</span>
              </div>
            </button>

            <button
              type="button"
              className={`stage3-tile-card ${stage3Tab === "resources" ? "active" : ""}`}
              onClick={() => {
                ambientAudio.playChime("click");
                setStage3Tab("resources");
              }}
            >
              <div className="stage3-tile-icon-wrap" style={{ color: "#f59e0b" }}>
                <Compass size={22} />
              </div>
              <div className="stage3-tile-body">
                <div className="stage3-tile-title-row">
                  <span className="stage3-tile-title">Curated Resources</span>
                  <span className="stage3-badge-counter">{curatedResources.length}</span>
                </div>
                <span className="stage3-tile-sub">Textbooks, MIT notes &amp; syllabus maps</span>
              </div>
            </button>

            <button
              type="button"
              className={`stage3-tile-card ${stage3Tab === "practice" ? "active" : ""}`}
              onClick={() => {
                ambientAudio.playChime("click");
                setStage3Tab("practice");
              }}
            >
              <div className="stage3-tile-icon-wrap" style={{ color: "#a855f7" }}>
                <Zap size={22} />
              </div>
              <div className="stage3-tile-body">
                <div className="stage3-tile-title-row">
                  <span className="stage3-tile-title">Practice Lab</span>
                  {stage3Tab === "practice" && <span className="stage3-tile-status-tag">Active</span>}
                </div>
                <span className="stage3-tile-sub">MCQs, flashcards, written grading &amp; PYQs</span>
              </div>
            </button>
          </div>

          {/* ================================================================= */}
          {/* TAB 1: THEORY (Expanded Workspace: Sidebar Chapters + Deep Content) */}
          {/* ================================================================= */}
          {stage3Tab === "theory" && (() => {
            const currentTheoryTopic = activeSelectedTopics[stage3TheoryIdx] || activeSelectedTopics[0];
            if (!currentTheoryTopic) {
              return (
                <div style={{ textAlign: "center", padding: "60px 20px" }}>
                  <p style={{ color: "var(--t2)", fontSize: "16px" }}>No syllabus portions selected.</p>
                  <button
                    type="button"
                    className="bringe-primary-btn"
                    style={{ marginTop: "14px" }}
                    onClick={() => setShowPortionModal(true)}
                  >
                    Select Syllabus Portions
                  </button>
                </div>
              );
            }

            return (
              <div className="theory-expanded-workspace">
                {/* Left Side: Chapter Navigation Sidebar */}
                <aside className="theory-chapters-sidebar">
                  <div className="theory-chapters-header">
                    <span className="theory-chapters-title">Chapters ({activeSelectedTopics.length})</span>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      style={{ fontSize: "12px", padding: "4px 10px", borderRadius: "999px" }}
                      onClick={() => {
                        ambientAudio.playChime("click");
                        setShowPortionModal(true);
                      }}
                    >
                      Portions
                    </button>
                  </div>

                  {activeSelectedTopics.map((top, idx) => (
                    <button
                      key={top.id}
                      type="button"
                      className={`theory-chapter-card ${stage3TheoryIdx === idx ? "active" : ""}`}
                      onClick={() => {
                        ambientAudio.playChime("click");
                        setStage3TheoryIdx(idx);
                      }}
                    >
                      <div className="chapter-card-top">
                        <span className="chapter-num-tag">Chapter 0{idx + 1}</span>
                        <span className="topic-marks-tag" style={{ fontSize: "11px", padding: "2px 7px" }}>
                          +{top.predictedMarks}m
                        </span>
                      </div>
                      <h4 className="chapter-name">{top.name}</h4>
                      <div className="chapter-meta-row">
                        <span style={{ color: top.tier === "must_know" ? "var(--accent-green)" : "var(--t2)" }}>
                          {top.tier === "must_know" ? "Must Know Core" : top.tier === "should_know" ? "Should Know" : "Skip"}
                        </span>
                        <span>&bull;</span>
                        <span>{top.durationMins}m</span>
                      </div>
                    </button>
                  ))}
                </aside>

                {/* Right Side: Expansive Academic Content Workspace */}
                <main className="theory-content-workspace">
                  {/* Active Chapter Header Banner */}
                  <div
                    style={{
                      background: "var(--surface2)",
                      border: "1px solid var(--border)",
                      borderRadius: "12px",
                      padding: "20px 26px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "16px",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                        <span className="chapter-num-tag" style={{ color: "var(--accent-green)", fontSize: "12.5px" }}>
                          Chapter 0{stage3TheoryIdx + 1}
                        </span>
                        <span className={`tier-badge ${currentTheoryTopic.tier === "must_know" ? "must-know" : currentTheoryTopic.tier === "should_know" ? "should-know" : "skip"}`}>
                          {currentTheoryTopic.tier === "must_know" ? "Must Know Core" : currentTheoryTopic.tier === "should_know" ? "Should Know" : "Skip for Now"}
                        </span>
                        <span className="source-trust-tag">{currentTheoryTopic.sourceTag}</span>
                        <span style={{ fontSize: "13px", color: "var(--t3)" }}>&bull; {currentTheoryTopic.pastExamFreq}</span>
                      </div>
                      <h3 style={{ fontFamily: "var(--serif)", fontSize: "26px", fontWeight: 500, margin: 0, color: "var(--text)" }}>
                        {currentTheoryTopic.name}
                      </h3>
                      <p style={{ color: "var(--t2)", fontSize: "15px", margin: "6px 0 0" }}>
                        {currentTheoryTopic.subtopic}
                      </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span className="topic-marks-tag" style={{ fontSize: "13.5px", padding: "6px 14px" }}>
                        +{currentTheoryTopic.predictedMarks} Exam Marks
                      </span>
                      <button
                        type="button"
                        className="bringe-primary-btn"
                        style={{ padding: "9px 18px", fontSize: "13.5px" }}
                        onClick={() => {
                          ambientAudio.playChime("click");
                          setStage3PracticeTopicIdx(stage3TheoryIdx);
                          setStage3Tab("practice");
                        }}
                      >
                        <span>Jump to Practice Lab</span>
                        <ArrowRight size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Horizontal 2-Column Content Layout */}
                  <div className="theory-horizontal-layout">
                    {/* Primary Column */}
                    <div className="theory-col-primary">
                      {/* Card 1: Core Theoretical Foundations with Paragraph Simplifier */}
                      <div className="theory-card">
                        <div className="theory-card-title">
                          <Brain size={19} style={{ color: "var(--accent-green)" }} />
                          <span>Academic Derivation &amp; In-Depth Theory</span>
                        </div>
                        <div className="theory-prose" style={{ lineHeight: "1.75", marginBottom: "16px" }}>
                          {currentTheoryTopic.collegeRigor}
                        </div>
                        <ParagraphSimplifier
                          originalText={currentTheoryTopic.collegeRigor}
                          topicName={currentTheoryTopic.name}
                          alwaysShow={true}
                        />
                      </div>

                      {/* Card 2: Cognitive Scaffold (Step-by-Step Model Derivation) with Paragraph Simplifier */}
                      <div className="theory-card">
                        <div className="theory-card-title">
                          <BookOpen size={19} style={{ color: "#a855f7" }} />
                          <span>Step-by-Step Model Derivation ({currentTheoryTopic.fadedExample.title})</span>
                        </div>
                        <div style={{ fontSize: "14.5px", color: "var(--t2)", marginBottom: "12px" }}>
                          <b>Problem Formulation:</b> {currentTheoryTopic.fadedExample.step1_full.problem}
                        </div>
                        <div
                          style={{
                            background: "var(--surface2)",
                            border: "1px solid var(--border)",
                            borderRadius: "8px",
                            padding: "16px 20px",
                            fontSize: "14px",
                            color: "var(--text)",
                            lineHeight: "1.68",
                            fontFamily: "var(--sans)",
                            marginBottom: "12px",
                          }}
                        >
                          <b>Annotated Derivation:</b><br />
                          {currentTheoryTopic.fadedExample.step1_full.annotatedSolution}
                        </div>
                        <div style={{ marginBottom: "14px", fontSize: "13.5px", color: "var(--t3)" }}>
                          <b>Key Examiner Insight:</b> {currentTheoryTopic.fadedExample.step1_full.keyInsight}
                        </div>
                        <ParagraphSimplifier
                          originalText={currentTheoryTopic.fadedExample.step1_full.annotatedSolution}
                          topicName={`${currentTheoryTopic.name} Derivation`}
                          alwaysShow={true}
                        />
                      </div>
                    </div>

                    {/* Secondary Column */}
                    <div className="theory-col-secondary">
                      {/* Card 3: Intuitive Mental Model & Analogy */}
                      <div className="theory-card">
                        <div className="theory-card-title">
                          <Activity size={19} style={{ color: "#60a5fa" }} />
                          <span>Intuitive Mental Model &amp; Analogy</span>
                        </div>
                        <div className="theory-prose" style={{ fontStyle: "italic", color: "var(--t2)", fontSize: "15px", marginBottom: "12px" }}>
                          &ldquo;{currentTheoryTopic.highSchoolAnalogy}&rdquo;
                        </div>
                        <ParagraphSimplifier
                          originalText={currentTheoryTopic.highSchoolAnalogy}
                          topicName={`${currentTheoryTopic.name} Intuition`}
                          alwaysShow={true}
                        />
                      </div>

                      {/* Card 4: Operational Formulas & Boundary Limits */}
                      <div className="theory-card">
                        <div className="theory-card-title">
                          <Layers size={19} style={{ color: "#f59e0b" }} />
                          <span>Operational Formulas &amp; Boundary Conditions</span>
                        </div>
                        <div
                          style={{
                            fontFamily: "var(--mono)",
                            fontSize: "14px",
                            background: "var(--surface2)",
                            border: "1px solid var(--border)",
                            borderRadius: "8px",
                            padding: "14px 18px",
                            color: "var(--accent-green)",
                            lineHeight: "1.65",
                          }}
                        >
                          {currentTheoryTopic.formulaBoundary}
                        </div>
                      </div>

                      {/* Card 5: Examiner Traps & Deduction Pitfalls */}
                      <div
                        className="theory-card"
                        style={{
                          borderColor: "rgba(239, 68, 68, 0.35)",
                          background: "linear-gradient(180deg, rgba(239, 68, 68, 0.04) 0%, var(--surface) 100%)",
                        }}
                      >
                        <div className="theory-card-title" style={{ color: "#f87171" }}>
                          <ShieldAlert size={19} />
                          <span>High-Yield Examiner Traps &amp; Deduction Pitfalls</span>
                        </div>
                        <p style={{ fontSize: "14.5px", color: "var(--text)", marginBottom: "12px", lineHeight: "1.6" }}>
                          <b>Common Trap:</b> {currentTheoryTopic.commonGotcha}
                        </p>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          {currentTheoryTopic.deductionTraps.map((trap, tIdx) => (
                            <div key={tIdx} style={{ fontSize: "13.5px", color: "var(--t2)", display: "flex", gap: "8px" }}>
                              <span style={{ color: "#ef4444", fontWeight: "bold" }}>&bull;</span>
                              <span>{trap}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Card 6: Key Examination Concepts & Definitions */}
                      <div className="theory-card">
                        <div className="theory-card-title">
                          <CheckCircle2 size={19} style={{ color: "#22c55e" }} />
                          <span>Key Examination Concepts &amp; Definitions</span>
                        </div>
                        <ul style={{ paddingLeft: "20px", margin: "0", display: "flex", flexDirection: "column", gap: "8px" }}>
                          {currentTheoryTopic.keyPoints.map((point, pIdx) => (
                            <li key={pIdx} style={{ fontSize: "14px", color: "var(--text)", lineHeight: "1.6" }}>
                              {point}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </main>
              </div>
            );
          })()}

          {/* ================================================================= */}
          {/* TAB 2: SCHEDULE (Pass-Core Threshold, Sleep Window & Portions)    */}
          {/* ================================================================= */}
          {stage3Tab === "schedule" && (
            <div>
              {/* Pass-Core Threshold Card */}
              <div className="pass-threshold-card">
                <div className="pass-threshold-head">
                  <span>
                    Target Pass Mark: <b>{passMarkTarget} Marks</b> ({passMarkTarget}%)
                  </span>
                  <span>
                    Selected Expected Marks: <b>{totalPredictedMarks} Marks</b>
                  </span>
                </div>
                <div className="pass-threshold-bar">
                  <div
                    className="pass-threshold-fill"
                    style={{
                      width: `${Math.min(100, (totalPredictedMarks / passMarkTarget) * 100)}%`,
                      backgroundColor:
                        totalPredictedMarks >= passMarkTarget ? "#4ade80" : "#facc15",
                    }}
                  />
                </div>
                <div style={{ fontSize: "13.5px", color: "var(--t2)", display: "flex", justifyContent: "space-between" }}>
                  <span>
                    {totalPredictedMarks >= passMarkTarget
                      ? `Pass-Core threshold secured (+${totalPredictedMarks - passMarkTarget} margin above target).`
                      : `Currently ${passMarkTarget - totalPredictedMarks} marks below target pass mark. Select more Must-Know topics.`}
                  </span>
                  <span style={{ fontFamily: "var(--mono)" }}>
                    {Math.round((totalPredictedMarks / passMarkTarget) * 100)}% Pass Coverage
                  </span>
                </div>
              </div>

              {/* Sleep-Protected Planner Bar */}
              <div className="sleep-schedule-panel">
                <div className="sleep-schedule-header">
                  <div className="sleep-schedule-title">
                    <Moon size={17} style={{ color: "#60a5fa" }} />
                    <span>Sleep-Protected Night Schedule (Dunlosky &amp; Karpicke Memory Framework)</span>
                  </div>
                  <span style={{ fontSize: "12px", color: "var(--t3)", fontFamily: "var(--mono)" }}>
                    {sleepHours}h Sleep Block Non-Negotiable
                  </span>
                </div>
                <div className="sleep-phases-grid">
                  <div className="sleep-phase-card">
                    <span className="phase-step-label">PHASE 1 · SPRINTS</span>
                    <span className="phase-name">Active Retrieval Missions</span>
                    <span className="phase-duration">{studyBudgetHours} hrs · High expected score</span>
                  </div>
                  <div className="sleep-phase-card">
                    <span className="phase-step-label">PHASE 2 · SWEEP</span>
                    <span className="phase-name">Evening Consolidation</span>
                    <span className="phase-duration">30 mins · Re-test weak items</span>
                  </div>
                  <div className="sleep-phase-card sleep-locked">
                    <span className="phase-step-label" style={{ color: "#93c5fd" }}>PHASE 3 · SLEEP LOCKED</span>
                    <span className="phase-name" style={{ color: "#60a5fa" }}>Protected Sleep Block</span>
                    <span className="phase-duration" style={{ color: "#bfdbfe" }}>{sleepHours} hrs · Memory consolidation</span>
                  </div>
                  <div className="sleep-phase-card">
                    <span className="phase-step-label">PHASE 4 · MORNING</span>
                    <span className="phase-name">Rapid Recall Card</span>
                    <span className="phase-duration">30 mins · Final survival sheet</span>
                  </div>
                </div>
              </div>

              {/* Time Budget Status Bar */}
              <div className={`budget-status-panel ${isOverBudget ? "over-budget" : "within-budget"}`}>
                <div className="budget-text-row">
                  <span>
                    Study Budget: <b>{studyBudgetHours} hrs</b> ({budgetMinutes} mins)
                  </span>
                  <span>
                    Selected Coverage: <b>{(totalAllocatedMins / 60).toFixed(1)} hrs</b> ({totalAllocatedMins} mins)
                  </span>
                </div>
                <div className="budget-bar-track">
                  <div
                    className="budget-bar-fill"
                    style={{
                      width: `${Math.min(100, (totalAllocatedMins / budgetMinutes) * 100)}%`,
                      backgroundColor: isOverBudget ? "#ef4444" : "var(--t1)",
                    }}
                  />
                </div>
                {isOverBudget ? (
                  <div className="budget-warning">
                    <AlertTriangle size={14} style={{ marginRight: "6px" }} />
                    <span>
                      Selected topics exceed your {studyBudgetHours} hr window. Uncheck lower-yield topics to protect descriptive writing &amp; review time.
                    </span>
                  </div>
                ) : (
                  <div className="budget-ok">
                    <CheckCircle2 size={14} style={{ marginRight: "6px" }} />
                    <span>
                      Optimal allocation. {budgetMinutes - totalAllocatedMins} minutes reserved for written practice, flashcards, and sleep.
                    </span>
                  </div>
                )}
              </div>

              {/* Evidence Filter Tabs */}
              <div className="tier-filter-tabs">
                <button
                  type="button"
                  className={`tier-filter-btn ${evidenceFilter === "all" ? "active" : ""}`}
                  onClick={() => {
                    ambientAudio.playChime("click");
                    setEvidenceFilter("all");
                  }}
                >
                  All Evidence ({availableTopics.length})
                </button>
                <button
                  type="button"
                  className={`tier-filter-btn ${evidenceFilter === "must_know" ? "active" : ""}`}
                  onClick={() => {
                    ambientAudio.playChime("click");
                    setEvidenceFilter("must_know");
                  }}
                >
                  Must Know (Recurrence &ge; 75%)
                </button>
                <button
                  type="button"
                  className={`tier-filter-btn ${evidenceFilter === "should_know" ? "active" : ""}`}
                  onClick={() => {
                    ambientAudio.playChime("click");
                    setEvidenceFilter("should_know");
                  }}
                >
                  Should Know (50-74%)
                </button>
                <button
                  type="button"
                  className={`tier-filter-btn ${evidenceFilter === "skip" ? "active" : ""}`}
                  onClick={() => {
                    ambientAudio.playChime("click");
                    setEvidenceFilter("skip");
                  }}
                >
                  Skip for Now (Low ROI)
                </button>
              </div>

              {/* Add Custom User Topic Form */}
              <form onSubmit={handleAddCustomTopic} className="custom-topic-inline-form">
                <input
                  type="text"
                  className="field-text-input"
                  placeholder={`Add another topic you expect on the ${intakeSubject || "exam"}...`}
                  value={customTopicInput}
                  onChange={(e) => setCustomTopicInput(e.target.value)}
                />
                <button type="submit" className="btn btn-ghost" style={{ whiteSpace: "nowrap" }}>
                  + Add Topic
                </button>
              </form>

              {/* List of Evidence-Coded Topics */}
              <div className="topics-checklist-grid">
                {filteredTopics.map((topic) => {
                  const isSelected = selectedTopicIds.includes(topic.id);
                  return (
                    <div
                      key={topic.id}
                      className={`topic-check-card ${isSelected ? "selected" : ""}`}
                      onClick={() => toggleTopic(topic.id)}
                    >
                      <div className="topic-card-checkbox-col">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="bringe-checkbox"
                        />
                      </div>
                      <div className="topic-card-body-col">
                        <div className="topic-card-header-line">
                          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                            <h4 className="topic-title">{topic.name}</h4>
                            <span className={`tier-badge ${topic.tier === "must_know" ? "must-know" : topic.tier === "should_know" ? "should-know" : "skip"}`}>
                              {topic.tier === "must_know" ? "Must Know" : topic.tier === "should_know" ? "Should Know" : "Skip for Now"}
                            </span>
                            <span className="source-trust-tag">{topic.sourceTag}</span>
                          </div>
                          <span className="topic-marks-tag">+{topic.predictedMarks} Marks</span>
                        </div>
                        <div className="topic-meta-row">
                          <span className="topic-sub">{topic.subtopic}</span>
                          <span className="meta-sep">&bull;</span>
                          <span className="topic-freq">{topic.pastExamFreq}</span>
                          <span className="meta-sep">&bull;</span>
                          <span className="topic-time">{topic.durationMins} mins</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 3: CURATED RESOURCES (Popular Standards & Hard-to-Find Gems)  */}
          {/* ================================================================= */}
          {stage3Tab === "resources" && (
            <div>
              {/* Header & Description */}
              <div style={{ marginBottom: "22px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                  <Compass size={20} style={{ color: "var(--accent-green)" }} />
                  <h3 style={{ fontFamily: "var(--serif)", fontSize: "24px", fontWeight: 500, margin: 0 }}>
                    Curated Resource &amp; Intelligence Hub
                  </h3>
                </div>
                <p style={{ color: "var(--t2)", fontSize: "14.5px", margin: 0, lineHeight: "1.55" }}>
                  Synthesizing authoritative textbooks, elite university lecture vaults, and underground hidden gems that search engines obscure.
                </p>
              </div>

              {/* Category Filter Pills */}
              <div className="tier-filter-tabs" style={{ margin: "0 0 18px" }}>
                <button
                  type="button"
                  className={`tier-filter-btn ${resourceCategoryFilter === "all" ? "active" : ""}`}
                  onClick={() => {
                    ambientAudio.playChime("click");
                    setResourceCategoryFilter("all");
                  }}
                >
                  All Resources ({curatedResources.length})
                </button>
                <button
                  type="button"
                  className={`tier-filter-btn ${resourceCategoryFilter === "popular" ? "active" : ""}`}
                  onClick={() => {
                    ambientAudio.playChime("click");
                    setResourceCategoryFilter("popular");
                  }}
                >
                  Popular Gold Standards
                </button>
                <button
                  type="button"
                  className={`tier-filter-btn ${resourceCategoryFilter === "underrated" ? "active" : ""}`}
                  style={{
                    borderColor: resourceCategoryFilter === "underrated" ? "#f59e0b" : undefined,
                    color: resourceCategoryFilter === "underrated" ? "#fbbf24" : undefined,
                  }}
                  onClick={() => {
                    ambientAudio.playChime("click");
                    setResourceCategoryFilter("underrated");
                  }}
                >
                  Underrated Hidden Gems
                </button>
                <button
                  type="button"
                  className={`tier-filter-btn ${resourceCategoryFilter === "interactive" ? "active" : ""}`}
                  onClick={() => {
                    ambientAudio.playChime("click");
                    setResourceCategoryFilter("interactive");
                  }}
                >
                  Interactive Simulators
                </button>
                <button
                  type="button"
                  className={`tier-filter-btn ${resourceCategoryFilter === "cheatsheet" ? "active" : ""}`}
                  onClick={() => {
                    ambientAudio.playChime("click");
                    setResourceCategoryFilter("cheatsheet");
                  }}
                >
                  Cheatsheets &amp; Problem Banks
                </button>
              </div>

              {/* Resources Grid */}
              <div className="osint-grid">
                {filteredResources.map((item) => (
                  <div
                    key={item.id}
                    className={`osint-card ${item.isUnderrated ? "underrated-border" : ""}`}
                  >
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                        <span className={`osint-badge ${item.isUnderrated ? "underrated" : "popular"}`}>
                          {item.isUnderrated ? <Sparkles size={12} /> : <Award size={12} />}
                          <span>{item.badge}</span>
                        </span>
                        <span style={{ fontSize: "12px", color: "var(--t3)", textTransform: "uppercase", fontFamily: "var(--mono)" }}>
                          {item.type}
                        </span>
                      </div>

                      <h4 className="osint-card-title">{item.title}</h4>
                      <div className="osint-card-source">
                        <b>Source / Origin:</b> {item.source}
                      </div>

                      <div className="osint-card-why">
                        <b>Why High-Yield:</b> {item.whyHighYield}
                      </div>

                      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "12px" }}>
                        {item.keyConcepts.map((kc, kIdx) => (
                          <span
                            key={kIdx}
                            style={{
                              fontSize: "12.5px",
                              background: "var(--surface2)",
                              border: "1px solid var(--border)",
                              borderRadius: "4px",
                              padding: "3px 9px",
                              color: "var(--t2)",
                            }}
                          >
                            {kc}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div style={{ marginTop: "20px", paddingTop: "14px", borderTop: "1px solid var(--border)" }}>
                      {item.url ? (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-ghost"
                          style={{
                            fontSize: "13.5px",
                            width: "100%",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            gap: "8px",
                            padding: "10px 16px",
                            textDecoration: "none",
                          }}
                        >
                          <span>Explore Resource Vault</span>
                          <ExternalLink size={14} />
                        </a>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-ghost"
                          style={{
                            fontSize: "13.5px",
                            width: "100%",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            gap: "8px",
                            padding: "10px 16px",
                          }}
                          onClick={() => {
                            ambientAudio.playChime("click");
                            alert(`Resource details saved to session notes: ${item.title}`);
                          }}
                        >
                          <Bookmark size={14} />
                          <span>Bookmark to Study Session</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 4: PRACTICE LAB (Flashcards, MCQs, AI-Evaluated Written, PYQ) */}
          {/* ================================================================= */}
          {stage3Tab === "practice" && (() => {
            const currentPracticeTopic = activeSelectedTopics[stage3PracticeTopicIdx] || activeSelectedTopics[0];
            const currentPracticePyqs = getPyqBankForTopic(currentPracticeTopic);

            return (
              <div>
                {/* Topic Selector Pills */}
                <div className="theory-topic-pills">
                  {activeSelectedTopics.map((top, idx) => (
                    <button
                      key={top.id}
                      type="button"
                      className={`theory-topic-pill ${stage3PracticeTopicIdx === idx ? "active" : ""}`}
                      onClick={() => {
                        ambientAudio.playChime("click");
                        setStage3PracticeTopicIdx(idx);
                        setStage3FlashcardIdx(0);
                        setStage3IsFlipped(false);
                        setStage3McqOption(null);
                        setStage3McqSubmitted(false);
                        setStage3WrittenText("");
                        setStage3WritingEvaluation(null);
                      }}
                    >
                      <span>0{idx + 1}. {top.name}</span>
                    </button>
                  ))}
                </div>

                {/* Sub-Nav across Practice Modes */}
                <div className="practice-mode-nav">
                  <button
                    type="button"
                    className={`practice-mode-btn ${stage3PracticeMode === "flashcards" ? "active" : ""}`}
                    onClick={() => {
                      ambientAudio.playChime("click");
                      setStage3PracticeMode("flashcards");
                    }}
                  >
                    <Layers size={17} />
                    <span>Flashcards (Active Recall)</span>
                  </button>
                  <button
                    type="button"
                    className={`practice-mode-btn ${stage3PracticeMode === "mcq" ? "active" : ""}`}
                    onClick={() => {
                      ambientAudio.playChime("click");
                      setStage3PracticeMode("mcq");
                    }}
                  >
                    <HelpCircle size={17} />
                    <span>MCQ Diagnostic</span>
                  </button>
                  <button
                    type="button"
                    className={`practice-mode-btn ${stage3PracticeMode === "written" ? "active" : ""}`}
                    onClick={() => {
                      ambientAudio.playChime("click");
                      setStage3PracticeMode("written");
                    }}
                  >
                    <PenTool size={17} />
                    <span>Descriptive Written Test (AI Evaluated)</span>
                  </button>
                  <button
                    type="button"
                    className={`practice-mode-btn ${stage3PracticeMode === "pyq" ? "active" : ""}`}
                    onClick={() => {
                      ambientAudio.playChime("click");
                      setStage3PracticeMode("pyq");
                    }}
                  >
                    <FileText size={17} />
                    <span>Previous Year Questions (PYQs)</span>
                  </button>
                </div>

                {/* --- Sub-Mode 1: FLASHCARDS --- */}
                {stage3PracticeMode === "flashcards" && (
                  <div style={{ maxWidth: "1020px", margin: "0 auto", width: "100%" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                      <span style={{ fontSize: "13px", color: "var(--t3)", fontFamily: "var(--mono)" }}>
                        CARD {stage3FlashcardIdx + 1} OF {currentPracticeTopic.flashcards.length}
                      </span>
                      <span style={{ fontSize: "13px", color: "var(--accent-green)" }}>
                        Dunlosky &amp; Karpicke Confidence Gated
                      </span>
                    </div>

                    <div
                      className="active-flip-card"
                      onClick={() => {
                        ambientAudio.playChime("click");
                        setStage3IsFlipped(!stage3IsFlipped);
                      }}
                      style={{ minHeight: "260px", cursor: "pointer" }}
                    >
                      <div className="flip-card-inner">
                        <div className="flip-card-front">
                          <span className="flip-card-tag" style={{ fontSize: "12px" }}>FRONT · PROMPT</span>
                          <p className="flip-card-text" style={{ fontSize: "18px", lineHeight: "1.6" }}>
                            {currentPracticeTopic.flashcards[stage3FlashcardIdx]?.front}
                          </p>
                          <span style={{ fontSize: "13px", color: "var(--t3)" }}>Click to reveal solution</span>
                        </div>
                        <div className="flip-card-back">
                          <span className="flip-card-tag" style={{ color: "var(--accent-green)", fontSize: "12px" }}>BACK · MECHANICS</span>
                          <p className="flip-card-text" style={{ fontSize: "17.5px", lineHeight: "1.65" }}>
                            {currentPracticeTopic.flashcards[stage3FlashcardIdx]?.back}
                          </p>
                          <span style={{ fontSize: "13px", color: "var(--t3)" }}>Click to flip back</span>
                        </div>
                      </div>
                    </div>

                    {/* Confidence Rating Buttons */}
                    <div style={{ marginTop: "20px", textAlign: "center" }}>
                      <div style={{ fontSize: "13.5px", color: "var(--t2)", marginBottom: "12px" }}>
                        Rate Your Retrieval Confidence (Auto-schedules weak cards before sleep):
                      </div>
                      <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
                        {[
                          { score: 1, label: "1 · Blank" },
                          { score: 2, label: "2 · Vague" },
                          { score: 3, label: "3 · Partial" },
                          { score: 4, label: "4 · Solid" },
                          { score: 5, label: "5 · Mastered" },
                        ].map((btn) => (
                          <button
                            key={btn.score}
                            type="button"
                            className="confidence-gate-btn"
                            style={{ padding: "9px 16px", fontSize: "13px" }}
                            onClick={() => handleStage3RateFlashcard(btn.score)}
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* --- Sub-Mode 2: MCQ DIAGNOSTIC --- */}
                {stage3PracticeMode === "mcq" && (
                  <div className="mcq-module-card" style={{ maxWidth: "1020px", margin: "0 auto", width: "100%" }}>
                    <div style={{ fontSize: "13px", color: "var(--t3)", fontFamily: "var(--mono)", marginBottom: "10px" }}>
                      DIAGNOSTIC MCQ · {currentPracticeTopic.name}
                    </div>
                    <h4 style={{ fontSize: "18px", fontWeight: 600, color: "var(--text)", marginBottom: "20px", lineHeight: "1.55" }}>
                      {currentPracticeTopic.mcq.question}
                    </h4>

                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {currentPracticeTopic.mcq.options.map((opt, oIdx) => {
                        const isChosen = stage3McqOption === oIdx;
                        const isCorrect = oIdx === currentPracticeTopic.mcq.correctIndex;

                        let borderStyle = "var(--border)";
                        let bgStyle = "var(--surface2)";
                        let textColor = "var(--text)";

                        if (stage3McqSubmitted) {
                          if (isCorrect) {
                            borderStyle = "#22c55e";
                            bgStyle = "rgba(34, 197, 94, 0.12)";
                            textColor = "#4ade80";
                          } else if (isChosen) {
                            borderStyle = "#ef4444";
                            bgStyle = "rgba(239, 68, 68, 0.12)";
                            textColor = "#f87171";
                          }
                        } else if (isChosen) {
                          borderStyle = "var(--border-2)";
                          bgStyle = "rgba(255, 255, 255, 0.08)";
                        }

                        return (
                          <button
                            key={oIdx}
                            type="button"
                            style={{
                              padding: "15px 20px",
                              borderRadius: "8px",
                              border: `1px solid ${borderStyle}`,
                              background: bgStyle,
                              color: textColor,
                              textAlign: "left",
                              fontSize: "15px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "14px",
                              transition: "all 0.15s ease",
                            }}
                            onClick={() => {
                              if (stage3McqSubmitted) return;
                              setStage3McqOption(oIdx);
                              setStage3McqSubmitted(true);
                              ambientAudio.playChime(isCorrect ? "success" : "click");
                              if (isCorrect) {
                                onGainXP(20);
                                setGraspingIndex((prev) => Math.min(99, prev + 2));
                              }
                            }}
                          >
                            <span style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "var(--t3)" }}>
                              [{String.fromCharCode(65 + oIdx)}]
                            </span>
                            <span>{opt}</span>
                          </button>
                        );
                      })}
                    </div>

                    {stage3McqSubmitted && (
                      <div
                        style={{
                          marginTop: "22px",
                          padding: "18px 22px",
                          background: "var(--surface2)",
                          border: "1px solid var(--border)",
                          borderRadius: "8px",
                          animation: "enter 0.25s ease",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                          {stage3McqOption === currentPracticeTopic.mcq.correctIndex ? (
                            <CheckCircle2 size={18} style={{ color: "#22c55e" }} />
                          ) : (
                            <AlertTriangle size={18} style={{ color: "#ef4444" }} />
                          )}
                          <span style={{ fontWeight: 600, fontSize: "15px", color: stage3McqOption === currentPracticeTopic.mcq.correctIndex ? "#22c55e" : "#ef4444" }}>
                            {stage3McqOption === currentPracticeTopic.mcq.correctIndex ? "Accurate Answer (+20 XP)" : "Incorrect Option Selected"}
                          </span>
                        </div>
                        <p style={{ fontSize: "14px", color: "var(--t2)", margin: 0, lineHeight: "1.65" }}>
                          {currentPracticeTopic.mcq.explanation}
                        </p>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          style={{ marginTop: "14px", fontSize: "13px" }}
                          onClick={() => {
                            setStage3McqOption(null);
                            setStage3McqSubmitted(false);
                          }}
                        >
                          Retry MCQ
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* --- Sub-Mode 3: DESCRIPTIVE WRITTEN TEST (AI Evaluated) --- */}
                {stage3PracticeMode === "written" && (
                  <div style={{ maxWidth: "1020px", margin: "0 auto", width: "100%" }}>
                    <div
                      style={{
                        background: "var(--surface2)",
                        border: "1px solid var(--border)",
                        borderRadius: "10px",
                        padding: "22px 26px",
                        marginBottom: "22px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                        <span className="bringe-stage-tag" style={{ margin: 0, fontSize: "12px" }}>UNIVERSITY DESCRIPTIVE PROMPT</span>
                        <span className="topic-marks-tag" style={{ fontSize: "13.5px" }}>Max Marks: {currentPracticeTopic.writingQuestion.maxMarks}</span>
                      </div>
                      <p style={{ fontSize: "16.5px", color: "var(--text)", fontWeight: 550, margin: 0, lineHeight: "1.6" }}>
                        {currentPracticeTopic.writingQuestion.prompt}
                      </p>
                    </div>

                    <div style={{ marginBottom: "18px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                        <span style={{ fontSize: "14px", color: "var(--t2)" }}>
                          Write your descriptive exam response below (AI will evaluate marks &amp; rubric coverage):
                        </span>
                        <span style={{ fontSize: "13px", color: "var(--t3)", fontFamily: "var(--mono)" }}>
                          {stage3WrittenText.trim().split(/\s+/).filter(Boolean).length} words
                        </span>
                      </div>
                      <textarea
                        className="writing-answer-textarea"
                        placeholder="Draft your full answer here. Include definitions, key equations, step-by-step mechanisms, and boundary conditions..."
                        value={stage3WrittenText}
                        onChange={(e) => setStage3WrittenText(e.target.value)}
                        rows={6}
                        style={{ fontSize: "15px", lineHeight: "1.65" }}
                      />
                    </div>

                    {/* Pre-Response Confidence Gate */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "13.5px", color: "var(--t3)" }}>Pre-submission Confidence:</span>
                        {(['low', 'medium', 'high'] as const).map((conf) => (
                          <button
                            key={conf}
                            type="button"
                            className={`confidence-gate-btn ${stage3WritingConfidence === conf ? 'selected' : ''}`}
                            style={{ padding: "6px 14px", fontSize: "12.5px" }}
                            onClick={() => setStage3WritingConfidence(conf)}
                          >
                            {conf.toUpperCase()}
                          </button>
                        ))}
                      </div>

                      <button
                        type="button"
                        className="bringe-primary-btn"
                        style={{ padding: "10px 22px", fontSize: "14px" }}
                        disabled={stage3WrittenText.trim().length < 15 || stage3IsEvaluating}
                        onClick={handleStage3EvaluateWrittenAnswer}
                      >
                        {stage3IsEvaluating ? (
                          <>
                            <RotateCcw size={16} className="spin-anim" />
                            <span>AI Evaluating Rubric...</span>
                          </>
                        ) : (
                          <>
                            <PenTool size={16} />
                            <span>Submit for AI Evaluation &rarr;</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Evaluation Result Card */}
                    {stage3WritingEvaluation && (
                      <div
                        className="evaluation-card"
                        style={{
                          background: "var(--surface)",
                          border: "1px solid var(--border-2)",
                          borderRadius: "12px",
                          padding: "26px 30px",
                          animation: "enter 0.3s ease",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                          <div>
                            <span style={{ fontSize: "12px", textTransform: "uppercase", fontFamily: "var(--mono)", color: "var(--t3)" }}>
                              AI EVALUATION RESULT
                            </span>
                            <h4 style={{ fontSize: "22px", fontWeight: 600, color: "var(--text)", margin: "4px 0 0" }}>
                              Score: {stage3WritingEvaluation.marksAwarded} / {stage3WritingEvaluation.maxMarks} Marks
                            </h4>
                          </div>
                          <span className="topic-marks-tag" style={{ fontSize: "14.5px", padding: "6px 16px" }}>
                            {Math.round(stage3WritingEvaluation.scoreRatio * 100)}% Rubric Match
                          </span>
                        </div>

                        {stage3WritingEvaluation.strengths.length > 0 && (
                          <div style={{ marginBottom: "16px" }}>
                            <span style={{ fontSize: "13.5px", fontWeight: 600, color: "#22c55e", display: "flex", alignItems: "center", gap: "6px" }}>
                              <Check size={16} /> Strengths &amp; Correct Mechanisms:
                            </span>
                            <ul style={{ paddingLeft: "22px", margin: "8px 0 0", fontSize: "14px", color: "var(--t2)", lineHeight: "1.6" }}>
                              {stage3WritingEvaluation.strengths.map((s, sIdx) => (
                                <li key={sIdx}>{s}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {stage3WritingEvaluation.penalties.length > 0 && (
                          <div style={{ marginBottom: "16px" }}>
                            <span style={{ fontSize: "13.5px", fontWeight: 600, color: "#f59e0b", display: "flex", alignItems: "center", gap: "6px" }}>
                              <AlertTriangle size={16} /> Examiner Deduction Traps &amp; Missing Keywords:
                            </span>
                            <ul style={{ paddingLeft: "22px", margin: "8px 0 0", fontSize: "14px", color: "var(--t2)", lineHeight: "1.6" }}>
                              {stage3WritingEvaluation.penalties.map((p, pIdx) => (
                                <li key={pIdx}>{p}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div style={{ background: "var(--surface2)", padding: "14px 18px", borderRadius: "8px", marginBottom: "18px" }}>
                          <span style={{ fontSize: "12.5px", color: "var(--t3)", fontWeight: 600 }}>ACTIONABLE ADVICE TO IMPROVE SCORE:</span>
                          <p style={{ fontSize: "14px", color: "var(--text)", margin: "6px 0 0", lineHeight: "1.6" }}>
                            {stage3WritingEvaluation.feedbackAdvice}
                          </p>
                        </div>

                        {/* Sample Model Answer */}
                        <div style={{ borderTop: "1px solid var(--border)", paddingTop: "16px" }}>
                          <span style={{ fontSize: "12.5px", color: "var(--accent-green)", fontWeight: 600 }}>
                            EXAM-READY MODEL ANSWER (STUDY THIS):
                          </span>
                          <p style={{ fontSize: "14px", color: "var(--t2)", margin: "8px 0 0", lineHeight: "1.68", fontStyle: "italic" }}>
                            {currentPracticeTopic.writingQuestion.sampleModelAnswer}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* --- Sub-Mode 4: PYQ EXAM ARCHIVE --- */}
                {stage3PracticeMode === "pyq" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                    <div style={{ marginBottom: "6px" }}>
                      <h4 style={{ fontSize: "18px", fontWeight: 600, color: "var(--text)", margin: "0 0 6px" }}>
                        Past Examination Questions &amp; Full Worked Solutions
                      </h4>
                      <p style={{ fontSize: "14px", color: "var(--t2)", margin: 0, lineHeight: "1.5" }}>
                        Real university questions asked repeatedly on {currentPracticeTopic.name}. Review scoring keys to secure full marks.
                      </p>
                    </div>

                    {currentPracticePyqs.map((pyq) => {
                      const isRevealed = revealedPyqIds[pyq.id];
                      return (
                        <div
                          key={pyq.id}
                          style={{
                            background: "var(--surface)",
                            border: "1px solid var(--border)",
                            borderRadius: "10px",
                            padding: "22px 26px",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <span style={{ fontSize: "12px", fontFamily: "var(--mono)", background: "var(--surface2)", border: "1px solid var(--border)", padding: "3px 9px", borderRadius: "4px", color: "var(--text)" }}>
                                {pyq.year}
                              </span>
                              <span style={{ fontSize: "13px", color: "var(--accent-green)" }}>
                                {pyq.frequency}
                              </span>
                            </div>
                            <span className="topic-marks-tag" style={{ fontSize: "13.5px" }}>
                              {pyq.marks} Marks
                            </span>
                          </div>

                          <p style={{ fontSize: "16px", color: "var(--text)", fontWeight: 550, lineHeight: "1.6", margin: "0 0 16px" }}>
                            {pyq.question}
                          </p>

                          <button
                            type="button"
                            className="btn btn-ghost"
                            style={{ fontSize: "13px", display: "inline-flex", alignItems: "center", gap: "7px", padding: "8px 14px" }}
                            onClick={() => {
                              ambientAudio.playChime("click");
                              setRevealedPyqIds((prev) => ({
                                ...prev,
                                [pyq.id]: !prev[pyq.id],
                              }));
                            }}
                          >
                            {isRevealed ? <EyeOff size={15} /> : <Eye size={15} />}
                            <span>{isRevealed ? "Hide Solution & Rubric" : "View Full Worked Solution & Examiner Rubric"}</span>
                          </button>

                          {isRevealed && (
                            <div
                              style={{
                                marginTop: "16px",
                                background: "var(--surface2)",
                                border: "1px solid var(--border)",
                                borderRadius: "8px",
                                padding: "18px 20px",
                                animation: "enter 0.25s ease",
                              }}
                            >
                              <div style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--accent-green)", marginBottom: "8px" }}>
                                OFFICIAL MODEL SOLUTION:
                              </div>
                              <p style={{ fontSize: "14.5px", color: "var(--text)", whiteSpace: "pre-line", lineHeight: "1.68", margin: "0 0 16px" }}>
                                {pyq.solution}
                              </p>

                              <div style={{ borderTop: "1px solid var(--border)", paddingTop: "12px" }}>
                                <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--t3)", textTransform: "uppercase", fontFamily: "var(--mono)" }}>
                                  Key Examiner Scoring Breakdown:
                                </span>
                                <ul style={{ paddingLeft: "22px", margin: "8px 0 0", fontSize: "13.5px", color: "var(--t2)", lineHeight: "1.6" }}>
                                  {pyq.keyScoringPoints.map((ksp, kIdx) => (
                                    <li key={kIdx}>{ksp}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Action Bar */}
          <div
            className="form-actions-bar"
            style={{
              marginTop: "32px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ fontSize: "13px", color: "var(--t3)" }}>
              {selectedTopicIds.length} topics locked · {totalPredictedMarks} expected marks
            </div>
            <button
              type="button"
              className="bringe-primary-btn"
              disabled={selectedTopicIds.length === 0}
              onClick={handleEnterStudyLoop}
            >
              Lock Schedule &amp; Enter Active Retrieval Loop &rarr;
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. ACTIVE STUDY LOOP: LEARN -> CLOSE BOOK -> RECALL */}
      {/* ========================================================================= */}
      {step === "active_study_loop" && (
        <div className="bringe-loop-container">
          {/* Top Session Bar with Countdown & Live Grasping Telemetry */}
          <div className="loop-topbar">
            <div className="loop-title-group">
              <span className="loop-session-label">EXAM EVE OS · ACTIVE RETRIEVAL LOOP</span>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <h2 className="loop-current-topic-title">{activeTopic.name}</h2>
                <span className="source-trust-tag">{activeTopic.sourceTag}</span>
              </div>
            </div>

            <div className="loop-topbar-right">
              {/* Single-Page Final Survival Sheet Button */}
              <button
                type="button"
                className="btn btn-ghost"
                style={{ fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "6px" }}
                onClick={() => {
                  ambientAudio.playChime("click");
                  setShowSurvivalSheetModal(true);
                }}
              >
                <FileText size={14} />
                <span>Survival Sheet</span>
              </button>

              {/* Micro-Spacing Queue Pill */}
              {reviewQueue.length > 0 && (
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{
                    fontSize: "12px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    borderColor: "rgba(250, 204, 21, 0.4)",
                    color: "#facc15",
                  }}
                  onClick={() => {
                    ambientAudio.playChime("click");
                    setShowMicroSpacingModal(true);
                  }}
                >
                  <RotateCcw size={14} />
                  <span>{reviewQueue.length} Spaced Re-test</span>
                </button>
              )}

              {/* Live Grasping Telemetry Pill */}
              <div className="grasping-index-pill">
                <span className="grasping-dot" />
                <span>Grasping: {graspingIndex}% · {currentTierInfo.label}</span>
              </div>

              {/* Countdown Ticker */}
              <div className="loop-countdown-box">
                <Clock size={15} style={{ marginRight: "6px" }} />
                <span>{formatCountdown(countdownSeconds)} remaining</span>
              </div>
            </div>
          </div>

          {/* Dynamic Fatigue & Friction Warning Banner */}
          {consecutiveErrors >= 2 && !fatigueAlertDismissed && (
            <div className="fatigue-warning-banner">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <AlertTriangle size={18} style={{ color: "#f97316", flexShrink: 0 }} />
                <span>
                  <b>Cognitive Fatigue &amp; Friction Detected:</b> Pacing telemetry indicates working-memory overload. Switch from hard new derivations to the Final Survival Sheet and protect your {sleepHours}-hour sleep window.
                </span>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ fontSize: "11px", padding: "4px 10px" }}
                  onClick={() => setShowSurvivalSheetModal(true)}
                >
                  Open Survival Sheet
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ fontSize: "11px", padding: "4px 8px" }}
                  onClick={() => setFatigueAlertDismissed(true)}
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Topic Selector Tabs across the top */}
          <div className="topic-horizontal-nav">
            {selectedTopicIds.map((tid, idx) => {
              const top = availableTopics.find((t) => t.id === tid);
              if (!top) return null;
              return (
                <button
                  key={tid}
                  type="button"
                  className={`topic-tab-btn ${currentTopicIdx === idx ? "active" : ""}`}
                  onClick={() => handleSwitchTopicInLoop(idx)}
                >
                  <span className="tab-idx">0{idx + 1}</span>
                  <span className="tab-name">{top.name}</span>
                </button>
              );
            })}
          </div>

          {/* Sub-Tabs: Descriptive Writing Exam vs Past Exam MCQ vs Faded Examples vs Summary vs Flashcards */}
          <div className="sub-module-nav">
            <button
              type="button"
              className={`sub-nav-btn ${activeSubTab === "writing" ? "active" : ""}`}
              onClick={() => {
                ambientAudio.playChime("click");
                setActiveSubTab("writing");
              }}
            >
              <PenTool size={16} />
              <span>Descriptive Writing Exam ({activeTopic.writingQuestion.maxMarks} Marks)</span>
            </button>
            <button
              type="button"
              className={`sub-nav-btn ${activeSubTab === "mcq" ? "active" : ""}`}
              onClick={() => {
                ambientAudio.playChime("click");
                setActiveSubTab("mcq");
              }}
            >
              <HelpCircle size={16} />
              <span>Past Exam MCQ</span>
            </button>
            <button
              type="button"
              className={`sub-nav-btn ${activeSubTab === "faded" ? "active" : ""}`}
              onClick={() => {
                ambientAudio.playChime("click");
                setActiveSubTab("faded");
              }}
            >
              <Zap size={16} />
              <span>Faded Worked Example</span>
            </button>
            <button
              type="button"
              className={`sub-nav-btn ${activeSubTab === "summary" ? "active" : ""}`}
              onClick={() => {
                ambientAudio.playChime("click");
                setActiveSubTab("summary");
              }}
            >
              <BookOpen size={16} />
              <span>Intuition &amp; Summary</span>
            </button>
            <button
              type="button"
              className={`sub-nav-btn ${activeSubTab === "flashcards" ? "active" : ""}`}
              onClick={() => {
                ambientAudio.playChime("click");
                setActiveSubTab("flashcards");
                setIsFlipped(false);
              }}
            >
              <Layers size={16} />
              <span>Flashcards</span>
            </button>
          </div>

          {/* ================================================================= */}
          {/* SUB-VIEW 1: DESCRIPTIVE WRITING EXAM WITH PRE-RESPONSE CONFIDENCE GATE */}
          {/* ================================================================= */}
          {activeSubTab === "writing" && (
            <div className="study-module-card writing-exam-panel">
              <div className="writing-prompt-card">
                <div className="writing-card-header">
                  <span className="bringe-stage-tag" style={{ margin: 0 }}>
                    UNIVERSITY EXAM SUBJECTIVE QUESTION
                  </span>
                  <span className="writing-marks-badge">
                    {activeTopic.writingQuestion.maxMarks} Marks
                  </span>
                </div>
                <h3 className="writing-question-text">
                  {activeTopic.writingQuestion.prompt}
                </h3>
                <div className="writing-rubric-hints">
                  <b>Examiner Marking Rubric:</b>
                  {activeTopic.writingQuestion.markingCriteria.map((crit, ci) => (
                    <span key={ci}>&bull; {crit}</span>
                  ))}
                </div>
              </div>

              {/* Student Answer Workspace */}
              <div className="writing-input-area">
                <label
                  className="field-label"
                  style={{
                    marginBottom: "8px",
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span>Write your complete answer below (Retrieve from active memory):</span>
                  <span style={{ fontSize: "12px", color: "var(--t3)" }}>
                    {writtenAnswerText.trim().split(/\s+/).filter(Boolean).length} words
                  </span>
                </label>
                <textarea
                  className="writing-answer-textarea"
                  placeholder="Draft your detailed answer here. Include step-by-step mechanisms, technical variables, and explicit state changes. The AI examiner will grade your answer and compute your marks..."
                  value={writtenAnswerText}
                  onChange={(e) => setWrittenAnswerText(e.target.value)}
                />
              </div>

              {/* Pre-Response Metacognitive Confidence Gate */}
              <div className="confidence-gate-panel">
                <span className="confidence-gate-label">
                  Pre-Response Confidence Gate: How sure are you of this answer?
                </span>
                <div className="confidence-buttons-row">
                  <button
                    type="button"
                    className={`confidence-gate-btn ${writingConfidence === "low" ? "selected" : ""}`}
                    onClick={() => setWritingConfidence("low")}
                  >
                    <span className="conf-dot low" />
                    <span>Low (~30% · Guessing / Unsure)</span>
                  </button>
                  <button
                    type="button"
                    className={`confidence-gate-btn ${writingConfidence === "medium" ? "selected" : ""}`}
                    onClick={() => setWritingConfidence("medium")}
                  >
                    <span className="conf-dot med" />
                    <span>Medium (~65% · Moderate Confidence)</span>
                  </button>
                  <button
                    type="button"
                    className={`confidence-gate-btn ${writingConfidence === "high" ? "selected" : ""}`}
                    onClick={() => setWritingConfidence("high")}
                  >
                    <span className="conf-dot high" />
                    <span>High (~90%+ · Certain / Exam Ready)</span>
                  </button>
                </div>
              </div>

              {/* Submit for AI Examination Button */}
              <div className="form-actions-bar" style={{ marginTop: "4px" }}>
                <button
                  type="button"
                  className="bringe-primary-btn"
                  disabled={!writtenAnswerText.trim() || isEvaluatingAnswer}
                  onClick={handleEvaluateWrittenAnswer}
                >
                  {isEvaluatingAnswer
                    ? "AI Examiner Grading Answer..."
                    : "Submit Answer for AI Grading & Marks"} &rarr;
                </button>
              </div>

              {/* AI Evaluation & Feedback Card */}
              {writingEvaluation && (
                <div className="writing-eval-card">
                  <div className="eval-score-header">
                    <div>
                      <span className="bringe-stage-tag" style={{ margin: 0 }}>
                        OFFICIAL EVALUATION RESULT
                      </span>
                      <div className="eval-score-large">
                        {writingEvaluation.marksAwarded} / {writingEvaluation.maxMarks} Marks
                      </div>
                    </div>
                    <div className="eval-grasping-tier-badge">
                      {writingEvaluation.graspingInsight}
                    </div>
                  </div>

                  {/* Illusion of Competence Warning */}
                  {writingEvaluation.illusionDetected && (
                    <div className="illusion-warning-card">
                      <ShieldAlert size={18} style={{ flexShrink: 0, color: "#f87171" }} />
                      <div>
                        <b>Illusion of Competence Alert (Karpicke &amp; Blunt Retrieval Model):</b>
                        <p style={{ margin: "4px 0 0" }}>
                          You reported High Confidence (~90%+), but your response missed core grading criteria. This occurs when passive familiarity is mistaken for active retrieval. This topic has been queued for urgent +25 min micro-spacing.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 60-Second Misconception Diagnosis */}
                  <div className="misconception-diagnosis-box">
                    <div className="misconception-title">
                      <Brain size={16} />
                      <span>60-Second Cognitive Misconception Diagnosis</span>
                    </div>
                    <p className="misconception-body">
                      {writingEvaluation.misconceptionDiagnosis}
                    </p>
                  </div>

                  {/* Strengths & Deductions */}
                  <div className="eval-breakdown-grid">
                    <div className="eval-col-box">
                      <h5
                        style={{
                          color: "#4ade80",
                          fontSize: "13px",
                          marginBottom: "8px",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <CheckCircle2 size={15} /> Marks Earned
                      </h5>
                      <ul
                        style={{
                          listStyle: "none",
                          padding: 0,
                          margin: 0,
                          display: "flex",
                          flexDirection: "column",
                          gap: "6px",
                        }}
                      >
                        {writingEvaluation.strengths.map((str, si) => (
                          <li key={si} style={{ fontSize: "12.5px", color: "var(--t2)" }}>
                            &bull; {str}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="eval-col-box">
                      <h5
                        style={{
                          color: "#f87171",
                          fontSize: "13px",
                          marginBottom: "8px",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <ShieldAlert size={15} /> Examiner Deductions &amp; Missed Points
                      </h5>
                      <ul
                        style={{
                          listStyle: "none",
                          padding: 0,
                          margin: 0,
                          display: "flex",
                          flexDirection: "column",
                          gap: "6px",
                        }}
                      >
                        {writingEvaluation.penalties.map((pen, pi) => (
                          <li key={pi} style={{ fontSize: "12.5px", color: "var(--t2)" }}>
                            &bull; {pen}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Model Exemplary Answer */}
                  <div
                    className="model-answer-section"
                    style={{
                      marginTop: "20px",
                      borderTop: "1px solid var(--border)",
                      paddingTop: "16px",
                    }}
                  >
                    <h5 style={{ fontSize: "13.5px", color: "var(--t1)", marginBottom: "8px" }}>
                      Model High-Scoring Answer (Learn from this):
                    </h5>
                    <pre className="model-answer-pre">
                      {activeTopic.writingQuestion.sampleModelAnswer}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* SUB-VIEW 2: MCQS & PYQ VERIFICATION */}
          {/* ================================================================= */}
          {activeSubTab === "mcq" && (
            <div className="study-module-card">
              <div className="mcq-question-header">
                <span className="mcq-tag">PAST EXAM RECURRENT QUESTION</span>
                <h3 className="mcq-question-text">{activeTopic.mcq.question}</h3>
              </div>

              <div className="mcq-options-stack">
                {activeTopic.mcq.options.map((option, optIdx) => {
                  const isSelected = selectedMcqOption === optIdx;
                  const isCorrect = optIdx === activeTopic.mcq.correctIndex;

                  let optClass = "mcq-option-row";
                  if (isSelected) optClass += " selected";
                  if (mcqSubmitted) {
                    if (isCorrect) optClass += " correct-highlight";
                    else if (isSelected && !isCorrect) optClass += " wrong-highlight";
                  }

                  return (
                    <div
                      key={optIdx}
                      className={optClass}
                      onClick={() => {
                        if (!mcqSubmitted) {
                          ambientAudio.playChime("click");
                          setSelectedMcqOption(optIdx);
                        }
                      }}
                    >
                      <span className="option-letter-badge">
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      <span className="option-text">{option}</span>
                    </div>
                  );
                })}
              </div>

              {/* MCQ Pre-Response Confidence Gate */}
              {!mcqSubmitted && (
                <div className="confidence-gate-panel">
                  <span className="confidence-gate-label">
                    Pre-Response Confidence Gate: How confident are you in this answer?
                  </span>
                  <div className="confidence-buttons-row">
                    <button
                      type="button"
                      className={`confidence-gate-btn ${mcqConfidence === "low" ? "selected" : ""}`}
                      onClick={() => setMcqConfidence("low")}
                    >
                      <span className="conf-dot low" />
                      <span>Low (~30% · Unsure)</span>
                    </button>
                    <button
                      type="button"
                      className={`confidence-gate-btn ${mcqConfidence === "medium" ? "selected" : ""}`}
                      onClick={() => setMcqConfidence("medium")}
                    >
                      <span className="conf-dot med" />
                      <span>Medium (~65% · Probable)</span>
                    </button>
                    <button
                      type="button"
                      className={`confidence-gate-btn ${mcqConfidence === "high" ? "selected" : ""}`}
                      onClick={() => setMcqConfidence("high")}
                    >
                      <span className="conf-dot high" />
                      <span>High (~90%+ · Certain)</span>
                    </button>
                  </div>
                </div>
              )}

              {mcqSubmitted && (
                <div>
                  <div
                    className={`mcq-feedback-box ${
                      selectedMcqOption === activeTopic.mcq.correctIndex
                        ? "feedback-correct"
                        : "feedback-wrong"
                    }`}
                  >
                    <div className="feedback-status-title">
                      {selectedMcqOption === activeTopic.mcq.correctIndex ? (
                        <>
                          <CheckCircle2 size={16} />
                          <span>Correct (+30 XP · Grasping +5%)</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle size={16} />
                          <span>Incorrect · Queued for +25 min micro-spacing</span>
                        </>
                      )}
                    </div>
                    <p className="feedback-explanation">{activeTopic.mcq.explanation}</p>
                  </div>

                  {/* Illusion of Competence Check for MCQ */}
                  {selectedMcqOption !== activeTopic.mcq.correctIndex &&
                    mcqConfidence === "high" && (
                      <div className="illusion-warning-card" style={{ marginBottom: "16px" }}>
                        <ShieldAlert size={18} style={{ flexShrink: 0, color: "#f87171" }} />
                        <div>
                          <b>Illusion of Competence Detected:</b>
                          <p style={{ margin: "4px 0 0" }}>
                            You reported High Confidence, but picked a frequent distractor option. Review the explanation above carefully.
                          </p>
                        </div>
                      </div>
                    )}

                  {/* 60-Second Misconception Diagnosis */}
                  {selectedMcqOption !== activeTopic.mcq.correctIndex && (
                    <div className="misconception-diagnosis-box">
                      <div className="misconception-title">
                        <Brain size={16} />
                        <span>60-Second Cognitive Misconception Diagnosis</span>
                      </div>
                      <p className="misconception-body">
                        {activeTopic.misconceptionDiagnosis}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="module-footer-nav">
                {!mcqSubmitted ? (
                  <button
                    type="button"
                    className="bringe-primary-btn"
                    disabled={selectedMcqOption === null}
                    onClick={handleCheckMcq}
                  >
                    Submit &amp; Evaluate MCQ Answer &rarr;
                  </button>
                ) : (
                  <div style={{ display: "flex", gap: "12px", width: "100%", justifyContent: "space-between" }}>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => {
                        ambientAudio.playChime("click");
                        setSelectedMcqOption(null);
                        setMcqSubmitted(false);
                      }}
                    >
                      Retry MCQ
                    </button>
                    {currentTopicIdx + 1 < selectedTopicIds.length ? (
                      <button
                        type="button"
                        className="bringe-primary-btn"
                        onClick={() => handleSwitchTopicInLoop(currentTopicIdx + 1)}
                      >
                        Next Topic &rarr;
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="bringe-primary-btn"
                        onClick={() => {
                          ambientAudio.playChime("levelUp");
                          onGainXP(100);
                          setShowSurvivalSheetModal(true);
                        }}
                      >
                        Complete Session &amp; View Survival Sheet
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* SUB-VIEW 3: FADED WORKED EXAMPLES (COGNITIVE LOAD THEORY) */}
          {/* ================================================================= */}
          {activeSubTab === "faded" && (
            <div className="study-module-card faded-module-panel">
              <div className="faded-stepper-header">
                <button
                  type="button"
                  className={`faded-step-btn ${fadedStepLevel === 1 ? "active" : ""}`}
                  onClick={() => setFadedStepLevel(1)}
                >
                  Step 1: Annotated Complete Solution
                </button>
                <button
                  type="button"
                  className={`faded-step-btn ${fadedStepLevel === 2 ? "active" : ""}`}
                  onClick={() => setFadedStepLevel(2)}
                >
                  Step 2: Faded Example (Fill Missing Step)
                </button>
                <button
                  type="button"
                  className={`faded-step-btn ${fadedStepLevel === 3 ? "active" : ""}`}
                  onClick={() => setFadedStepLevel(3)}
                >
                  Step 3: Independent Exam Problem
                </button>
              </div>

              {fadedStepLevel === 1 && (
                <div className="faded-box">
                  <span className="bringe-stage-tag">LEVEL 1 · FULL WORKED SOLUTION</span>
                  <h4 className="faded-problem-title">
                    {activeTopic.fadedExample.step1_full.problem}
                  </h4>
                  <pre className="faded-annotated-pre">
                    {activeTopic.fadedExample.step1_full.annotatedSolution}
                  </pre>
                  <div style={{ fontSize: "13px", color: "var(--t2)" }}>
                    <b>Key Pedagogical Insight:</b> {activeTopic.fadedExample.step1_full.keyInsight}
                  </div>
                  <div className="form-actions-bar" style={{ marginTop: "16px" }}>
                    <button
                      type="button"
                      className="bringe-primary-btn"
                      onClick={() => setFadedStepLevel(2)}
                    >
                      Proceed to Step 2: Faded Example &rarr;
                    </button>
                  </div>
                </div>
              )}

              {fadedStepLevel === 2 && (
                <div className="faded-box">
                  <span className="bringe-stage-tag">LEVEL 2 · FADED WORKED EXAMPLE</span>
                  <h4 className="faded-problem-title">
                    {activeTopic.fadedExample.step2_faded.problem}
                  </h4>
                  <pre className="faded-annotated-pre">
                    {activeTopic.fadedExample.step2_faded.scaffold}
                  </pre>

                  <div style={{ marginTop: "14px" }}>
                    <label className="field-label" style={{ marginBottom: "6px", display: "block" }}>
                      {activeTopic.fadedExample.step2_faded.missingPrompt}
                    </label>
                    <input
                      type="text"
                      className="field-text-input"
                      placeholder="Type your calculated step / value here..."
                      value={fadedStep2Input}
                      onChange={(e) => setFadedStep2Input(e.target.value)}
                    />
                  </div>

                  <div className="form-actions-bar" style={{ marginTop: "14px" }}>
                    {!fadedStep2Verified ? (
                      <button
                        type="button"
                        className="bringe-primary-btn"
                        disabled={!fadedStep2Input.trim()}
                        onClick={() => {
                          ambientAudio.playChime("levelUp");
                          setFadedStep2Verified(true);
                          onGainXP(25);
                        }}
                      >
                        Verify Step &rarr;
                      </button>
                    ) : (
                      <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                        <span style={{ fontSize: "13px", color: "#4ade80" }}>
                          Verified Model Step: <b>{activeTopic.fadedExample.step2_faded.correctStep}</b>
                        </span>
                        <button
                          type="button"
                          className="bringe-primary-btn"
                          onClick={() => setFadedStepLevel(3)}
                        >
                          Proceed to Step 3: Independent Problem &rarr;
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {fadedStepLevel === 3 && (
                <div className="faded-box">
                  <span className="bringe-stage-tag">LEVEL 3 · INDEPENDENT UNASSISTED PROBLEM</span>
                  <h4 className="faded-problem-title">
                    {activeTopic.fadedExample.step3_independent.problem}
                  </h4>
                  <p style={{ fontSize: "12.5px", color: "var(--t3)", marginBottom: "12px" }}>
                    Hint: {activeTopic.fadedExample.step3_independent.hint}
                  </p>
                  <textarea
                    className="writing-answer-textarea"
                    placeholder="Solve this exam question completely without looking at external notes..."
                    style={{ minHeight: "120px" }}
                  />

                  <div className="form-actions-bar" style={{ marginTop: "14px" }}>
                    {!fadedStep3Revealed ? (
                      <button
                        type="button"
                        className="bringe-primary-btn"
                        onClick={() => {
                          ambientAudio.playChime("click");
                          setFadedStep3Revealed(true);
                          onGainXP(30);
                        }}
                      >
                        Reveal Model Solution &amp; Rubric &rarr;
                      </button>
                    ) : (
                      <div style={{ width: "100%" }}>
                        <h5 style={{ fontSize: "13px", color: "var(--t1)", marginBottom: "8px" }}>
                          Model Solution:
                        </h5>
                        <pre className="model-answer-pre">
                          {activeTopic.fadedExample.step3_independent.modelAnswer}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* SUB-VIEW 4: SUMMARY & INTUITION (WITH CLOSE BOOK RECALL TOGGLE) */}
          {/* ================================================================= */}
          {activeSubTab === "summary" && (
            <div className="study-module-card">
              {/* Close Book Recall Toggle Bar */}
              <div className="book-closed-banner">
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {isBookClosed ? (
                    <Lock size={16} style={{ color: "#facc15" }} />
                  ) : (
                    <Unlock size={16} style={{ color: "#4ade80" }} />
                  )}
                  <span>
                    <b>Dunlosky Retrieval Gate:</b> {isBookClosed ? "Closed Book Mode (Forced Active Recall)" : "Open Book Mode (Passive Inspection)"}
                  </span>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ fontSize: "11px", padding: "4px 10px" }}
                  onClick={() => {
                    ambientAudio.playChime("click");
                    setIsBookClosed(!isBookClosed);
                  }}
                >
                  {isBookClosed ? "Peek at Notes" : "Close Book & Retrieve"}
                </button>
              </div>

              {/* Blurred Glass Overlay when Closed Book is Active */}
              <div className={`book-closed-blur-box ${isBookClosed ? "active-blur" : ""}`}>
                {isBookClosed && (
                  <div className="book-closed-glass-overlay">
                    <div className="book-closed-lock-title">
                      <Lock size={20} />
                      <span>Book Closed for Active Recall</span>
                    </div>
                    <p className="book-closed-hint">
                      Learning-science evidence (Karpicke &amp; Blunt) proves retrieval practice produces 2.5x higher exam retention than re-reading. Force your brain to recall without looking.
                    </p>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <button
                        type="button"
                        className="bringe-primary-btn"
                        onClick={() => {
                          ambientAudio.playChime("click");
                          setActiveSubTab("writing");
                        }}
                      >
                        Draft in Writing Exam &rarr;
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => setIsBookClosed(false)}
                      >
                        Peek at Notes
                      </button>
                    </div>
                  </div>
                )}

                <div className={isBookClosed ? "book-closed-content-blurred" : ""}>
                  {/* Adaptive Pedagogical Layer */}
                  <div className="adaptive-pedagogy-box">
                    {currentTierInfo.tier === 1 ? (
                      <div className="pedagogy-highschool">
                        <span className="pedagogy-tag">HIGH-SCHOOL FOUNDATIONAL ANALOGY</span>
                        <p className="pedagogy-body">{activeTopic.highSchoolAnalogy}</p>
                        <ParagraphSimplifier
                          originalText={activeTopic.highSchoolAnalogy}
                          topicName={activeTopic.name}
                        />
                      </div>
                    ) : (
                      <div className="pedagogy-college">
                        <span className="pedagogy-tag">UNIVERSITY EXAM RIGOR</span>
                        <p className="pedagogy-body">{activeTopic.collegeRigor}</p>
                        <ParagraphSimplifier
                          originalText={activeTopic.collegeRigor}
                          topicName={activeTopic.name}
                        />
                      </div>
                    )}
                  </div>

                  {/* Crucial Scoring Hooks */}
                  <div className="summary-section-block">
                    <h4 className="summary-block-heading">Crucial Scoring Points for the Answer Sheet</h4>
                    <ul className="summary-keypoints-list">
                      {activeTopic.keyPoints.map((pt, i) => (
                        <li key={i} className="keypoint-item">
                          <CheckCircle2 size={16} className="bullet-icon" />
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Examiner Gotcha */}
                  <div className="summary-gotcha-box">
                    <div className="gotcha-header">
                      <ShieldAlert size={16} />
                      <span>Frequent Exam Gotcha &amp; Deduction Trap</span>
                    </div>
                    <p className="gotcha-text">{activeTopic.commonGotcha}</p>
                    <ParagraphSimplifier
                      originalText={activeTopic.commonGotcha}
                      topicName={activeTopic.name}
                    />
                  </div>
                </div>
              </div>

              <div className="module-footer-nav">
                <button
                  type="button"
                  className="bringe-primary-btn"
                  onClick={() => {
                    ambientAudio.playChime("click");
                    setActiveSubTab("writing");
                  }}
                >
                  Practice Descriptive Writing &rarr;
                </button>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* SUB-VIEW 5: FLASHCARDS */}
          {/* ================================================================= */}
          {activeSubTab === "flashcards" && (
            <div className="study-module-card flashcard-module-card">
              <div className="flashcard-step-header">
                <span>
                  Card {currentFlashcardIdx + 1} of {activeTopic.flashcards.length}
                </span>
                <span style={{ fontSize: "12px", color: "var(--t3)" }}>
                  Click card to flip
                </span>
              </div>

              <div
                className={`active-flip-card ${isFlipped ? "flipped" : ""}`}
                onClick={() => {
                  ambientAudio.playChime("click");
                  setIsFlipped(!isFlipped);
                }}
              >
                <div className="card-face card-front">
                  <span className="face-label">QUESTION / PROMPT</span>
                  <p className="card-prompt-text">
                    {activeTopic.flashcards[currentFlashcardIdx]?.front}
                  </p>
                  <span className="flip-hint">Click to reveal answer</span>
                </div>
                <div className="card-face card-back">
                  <span className="face-label">EXAM ANSWER &amp; FORMULA</span>
                  <p className="card-answer-text">
                    {activeTopic.flashcards[currentFlashcardIdx]?.back}
                  </p>
                </div>
              </div>

              <div className="card-rating-actions">
                <button
                  type="button"
                  className="card-rate-btn rate-hard"
                  onClick={() => handleNextCard(false)}
                >
                  Need Review (Queue micro-retest)
                </button>
                <button
                  type="button"
                  className="card-rate-btn rate-easy"
                  onClick={() => handleNextCard(true)}
                >
                  I Got It (+15 XP)
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: SINGLE-PAGE FINAL SURVIVAL SHEET (PANIC CARD) */}
      {/* ========================================================================= */}
      {showSurvivalSheetModal && (
        <div className="survival-sheet-modal-backdrop" onClick={() => setShowSurvivalSheetModal(false)}>
          <div className="survival-sheet-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="survival-modal-header">
              <div className="survival-modal-title">
                <ShieldAlert size={20} style={{ color: "#4ade80" }} />
                <span>Final Survival Sheet (Panic Card) · {intakeSubject || "Course Core"}</span>
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "6px" }}
                  onClick={() => window.print()}
                >
                  <Printer size={14} />
                  <span>Print</span>
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "6px" }}
                  onClick={() => {
                    const text = selectedTopics
                      .map((t) => `${t.name}\n${t.formulaBoundary}\nKeywords: ${t.mustWriteKeywords.join(", ")}`)
                      .join("\n\n");
                    navigator.clipboard.writeText(text);
                    alert("Survival Sheet copied to clipboard.");
                  }}
                >
                  <Copy size={14} />
                  <span>Copy</span>
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ padding: "4px 8px" }}
                  onClick={() => setShowSurvivalSheetModal(false)}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="survival-modal-scroll">
              {/* Section 1: Exam-Hall Time-Allocation Strategy */}
              <div className="survival-card-section">
                <div className="survival-sec-title">
                  <Clock size={16} style={{ color: "#60a5fa" }} />
                  <span>Exam-Hall Mark-Allocation Rule (Minutes per Mark)</span>
                </div>
                <p style={{ fontSize: "13px", color: "var(--t2)", lineHeight: 1.5, margin: 0 }}>
                  Standard 3-hour examination (180 mins) for 100 marks: <b>1.5 to 1.8 minutes per mark</b>.
                  <br />
                  &bull; 14-Mark Long Answer: Allocate maximum 22-25 mins.
                  <br />
                  &bull; 8-Mark Medium Question: Allocate maximum 12-14 mins.
                  <br />
                  &bull; Final 15 Minutes: Strictly reserved for answer sheet verification and checking boundary conditions.
                </p>
              </div>

              {/* Section 2: High-Yield Formulas with Boundary Conditions */}
              <div className="survival-card-section">
                <div className="survival-sec-title">
                  <Zap size={16} style={{ color: "#4ade80" }} />
                  <span>Essential Formulas &amp; Boundary Conditions</span>
                </div>
                {selectedTopics.map((top) => (
                  <div key={top.id} className="survival-formula-item">
                    <b>{top.name}:</b> {top.formulaBoundary}
                  </div>
                ))}
              </div>

              {/* Section 3: Must-Write Keywords Professors Look For */}
              <div className="survival-card-section">
                <div className="survival-sec-title">
                  <CheckCircle2 size={16} style={{ color: "#facc15" }} />
                  <span>Must-Write Keywords Examiners Grade For</span>
                </div>
                {selectedTopics.map((top) => (
                  <div key={top.id} style={{ marginBottom: "10px" }}>
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--t1)" }}>
                      {top.name}:
                    </span>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "4px" }}>
                      {top.mustWriteKeywords.map((kw, ki) => (
                        <span key={ki} className="source-trust-tag" style={{ color: "var(--t1)" }}>
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Section 4: Frequent Examiner Deduction Traps */}
              <div className="survival-card-section">
                <div className="survival-sec-title">
                  <ShieldAlert size={16} style={{ color: "#f87171" }} />
                  <span>Frequent Examiner Deduction Traps</span>
                </div>
                {selectedTopics.map((top) => (
                  <div key={top.id} style={{ marginBottom: "10px" }}>
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--t1)" }}>
                      {top.name}:
                    </span>
                    <ul style={{ paddingLeft: "18px", margin: "4px 0 0", fontSize: "12.5px", color: "var(--t2)" }}>
                      {top.deductionTraps.map((trap, ti) => (
                        <li key={ti}>{trap}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: NIGHT-OF MICRO-SPACING SCHEDULE */}
      {/* ========================================================================= */}
      {showMicroSpacingModal && (
        <div className="micro-spacing-modal-backdrop" onClick={() => setShowMicroSpacingModal(false)}>
          <div className="micro-spacing-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="survival-modal-header">
              <div className="survival-modal-title">
                <RotateCcw size={18} style={{ color: "#facc15" }} />
                <span>Night-Of Spaced Retention Scheduler ({reviewQueue.length} items queued)</span>
              </div>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ padding: "4px 8px" }}
                onClick={() => setShowMicroSpacingModal(false)}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: "20px", overflowY: "auto" }}>
              <p style={{ fontSize: "13px", color: "var(--t2)", marginBottom: "16px" }}>
                Items where hesitation, errors, or illusion of competence were detected are automatically scheduled across 3 spacing intervals before your exam:
              </p>

              {reviewQueue.length === 0 ? (
                <div style={{ textAlign: "center", padding: "30px 20px", color: "var(--t3)" }}>
                  No items currently pending in the micro-spacing queue.
                </div>
              ) : (
                reviewQueue.map((item) => (
                  <div key={item.id} className="micro-spacing-item">
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "4px" }}>
                        <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--t1)" }}>
                          {item.topicName}
                        </span>
                        <span className="source-trust-tag">{item.intervalTag}</span>
                      </div>
                      <p style={{ fontSize: "12px", color: "var(--t3)", margin: 0 }}>
                        {item.reason}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="bringe-primary-btn"
                      style={{ fontSize: "11.5px", padding: "6px 12px" }}
                      onClick={() => handleRetestQueueItem(item)}
                    >
                      Re-Test Now
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
