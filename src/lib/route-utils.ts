import { NextResponse } from "next/server";
import { SupabaseClient } from "@supabase/supabase-js";

const requests = new Map<string, number[]>();

export function enforceRateLimit(userId: string, limit = 60) {
  const now = Date.now();
  const recent = (requests.get(userId) ?? []).filter((timestamp) => now - timestamp < 60_000);
  if (recent.length >= limit) throw new Error("RATE_LIMITED");
  recent.push(now);
  requests.set(userId, recent);
}

export async function idempotent<T>(
  supabase: SupabaseClient,
  userId: string,
  route: string,
  key: string | null,
  operation: () => Promise<T>,
) {
  if (!key) throw new Error("IDEMPOTENCY_KEY_REQUIRED");
  const { data: prior } = await supabase
    .from("idempotency_keys")
    .select("response")
    .eq("user_id", userId)
    .eq("route", route)
    .eq("key", key)
    .maybeSingle();
  if (prior) return prior.response as T;

  const response = await operation();
  const { error } = await supabase.from("idempotency_keys").insert({ user_id: userId, route, key, response });
  if (error?.code === "23505") {
    const { data: concurrent } = await supabase
      .from("idempotency_keys")
      .select("response")
      .eq("user_id", userId)
      .eq("route", route)
      .eq("key", key)
      .single();
    if (concurrent) return concurrent.response as T;
  }
  if (error) throw error;
  return response;
}

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function hoursUntil(iso: string) {
  return Math.max(0, (new Date(iso).getTime() - Date.now()) / 3_600_000);
}
