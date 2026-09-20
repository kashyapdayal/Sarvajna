"use client";

import React, { useState } from "react";
import {
  MessageSquare,
  ThumbsUp,
  Send,
  Sparkles,
  ShieldCheck,
  Award,
  Bot,
  User,
} from "lucide-react";
import { ResourceComment } from "@/types";
import { ambientAudio } from "@/components/common/SoundEffects";

interface TopicDiscussionsProps {
  comments: ResourceComment[];
  resourceTitle?: string;
  onAddComment: (commentText: string) => void;
  onAddXP: (xp: number) => void;
}

export const TopicDiscussions: React.FC<TopicDiscussionsProps> = ({
  comments,
  resourceTitle = "Ultimate DBMS 1-Night Revision Mindmap",
  onAddComment,
  onAddXP,
}) => {
  const [commentList, setCommentList] = useState<ResourceComment[]>(comments);
  const [newText, setNewText] = useState("");
  const [votedComments, setVotedComments] = useState<Record<string, boolean>>({});

  const handlePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;

    ambientAudio.playChime("levelUp");

    const newEntry: ResourceComment = {
      id: `comment-${Date.now()}`,
      resourceId: "res-1",
      author: "You (Anu S.)",
      avatar: "A",
      role: "Level 5 Scholar",
      text: newText.trim(),
      upvotes: 1,
      timestamp: "Just now",
      badge: "Student Contributor",
    };

    setCommentList([newEntry, ...commentList]);
    onAddComment(newText);
    onAddXP(20);
    setNewText("");
  };

  const handleUpvoteComment = (id: string) => {
    ambientAudio.playChime("click");
    const hasVoted = votedComments[id];

    setVotedComments({ ...votedComments, [id]: !hasVoted });
    setCommentList((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          return { ...c, upvotes: c.upvotes + (hasVoted ? -1 : 1) };
        }
        return c;
      })
    );
  };

  return (
    <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-5 sm:p-7 shadow-sm transition-all space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100 dark:border-stone-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" />
              Peer Discussion & Exam Tips
            </span>
            <span className="text-xs text-stone-400 font-mono">
              Thread: {resourceTitle}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100 mt-1">
            Community Comments & Exam Warnings
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Students share university paper observations, trick questions, and corrections.
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-stone-400">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Earn +20 XP per verified contribution</span>
        </div>
      </div>

      {/* Input box to add comment */}
      <form onSubmit={handlePost} className="space-y-3">
        <div className="relative">
          <textarea
            rows={3}
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Share a tip, formula shortcut, or ask a doubt on this topic..."
            className="w-full p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all placeholder:text-stone-400 resize-none"
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-stone-400">
            Keep it calm, helpful, and grounded. Markdown supported.
          </span>
          <button
            type="submit"
            disabled={!newText.trim()}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              newText.trim()
                ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                : "bg-stone-100 dark:bg-stone-800 text-stone-400 cursor-not-allowed"
            }`}
          >
            <span>Post Comment (+20 XP)</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-3 pt-2">
        {commentList.map((comment) => {
          const isVoted = votedComments[comment.id];

          return (
            <div
              key={comment.id}
              className="p-4 rounded-2xl bg-stone-50/60 dark:bg-stone-800/30 border border-stone-200/80 dark:border-stone-800 space-y-2.5 transition-all"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 flex items-center justify-center text-sm shadow-inner">
                    {comment.avatar}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-stone-900 dark:text-stone-100">
                        {comment.author}
                      </span>
                      {comment.badge && (
                        <span className="text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2 py-0.2 rounded-full border border-emerald-200 dark:border-emerald-800">
                          {comment.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-stone-400">{comment.role}</span>
                  </div>
                </div>

                <span className="text-[11px] text-stone-400 font-mono">
                  {comment.timestamp}
                </span>
              </div>

              <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed pl-10">
                {comment.text}
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-stone-800 pl-10">
                <button
                  onClick={() => handleUpvoteComment(comment.id)}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                    isVoted
                      ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300"
                      : "bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:text-stone-900"
                  }`}
                >
                  <ThumbsUp className="w-3 h-3" />
                  <span>Helpful ({comment.upvotes})</span>
                </button>

                <span className="text-[10px] text-stone-400">Verified student insight</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
