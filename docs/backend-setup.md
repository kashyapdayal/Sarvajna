# Backend setup

1. In the Supabase SQL editor, run `supabase/migrations/20260919000000_rescue_mvp.sql` once against the intended project.
2. Configure these values in the deployment environment (never commit them):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server and worker only; never prefix this with `NEXT_PUBLIC_`)
3. Enable Email or Google sign-in in Supabase Auth. API requests must send the signed-in user JWT as `Authorization: Bearer <token>`.
4. Start the app with `npm run dev`, then verify `GET /api/health` returns `{"status":"ok"}`.
5. Run `npm run worker` as a separate server process. It atomically claims jobs from Postgres and extracts text from `.txt`, `.md`, and text-based PDF uploads. Image/scanned-PDF OCR returns a clear retry state until an OCR provider is configured.

The API validates input with Zod, requires `Idempotency-Key` on mutations, and enforces user ownership through Supabase RLS. Upload completion queues `ingest_document` jobs; deploy a worker with the service-role key to claim and process those jobs before enabling real document ingestion.

`SUPABASE_SERVICE_ROLE_KEY` bypasses RLS. Keep it only in server/worker environment variables and rotate it immediately if it is pasted into chat, source control, or a client bundle.
