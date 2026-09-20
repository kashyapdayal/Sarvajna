import { NextResponse } from "next/server";
import { handleRouteError, requireUser } from "@/lib/api";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { supabase } = await requireUser(request);
    const { data: quiz, error } = await supabase.from("quizzes").select("id,kind,session_id,quiz_items(id,q_type,stem,options,difficulty,marks)").eq("id", params.id).single();
    if (error || !quiz) throw new Error("NOT_FOUND");
    return NextResponse.json({ evaluation: quiz });
  } catch (error) { return handleRouteError(error); }
}
