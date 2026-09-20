import { NextResponse } from "next/server";
import { assertSessionOwner, handleRouteError, requireUser } from "@/lib/api";
import { hoursUntil } from "@/lib/route-utils";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { supabase } = await requireUser(request);
    const session = await assertSessionOwner(supabase, params.id);
    const { data: exam, error } = await supabase.from("exams").select("title,subject,exam_start,pass_percent,total_marks").eq("id", session.exam_id).single();
    if (error) throw error;
    return NextResponse.json({ session, exam: { ...exam, hours_remaining: hoursUntil(exam.exam_start) } });
  } catch (error) {
    return handleRouteError(error);
  }
}
