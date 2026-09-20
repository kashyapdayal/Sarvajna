import { NextResponse } from "next/server";
import { createQuickCramPack } from "@/lib/ai";
import { assertSessionOwner, handleRouteError, parseBody, requireUser } from "@/lib/api";
import { quickCramSchema } from "@/lib/contracts";
import { sessionStudyMaterial } from "@/lib/study-material";
import { enforceRateLimit } from "@/lib/route-utils";

export async function POST(request: Request) {
  try {
    const { user, supabase } = await requireUser(request);
    enforceRateLimit(user.id);
    const input = parseBody(quickCramSchema, await request.json());
    let material = "";
    if (input.session_id) {
      const session = await assertSessionOwner(supabase, input.session_id);
      material = await sessionStudyMaterial(supabase, session.exam_id);
    }
    const { data: twin } = await supabase.from("learning_twin").select("metrics").eq("user_id", user.id).maybeSingle();
    const storedFormat = (twin?.metrics as Record<string, unknown> | null)?.prefers;
    const studyMode = input.study_mode === "mixed" && (storedFormat === "read" || storedFormat === "write" || storedFormat === "practice") ? storedFormat : input.study_mode;
    const pack = await createQuickCramPack(input.topic, input.hours_remaining, input.language, material, studyMode);
    return NextResponse.json({ pack, grounded: Boolean(material), source: material ? "your uploaded material" : "online AI-assisted research", study_mode: studyMode });
  } catch (error) { return handleRouteError(error); }
}
