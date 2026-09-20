import { NextResponse } from "next/server";
import { handleRouteError, parseBody, requireUser } from "@/lib/api";
import { pathResourceSchema } from "@/lib/contracts";
import { enforceRateLimit, idempotent } from "@/lib/route-utils";

export async function GET(request: Request) {
  try {
    const { user, supabase } = await requireUser(request);
    const { data, error } = await supabase.from("learning_path_items").select("*").eq("user_id", user.id).order("sequence").order("created_at");
    if (error) throw error;
    return NextResponse.json({ items: data ?? [] });
  } catch (error) { return handleRouteError(error); }
}

export async function POST(request: Request) {
  try {
    const { user, supabase } = await requireUser(request);
    enforceRateLimit(user.id);
    const input = parseBody(pathResourceSchema, await request.json());
    const response = await idempotent(supabase, user.id, "/api/path/resources", request.headers.get("idempotency-key"), async () => {
      const { count, error: countError } = await supabase.from("learning_path_items").select("id", { count: "exact", head: true }).eq("user_id", user.id);
      if (countError) throw countError;
      const { data, error } = await supabase.from("learning_path_items").insert({ user_id: user.id, topic: input.topic, level: input.level, resource: input.resource, sequence: count ?? 0, status: "queued" }).select().single();
      if (error) throw error;
      return { item: data };
    });
    return NextResponse.json(response, { status: 201 });
  } catch (error) { return handleRouteError(error); }
}
