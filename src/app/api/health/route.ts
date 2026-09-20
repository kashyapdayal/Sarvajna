import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ status: "ok", service: "skillos-rescue", timestamp: new Date().toISOString() });
}
