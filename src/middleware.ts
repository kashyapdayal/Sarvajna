import type { NextRequest } from "next/server";

export function middleware(_request: NextRequest) {
  return;
}

export const config = {
  matcher: ["/", "/login", "/onboarding"],
};
