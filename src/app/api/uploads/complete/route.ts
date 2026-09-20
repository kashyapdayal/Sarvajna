import { NextResponse } from "next/server";
import { createWorkerClient, handleRouteError, parseBody, requireUser } from "@/lib/api";
import { uploadCompleteSchema } from "@/lib/contracts";
import { enforceRateLimit, idempotent } from "@/lib/route-utils";

export async function POST(request: Request) {
  try {
    const { user, supabase } = await requireUser(request);
    enforceRateLimit(user.id, 10);
    const input = parseBody(uploadCompleteSchema, await request.json());
    const response = await idempotent(supabase, user.id, "/api/uploads/complete", request.headers.get("idempotency-key"), async () => {
      const { data: document, error } = await supabase.from("documents").select("*").eq("id", input.document_id).single();
      if (error || !document) throw new Error("NOT_FOUND");
      const { error: updateError } = await supabase.from("documents").update({ status: "parsing" }).eq("id", document.id);
      if (updateError) throw updateError;
      const worker = createWorkerClient();
      const { data: job, error: jobError } = await worker.from("jobs").insert({ type: "ingest_document", payload: { document_id: document.id, user_id: user.id, exam_id: document.exam_id } }).select().single();
      if (jobError) throw jobError;
      return { document_id: document.id, job_id: job.id, status: "queued" };
    });
    return NextResponse.json(response, { status: 202 });
  } catch (error) {
    return handleRouteError(error);
  }
}
