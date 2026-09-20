import { assertSessionOwner, handleRouteError, requireUser } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { supabase } = await requireUser(request);
    await assertSessionOwner(supabase, params.id);
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let lastId = Number(new URL(request.url).searchParams.get("after") ?? 0);
        const send = async () => {
          const { data } = await supabase.from("events").select("id,type,payload,ts").eq("session_id", params.id).gt("id", lastId).order("id");
          for (const event of data ?? []) {
            lastId = event.id;
            controller.enqueue(encoder.encode(`id: ${event.id}\nevent: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`));
          }
        };
        await send();
        const timer = setInterval(() => { void send(); }, 2000);
        request.signal.addEventListener("abort", () => { clearInterval(timer); controller.close(); }, { once: true });
      },
    });
    return new Response(stream, { headers: { "Cache-Control": "no-cache, no-transform", Connection: "keep-alive", "Content-Type": "text/event-stream" } });
  } catch (error) {
    return handleRouteError(error);
  }
}
