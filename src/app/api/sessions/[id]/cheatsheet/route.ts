import { NextResponse } from "next/server";
import { assertSessionOwner, handleRouteError, requireUser } from "@/lib/api";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { supabase } = await requireUser(request);
    const session = await assertSessionOwner(supabase, params.id);
    const { data, error } = await supabase.from("cheat_sheets").select("*").eq("session_id", session.id).order("version", { ascending: false }).limit(1).maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: { code: "NOT_READY", message_user: "Your revision sheet is still being prepared.", message_dev: "No cheat sheet generated.", retryable: true } }, { status: 202 });
    return NextResponse.json({ cheatsheet: data, usage: "Revision aid only. Do not use it during an exam." });
  } catch (error) {
    return handleRouteError(error);
  }
}
