import { userDataText } from "@/lib/behavior-agent";
import { handleRouteError, requireUser } from "@/lib/api";

export async function GET(request: Request) {
  try {
    const { user, supabase } = await requireUser(request);
    const [{ data: profile, error: profileError }, { data: twin, error: twinError }] = await Promise.all([
      supabase.from("profiles").select("display_name,language_pref,onboarding_answers,capability_profile,created_at").eq("id", user.id).maybeSingle(),
      supabase.from("learning_twin").select("version,metrics,updated_at").eq("user_id", user.id).maybeSingle(),
    ]);
    if (profileError || twinError) throw profileError ?? twinError;
    return new Response(userDataText(profile ?? {}, twin ?? {}), { headers: { "Content-Disposition": "attachment; filename=user_data.txt", "Content-Type": "text/plain; charset=utf-8" } });
  } catch (error) { return handleRouteError(error); }
}
