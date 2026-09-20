export type LearningFormat = "read" | "write" | "watch" | "practice" | "mixed";

export type BehaviorObservation = {
  preferred_format?: LearningFormat;
  confidence?: number;
  energy?: "low" | "steady" | "high";
  feels_difficult?: boolean;
  needs_repetition?: boolean;
  time_spent_min?: number;
  correct_ratio?: number;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function analyzeLearningBehavior(current: Record<string, unknown>, observation: BehaviorObservation) {
  const alpha = .3;
  const previousRetention = Number(current.retention_est ?? .5);
  const previousSpeed = Number(current.speed_factor ?? 1);
  const correctRatio = observation.correct_ratio;
  const retention = correctRatio === undefined ? previousRetention : clamp((1 - alpha) * previousRetention + alpha * correctRatio, .1, .98);
  const expectedMinutes = Number(current.focus_span_min ?? 25);
  const speed = observation.time_spent_min ? clamp((1 - alpha) * previousSpeed + alpha * (expectedMinutes / Math.max(5, observation.time_spent_min)), .6, 1.5) : previousSpeed;
  const preferred = observation.preferred_format ?? (current.prefers as LearningFormat | undefined) ?? "mixed";
  const fatigue = observation.energy === "low" || observation.feels_difficult || observation.needs_repetition;
  const focusSpan = clamp(Math.round(Number(current.focus_span_min ?? 25) * (fatigue ? .85 : 1.03)), 10, 60);
  const questionStyle = retention < .5 || observation.confidence !== undefined && observation.confidence <= 4 ? "direct" : retention > .75 && !fatigue ? "indirect" : "mixed";
  const contentFormat = fatigue ? "short note + one example" : preferred === "watch" ? "short video + 3 recall questions" : preferred === "write" ? "answer skeleton + write-from-memory prompt" : preferred === "practice" ? "worked problem + rapid quiz" : preferred === "read" ? "layered note + recall card" : "layered note + one practice question";
  const metrics = {
    ...current,
    prefers: preferred,
    retention_est: Number(retention.toFixed(3)),
    speed_factor: Number(speed.toFixed(3)),
    focus_span_min: focusSpan,
    confidence_self: observation.confidence ?? current.confidence_self ?? 5,
    last_energy: observation.energy ?? current.last_energy ?? "steady",
    learning_events: Number(current.learning_events ?? 0) + 1,
  };
  return {
    metrics,
    adaptation: {
      content_format: contentFormat,
      question_style: questionStyle,
      focus_block_min: focusSpan,
      next_action: fatigue ? "Take one short block, then do a 3-question recall check." : "Continue with the next highest-value topic and verify it with recall.",
      reason: fatigue ? "The plan was shortened after your feedback to protect attention." : `The next step uses your ${preferred} preference and latest performance.`,
    },
  };
}

export function userDataText(profile: Record<string, unknown>, twin: Record<string, unknown>) {
  return [
    "SARVAJNA USER DATA EXPORT",
    `Generated: ${new Date().toISOString()}`,
    "",
    "PROFILE",
    JSON.stringify(profile, null, 2),
    "",
    "LEARNING TWIN",
    JSON.stringify(twin, null, 2),
    "",
    "This file is a private export of your Sarvajna data.",
  ].join("\n");
}
