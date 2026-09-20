import { NextResponse } from "next/server";
import { handleRouteError, parseBody, requireUser } from "@/lib/api";
import { onboardingSchema } from "@/lib/contracts";
import { enforceRateLimit, idempotent } from "@/lib/route-utils";

export async function GET(request: Request) {
  try {
    const { user, supabase } = await requireUser(request);
    const { data, error } = await supabase.from("profiles").select("display_name,onboarding_completed,onboarding_answers,capability_profile").eq("id", user.id).maybeSingle();
    if (error) throw error;
    return NextResponse.json({ profile: data });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { user, supabase } = await requireUser(request);
    enforceRateLimit(user.id);
    const answers = parseBody(onboardingSchema, await request.json());
    const response = await idempotent(supabase, user.id, "/api/onboarding", request.headers.get("idempotency-key"), async () => {
      const capability = {
        baseline_confidence: Object.values(answers.confidence_by_subject).length ? Object.values(answers.confidence_by_subject).reduce((sum, value) => sum + value, 0) / Object.values(answers.confidence_by_subject).length / 10 : .5,
        focus_span_min: answers.focus_span_min,
        speed_factor: 1,
        retention_est: .5,
        chronotype: answers.best_time,
        panic_index: .2,
        distraction: answers.distraction,
        prefers: answers.learning_style,
        weak_style: answers.difficulties,
        plan_adherence: 0,
        observed_sessions: 0,
        topic_mastery: {},
      };
      const { data: profile, error } = await supabase.from("profiles").upsert({
        id: user.id, display_name: answers.display_name, onboarding_completed: true, onboarding_answers: answers, capability_profile: capability,
      }, { onConflict: "id" }).select().single();
      if (error) throw error;
      const { error: twinError } = await supabase.from("learning_twin").upsert({ user_id: user.id, version: 1, metrics: capability }, { onConflict: "user_id" });
      if (twinError) throw twinError;
      return { profile, capability };
    });
    return NextResponse.json(response);
  } catch (error) {
    return handleRouteError(error);
  }
}
