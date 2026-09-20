import { NextResponse } from "next/server";
import { assertExamOwner, handleRouteError, parseBody, requireUser } from "@/lib/api";
import { createSessionSchema } from "@/lib/contracts";
import { deriveMode } from "@/lib/rescue-engine";
import { enforceRateLimit, hoursUntil, idempotent } from "@/lib/route-utils";

export async function POST(request: Request) {
  try {
    const { user, supabase } = await requireUser(request);
    enforceRateLimit(user.id);
    const input = parseBody(createSessionSchema, await request.json());
    const exam = await assertExamOwner(supabase, input.exam_id);
    const hours = hoursUntil(exam.exam_start);
    if (hours <= 0) return NextResponse.json({ error: { code: "EXAM_STARTED", message_user: "This exam has already started.", message_dev: "exam_start is in the past", retryable: false } }, { status: 409 });
    const response = await idempotent(supabase, user.id, "/api/sessions", request.headers.get("idempotency-key"), async () => {
      const { data, error } = await supabase.from("rescue_sessions").insert({
        user_id: user.id, exam_id: input.exam_id, state: "INTAKE", mode: input.mode ?? deriveMode(hours),
      }).select().single();
      if (error) throw error;
      await supabase.from("events").insert({ user_id: user.id, session_id: data.id, type: "session_start", payload: {} });
      return { session: data };
    });
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
