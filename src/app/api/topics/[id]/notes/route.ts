import { NextResponse } from "next/server";
import { handleRouteError, requireUser } from "@/lib/api";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { supabase } = await requireUser(request);
    const search = new URL(request.url).searchParams;
    const layer = search.get("layer") ?? "L30s";
    const lang = search.get("lang") ?? "en";
    const { data, error } = await supabase.from("notes").select("*").eq("topic_id", params.id).eq("layer", layer).eq("lang", lang).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: { code: "NOT_READY", message_user: "This note is still being prepared.", message_dev: "No note exists for the requested topic/layer/language.", retryable: true } }, { status: 202 });
    return NextResponse.json({ note: data });
  } catch (error) {
    return handleRouteError(error);
  }
}
