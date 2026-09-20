import { NextResponse } from "next/server";
import { assertSessionOwner, handleRouteError, requireUser } from "@/lib/api";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { supabase } = await requireUser(request);
    const session = await assertSessionOwner(supabase, params.id);
    const { data, error } = await supabase.from("topics")
      .select("id,key,title,unit,complexity,verified,source,topic_stats(appearances,papers_considered,p_appear,avg_marks,expected_marks)")
      .eq("exam_id", session.exam_id)
      .order("unit").order("title");
    if (error) throw error;
    return NextResponse.json({ topics: data ?? [] });
  } catch (error) {
    return handleRouteError(error);
  }
}
