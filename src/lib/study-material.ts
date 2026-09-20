import { SupabaseClient } from "@supabase/supabase-js";

export async function sessionStudyMaterial(supabase: SupabaseClient, examId: string, limit = 45_000) {
  const { data: documents, error: documentError } = await supabase.from("documents").select("id,file_path,status").eq("exam_id", examId).eq("status", "ready");
  if (documentError) throw documentError;
  if (!documents?.length) return "";
  const ids = documents.map((document) => document.id);
  const { data: chunks, error } = await supabase.from("document_chunks").select("document_id,page_from,text").in("document_id", ids).order("page_from");
  if (error) throw error;
  return (chunks ?? []).map((chunk) => `[doc:${chunk.document_id};page:${chunk.page_from}]\n${chunk.text}`).join("\n\n").slice(0, limit);
}
