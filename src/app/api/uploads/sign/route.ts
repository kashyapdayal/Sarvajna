import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { assertExamOwner, handleRouteError, parseBody, requireUser } from "@/lib/api";
import { uploadSignSchema } from "@/lib/contracts";
import { enforceRateLimit, idempotent } from "@/lib/route-utils";

const safeFilename = (filename: string) => filename.replace(/[^a-zA-Z0-9._-]/g, "_");

export async function POST(request: Request) {
  try {
    const { user, supabase } = await requireUser(request);
    enforceRateLimit(user.id, 10);
    const input = parseBody(uploadSignSchema, await request.json());
    await assertExamOwner(supabase, input.exam_id);
    const response = await idempotent(supabase, user.id, "/api/uploads/sign", request.headers.get("idempotency-key"), async () => {
      if (input.sha256) {
        const { data: duplicate } = await supabase.from("documents").select("id,status,file_path").eq("exam_id", input.exam_id).eq("sha256", input.sha256).maybeSingle();
        if (duplicate) return { document: duplicate, reused: true };
      }
      const path = `${user.id}/${input.exam_id}/${randomUUID()}-${safeFilename(input.filename)}`;
      const { data: document, error } = await supabase.from("documents").insert({
        user_id: user.id, exam_id: input.exam_id, kind: input.kind, file_path: path, mime: input.mime, sha256: input.sha256,
      }).select().single();
      if (error) throw error;
      const { data: signed, error: signedError } = await supabase.storage.from("uploads").createSignedUploadUrl(path);
      if (signedError) throw signedError;
      return { document, upload: signed, reused: false };
    });
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
