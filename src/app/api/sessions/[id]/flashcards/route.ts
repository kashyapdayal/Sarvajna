import { NextResponse } from "next/server";
import { assertSessionOwner, handleRouteError, requireUser } from "@/lib/api";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { supabase } = await requireUser(request);
    const session = await assertSessionOwner(supabase, params.id);
    let query = supabase.from("flashcards").select("*").eq("session_id", session.id).order("next_due_at");
    if (new URL(request.url).searchParams.get("due") === "1") query = query.lte("next_due_at", new Date().toISOString());
    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ flashcards: data ?? [] });
  } catch (error) {
    return handleRouteError(error);
  }
}
