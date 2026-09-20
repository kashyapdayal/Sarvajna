import { NextResponse } from "next/server";
import { createLearningPath } from "@/lib/ai";
import { handleRouteError, parseBody, requireUser } from "@/lib/api";
import { config } from "@/lib/config";
import { learningPathRequestSchema } from "@/lib/contracts";
import { enforceRateLimit } from "@/lib/route-utils";

export async function POST(request: Request) {
  try {
    if (!config.features.deepLearn) return NextResponse.json({ error: { code: "FEATURE_DISABLED", message_user: "Deep Learn is currently unavailable.", message_dev: "FEATURE_DEEP_LEARN=false", retryable: false } }, { status: 403 });
    const { user, supabase } = await requireUser(request);
    enforceRateLimit(user.id);
    const input = parseBody(learningPathRequestSchema, await request.json());
    const { data: twin } = await supabase.from("learning_twin").select("metrics").eq("user_id", user.id).maybeSingle();
    const path = await createLearningPath(input.goal, input.days, input.minutes_per_day, twin?.metrics ?? {});
    return NextResponse.json(path);
  } catch (error) {
    return handleRouteError(error);
  }
}
