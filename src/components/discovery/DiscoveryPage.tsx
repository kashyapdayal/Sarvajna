"use client";

import { Compass } from "lucide-react";
import { ResourceExplorer } from "@/components/platform/ResourceExplorer";
import { StudyPathIsland } from "@/types";

interface DiscoveryPageProps {
  onAddToStudyPath: (topic: StudyPathIsland) => void;
  onNavigateToStudyPath: () => void;
  onStartLearning: (topicTitle: string) => void;
  existingStudyPath: StudyPathIsland[];
}

export function DiscoveryPage(_: DiscoveryPageProps) {
  return <div className="mx-auto max-w-5xl space-y-5 pb-16 pt-2">
    <header className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900 sm:p-7">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600 dark:bg-emerald-950"><Compass className="h-6 w-6" /></div>
        <div><p className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Explore</p><h1 className="mt-1 text-2xl font-extrabold tracking-tight text-stone-900 dark:text-stone-100 sm:text-3xl">Find a better way to learn your next topic.</h1><p className="mt-2 max-w-2xl text-sm text-stone-600 dark:text-stone-300">Search once. Compare beginner, intermediate, and advanced resources. Add only the ones that fit your study path.</p></div>
      </div>
    </header>
    <ResourceExplorer />
  </div>;
}
