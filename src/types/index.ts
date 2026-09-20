export type NavigationTab =
  | "discovery"
  | "bridge"
  | "study-path"
  | "share"
  | "settings"
  | "ai-taking"
  | "long-term"
  | "binge"
  | "uploading";

export interface StudyPathIsland {
  id: string;
  title: string;
  category: string;
  status: "locked" | "unlocked" | "completed";
  level: number;
  xpReward: number;
  estMinutes: number;
  description: string;
  keyConcepts: string[];
  prerequisites?: string[];
  addedFromDiscovery?: boolean;
}

export interface DiscoveryResult {
  query: string;
  title: string;
  level: string;
  summary: string;
  prerequisites: string[];
  keyConcepts: string[];
  examHook: string;
  estMinutes: number;
  confidenceMatch: number;
}

export interface StudentInitialData {
  name: string;
  hoursPerDay: number;
  interests: string[];
  difficulties: string[];
  learningStyle: "visual" | "reading" | "practice" | "auditory" | "mixed";
  confidenceBySubject: Record<string, number>;
  conceptGraspingSpeed: "examples-first" | "theory-first";
  focusDurationMin: number;
  examTimeline: string;
  targetScore: string;
  createdAt: string;
}

export interface AntigravitySkill {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  triggers: string[];
  path: string;
}

export interface LearningTwinProfile {
  id: string;
  name: string;
  avatar: string;
  level: number;
  xp: number;
  nextLevelXp: number;
  streakDays: number;
  focusSpanMinutes: number;
  chronotype: "Night Owl" | "Morning Lark" | "Balanced";
  speedFactor: number;
  retentionEstimate: number;
  weakStyle: "Numericals" | "Theory" | "Definitions" | "Diagrams";
  prefers: "Examples-First" | "Test-First" | "Step-by-Step";
  procrastinationIndex: number;
  panicSeed: number;
  calibration: string;
}

export interface ExamRescueSession {
  examName: string;
  subjectCode: string;
  targetDate: string;
  hoursRemaining: number;
  passConfidence: number;
  confidenceRange: [number, number];
  passScoreTarget: number;
  expectedScore: number;
  passConfidenceDriver: string;
  passCoreCount: number;
  totalTopics: number;
  studyTimeHours: string;
  sleepWindow: string;
  skippedTopicsCount: number;
  skippedReason: string;
}

export interface StudyBlock {
  id: string;
  type: "LEARN" | "RECALL" | "BREAK" | "BUILD_SHEET" | "FINAL_SWEEP" | "SLEEP";
  topicId: string;
  topicTitle: string;
  depthLevel: "L0" | "L1" | "L2" | "L3";
  durationMinutes: number;
  status: "completed" | "in_progress" | "pending";
  pAppear: number;
  avgMarks: number;
  whyThis: string;
  notes: {
    l30s: {
      definition: string;
      bullets: string[];
      examHook: string;
    };
    l3m: {
      explanation: string;
      workedExample: string;
      formulaOrSteps: string[];
      commonMistakes: string[];
      howToWriteAnswer: { marks: number; structure: string };
      likelyQuestions: string[];
    };
    deep?: {
      edgeCases: string[];
      proofOrOrigin: string;
    };
    citations: string[];
  };
  quiz: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
    conceptTrap: string;
  };
}

export interface SkillNode {
  id: string;
  title: string;
  category: "Core Database" | "Architecture" | "Query Tuning" | "Security" | "Distributed";
  level: number;
  xpReward: number;
  status: "mastered" | "available" | "locked";
  prerequisites: string[];
  description: string;
  masteryPercent: number;
  difficulty: "Easy" | "Medium" | "Hard";
}

export interface MistakeEntry {
  id: string;
  concept: string;
  examType: string;
  errorType: "concept" | "careless" | "calculation" | "misread";
  why: string;
  fixPath: string;
  loggedAt: string;
  retested: boolean;
}

export interface CommunityResource {
  id: string;
  title: string;
  topic: string;
  type: "Notes" | "PYQ Solutions" | "Cheat Sheet" | "Mindmap" | "Mnemonics";
  author: {
    name: string;
    reputation: number;
    badge: string;
  };
  pagesOrDuration: string;
  upvotes: number;
  userVoted?: boolean;
  downloads: number;
  verified: "AI & Peer Verified" | "Peer Verified" | "Provisional";
  summary: string;
  commentsCount: number;
  timestamp: string;
  tags: string[];
}

export interface ResourceComment {
  id: string;
  resourceId: string;
  author: string;
  avatar: string;
  role: string;
  text: string;
  upvotes: number;
  timestamp: string;
  badge?: string;
}

export interface NoteTakingMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  generatedNotes?: {
    topic: string;
    bullets: string[];
    keyFormula?: string;
    examTrap?: string;
  };
}
