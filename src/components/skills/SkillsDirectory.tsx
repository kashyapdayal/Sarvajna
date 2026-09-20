"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  Filter,
  Zap,
  Sparkles,
  BookOpen,
  ArrowRight,
  Shield,
  Code,
  Layers,
  Database,
  Terminal,
  Cpu,
  CheckCircle2,
  X,
  FileCode,
} from "lucide-react";
import { AntigravitySkill } from "@/types";
import skillsCatalogData from "@/data/skillsCatalog.json";
import { ambientAudio } from "@/components/common/SoundEffects";

interface SkillsDirectoryProps {
  onSelectSkill: (skill: AntigravitySkill) => void;
  selectedSkillId?: string | null;
  onAddXP?: (xp: number) => void;
}

export const SkillsDirectory: React.FC<SkillsDirectoryProps> = ({
  onSelectSkill,
  selectedSkillId,
  onAddXP,
}) => {
  const allSkills: AntigravitySkill[] = (skillsCatalogData as any).skills || [];

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [detailSkill, setDetailSkill] = useState<AntigravitySkill | null>(null);
  const [displayCount, setDisplayCount] = useState(24);

  const categories = useMemo(() => {
    const counts: Record<string, number> = {};
    allSkills.forEach((s) => {
      counts[s.category] = (counts[s.category] || 0) + 1;
    });
    return [
      { id: "All", label: "All Skills", count: allSkills.length },
      { id: "data-ai", label: "Data & AI", count: counts["data-ai"] || 0 },
      { id: "development", label: "Development", count: counts["development"] || 0 },
      { id: "architecture", label: "Architecture", count: counts["architecture"] || 0 },
      { id: "security", label: "Security", count: counts["security"] || 0 },
      { id: "infrastructure", label: "Infrastructure", count: counts["infrastructure"] || 0 },
      { id: "workflow", label: "Workflow", count: counts["workflow"] || 0 },
      { id: "testing", label: "Testing", count: counts["testing"] || 0 },
      { id: "business", label: "Business", count: counts["business"] || 0 },
      { id: "general", label: "General", count: counts["general"] || 0 },
    ];
  }, [allSkills]);

  const filteredSkills = useMemo(() => {
    return allSkills.filter((s) => {
      const matchCat = selectedCategory === "All" || s.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.tags.some((t) => t.toLowerCase().includes(q)) ||
        s.triggers.some((tr) => tr.toLowerCase().includes(q));

      return matchCat && matchSearch;
    });
  }, [allSkills, selectedCategory, searchQuery]);

  const displayedSkills = filteredSkills.slice(0, displayCount);

  const formatSkillName = (name: string) => {
    return name
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "data-ai":
        return <Cpu className="w-3.5 h-3.5 text-indigo-500" />;
      case "development":
        return <Code className="w-3.5 h-3.5 text-emerald-500" />;
      case "architecture":
        return <Layers className="w-3.5 h-3.5 text-blue-500" />;
      case "security":
        return <Shield className="w-3.5 h-3.5 text-rose-500" />;
      case "infrastructure":
        return <Database className="w-3.5 h-3.5 text-amber-500" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-stone-500" />;
    }
  };

  return (
    <div className="space-y-5">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100 dark:border-stone-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-semibold border border-indigo-200/80 dark:border-indigo-800 flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-indigo-500 fill-current" />
              Antigravity Skills Ecosystem
            </span>
            <span className="text-xs text-stone-400 font-mono">
              307 Autonomous AI Skills
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-100 mt-1">
            Curated Skills & Study Personas
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Cloned from antigravity-skills repo. Activate any specialized skill in your AI study session.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setDisplayCount(24);
            }}
            placeholder="Search 307 skills, tags, triggers..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all placeholder:text-stone-400"
          />
        </div>
      </div>

      {/* Category Pills Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              ambientAudio.playChime("click");
              setSelectedCategory(cat.id);
              setDisplayCount(24);
            }}
            className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
              selectedCategory === cat.id
                ? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-sm"
                : "bg-stone-100 dark:bg-stone-800/80 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700"
            }`}
          >
            <span>{cat.label}</span>
            <span className="text-[10px] opacity-70 font-mono">({cat.count})</span>
          </button>
        ))}
      </div>

      {/* Skills Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {displayedSkills.map((skill) => {
          const isSelected = selectedSkillId === skill.id;

          return (
            <div
              key={skill.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between group ${
                isSelected
                  ? "bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-500 dark:border-indigo-500 shadow-sm"
                  : "bg-white dark:bg-stone-900 border-stone-200/80 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 hover:shadow-sm"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-stone-600 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-md">
                    {getCategoryIcon(skill.category)}
                    <span>{skill.category}</span>
                  </span>

                  {isSelected && (
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Active
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-xs sm:text-sm text-stone-900 dark:text-stone-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                  {formatSkillName(skill.name)}
                </h3>

                <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 line-clamp-2 leading-relaxed">
                  {skill.description}
                </p>

                {/* Tags preview */}
                <div className="flex flex-wrap gap-1 mt-2.5">
                  {skill.tags.slice(0, 3).map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] bg-stone-50 dark:bg-stone-800/80 text-stone-500 px-1.5 py-0.2 rounded border border-stone-100 dark:border-stone-800"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Bar */}
              <div className="pt-3 mt-3 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between gap-2">
                <button
                  onClick={() => setDetailSkill(skill)}
                  className="text-[11px] text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 font-medium"
                >
                  View SKILL.md
                </button>

                <button
                  onClick={() => {
                    ambientAudio.playChime("levelUp");
                    onSelectSkill(skill);
                    if (onAddXP) onAddXP(10);
                  }}
                  className={`px-3 py-1 rounded-xl text-[11px] font-semibold transition-all flex items-center gap-1 ${
                    isSelected
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300"
                  }`}
                >
                  <span>{isSelected ? "Active Partner" : "Activate"}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination / Load More */}
      {displayedSkills.length < filteredSkills.length && (
        <div className="text-center pt-2">
          <button
            onClick={() => setDisplayCount((prev) => prev + 24)}
            className="px-5 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 text-xs font-semibold transition-colors"
          >
            Load More Skills ({filteredSkills.length - displayedSkills.length} remaining)
          </button>
        </div>
      )}

      {/* SKILL.md Drawer / Modal */}
      {detailSkill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/75 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-white dark:bg-stone-900 rounded-3xl p-6 shadow-2xl border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 animate-in fade-in zoom-in-95 duration-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-mono text-stone-500">
                  {detailSkill.path}
                </span>
              </div>
              <button
                onClick={() => setDetailSkill(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h3 className="text-lg font-bold">{formatSkillName(detailSkill.name)}</h3>
              <p className="text-xs text-stone-600 dark:text-stone-300 mt-2 leading-relaxed">
                {detailSkill.description}
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <span className="font-semibold text-stone-400 uppercase tracking-wider text-[10px]">
                Activation Triggers ({detailSkill.triggers.length})
              </span>
              <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                {detailSkill.triggers.map((tr, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 font-mono text-[10px]"
                  >
                    {tr}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-end gap-3">
              <button
                onClick={() => setDetailSkill(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600"
              >
                Close
              </button>
              <button
                onClick={() => {
                  onSelectSkill(detailSkill);
                  setDetailSkill(null);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <span>Activate in AI Taking</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
