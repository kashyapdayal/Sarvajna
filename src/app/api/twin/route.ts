import { NextResponse } from "next/server";
import { handleRouteError, requireUser } from "@/lib/api";
import { enforceRateLimit, idempotent } from "@/lib/route-utils";

export async function GET(request: Request) {
  try {
    const { user, supabase } = await requireUser(request);
    const { data, error } = await supabase.from("learning_twin").select("version,metrics,updated_at").eq("user_id", user.id).maybeSingle();
    if (error) throw error;
    return NextResponse.json({ twin: data });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const { user, supabase } = await requireUser(request);
    enforceRateLimit(user.id);
    const response = await idempotent(supabase, user.id, "/api/twin", request.headers.get("idempotency-key"), async () => {
      const { error } = await supabase.from("learning_twin").delete().eq("user_id", user.id);
      if (error) throw error;
      return { deleted: true };
    });
    return NextResponse.json(response);
  } catch (error) {
    return handleRouteError(error);
  }
}
