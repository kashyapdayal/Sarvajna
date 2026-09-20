import { NextResponse } from "next/server";
import { handleRouteError, parseBody, requireUser } from "@/lib/api";
import { blockActionSchema } from "@/lib/contracts";
import { enforceRateLimit, idempotent } from "@/lib/route-utils";

const actionToStatus = { start: "active", done: "done", skip: "skipped" } as const;

export async function POST(request: Request, { params }: { params: { id: string; action: string } }) {
  try {
    const status = actionToStatus[params.action as keyof typeof actionToStatus];
    if (!status) return NextResponse.json({ error: { code: "NOT_FOUND", message_user: "That action is not available.", message_dev: "Invalid block action.", retryable: false } }, { status: 404 });
    const { user, supabase } = await requireUser(request);
    enforceRateLimit(user.id);
    const input = parseBody(blockActionSchema, await request.json().catch(() => ({})));
    const response = await idempotent(supabase, user.id, `/api/blocks/${params.id}/${params.action}`, request.headers.get("idempotency-key"), async () => {
      const { data: block, error } = await supabase.from("plan_blocks").select("*,rescue_sessions!inner(id,user_id)").eq("id", params.id).single();
      if (error || !block) throw new Error("NOT_FOUND");
      const { data, error: updateError } = await supabase.from("plan_blocks").update({
        status, actual_min: status === "done" ? input.actual_min ?? block.planned_min : block.actual_min,
      }).eq("id", params.id).select().single();
      if (updateError) throw updateError;
      await supabase.from("events").insert({ user_id: user.id, session_id: block.session_id, type: `block_${params.action}`, payload: { block_id: block.id, actual_min: input.actual_min } });
      if (status === "active") await supabase.from("rescue_sessions").update({ state: "ACTIVE" }).eq("id", block.session_id);
      return { block: data };
    });
    return NextResponse.json(response);
  } catch (error) {
    return handleRouteError(error);
  }
}
