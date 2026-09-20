"use client";

import React, { useState } from "react";
import {
  Sparkles,
  ThumbsUp,
  Download,
  MessageSquare,
  ShieldCheck,
  Award,
  Filter,
  FileSpreadsheet,
  Share2,
  Check,
} from "lucide-react";
import { CommunityResource } from "@/types";
import { ambientAudio } from "@/components/common/SoundEffects";

interface CommunityResourcesProps {
  resources: CommunityResource[];
  onSelectResourceForComments: (resourceId: string) => void;
  onAddXP: (xp: number) => void;
}

export const CommunityResources: React.FC<CommunityResourcesProps> = ({
  resources,
  onSelectResourceForComments,
  onAddXP,
}) => {
  const [filterType, setFilterType] = useState<string>("All");
  const [resourceList, setResourceList] = useState(resources);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const filterOptions = ["All", "Cheat Sheet", "PYQ Solutions", "Mnemonics", "Notes"];

  const filtered = filterType === "All"
    ? resourceList
    : resourceList.filter((r) => r.type === filterType);

  const handleUpvote = (id: string) => {
    ambientAudio.playChime("click");
    setResourceList((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const newVoted = !r.userVoted;
          const upvotesDelta = newVoted ? 1 : -1;
          if (newVoted) onAddXP(10);
          return { ...r, upvotes: r.upvotes + upvotesDelta, userVoted: newVoted };
        }
        return r;
      })
    );
  };

  const handleDownload = (id: string) => {
    ambientAudio.playChime("levelUp");
    setDownloadingId(id);
    setTimeout(() => {
      setDownloadingId(null);
      alert("Resource downloaded successfully! Saved to your offline cache.");
    }, 1000);
  };

  return (
    <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-5 sm:p-7 shadow-sm transition-all space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100 dark:border-stone-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" />
              Community Knowledge Graph
            </span>
            <span className="text-xs text-stone-400 font-mono">
              Crowdsourced & AI-Vetted
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100 mt-1">
            Top Student Notes & Verified Answers
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Every submission undergoes automated fact-checking + peer consensus before ranking.
          </p>
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {filterOptions.map((type) => (
            <button
              key={type}
              onClick={() => {
                ambientAudio.playChime("click");
                setFilterType(type);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                filterType === type
                  ? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-sm"
                  : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Resource Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="p-5 rounded-2xl bg-stone-50/70 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700/80 flex flex-col justify-between hover:border-amber-300 dark:hover:border-amber-700 transition-all group"
          >
            <div>
              {/* Header row: Type badge & Verified tag */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-stone-200/70 dark:bg-stone-700 text-stone-700 dark:text-stone-300 font-semibold">
                  {item.type} • {item.pagesOrDuration}
                </span>

                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900">
                  <ShieldCheck className="w-3 h-3" />
                  {item.verified}
                </span>
              </div>

              {/* Title & Topic */}
              <h3 className="font-bold text-base text-stone-900 dark:text-stone-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                {item.title}
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 leading-relaxed">
                {item.summary}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1 mt-3">
                {item.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 px-2 py-0.5 rounded-md border border-stone-200 dark:border-stone-800"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Author info & actions footer */}
            <div className="pt-4 mt-4 border-t border-stone-200/60 dark:border-stone-700/60 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-[11px] font-bold text-amber-800 dark:text-amber-300">
                  {item.author.name.charAt(0)}
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-stone-800 dark:text-stone-200 text-[11px]">
                    {item.author.name}
                  </span>
                  <span className="text-[10px] text-stone-400">
                    {item.author.badge}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Upvote Button */}
                <button
                  onClick={() => handleUpvote(item.id)}
                  className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    item.userVoted
                      ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                      : "bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-amber-400"
                  }`}
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>{item.upvotes}</span>
                </button>

                {/* Comments trigger */}
                <button
                  onClick={() => onSelectResourceForComments(item.id)}
                  className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-stone-400" />
                  <span>{item.commentsCount}</span>
                </button>

                {/* Download */}
                <button
                  onClick={() => handleDownload(item.id)}
                  className="p-1.5 rounded-xl bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                  title="Download resource"
                >
                  {downloadingId === item.id ? (
                    <Check className="w-4 h-4 text-emerald-500 animate-pulse" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
