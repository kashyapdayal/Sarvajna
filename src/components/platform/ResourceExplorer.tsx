"use client";

import { FormEvent, useMemo, useState } from "react";
import { BookOpen, Check, ExternalLink, GraduationCap, Layers3, Search, Sparkles, Wrench } from "lucide-react";
import { LearningResource, ResourceLevel, catalogResources } from "@/lib/resource-catalog";
import { supabaseBrowser } from "@/lib/supabase-browser";

const levels: Array<{ id: ResourceLevel; label: string; note: string }> = [
  { id: "beginner", label: "Beginner", note: "Build the foundation without overload." },
  { id: "intermediate", label: "Intermediate", note: "Practice real workflows and small projects." },
  { id: "advanced", label: "Advanced", note: "Go deeper with systems, security, and production tasks." },
];

const kindIcon = { video: BookOpen, guide: GraduationCap, lab: Wrench, project: Layers3 };

export function ResourceExplorer() {
  const [query, setQuery] = useState("linux");
  const [language, setLanguage] = useState("English");
  const [results, setResults] = useState<LearningResource[]>(() => catalogResources("linux"));
  const [activeLevel, setActiveLevel] = useState<ResourceLevel>("beginner");
  const [state, setState] = useState("Search a topic to see a structured resource tree.");
  const [added, setAdded] = useState<string[]>([]);
  const visible = useMemo(() => results.filter((resource) => resource.level === activeLevel), [results, activeLevel]);

  async function search(event: FormEvent) {
    event.preventDefault();
    const fallback = catalogResources(query, language);
    setState("Finding courses, channels, labs, and projects…");
    const session = await supabaseBrowser?.auth.getSession();
    if (!session?.data.session) {
      setResults(fallback);
      setState(fallback.length ? "Showing our curated learning tree. Sign in to search the wider web and save resources." : "Sign in to search the web and save a learning path.");
      return;
    }
    const response = await fetch("/api/resources/search", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.data.session.access_token}` }, body: JSON.stringify({ topic: query, language }) });
    if (!response.ok) {
      setResults(fallback);
      setState(fallback.length ? "Showing curated resources while web discovery is unavailable." : "Search could not finish. Check your AI provider configuration and try again.");
      return;
    }
    const data = await response.json();
    setResults(data.resources);
    setActiveLevel("beginner");
    setState(data.source === "web" ? "Fresh web results, grouped into a practical learning tree." : "Curated, hands-on-first resource tree.");
  }

  async function addToPath(resource: LearningResource) {
    const session = await supabaseBrowser?.auth.getSession();
    if (!session?.data.session) return setState("Sign in first so this resource can become part of your adaptive path.");
    const response = await fetch("/api/path/resources", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.data.session.access_token}`, "Idempotency-Key": crypto.randomUUID() }, body: JSON.stringify({ topic: query, level: resource.level, resource }) });
    if (!response.ok) return setState("We could not add that resource. Please try again.");
    setAdded((items) => [...items, resource.id]);
    setState(`${resource.title} is in your path. SkillOS will place it when it matches your progress.`);
  }

  return <section className="space-y-5">
    <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900">
      <div className="flex items-start gap-3"><div className="rounded-2xl bg-indigo-50 p-2.5 text-indigo-600 dark:bg-indigo-950"><Sparkles className="h-5 w-5" /></div><div><h2 className="font-bold text-stone-900 dark:text-stone-100">Explore a skill tree</h2><p className="text-sm text-stone-500">Courses, YouTube channels, underrated guides, hands-on labs, and projects—then add only what you want.</p></div></div>
      <form onSubmit={search} className="mt-4 flex flex-col gap-2 sm:flex-row"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try Linux, Python, calculus…" className="min-h-11 flex-1 rounded-xl border border-stone-300 bg-white px-3 text-sm dark:border-stone-700 dark:bg-stone-800" /><select value={language} onChange={(event) => setLanguage(event.target.value)} className="min-h-11 rounded-xl border border-stone-300 bg-white px-3 text-sm dark:border-stone-700 dark:bg-stone-800"><option>English</option><option>Hindi</option><option>Malayalam</option><option>Tamil</option></select><button className="min-h-11 rounded-xl bg-stone-900 px-4 text-sm font-semibold text-white dark:bg-stone-100 dark:text-stone-900"><Search className="mr-1 inline h-4 w-4" />Search</button></form>
      <p className="mt-3 text-xs text-stone-500">{state}</p>
    </div>
    <div className="flex gap-2 overflow-x-auto pb-1">{levels.map((level) => <button key={level.id} onClick={() => setActiveLevel(level.id)} className={`min-w-36 rounded-2xl border p-3 text-left transition ${activeLevel === level.id ? "border-indigo-500 bg-indigo-50 text-indigo-950 dark:bg-indigo-950 dark:text-indigo-100" : "border-stone-200 bg-white text-stone-600 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300"}`}><span className="block text-sm font-bold">{level.label}</span><span className="mt-1 block text-[11px] leading-snug">{level.note}</span></button>)}</div>
    <div className="grid gap-3 md:grid-cols-2">{visible.map((resource) => { const Icon = kindIcon[resource.kind]; const isAdded = added.includes(resource.id); return <article key={resource.id} className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900"><div className="flex items-start gap-3"><div className="rounded-xl bg-stone-100 p-2 text-stone-600 dark:bg-stone-800 dark:text-stone-300"><Icon className="h-4 w-4" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap gap-1"><span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-bold uppercase dark:bg-stone-800">{resource.kind}</span>{resource.underrated && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">Underrated</span>}</div><h3 className="mt-2 font-bold text-stone-900 dark:text-stone-100">{resource.title}</h3><p className="text-xs text-stone-500">{resource.provider} · {resource.duration} · {resource.language}</p></div></div><p className="mt-3 text-sm leading-relaxed text-stone-600 dark:text-stone-300">{resource.description}</p>{resource.project && <p className="mt-3 rounded-xl bg-indigo-50 p-2.5 text-xs text-indigo-900 dark:bg-indigo-950 dark:text-indigo-100"><strong>Build:</strong> {resource.project}</p>}<div className="mt-4 flex gap-2"><a href={resource.url} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-stone-300 px-3 text-xs font-semibold dark:border-stone-700"><ExternalLink className="h-3.5 w-3.5" />Open</a><button disabled={isAdded} onClick={() => addToPath(resource)} className="min-h-10 flex-1 rounded-xl bg-indigo-600 px-3 text-xs font-semibold text-white disabled:bg-emerald-600">{isAdded ? <><Check className="mr-1 inline h-3.5 w-3.5" />Added</> : "Add to study path"}</button></div></article>; })}</div>
  </section>;
}
