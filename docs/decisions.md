# Decisions

- [S05.3, S12, S13] Deterministic rescue triage and plan construction live in `src/lib/rescue-engine.ts`; API handlers only persist and present their results.
- [S08, S20, S24] API handlers authenticate each request from its Supabase bearer token, rely on RLS for data isolation, and use the service-role key only to enqueue worker jobs.
