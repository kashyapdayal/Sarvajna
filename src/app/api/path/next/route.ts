import { NextResponse } from "next/server";
import { handleRouteError, requireUser } from "@/lib/api";

export async function GET(request: Request) {
  try {
    const { user, supabase } = await requireUser(request);
    const [{ data: items, error }, { data: twin }] = await Promise.all([
      supabase.from("learning_path_items").select("*").eq("user_id", user.id).in("status", ["queued", "active"]).order("sequence").order("created_at").limit(1),
      supabase.from("learning_twin").select("metrics").eq("user_id", user.id).maybeSingle(),
    ]);
    if (error) throw error;
    const next = items?.[0] ?? null;
    const metrics = (twin?.metrics ?? {}) as { retention_est?: number; focus_span_min?: number };
    const driver = metrics.retention_est !== undefined && metrics.retention_est < .5
      ? "Start with this resource, then do a short recall check before moving on."
      : metrics.focus_span_min !== undefined && metrics.focus_span_min < 20
        ? "Use a 15-minute focus block, then take a short break."
        : "This is the next saved resource in your path.";
    return NextResponse.json({ next, driver, twin: { retention_est: metrics.retention_est, focus_span_min: metrics.focus_span_min } });
  } catch (error) { return handleRouteError(error); }
}
