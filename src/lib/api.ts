import { NextResponse } from "next/server";
import { ZodError, z } from "zod";
import { createClient, SupabaseClient, User } from "@supabase/supabase-js";

type ApiContext = { user: User; supabase: SupabaseClient };

const errorStatus: Record<string, number> = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION_ERROR: 400,
  CONFLICT: 409,
  RATE_LIMITED: 429,
};

export function apiError(
  code: string,
  messageUser: string,
  messageDev: string,
  retryable = false,
) {
  return NextResponse.json(
    { error: { code, message_user: messageUser, message_dev: messageDev, retryable } },
    { status: errorStatus[code] ?? 500 },
  );
}

export function parseBody<T extends z.ZodTypeAny>(schema: T, body: unknown): z.infer<T> {
  return schema.parse(body);
}

export function handleRouteError(error: unknown) {
  if (error instanceof ZodError) {
    return apiError("VALIDATION_ERROR", "Please check the information and try again.", error.message);
  }
  if (error instanceof Error && error.message === "UNAUTHORIZED") {
    return apiError("UNAUTHORIZED", "Please sign in to continue.", "Missing or invalid bearer token.");
  }
  if (error instanceof Error && error.message === "NOT_FOUND") {
    return apiError("NOT_FOUND", "We could not find that item.", "Requested row is not visible to this user.");
  }
  if (error instanceof Error && error.message === "RATE_LIMITED") {
    return apiError("RATE_LIMITED", "Please wait a moment before trying again.", "Per-user API rate limit exceeded.", true);
  }
  if (error instanceof Error && error.message === "IDEMPOTENCY_KEY_REQUIRED") {
    return apiError("VALIDATION_ERROR", "Please retry with a request key.", "Mutating routes require an Idempotency-Key header.");
  }
  console.error("API route failed", error instanceof Error ? error.message : "Unknown error");
  return apiError("INTERNAL_ERROR", "Something went wrong. Please try again.", "Unhandled route error.", true);
}

export async function requireUser(request: Request): Promise<ApiContext> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (!url || !anonKey || !token) throw new Error("UNAUTHORIZED");

  const authClient = createClient(url, anonKey);
  const { data, error } = await authClient.auth.getUser(token);
  if (error || !data.user) throw new Error("UNAUTHORIZED");

  return {
    user: data.user,
    supabase: createClient(url, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    }),
  };
}

export function createWorkerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) throw new Error("Server worker credentials are not configured.");
  return createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function assertSessionOwner(supabase: SupabaseClient, sessionId: string) {
  const { data, error } = await supabase.from("rescue_sessions").select("*").eq("id", sessionId).single();
  if (error || !data) throw new Error("NOT_FOUND");
  return data;
}

export async function assertExamOwner(supabase: SupabaseClient, examId: string) {
  const { data, error } = await supabase.from("exams").select("*").eq("id", examId).single();
  if (error || !data) throw new Error("NOT_FOUND");
  return data;
}
