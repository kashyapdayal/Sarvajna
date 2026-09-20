import { NextResponse } from "next/server";
import { discoverResources } from "@/lib/ai";
import { handleRouteError, parseBody, requireUser } from "@/lib/api";
import { resourceSearchSchema } from "@/lib/contracts";
import { catalogResources } from "@/lib/resource-catalog";
import { enforceRateLimit } from "@/lib/route-utils";

export async function POST(request: Request) {
  try {
    const { user } = await requireUser(request);
    enforceRateLimit(user.id);
    const input = parseBody(resourceSearchSchema, await request.json());
    let resources = catalogResources(input.topic, input.language);
    let source: "curated" | "web" = "curated";
    if (!resources.length) {
      const discovered = await discoverResources(input.topic, input.language);
      resources = discovered.resources.map((resource, index) => ({ ...resource, id: `web-${index}-${resource.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`, topic: input.topic }));
      source = "web";
    }
    return NextResponse.json({ topic: input.topic, source, resources });
  } catch (error) {
    return handleRouteError(error);
  }
}
