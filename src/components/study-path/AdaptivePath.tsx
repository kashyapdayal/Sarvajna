"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Clock, ExternalLink, LoaderCircle, PlayCircle, Route } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase-browser";

type PathItem = { id: string; topic: string; level: string; status: "queued" | "active" | "done" | "skipped"; progress: number; resource: { title: string; provider: string; url: string; kind: string; duration: string; description: string } };

export function AdaptivePath() {
  const [items, setItems] = useState<PathItem[]>([]);
  const [nextId, setNextId] = useState<string | null>(null);
  const [driver, setDriver] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function authHeaders() {
    const session = await supabaseBrowser?.auth.getSession();
    return session?.data.session ? { Authorization: `Bearer ${session.data.session.access_token}` } : null;
  }

  async function load() {
    const headers = await authHeaders();
    if (!headers) { setMessage("Sign in to see resources you have saved to your path."); setLoading(false); return; }
    const [itemsResponse, nextResponse] = await Promise.all([fetch("/api/path/resources", { headers }), fetch("/api/path/next", { headers })]);
    if (!itemsResponse.ok) { setMessage("We could not load your path."); setLoading(false); return; }
    const saved = await itemsResponse.json();
    const next = nextResponse.ok ? await nextResponse.json() : null;
    setItems(saved.items ?? []); setNextId(next?.next?.id ?? null); setDriver(next?.driver ?? ""); setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  async function track(item: PathItem, type: "resource_opened" | "resource_completed") {
    const headers = await authHeaders();
    if (!headers) return;
    await fetch("/api/path/activity", { method: "POST", headers: { ...headers, "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() }, body: JSON.stringify({ path_item_id: item.id, type, progress: type === "resource_completed" ? 1 : item.progress }) });
    if (type === "resource_opened") window.open(item.resource.url, "_blank", "noopener,noreferrer");
    await load();
  }

  if (loading) return <div className="grid min-h-48 place-items-center text-sm text-stone-500"><LoaderCircle className="mr-2 h-4 w-4 animate-spin" />Loading your path…</div>;
  return <div className="mx-auto max-w-4xl space-y-5 pb-16 pt-2"><header className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900 sm:p-7"><div className="flex items-start gap-3"><div className="rounded-2xl bg-indigo-50 p-3 text-indigo-600 dark:bg-indigo-950"><Route className="h-6 w-6" /></div><div><p className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">My study path</p><h1 className="mt-1 text-2xl font-extrabold text-stone-900 dark:text-stone-100 sm:text-3xl">Your saved resources, in the right order.</h1><p className="mt-2 text-sm text-stone-600 dark:text-stone-300">{driver || "Add resources from Explore and we’ll adapt the next step as you learn."}</p></div></div></header>{message && <p className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-100">{message}</p>}{!items.length && !message && <p className="rounded-2xl border border-dashed border-stone-300 p-8 text-center text-sm text-stone-500 dark:border-stone-700">No saved resources yet. Search a topic in Explore and add the resources you want to follow.</p>}<div className="space-y-3">{items.map((item, index) => <article key={item.id} className={`rounded-2xl border bg-white p-4 dark:bg-stone-900 ${item.id === nextId ? "border-indigo-400 ring-2 ring-indigo-100 dark:ring-indigo-950" : "border-stone-200 dark:border-stone-800"}`}><div className="flex gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-stone-100 text-xs font-bold text-stone-600 dark:bg-stone-800 dark:text-stone-300">{index + 1}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase"><span className="rounded-full bg-indigo-50 px-2 py-0.5 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200">{item.level}</span><span className="rounded-full bg-stone-100 px-2 py-0.5 text-stone-600 dark:bg-stone-800 dark:text-stone-300">{item.resource.kind}</span>{item.id === nextId && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">Next up</span>}</div><h2 className="mt-2 font-bold text-stone-900 dark:text-stone-100">{item.resource.title}</h2><p className="text-xs text-stone-500">{item.resource.provider} · {item.resource.duration} · {item.topic}</p><p className="mt-2 text-sm text-stone-600 dark:text-stone-300">{item.resource.description}</p><div className="mt-3 flex flex-wrap gap-2"><button onClick={() => track(item, "resource_opened")} className="inline-flex min-h-10 items-center gap-1 rounded-xl bg-stone-900 px-3 text-xs font-semibold text-white dark:bg-stone-100 dark:text-stone-900"><PlayCircle className="h-3.5 w-3.5" />Start resource</button><button onClick={() => track(item, "resource_completed")} disabled={item.status === "done"} className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-stone-300 px-3 text-xs font-semibold disabled:text-emerald-600 dark:border-stone-700"><CheckCircle2 className="h-3.5 w-3.5" />{item.status === "done" ? "Completed" : "Mark complete"}</button></div></div></div></article>)}</div></div>;
}
