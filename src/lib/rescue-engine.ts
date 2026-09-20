export type TopicInput = {
  id: string;
  title: string;
  unit: string | null;
  complexity: number;
  pAppear: number;
  avgMarks: number;
  expectedMarks: number;
  mastery: number;
};

export type TriageItem = TopicInput & {
  depth: "L1" | "L2";
  minutes: number;
  gain: number;
  density: number;
  priority: "MUST" | "SHOULD" | "NICE";
  reason: string;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const normalCdf = (value: number) => 0.5 * (1 + erf(value / Math.sqrt(2)));
const erf = (value: number) => {
  const sign = value < 0 ? -1 : 1;
  const absolute = Math.abs(value);
  const t = 1 / (1 + 0.3275911 * absolute);
  const polynomial = (((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t);
  return sign * (1 - polynomial * Math.exp(-absolute * absolute));
};

export function deriveMode(hoursLeft: number) {
  if (hoursLeft < 4) return "EMERGENCY";
  if (hoursLeft < 10) return "SPRINT";
  if (hoursLeft <= 30) return "STANDARD";
  return "EXTENDED";
}

export function focusMinutes(hoursLeft: number, declaredHours?: number) {
  const available = Math.min(hoursLeft, declaredHours ?? hoursLeft);
  const sleep = hoursLeft < 5 ? 0 : hoursLeft < 10 ? 4.5 : hoursLeft < 14 ? 6 : 7;
  const remaining = Math.max(0, available - sleep);
  return Math.floor(remaining * 60 * 0.88 * (hoursLeft < 10 ? 0.75 : 0.85));
}

export function triageTopics(topics: TopicInput[], studyMinutes: number, passPercent: number, totalMarks: number, diagnosticSkipped: boolean) {
  const scored = topics.map((topic): TriageItem => {
    const mastery = clamp(topic.mastery, 0, 1);
    const minutes = clamp(Math.round((20 * topic.complexity / 3) * (1 - 0.6 * mastery)), 8, 150);
    const gain = topic.pAppear * topic.avgMarks * (Math.min(0.55, mastery + (0.55 - mastery) * 0.9) - mastery);
    return {
      ...topic,
      minutes,
      gain,
      density: gain / minutes,
      depth: "L1",
      priority: "NICE",
      reason: `Estimated ${Math.round(topic.pAppear * 100)}% appearance probability; average ${topic.avgMarks.toFixed(1)} marks.`,
    };
  }).sort((first, second) => second.density - first.density || first.title.localeCompare(second.title));

  let used = 0;
  const selected: TriageItem[] = [];
  for (const item of scored) {
    if (used + item.minutes > studyMinutes * 0.75 && selected.length > 0) continue;
    selected.push({ ...item, priority: "MUST" });
    used += item.minutes;
  }
  const expectedScore = selected.reduce((sum, item) => sum + item.expectedMarks * Math.min(0.55, item.mastery + (0.55 - item.mastery) * 0.9), 0);
  const variance = selected.reduce((sum, item) => sum + item.avgMarks ** 2 * (item.pAppear * (1 - item.pAppear) * 0.55 ** 2 + 0.04 * item.pAppear), 0);
  const sigma = Math.sqrt(variance) * (diagnosticSkipped ? 1.25 : 1);
  const passScore = totalMarks * passPercent / 100;
  const confidence = sigma > 0 ? normalCdf((expectedScore - passScore) / sigma) : expectedScore >= passScore ? 1 : 0;

  return {
    selected,
    skipped: scored.filter((item) => !selected.some((chosen) => chosen.id === item.id)),
    expectedScore: Number(expectedScore.toFixed(2)),
    sigma: Number(sigma.toFixed(2)),
    passConfidence: Number(clamp(confidence, 0, 0.75).toFixed(3)),
    status: expectedScore >= passScore ? "ACHIEVABLE" : "UNREACHABLE",
    studyMinutes: used,
  };
}

export function makePlan(selection: TriageItem[], start: Date, examStart: Date, focusSpan: number) {
  const workBlock = focusSpan <= 20 ? 15 : focusSpan <= 35 ? 25 : 40;
  const breakBlock = focusSpan <= 20 ? 5 : focusSpan <= 35 ? 5 : 10;
  let cursor = new Date(start);
  const blocks: Array<{ seq: number; type: string; topic_id: string | null; depth: string | null; start_at: string; planned_min: number; done_condition: string; why: string }> = [];
  const add = (type: string, topic: TriageItem | null, minutes: number, doneCondition: string, why: string) => {
    const startAt = new Date(cursor);
    cursor = new Date(cursor.getTime() + minutes * 60_000);
    blocks.push({ seq: blocks.length + 1, type, topic_id: topic?.id ?? null, depth: topic?.depth ?? null, start_at: startAt.toISOString(), planned_min: minutes, done_condition: doneCondition, why });
  };
  add("WARMUP", null, 3, "Choose a quiet place and open the first note.", "A short start lowers friction.");
  selection.forEach((topic, index) => {
    let remaining = topic.minutes;
    while (remaining > 0) {
      const minutes = Math.min(workBlock, remaining);
      add("LEARN", topic, minutes, `Finish the ${topic.depth} note and one worked example.`, topic.reason);
      remaining -= minutes;
      if (remaining > 0) add("BREAK", null, breakBlock, "Step away from the screen.", "Protect attention.");
    }
    add("RECALL", topic, Math.min(10, workBlock), "Answer the recall questions without notes.", "Retrieval practice locks in the topic.");
    if ((index + 1) % 2 === 0 && index < selection.length - 1) add("BREAK", null, breakBlock, "Take a short reset.", "Protect attention.");
  });
  add("BUILD_SHEET", null, 15, "Review the revision sheet and mark one weak point.", "Keep the final revision compact.");
  add("FINAL_SWEEP", null, 15, "Read the panic card and formula list.", "End with high-value recall.");
  const hoursLeft = (examStart.getTime() - start.getTime()) / 3_600_000;
  if (hoursLeft >= 5) {
    const sleepMinutes = hoursLeft < 10 ? 270 : hoursLeft < 14 ? 360 : 420;
    add("SLEEP", null, sleepMinutes, "Rest without study notifications.", "Sleep is protected because it supports recall.");
    add("MORNING_CARD", null, 10, "Read only the panic card and exam strategy.", "Keep the final review calm and short.");
  }
  if (cursor.getTime() > examStart.getTime() - 30 * 60_000) throw new Error("PLAN_DOES_NOT_FIT");
  return blocks;
}
