import { z } from "zod";

const uuid = z.string().uuid();
const targetSchema = z.object({
  type: z.enum(["pass", "percent", "custom"]).default("pass"),
  percent: z.number().min(1).max(100).optional(),
}).default({ type: "pass" });

export const createExamSchema = z.object({
  title: z.string().trim().min(1).max(160),
  subject: z.string().trim().min(1).max(120),
  domain: z.string().trim().max(120).optional(),
  board: z.string().trim().max(160).optional(),
  exam_start: z.string().datetime({ offset: true }),
  duration_min: z.number().int().min(15).max(720),
  target: targetSchema,
  pass_percent: z.number().min(1).max(100).default(40),
  safety_margin: z.number().min(0).max(30).default(8),
  total_marks: z.number().positive().max(1000).default(100),
  pattern: z.object({ sections: z.array(z.object({
    name: z.string().min(1).max(80),
    count: z.number().int().positive().optional(),
    attempt_k: z.number().int().positive().optional(),
    marks_each: z.number().positive().optional(),
  })).max(20) }).optional(),
  negative_marking: z.boolean().default(false),
});

export const createSessionSchema = z.object({
  exam_id: uuid,
  mode: z.enum(["EMERGENCY", "SPRINT", "STANDARD", "EXTENDED"]).optional(),
});

export const behaviorSchema = z.object({
  session_id: uuid,
  answers: z.object({
    focus_span_min: z.number().int().min(5).max(180),
    chronotype: z.enum(["morning", "afternoon", "evening", "night"]),
    prefers: z.enum(["video", "reading", "practice", "examples", "explaining"]),
    prior_coverage: z.number().min(0).max(1),
    panic_index: z.number().min(0).max(1),
    distraction: z.enum(["low", "medium", "high"]),
    declared_hours: z.number().positive().max(72),
    weak_style: z.enum(["memorizing", "numericals", "diagrams", "long_answers", "theory"]),
  }),
});

export const blockActionSchema = z.object({ actual_min: z.number().min(0).max(300).optional() });
export const adjustSchema = z.object({
  extra_minutes: z.number().int().min(-720).max(720).optional(),
  leave_at: z.string().datetime({ offset: true }).optional(),
  target: targetSchema.optional(),
}).refine((value) => Object.keys(value).length > 0, "Provide at least one adjustment.");
export const attemptSchema = z.object({
  quiz_item_id: uuid,
  response: z.union([z.string().max(4000), z.number(), z.boolean()]),
  time_ms: z.number().int().min(0).max(3_600_000),
  hints: z.number().int().min(0).max(10).default(0),
  confidence_self: z.number().int().min(1).max(5).optional(),
});
export const noteTransformSchema = z.object({
  action: z.enum(["simplify", "translate", "example"]),
  text: z.string().trim().min(1).max(6000),
  lang: z.enum(["en", "ml", "hi", "ta"]).default("en"),
});
export const tutorSchema = z.object({
  topic_id: uuid,
  question: z.string().trim().min(1).max(1000),
  mode: z.enum(["normal", "panic"]).default("normal"),
});
export const uploadSignSchema = z.object({
  exam_id: uuid,
  kind: z.enum(["syllabus", "pyq", "notes", "textbook", "other"]),
  mime: z.enum(["application/pdf", "image/png", "image/jpeg", "image/webp", "text/plain", "text/markdown"]),
  filename: z.string().trim().min(1).max(160),
  sha256: z.string().regex(/^[a-f0-9]{64}$/i).optional(),
});
export const uploadCompleteSchema = z.object({ document_id: uuid });
export const flashcardReviewSchema = z.object({ result: z.enum(["right", "wrong"]) });
export const onboardingSchema = z.object({
  display_name: z.string().trim().min(1).max(80).optional(),
  hours_per_day: z.number().min(.5).max(16),
  interests: z.array(z.string().trim().min(1).max(80)).min(1).max(8),
  difficulties: z.string().trim().min(1).max(600),
  learning_style: z.enum(["visual", "reading", "practice", "auditory", "mixed"]),
  next_exam: z.string().datetime({ offset: true }).optional(),
  confidence_by_subject: z.record(z.string().min(1).max(80), z.number().int().min(1).max(10)).default({}),
  best_time: z.enum(["morning", "afternoon", "evening", "night"]),
  focus_span_min: z.number().int().min(5).max(180),
  distraction: z.enum(["low", "medium", "high"]),
  preferred_feedback: z.enum(["direct", "encouraging", "detailed"]),
  recent_study_consistency: z.enum(["rarely", "some_days", "most_days"]),
});
export const deepLearnChatSchema = z.object({ topic_id: z.string().uuid().optional(), question: z.string().trim().min(1).max(1200) });
export const learningPathRequestSchema = z.object({ goal: z.string().trim().min(1).max(400), days: z.number().int().min(1).max(90), minutes_per_day: z.number().int().min(10).max(480) });
export const resourceSearchSchema = z.object({ topic: z.string().trim().min(2).max(120), language: z.string().trim().min(2).max(80).default("English") });
export const pathResourceSchema = z.object({
  topic: z.string().trim().min(2).max(120), level: z.enum(["beginner", "intermediate", "advanced"]),
  resource: z.object({ id: z.string().min(1).max(160), title: z.string().min(1).max(140), provider: z.string().min(1).max(80), url: z.string().url(), kind: z.enum(["video", "guide", "lab", "project"]), language: z.string().max(80), duration: z.string().max(60), description: z.string().max(360), project: z.string().max(360).optional() }),
});
export const learningActivitySchema = z.object({ path_item_id: z.string().uuid().optional(), type: z.enum(["resource_opened", "resource_completed", "quiz_answer", "focus_end", "hint_used", "path_skipped"]), duration_ms: z.number().int().min(0).max(28_800_000).optional(), correct: z.boolean().optional(), progress: z.number().min(0).max(1).optional() });
export const quickCramSchema = z.object({ topic: z.string().trim().min(2).max(160), hours_remaining: z.number().min(.5).max(72), language: z.string().trim().min(2).max(80).default("English"), study_mode: z.enum(["read", "write", "practice", "mixed"]).default("mixed"), session_id: z.string().uuid().optional() });
export const quickCramFeedbackSchema = z.object({
  topic: z.string().trim().min(2).max(160),
  preferred_format: z.enum(["read", "write", "practice", "mixed"]),
  correct_ratio: z.number().min(0).max(1),
  time_spent_min: z.number().min(1).max(360),
  needs_repetition: z.boolean(),
});
export const behaviorFeedbackSchema = z.object({
  session_id: z.string().uuid(),
  preferred_format: z.enum(["read", "write", "watch", "practice", "mixed"]).optional(),
  confidence: z.number().int().min(1).max(10).optional(),
  energy: z.enum(["low", "steady", "high"]).optional(),
  feels_difficult: z.boolean().optional(),
  needs_repetition: z.boolean().optional(),
  time_spent_min: z.number().min(1).max(360).optional(),
  correct_ratio: z.number().min(0).max(1).optional(),
});
export const evaluationSubmitSchema = z.object({ answers: z.array(z.object({ quiz_item_id: z.string().uuid(), response: z.union([z.string().max(4000), z.number().int().min(0).max(3)]), time_ms: z.number().int().min(0).max(3_600_000) })).min(1).max(10) });
