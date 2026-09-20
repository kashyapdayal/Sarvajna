"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Send,
  Mic,
  MicOff,
  Copy,
  Check,
  BookOpen,
  HelpCircle,
  Flame,
  FileText,
  BookmarkPlus,
  ArrowRight,
  Layers,
  Bot,
  User,
  Zap,
} from "lucide-react";
import { NoteTakingMessage, AntigravitySkill } from "@/types";
import { ambientAudio } from "@/components/common/SoundEffects";

interface AiStudySessionProps {
  activeSkill?: AntigravitySkill | null;
  onOpenSkillSelector?: () => void;
  onSaveToNotes?: (note: any) => void;
  onAddXP: (xp: number) => void;
}

export const AiStudySession: React.FC<AiStudySessionProps> = ({
  activeSkill,
  onOpenSkillSelector,
  onSaveToNotes,
  onAddXP,
}) => {
  const [messages, setMessages] = useState<NoteTakingMessage[]>([
    {
      id: "msg-0",
      sender: "ai",
      text: "Hello Anu. I'm your AI Study Partner & Live Note-Taker. As you study or explain concepts out loud, I will synthesize high-yield notes, formulas, and exam traps in real-time.",
      timestamp: "10:00 AM",
      generatedNotes: {
        topic: "Getting Started with AI Note-Taking",
        bullets: [
          "Explain a concept to test your memory (Feynman Technique)",
          "Ask me to simplify complex definitions or clarify edge cases",
          "I will extract structured notes and exam traps automatically",
        ],
        keyFormula: "Retention = Retrieval Practice + Spaced Repetition",
        examTrap: "Passive re-reading gives an illusion of mastery without active recall.",
      },
    },
  ]);

  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savedNotes, setSavedNotes] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAiThinking]);

  const handleSendMessage = (textToSend = inputText) => {
    if (!textToSend.trim()) return;

    ambientAudio.playChime("click");
    const userMsg: NoteTakingMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsAiThinking(true);

    // AI thinking and note-synthesis response simulation
    setTimeout(() => {
      ambientAudio.playChime("levelUp");
      onAddXP(15);
      setIsAiThinking(false);

      const promptLower = textToSend.toLowerCase();
      let aiReply = "Here is the structured breakdown of this concept for your revision.";
      let noteData = {
        topic: activeSkill ? activeSkill.name : "Core Concept Summary",
        bullets: [
          "Primary definition and operational condition",
          "Critical distinction tested in university papers",
          "Verification check for full credit",
        ],
        keyFormula: "Output = Input × Efficiency Factor",
        examTrap: "Don't skip the prerequisite constraints during proof derivations.",
      };

      if (promptLower.includes("normalization") || promptLower.includes("bcnf") || promptLower.includes("3nf")) {
        aiReply = "I've extracted the exact normal form rules and the common university distinction for you.";
        noteData = {
          topic: "Normalization (3NF vs BCNF)",
          bullets: [
            "3NF Condition: For X → Y, either X is Super Key OR Y is a Prime Attribute.",
            "BCNF Condition: For every non-trivial X → Y, X MUST strictly be a Super Key.",
            "BCNF is strictly stronger than 3NF; all BCNF relations are in 3NF.",
          ],
          keyFormula: "R1 ∩ R2 → R1  or  R1 ∩ R2 → R2 (Lossless Join)",
          examTrap: "In 3NF, prime attribute on RHS is allowed. In BCNF, it is strictly forbidden!",
        };
      } else if (promptLower.includes("acid") || promptLower.includes("transaction")) {
        aiReply = "Extracted ACID guarantees and the Conflict Serializability graph rule.";
        noteData = {
          topic: "Transactions & ACID Guarantees",
          bullets: [
            "Atomicity: All-or-nothing execution via Undo/Log",
            "Consistency: Transition between valid DB states",
            "Isolation: Serial equivalence via Two-Phase Locking (2PL)",
            "Durability: Committed updates persist via Write-Ahead Log (WAL)",
          ],
          keyFormula: "Conflict Serializability = Precedence Graph has NO directed cycles",
          examTrap: "Read-Read concurrent operations NEVER conflict in transaction schedules!",
        };
      } else if (promptLower.includes("grill") || promptLower.includes("test")) {
        aiReply = "Here is an active challenge: Relation R(A, B, C) has Candidate Key A. If we have FDs { A → B, B → C }, does this satisfy 3NF? Why or why not?";
        noteData = {
          topic: "Active Drill: Transitive Dependency Check",
          bullets: [
            "Candidate Key = A (non-prime attributes: B, C)",
            "A → B is Full Dependency (satisfies 2NF)",
            "B → C: B is non-superkey and C is non-prime → Violates 3NF!",
          ],
          keyFormula: "Decomposition into 3NF: R1(A, B), R2(B, C)",
          examTrap: "Students often forget that B is non-prime, leading to false BCNF assumptions.",
        };
      }

      const aiMsg: NoteTakingMessage = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: aiReply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        generatedNotes: noteData,
      };

      setMessages((prev) => [...prev, aiMsg]);
    }, 1200);
  };

  const toggleRecording = () => {
    ambientAudio.playChime("click");
    if (!isRecording) {
      setIsRecording(true);
      // Simulate listening
      setTimeout(() => {
        setIsRecording(false);
        handleSendMessage("Can you take notes on BCNF vs 3NF and point out the traps?");
      }, 3000);
    } else {
      setIsRecording(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    ambientAudio.playChime("click");
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveNote = (id: string, notes: any) => {
    ambientAudio.playChime("levelUp");
    setSavedNotes((prev) => ({ ...prev, [id]: true }));
    if (onSaveToNotes) onSaveToNotes(notes);
    onAddXP(25);
  };

  return (
    <div className="max-w-5xl mx-auto pb-28 space-y-5">
      {/* Top Banner: Minimal, Refined Session Header */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 p-5 sm:p-6 shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-200/60 dark:border-emerald-800 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              LIVE AI STUDY PARTNER
            </span>
            <span className="text-xs text-stone-400 font-mono">
              Feynman Active Note-Taking
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100 mt-1">
            Talk, Learn & Auto-Take Notes
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Discuss topics freely. The AI organizes key takeaways, formulas, and traps in real-time.
          </p>
        </div>

        {/* Active Skill Selector Pill */}
        <div className="flex items-center gap-2">
          {activeSkill ? (
            <button
              onClick={onOpenSkillSelector}
              className="px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-stone-200/60 dark:border-stone-700"
              title="Click to switch active Antigravity skill"
            >
              <Zap className="w-3.5 h-3.5 text-indigo-500 fill-current" />
              <span className="max-w-[150px] truncate">{activeSkill.name}</span>
              <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.2 rounded font-mono">
                {activeSkill.category}
              </span>
            </button>
          ) : (
            <button
              onClick={onOpenSkillSelector}
              className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-xs font-semibold flex items-center gap-1.5 border border-indigo-200/80 dark:border-indigo-800 transition-colors"
            >
              <Zap className="w-3.5 h-3.5 text-indigo-500" />
              <span>Attach Antigravity Skill (307)</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Conversation & Live Note Stream */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        {/* Messages Scroll Area */}
        <div className="p-4 sm:p-6 space-y-4 flex-1 overflow-y-auto max-h-[60vh]">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 text-xs sm:text-sm ${
                msg.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.sender === "ai" && (
                <div className="w-7 h-7 rounded-xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}

              <div
                className={`max-w-xl space-y-2.5 ${
                  msg.sender === "user"
                    ? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 p-3.5 sm:p-4 rounded-2xl rounded-tr-sm"
                    : "bg-stone-50 dark:bg-stone-800/50 border border-stone-200/80 dark:border-stone-700/80 p-4 rounded-2xl rounded-tl-sm text-stone-800 dark:text-stone-200"
                }`}
              >
                <p className="leading-relaxed">{msg.text}</p>

                {/* AI Note Taking Block attached to AI messages */}
                {msg.generatedNotes && (
                  <div className="mt-3 p-3.5 bg-white dark:bg-stone-900 rounded-xl border border-stone-200/80 dark:border-stone-700/80 text-xs space-y-2.5 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
                      <div className="flex items-center gap-1.5 font-bold text-stone-900 dark:text-stone-100">
                        <FileText className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{msg.generatedNotes.topic}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() =>
                            handleCopy(
                              msg.id,
                              `${msg.generatedNotes?.topic}\n` +
                                msg.generatedNotes?.bullets.map((b) => `• ${b}`).join("\n") +
                                `\nFormula: ${msg.generatedNotes?.keyFormula}\nTrap: ${msg.generatedNotes?.examTrap}`
                            )
                          }
                          className="p-1 rounded text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
                          title="Copy Markdown"
                        >
                          {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => handleSaveNote(msg.id, msg.generatedNotes)}
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors flex items-center gap-1 ${
                            savedNotes[msg.id]
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200"
                          }`}
                        >
                          <BookmarkPlus className="w-3 h-3" />
                          <span>{savedNotes[msg.id] ? "Saved" : "Save"}</span>
                        </button>
                      </div>
                    </div>

                    <ul className="space-y-1 text-stone-600 dark:text-stone-300 text-xs">
                      {msg.generatedNotes.bullets.map((b, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>

                    {msg.generatedNotes.keyFormula && (
                      <div className="p-2 bg-stone-50 dark:bg-stone-800/60 rounded-lg font-mono text-[11px] text-stone-800 dark:text-stone-200 border border-stone-200/50 dark:border-stone-700/50">
                        Formula: {msg.generatedNotes.keyFormula}
                      </div>
                    )}

                    {msg.generatedNotes.examTrap && (
                      <div className="p-2 bg-amber-50/60 dark:bg-amber-950/30 rounded-lg text-[11px] text-amber-900 dark:text-amber-200 border border-amber-200/50 dark:border-amber-900/40">
                        <strong>Exam Trap:</strong> {msg.generatedNotes.examTrap}
                      </div>
                    )}
                  </div>
                )}

                <div className="text-[10px] text-stone-400 text-right font-mono">
                  {msg.timestamp}
                </div>
              </div>

              {msg.sender === "user" && (
                <div className="w-7 h-7 rounded-xl bg-stone-200 dark:bg-stone-700 text-stone-800 dark:text-stone-200 flex items-center justify-center shrink-0 mt-0.5 text-xs font-semibold">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          ))}

          {isAiThinking && (
            <div className="flex items-center gap-2 text-xs text-stone-400 py-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>AI is synthesizing high-yield notes...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Prompt Recommendation Chips */}
        <div className="p-3 bg-stone-50/80 dark:bg-stone-800/40 border-t border-stone-100 dark:border-stone-800 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-[11px] text-stone-400 whitespace-nowrap font-medium">Quick Prompts:</span>
          <button
            onClick={() => handleSendMessage("Take notes on Normalization from 1NF to BCNF with exam traps.")}
            className="px-2.5 py-1 rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:border-emerald-400 whitespace-nowrap transition-colors"
          >
            1NF to BCNF Notes
          </button>
          <button
            onClick={() => handleSendMessage("Grill me on ACID transactions and conflict serializability.")}
            className="px-2.5 py-1 rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:border-emerald-400 whitespace-nowrap transition-colors"
          >
            Grill Me on ACID
          </button>
          <button
            onClick={() => handleSendMessage("Explain Two-Phase Locking (2PL) with a simple real-world analogy.")}
            className="px-2.5 py-1 rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:border-emerald-400 whitespace-nowrap transition-colors"
          >
            Explain 2PL Simply
          </button>
          <button
            onClick={() => handleSendMessage("What are the 3 most likely university 10-mark questions for DBMS?")}
            className="px-2.5 py-1 rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:border-emerald-400 whitespace-nowrap transition-colors"
          >
            Predict 10-Markers
          </button>
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-stone-200/80 dark:border-stone-800 bg-white dark:bg-stone-900">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            {/* Voice Dictation Simulator */}
            <button
              type="button"
              onClick={toggleRecording}
              className={`p-2.5 rounded-xl border transition-all ${
                isRecording
                  ? "bg-rose-500 text-white border-rose-500 animate-pulse shadow-sm"
                  : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-200"
              }`}
              title={isRecording ? "Listening to your study dictation..." : "Speak & dictate notes"}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                isRecording
                  ? "Listening to your voice... Speak your study topic..."
                  : "Explain a concept or ask AI to take notes on any topic..."
              }
              className="flex-1 bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/80 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all placeholder:text-stone-400"
            />

            <button
              type="submit"
              disabled={!inputText.trim()}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                inputText.trim()
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                  : "bg-stone-100 dark:bg-stone-800 text-stone-400 cursor-not-allowed"
              }`}
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
