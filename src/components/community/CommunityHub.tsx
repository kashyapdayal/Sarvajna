"use client";

import React, { useState } from "react";
import {
  UploadCloud,
  Share2,
  MessageSquare,
  Sparkles,
  BookOpen,
  Award,
} from "lucide-react";
import { CommunityResource, ResourceComment } from "@/types";
import { DocumentUploader } from "./DocumentUploader";
import { CommunityResources } from "./CommunityResources";
import { TopicDiscussions } from "./TopicDiscussions";
import { ambientAudio } from "@/components/common/SoundEffects";

interface CommunityHubProps {
  resources: CommunityResource[];
  comments: ResourceComment[];
  onAddComment: (commentText: string) => void;
  onAddXP: (xp: number) => void;
}

export const CommunityHub: React.FC<CommunityHubProps> = ({
  resources,
  comments,
  onAddComment,
  onAddXP,
}) => {
  const [activeSection, setActiveSection] = useState<"upload" | "resources" | "comments">("upload");
  const [activeResourceTitle, setActiveResourceTitle] = useState<string>(
    "Ultimate DBMS 1-Night Revision Mindmap & Formula Sheet"
  );

  const handleSelectResourceForComments = (resId: string) => {
    const found = resources.find((r) => r.id === resId);
    if (found) {
      setActiveResourceTitle(found.title);
    }
    setActiveSection("comments");
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-28">
      {/* Top Banner Navigation */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-5 sm:p-7 shadow-sm transition-all space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5" />
                Community & Resource Graph
              </span>
              <span className="text-xs text-stone-400">Crowdsourced Learning Platform</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 mt-1">
              Uploads & Community Notes
            </h1>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              Ingest exam documents, share high-yield cheat sheets, and verify discussion threads.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-3 py-2 rounded-2xl border border-amber-200 dark:border-amber-900">
            <Award className="w-4 h-4" />
            <span>Reputation Level: Scholar (420 Karma)</span>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="flex items-center gap-2 pt-2 border-t border-stone-100 dark:border-stone-800">
          <button
            onClick={() => {
              ambientAudio.playChime("click");
              setActiveSection("upload");
            }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeSection === "upload"
                ? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-sm"
                : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200"
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>1. Document Ingestion (OCR)</span>
          </button>

          <button
            onClick={() => {
              ambientAudio.playChime("click");
              setActiveSection("resources");
            }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeSection === "resources"
                ? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-sm"
                : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>2. Verified Resource Feed ({resources.length})</span>
          </button>

          <button
            onClick={() => {
              ambientAudio.playChime("click");
              setActiveSection("comments");
            }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeSection === "comments"
                ? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-sm"
                : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>3. Peer Discussions ({comments.length})</span>
          </button>
        </div>
      </div>

      {/* Sub-view rendering */}
      {activeSection === "upload" && (
        <DocumentUploader
          onUploadComplete={(docName, count) => {
            onAddXP(50);
          }}
        />
      )}

      {activeSection === "resources" && (
        <CommunityResources
          resources={resources}
          onSelectResourceForComments={handleSelectResourceForComments}
          onAddXP={onAddXP}
        />
      )}

      {activeSection === "comments" && (
        <TopicDiscussions
          comments={comments}
          resourceTitle={activeResourceTitle}
          onAddComment={onAddComment}
          onAddXP={onAddXP}
        />
      )}
    </div>
  );
};
