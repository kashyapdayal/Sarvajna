import { NextResponse } from "next/server";
import { createExamSchema } from "@/lib/contracts";
import { handleRouteError, parseBody, requireUser } from "@/lib/api";
import { enforceRateLimit, idempotent } from "@/lib/route-utils";

export async function POST(request: Request) {
  try {
    const { user, supabase } = await requireUser(request);
    enforceRateLimit(user.id);
    const input = parseBody(createExamSchema, await request.json());
    const response = await idempotent(supabase, user.id, "/api/exams", request.headers.get("idempotency-key"), async () => {
      const { data, error } = await supabase.from("exams").insert({
        user_id: user.id,
        title: input.title,
        subject: input.subject,
        domain: input.domain,
        board_or_university: input.board,
        exam_start: input.exam_start,
        duration_min: input.duration_min,
        target_type: input.target.type,
        target_percent: input.target.percent,
        pass_percent: input.pass_percent,
        safety_margin: input.safety_margin,
        total_marks: input.total_marks,
        pattern: input.pattern ?? { sections: [] },
        negative_marking: input.negative_marking,
        status: "intake",
      }).select().single();
      if (error) throw error;
      return { exam: data };
    });
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
