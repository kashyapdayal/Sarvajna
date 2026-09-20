import { NextResponse } from "next/server";
import { handleRouteError, parseBody, requireUser } from "@/lib/api";
import { flashcardReviewSchema } from "@/lib/contracts";
import { enforceRateLimit, idempotent } from "@/lib/route-utils";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { user, supabase } = await requireUser(request);
    enforceRateLimit(user.id);
    const input = parseBody(flashcardReviewSchema, await request.json());
    const response = await idempotent(supabase, user.id, `/api/flashcards/${params.id}/review`, request.headers.get("idempotency-key"), async () => {
      const { data: card, error } = await supabase.from("flashcards").select("*").eq("id", params.id).single();
      if (error || !card) throw new Error("NOT_FOUND");
      const box = input.result === "right" ? Math.min(3, card.box + 1) : 1;
      const minutes = input.result === "right" ? [15, 120, 1440][box - 1] : 15;
      const { data, error: updateError } = await supabase.from("flashcards").update({ box, next_due_at: new Date(Date.now() + minutes * 60_000).toISOString() }).eq("id", card.id).select().single();
      if (updateError) throw updateError;
      return { flashcard: data };
    });
    return NextResponse.json(response);
  } catch (error) {
    return handleRouteError(error);
  }
}
