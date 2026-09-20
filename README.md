# SkillOS — Adaptive Exam Prep MVP

SkillOS pairs a calm, exam-eve **Cram Mode** with an ongoing **Deep Learn Portal**. The existing dashboard remains the visual shell; the API layer now supplies auth, adaptive profiles, document ingestion, AI packs, study plans, and study events.

## Run locally

1. Copy `.env.example` to `.env.local` and replace `NEXT_PUBLIC_SUPABASE_URL` with the Project URL from Supabase Dashboard → Connect. Set `NEXT_PUBLIC_SUPABASE_ANON_KEY` to the browser-safe publishable/anon key and `SUPABASE_SERVICE_ROLE_KEY` to the server-only secret key. Then add `AI_API_KEY`. `AI_BASE_URL` and `AI_MODEL` make the AI provider swappable without code changes.
2. Create a Supabase project, enable Email authentication, then run both SQL files in `supabase/migrations/` in timestamp order using the Supabase SQL editor.
3. Install dependencies with `npm install`.
4. Start both the Next.js frontend/API and durable ingestion worker with
   `npm run local:start` (equivalently `./scripts/start.sh`).
5. Stop only the processes launched by the script with `npm run local:stop`
   (equivalently `./scripts/stop.sh`). Use `npm run local:restart` after
   changing `.env.local`.

The launcher is idempotent, prints configuration warnings without blocking
startup, and keeps separate frontend/worker logs and PID files in `.runtime/`.

Open `/login` to create an account, then complete `/onboarding`. The primary dashboard remains at `/`.

Accounts are stored by Supabase Auth. On signup, name, email, and password create a real user record; the profile migration copies the display name into `profiles`. Supabase's browser client persists the signed-in session in the browser so returning users can sign in again with the same email and password. Do not write access tokens, refresh tokens, or passwords into this repository or any project directory.

## API integration points

All API calls require `Authorization: Bearer <Supabase access token>`. Mutating calls also require a UUID `Idempotency-Key` header.

| Feature | Endpoint |
| --- | --- |
| Auth/profile questionnaire | `GET` / `POST /api/onboarding` |
| Cram intake | `POST /api/exams`, `POST /api/sessions`, `POST /api/behavior` |
| Upload and extract | `POST /api/uploads/sign`, `POST /api/uploads/complete` |
| Generate study pack | `POST /api/sessions/:id/cram` |
| Deterministic Pass Core and schedule | `POST /api/sessions/:id/triage`, `POST /api/sessions/:id/plan` |
| Study actions and adaptation signals | `POST /api/blocks/:id/{start|done|skip}`, `POST /api/attempts`, `POST /api/sessions/:id/panic` |
| Deep Learn | `POST /api/deep-learn/chat`, `POST /api/deep-learn/path` |
| Resource discovery and adaptive path | `POST /api/resources/search`, `GET`/`POST /api/path/resources`, `POST /api/path/activity`, `GET /api/path/next` |
| Quick Cram adaptation | `POST /api/cram/quick`, `POST /api/quick-cram/feedback` |
| Behavior agent and data export | `POST /api/behavior/feedback`, `GET /api/twin/export` |
| Adaptive exam evaluation | `POST /api/sessions/:id/evaluation`, `GET /api/evaluations/:id`, `POST /api/evaluations/:id/submit` |

The frontend can use `/api/sessions/:id/events` as an SSE stream for upload and generation state. Existing UI components can replace `mockData` progressively with these endpoints; no page redesign is required.

## Exam-rescue process

1. Create an exam and rescue session, then upload syllabus, notes, and PYQs. The worker extracts text and stores page-level chunks.
2. Submit behavior feedback after each meaningful study block. The deterministic behavior agent updates focus span, pace, retention estimate, format preference, and question style.
3. Generate a Cram Mode pack. It uses uploaded material first; only when material is missing does configured AI web research provide clearly labeled online context. Predictions are estimates, never guaranteed questions.
4. In the quick Cram sprint, each Pass Core topic follows a compact learn → closed-book recall → explanation → later retry loop. Recall feedback updates the Learning Twin so a later pack can select a better first-block format.
5. Start an adaptive evaluation after study. It creates direct, mixed, or indirect questions based on the current Twin, grades written answers, tracks mistakes, and returns the next recommended format.
5. Download `GET /api/twin/export` to receive a private `user_data.txt` export. The app does not store users’ auth tokens in project files.

## AI and content safety

`src/lib/config.ts` is the single configuration point for model settings, limits, and feature toggles. `src/lib/ai.ts` accepts an OpenAI-compatible Responses API, asks for JSON, validates every response with Zod, retries one malformed response, and treats uploaded files only as data. Study outputs from supplied files preserve document/page citations. The deterministic planner, score math, and sleep protection remain outside the model.

The worker extracts `.txt`, `.md`, and text-based PDFs. Scanned PDFs/images fail clearly until OCR is configured; they are never silently accepted. The Cram Mode generator needs at least one processed source document before creating content.

## Security

RLS isolates all user-owned records, upload/export buckets are private, and the service-role key is only used by server/worker code. Never place a service-role or AI key in a `NEXT_PUBLIC_*` variable. Rotate a key immediately if it has been pasted into chat or a repository.
# Sarvajna
