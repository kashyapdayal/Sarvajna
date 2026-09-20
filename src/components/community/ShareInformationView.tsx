"use client";

import React, { useState } from "react";
import {
  Share2,
  Upload,
  MessageSquare,
  ThumbsUp,
  FileText,
  Search,
  Download,
  Filter,
  Check,
} from "lucide-react";

interface CommunityNote {
  id: string;
  title: string;
  author: string;
  course: string;
  pages: number;
  upvotes: number;
  date: string;
  tags: string[];
}

interface PeerDiscussion {
  id: string;
  author: string;
  topic: string;
  text: string;
  replies: number;
  upvotes: number;
  timeAgo: string;
}

const SAMPLE_NOTES: CommunityNote[] = [
  {
    id: "n-1",
    title: "1-Night Exam Eve Formula & Normalization Proof Sheet",
    author: "Elena V. (TA)",
    course: "Database Systems",
    pages: 4,
    upvotes: 428,
    date: "Yesterday",
    tags: ["Must-Know", "BCNF", "2PL"],
  },
  {
    id: "n-2",
    title: "Relational Algebra vs Calculus Solved Past Papers (2020-2025)",
    author: "Marcus K.",
    course: "Database Systems",
    pages: 12,
    upvotes: 312,
    date: "3 days ago",
    tags: ["Past Papers", "Joins", "Projections"],
  },
  {
    id: "n-3",
    title: "B+ Tree Leaf Insertion & Split Trace Diagrams",
    author: "Devin S.",
    course: "Database Systems",
    pages: 6,
    upvotes: 219,
    date: "1 week ago",
    tags: ["Visual", "B+ Trees", "Splits"],
  },
];

const SAMPLE_DISCUSSIONS: PeerDiscussion[] = [
  {
    id: "d-1",
    author: "Sarah J.",
    topic: "Strict 2PL vs Rigorous 2PL difference",
    text: "Can someone confirm if Rigorous 2PL holds shared locks until commit as well as exclusive locks? My textbook only explicitly states exclusive.",
    replies: 7,
    upvotes: 43,
    timeAgo: "2 hours ago",
  },
  {
    id: "d-2",
    author: "Rahul M.",
    topic: "Watch out for question 4 on the 2024 Fall Midterm",
    text: "The professor set a trap on candidate key discovery where an attribute wasn't on the right side of any dependency. It has to be in every candidate key!",
    replies: 12,
    upvotes: 89,
    timeAgo: "5 hours ago",
  },
];

export const ShareInformationView: React.FC = () => {
  const [notes, setNotes] = useState<CommunityNote[]>(SAMPLE_NOTES);
  const [discussions, setDiscussions] = useState<PeerDiscussion[]>(SAMPLE_DISCUSSIONS);
  const [searchFilter, setSearchFilter] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [newCommentText, setNewCommentText] = useState("");
  const [userUpvoted, setUserUpvoted] = useState<Record<string, boolean>>({});

  const handleToggleUpvote = (id: string) => {
    const isUpvoted = userUpvoted[id];
    setUserUpvoted((prev) => ({ ...prev, [id]: !isUpvoted }));
    setNotes((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, upvotes: n.upvotes + (isUpvoted ? -1 : 1) } : n
      )
    );
  };

  const handlePostDiscussion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    const newEntry: PeerDiscussion = {
      id: `d-${Date.now()}`,
      author: "You",
      topic: "Study Question",
      text: newCommentText.trim(),
      replies: 0,
      upvotes: 1,
      timeAgo: "Just now",
    };

    setDiscussions([newEntry, ...discussions]);
    setNewCommentText("");
  };

  return (
    <div style={{ maxWidth: "860px", margin: "0 auto", padding: "20px 20px 80px" }}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "4px 10px",
            background: "var(--surface2)",
            border: "1px solid var(--border)",
            borderRadius: "4px",
            fontSize: "11px",
            color: "var(--t2)",
            textTransform: "uppercase",
            letterSpacing: "1px",
            marginBottom: "10px",
          }}
        >
          <Share2 size={13} />
          <span>Peer Knowledge Graph &amp; Collective Notes</span>
        </div>

        <h1 style={{ fontFamily: "var(--serif)", fontSize: "28px", fontWeight: 500, margin: "0 0 16px" }}>
          Share Information
        </h1>
      </div>

      {/* Upload Dropzone */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px dashed var(--border-2)",
          borderRadius: "8px",
          padding: "24px",
          textAlign: "center",
          marginBottom: "32px",
          cursor: "pointer",
        }}
        onClick={() => {
          setUploadSuccess(true);
          setTimeout(() => setUploadSuccess(false), 3000);
        }}
      >
        <Upload size={22} style={{ color: "var(--t3)", margin: "0 auto 8px" }} />
        <h4 style={{ fontSize: "14.5px", fontWeight: 500, color: "var(--text)", margin: "0 0 4px" }}>
          {uploadSuccess ? "Uploaded! Added to peer review queue" : "Drop your summary sheet or past paper notes"}
        </h4>
        <p style={{ fontSize: "12px", color: "var(--t4)", margin: 0 }}>
          PDF, TXT, or Markdown &middot; Instant OCR indexing
        </p>
      </div>

      {/* Community Revision Sheets */}
      <div style={{ marginBottom: "40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ fontFamily: "var(--serif)", fontSize: "20px", fontWeight: 500, margin: 0 }}>
            Curated Community Sheets
          </h3>
          <span style={{ fontSize: "12px", color: "var(--t4)" }}>
            {notes.length} verified sheets
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {notes.map((note) => {
            const hasUpvoted = userUpvoted[note.id];

            return (
              <div
                key={note.id}
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                  padding: "16px 18px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <span style={{ fontSize: "11px", color: "var(--t4)", textTransform: "uppercase" }}>
                      {note.course}
                    </span>
                    <span style={{ fontSize: "11px", color: "var(--t4)" }}>&middot;</span>
                    <span style={{ fontSize: "11px", color: "var(--t3)" }}>
                      by {note.author} ({note.date})
                    </span>
                  </div>

                  <h4 style={{ fontSize: "15px", fontWeight: 500, color: "var(--text)", margin: "0 0 8px" }}>
                    {note.title}
                  </h4>

                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {note.tags.map((t, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: "11px",
                          padding: "2px 6px",
                          borderRadius: "3px",
                          background: "#181818",
                          color: "var(--t2)",
                        }}
                      >
                        {t}
                      </span>
                    ))}
                    <span style={{ fontSize: "11px", color: "var(--t4)", alignSelf: "center", marginLeft: "4px" }}>
                      {note.pages} pages
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={() => handleToggleUpvote(note.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "6px 12px",
                      borderRadius: "4px",
                      border: "1px solid var(--border)",
                      background: hasUpvoted ? "var(--surface2)" : "#151515",
                      color: hasUpvoted ? "var(--text)" : "var(--t3)",
                      fontSize: "12.5px",
                      cursor: "pointer",
                    }}
                  >
                    <ThumbsUp size={13} />
                    <span>{note.upvotes}</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ padding: "6px 12px", fontSize: "12.5px" }}
                    onClick={() => alert(`Downloading: ${note.title}`)}
                  >
                    <Download size={14} style={{ marginRight: "4px" }} />
                    <span>Get PDF</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Peer Discussions */}
      <div>
        <h3 style={{ fontFamily: "var(--serif)", fontSize: "20px", fontWeight: 500, margin: "0 0 16px" }}>
          Active Discussion &amp; Gotcha Alerts
        </h3>

        {/* Post question bar */}
        <form onSubmit={handlePostDiscussion} style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
          <input
            type="text"
            placeholder="Ask peers a question or flag an exam gotcha..."
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            style={{
              flex: 1,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "6px",
              padding: "10px 14px",
              fontSize: "13.5px",
              color: "var(--text)",
              outline: "none",
            }}
          />
          <button type="submit" className="btn btn-primary" style={{ padding: "10px 18px", fontSize: "13px" }}>
            Post
          </button>
        </form>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {discussions.map((item) => (
            <div
              key={item.id}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "6px",
                padding: "16px 18px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "6px" }}>
                <span style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--text)" }}>
                  {item.topic}
                </span>
                <span style={{ fontSize: "11.5px", color: "var(--t4)" }}>
                  {item.timeAgo} &middot; by {item.author}
                </span>
              </div>

              <p style={{ fontSize: "13px", color: "var(--t2)", margin: "0 0 10px", lineHeight: 1.5 }}>
                {item.text}
              </p>

              <div style={{ display: "flex", alignItems: "center", gap: "14px", fontSize: "12px", color: "var(--t4)" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <MessageSquare size={13} />
                  <span>{item.replies} replies</span>
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <ThumbsUp size={13} />
                  <span>{item.upvotes} found helpful</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
