import { createClient } from "@supabase/supabase-js";

type Job = { id: string; type: string; payload: { document_id?: string; user_id?: string; exam_id?: string }; attempts: number };

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-key";
const isConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.SUPABASE_SERVICE_ROLE_KEY &&
  /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url) &&
  !url.includes("your-project") &&
  !url.includes("placeholder-project")
);

const supabase = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
const workerName = process.env.WORKER_NAME ?? `worker-${process.pid}`;

async function emit(userId: string | undefined, sessionId: string | undefined, type: string, payload: Record<string, unknown>) {
  if (!userId || !sessionId) return;
  await supabase.from("events").insert({ user_id: userId, session_id: sessionId, type, payload });
}

async function findSession(examId: string | undefined) {
  if (!examId) return null;
  const { data } = await supabase.from("rescue_sessions").select("id,user_id").eq("exam_id", examId).order("created_at", { ascending: false }).limit(1).maybeSingle();
  return data;
}

async function processIngestDocument(job: Job) {
  if (!job.payload.document_id) throw new Error("ingest_document job is missing document_id");
  const { data: document, error } = await supabase.from("documents").select("*").eq("id", job.payload.document_id).single();
  if (error || !document) throw new Error("Document no longer exists.");
  const session = await findSession(document.exam_id);
  await emit(document.user_id, session?.id, "ingest_started", { document_id: document.id, stage: "Reading upload" });

  const { data: file, error: downloadError } = await supabase.storage.from("uploads").download(document.file_path);
  if (downloadError || !file) throw new Error("The uploaded file could not be read.");
  let pages: Array<{ page: number; text: string }>;
  if (["text/plain", "text/markdown"].includes(document.mime)) {
    pages = [{ page: 1, text: (await file.text()).trim() }];
  } else if (document.mime === "application/pdf") {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
    pages = await Promise.all(Array.from({ length: pdf.numPages }, async (_, index) => {
      const page = await pdf.getPage(index + 1);
      const content = await page.getTextContent();
      return { page: index + 1, text: content.items.map((item) => "str" in item ? item.str : "").join(" ").replace(/\s+/g, " ").trim() };
    }));
  } else {
    throw new Error("This file needs OCR. Upload a text-based PDF or pasted text while image OCR is unavailable.");
  }
  if (!pages.some((page) => page.text.length > 0)) throw new Error("No readable text was found. Use a text-based PDF or paste the text.");
  const chunks = pages.flatMap(({ page, text }) => Array.from({ length: Math.ceil(text.length / 1800) }, (_, index) => {
    const start = Math.max(0, index * 1600 - (index === 0 ? 0 : 200));
    const chunk = text.slice(start, start + 1800);
    return { document_id: document.id, page_from: page, page_to: page, text: chunk, tokens: Math.ceil(chunk.length / 4) };
  }));
  const { error: clearError } = await supabase.from("document_chunks").delete().eq("document_id", document.id);
  if (clearError) throw clearError;
  const { error: chunkError } = await supabase.from("document_chunks").insert(chunks);
  if (chunkError) throw chunkError;
  const { error: documentError } = await supabase.from("documents").update({ status: "ready", pages: pages.length, ocr_used: false }).eq("id", document.id);
  if (documentError) throw documentError;
  await emit(document.user_id, session?.id, "ingest_ready", { document_id: document.id, chunks: chunks.length });
}

async function processJob(job: Job) {
  if (job.type === "ingest_document") return processIngestDocument(job);
  throw new Error(`Unsupported job type: ${job.type}`);
}

async function tick() {
  const { data: jobs, error } = await supabase.rpc("claim_jobs", { worker_name: workerName, max_jobs: 2 });
  if (error) throw error;
  for (const job of (jobs ?? []) as Job[]) {
    try {
      await processJob(job);
      await supabase.from("jobs").update({ status: "done", locked_by: workerName, error: null }).eq("id", job.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown worker error";
      const retry = job.attempts < 3;
      await supabase.from("jobs").update({
        status: retry ? "queued" : "failed",
        run_after: retry ? new Date(Date.now() + job.attempts * 30_000).toISOString() : new Date().toISOString(),
        error: message,
      }).eq("id", job.id);
      if (!retry && job.type === "ingest_document" && job.payload.document_id) {
        await supabase.from("documents").update({ status: "failed" }).eq("id", job.payload.document_id);
        const session = await findSession(job.payload.exam_id);
        await emit(job.payload.user_id, session?.id, "ingest_failed", { document_id: job.payload.document_id, message: "We could not read this upload. Try pasted text or a clearer file." });
      }
      console.error(`Job ${job.id} failed: ${message}`);
    }
  }
}

if (isConfigured && supabase) {
  console.info(`SkillOS worker ${workerName} active (polling Supabase jobs).`);
  setInterval(() => { void tick().catch((error) => console.error("Worker tick failed", error)); }, 2000);
  void tick().catch((error) => console.error("Worker startup failed", error));
} else {
  console.info(`SkillOS worker ${workerName} running in standby (local demo mode). Configure Supabase credentials in .env.local to enable real background job processing.`);
  setInterval(() => {}, 60000);
}
