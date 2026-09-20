"use client";

import { Clock, ShieldCheck, Zap } from "lucide-react";
import { ExamRescueSession, StudyBlock } from "@/types";
import { QuickCramPanel } from "@/components/rescue/QuickCramPanel";
import { RescueDashboard } from "@/components/rescue/RescueDashboard";

interface BridgeStudyPageProps {
  session: ExamRescueSession;
  blocks: StudyBlock[];
  onUpdateConfidence: (newScore: number) => void;
  onBlockCompleted: (blockId: string) => void;
  onAddXP: (xp: number) => void;
}

export function BridgeStudyPage(props: BridgeStudyPageProps) {
  return <div className="mx-auto max-w-5xl space-y-5 pb-16 pt-2">
    <header className="rounded-3xl border border-rose-200 bg-white p-5 shadow-sm dark:border-rose-900 dark:bg-stone-900 sm:p-7">
      <div className="flex items-start gap-3"><div className="rounded-2xl bg-rose-50 p-3 text-rose-600 dark:bg-rose-950"><Zap className="h-6 w-6" /></div><div><p className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300">Cram mode</p><h1 className="mt-1 text-2xl font-extrabold tracking-tight text-stone-900 dark:text-stone-100 sm:text-3xl">Focus on what can still move the result.</h1><div className="mt-2 flex flex-wrap gap-3 text-sm text-stone-600 dark:text-stone-300"><span className="inline-flex items-center gap-1"><Clock className="h-4 w-4" />{props.session.hoursRemaining}h remaining</span><span className="inline-flex items-center gap-1"><ShieldCheck className="h-4 w-4" />Sleep stays protected</span></div></div></div>
    </header>
    <QuickCramPanel />
    <RescueDashboard {...props} />
  </div>;
}
