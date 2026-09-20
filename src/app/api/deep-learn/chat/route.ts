import { NextResponse } from "next/server";
import { answerDeepLearn } from "@/lib/ai";
import { handleRouteError, parseBody, requireUser } from "@/lib/api";
import { config } from "@/lib/config";
import { deepLearnChatSchema } from "@/lib/contracts";
import { enforceRateLimit } from "@/lib/route-utils";

export async function POST(request: Request) {
  try {
    if (!config.features.deepLearn) return NextResponse.json({ error: { code: "FEATURE_DISABLED", message_user: "Deep Learn is currently unavailable.", message_dev: "FEATURE_DEEP_LEARN=false", retryable: false } }, { status: 403 });
    const { user, supabase } = await requireUser(request);
    enforceRateLimit(user.id);
    const input = parseBody(deepLearnChatSchema, await request.json());
    const [{ data: twin }, { data: notes }] = await Promise.all([
      supabase.from("learning_twin").select("metrics").eq("user_id", user.id).maybeSingle(),
      input.topic_id ? supabase.from("notes").select("citations,content_md").eq("topic_id", input.topic_id).eq("lang", "en").limit(3) : Promise.resolve({ data: [] }),
    ]);
    const sourceText = (notes ?? []).map((note) => `[sources:${JSON.stringify(note.citations)}]\n${note.content_md}`).join("\n\n");
    const response = await answerDeepLearn(input.question, sourceText, twin?.metrics ?? {});
    return NextResponse.json(response);
  } catch (error) {
    return handleRouteError(error);
  }
}
