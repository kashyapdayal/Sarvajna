create extension if not exists pgcrypto;

create type public.rescue_state as enum ('CREATED','INTAKE','UPLOADING','INGESTING','ANALYZING','DIAGNOSING','TRIAGED','PLANNED','GENERATING','ACTIVE','REPLANNING','WRAPUP','DONE','NEEDS_INPUT','FAILED','PANIC');
create type public.plan_block_type as enum ('LEARN','RECALL','REVIEW','BUILD_SHEET','BREAK','MEAL','SLEEP','WARMUP','FINAL_SWEEP','MORNING_CARD');
create type public.plan_block_status as enum ('todo','active','done','skipped','dropped');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  language_pref text not null default 'en',
  level text,
  board_or_university text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.learning_twin (
  user_id uuid primary key references auth.users(id) on delete cascade,
  version integer not null default 1 check (version > 0),
  metrics jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.exams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  subject text not null,
  domain text,
  board_or_university text,
  exam_start timestamptz not null,
  duration_min integer not null check (duration_min between 15 and 720),
  target_type text not null default 'pass' check (target_type in ('pass','percent','custom')),
  target_percent numeric,
  pass_percent numeric not null default 40 check (pass_percent between 1 and 100),
  safety_margin numeric not null default 8 check (safety_margin between 0 and 30),
  total_marks numeric not null default 100 check (total_marks > 0),
  pattern jsonb not null default '{"sections":[]}'::jsonb,
  negative_marking boolean not null default false,
  status text not null default 'draft',
  mode text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.rescue_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exam_id uuid not null references public.exams(id) on delete cascade,
  state public.rescue_state not null default 'CREATED',
  plan_version integer not null default 0 check (plan_version >= 0),
  mode text not null,
  pass_confidence numeric,
  predicted_score numeric,
  sigma numeric,
  triage jsonb,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exam_id uuid not null references public.exams(id) on delete cascade,
  kind text not null check (kind in ('syllabus','pyq','notes','textbook','other')),
  file_path text not null,
  mime text not null,
  sha256 text,
  pages integer,
  ocr_used boolean not null default false,
  status text not null default 'uploaded' check (status in ('uploaded','parsing','ready','failed')),
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, exam_id, sha256)
);

create table public.topics (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  key text not null,
  title text not null,
  parent_id uuid references public.topics(id) on delete set null,
  unit text,
  complexity smallint not null default 3 check (complexity between 1 and 5),
  est_weight numeric,
  source text not null default 'inferred' check (source in ('syllabus','inferred','user')),
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  unique (exam_id, key)
);

create table public.topic_stats (
  exam_id uuid not null references public.exams(id) on delete cascade,
  topic_id uuid not null references public.topics(id) on delete cascade,
  appearances integer not null default 0,
  papers_considered integer not null default 0,
  recency_weighted_freq numeric not null default 0,
  avg_marks numeric not null default 0,
  max_marks numeric not null default 0,
  last_year integer,
  p_appear numeric not null default .02 check (p_appear between .02 and .98),
  expected_marks numeric not null default 0,
  primary key (exam_id, topic_id)
);

create table public.plan_blocks (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.rescue_sessions(id) on delete cascade,
  plan_version integer not null,
  seq integer not null,
  type public.plan_block_type not null,
  topic_id uuid references public.topics(id) on delete set null,
  depth text check (depth in ('L0','L1','L2','L3')),
  start_at timestamptz not null,
  planned_min integer not null check (planned_min > 0),
  actual_min integer,
  status public.plan_block_status not null default 'todo',
  done_condition text not null,
  why text not null,
  created_at timestamptz not null default now(),
  unique (session_id, plan_version, seq)
);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics(id) on delete cascade,
  session_id uuid not null references public.rescue_sessions(id) on delete cascade,
  layer text not null check (layer in ('L30s','L3m','DEEP')),
  content_md text not null,
  citations jsonb not null default '[]'::jsonb,
  grounded boolean not null default false,
  verified boolean not null default false,
  lang text not null default 'en',
  created_at timestamptz not null default now(),
  unique (topic_id, session_id, layer, lang)
);

create table public.quizzes (id uuid primary key default gen_random_uuid(), session_id uuid not null references public.rescue_sessions(id) on delete cascade, topic_id uuid references public.topics(id) on delete set null, kind text not null check (kind in ('diagnostic','recall','mock')), created_at timestamptz not null default now());
create table public.quiz_items (id uuid primary key default gen_random_uuid(), quiz_id uuid not null references public.quizzes(id) on delete cascade, q_type text not null, stem text not null, options jsonb, answer jsonb not null, rubric jsonb, misconception_tag text, difficulty smallint, marks numeric not null default 1);
create table public.attempts (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, quiz_item_id uuid not null references public.quiz_items(id) on delete cascade, response jsonb not null, correct boolean, score numeric, time_ms integer, hints_used integer not null default 0, confidence_self smallint, created_at timestamptz not null default now());
create table public.events (id bigint generated always as identity primary key, user_id uuid not null references auth.users(id) on delete cascade, session_id uuid not null references public.rescue_sessions(id) on delete cascade, type text not null, payload jsonb not null default '{}'::jsonb, ts timestamptz not null default now());
create table public.document_chunks (id uuid primary key default gen_random_uuid(), document_id uuid not null references public.documents(id) on delete cascade, page_from integer not null, page_to integer not null, text text not null, tokens integer not null default 0, meta jsonb not null default '{}'::jsonb, created_at timestamptz not null default now());
create table public.pyq_questions (id uuid primary key default gen_random_uuid(), exam_id uuid not null references public.exams(id) on delete cascade, document_id uuid references public.documents(id) on delete cascade, year integer, paper_code text, section text, q_number text, text text not null, marks numeric, q_type text, topic_ids uuid[] not null default '{}', answer_hint text, confidence numeric, created_at timestamptz not null default now());
create table public.cheat_sheets (id uuid primary key default gen_random_uuid(), session_id uuid not null references public.rescue_sessions(id) on delete cascade, subject text not null, content jsonb not null default '{"sections":[]}'::jsonb, html text, pdf_path text, version integer not null default 1, verified boolean not null default false, created_at timestamptz not null default now(), unique(session_id, version));
create table public.flashcards (id uuid primary key default gen_random_uuid(), topic_id uuid not null references public.topics(id) on delete cascade, session_id uuid not null references public.rescue_sessions(id) on delete cascade, front text not null, back text not null, difficulty smallint not null default 1 check (difficulty between 1 and 3), source_pyq_id uuid references public.pyq_questions(id) on delete set null, box smallint not null default 1 check (box between 1 and 3), next_due_at timestamptz not null default now(), created_at timestamptz not null default now());
create table public.mistakes (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, attempt_id uuid references public.attempts(id) on delete cascade, topic_id uuid references public.topics(id) on delete set null, error_type text not null check (error_type in ('concept','recall','careless','calculation','misread','time')), explanation text not null, related_topic_ids uuid[] not null default '{}', resolved boolean not null default false, created_at timestamptz not null default now());
create table public.agent_runs (id uuid primary key default gen_random_uuid(), session_id uuid not null references public.rescue_sessions(id) on delete cascade, agent text not null, input_hash text, output jsonb, model text, tokens_in integer, tokens_out integer, cost_usd numeric, latency_ms integer, status text not null, error text, created_at timestamptz not null default now());
create table public.jobs (id uuid primary key default gen_random_uuid(), type text not null, payload jsonb not null, status text not null default 'queued' check (status in ('queued','running','done','failed')), attempts integer not null default 0, run_after timestamptz not null default now(), locked_by text, error text, created_at timestamptz not null default now());
create table public.idempotency_keys (user_id uuid not null references auth.users(id) on delete cascade, route text not null, key text not null, response jsonb not null, created_at timestamptz not null default now(), primary key (user_id, route, key));

create or replace function public.claim_jobs(worker_name text, max_jobs integer default 1)
returns setof public.jobs
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with claimed as (
    select id from public.jobs
    where status = 'queued' and run_after <= now()
    order by created_at
    for update skip locked
    limit greatest(1, least(max_jobs, 20))
  )
  update public.jobs j
  set status = 'running', locked_by = worker_name, attempts = j.attempts + 1
  from claimed
  where j.id = claimed.id
  returning j.*;
end;
$$;
revoke all on function public.claim_jobs(text, integer) from public;
grant execute on function public.claim_jobs(text, integer) to service_role;

create index exams_user_created_idx on public.exams(user_id, created_at desc);
create index sessions_user_created_idx on public.rescue_sessions(user_id, created_at desc);
create index topics_exam_idx on public.topics(exam_id);
create index blocks_session_version_idx on public.plan_blocks(session_id, plan_version, seq);
create index events_session_ts_idx on public.events(session_id, ts);
create index jobs_queue_idx on public.jobs(status, run_after) where status = 'queued';

alter table public.profiles enable row level security;
alter table public.learning_twin enable row level security;
alter table public.exams enable row level security;
alter table public.rescue_sessions enable row level security;
alter table public.documents enable row level security;
alter table public.topics enable row level security;
alter table public.topic_stats enable row level security;
alter table public.plan_blocks enable row level security;
alter table public.notes enable row level security;
alter table public.quizzes enable row level security;
alter table public.quiz_items enable row level security;
alter table public.attempts enable row level security;
alter table public.events enable row level security;
alter table public.document_chunks enable row level security;
alter table public.pyq_questions enable row level security;
alter table public.cheat_sheets enable row level security;
alter table public.flashcards enable row level security;
alter table public.mistakes enable row level security;
alter table public.agent_runs enable row level security;
alter table public.jobs enable row level security;
alter table public.idempotency_keys enable row level security;

create policy "profiles_own" on public.profiles for all using (id = auth.uid()) with check (id = auth.uid());
create policy "twin_own" on public.learning_twin for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "exams_own" on public.exams for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "sessions_own" on public.rescue_sessions for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "documents_own" on public.documents for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "topics_by_exam_owner" on public.topics for all using (exists (select 1 from public.exams e where e.id = exam_id and e.user_id = auth.uid())) with check (exists (select 1 from public.exams e where e.id = exam_id and e.user_id = auth.uid()));
create policy "stats_by_exam_owner" on public.topic_stats for all using (exists (select 1 from public.exams e where e.id = exam_id and e.user_id = auth.uid())) with check (exists (select 1 from public.exams e where e.id = exam_id and e.user_id = auth.uid()));
create policy "blocks_by_session_owner" on public.plan_blocks for all using (exists (select 1 from public.rescue_sessions s where s.id = session_id and s.user_id = auth.uid())) with check (exists (select 1 from public.rescue_sessions s where s.id = session_id and s.user_id = auth.uid()));
create policy "notes_by_session_owner" on public.notes for all using (exists (select 1 from public.rescue_sessions s where s.id = session_id and s.user_id = auth.uid())) with check (exists (select 1 from public.rescue_sessions s where s.id = session_id and s.user_id = auth.uid()));
create policy "quizzes_by_session_owner" on public.quizzes for all using (exists (select 1 from public.rescue_sessions s where s.id = session_id and s.user_id = auth.uid())) with check (exists (select 1 from public.rescue_sessions s where s.id = session_id and s.user_id = auth.uid()));
create policy "quiz_items_by_quiz_owner" on public.quiz_items for select using (exists (select 1 from public.quizzes q join public.rescue_sessions s on s.id = q.session_id where q.id = quiz_id and s.user_id = auth.uid()));
create policy "attempts_own" on public.attempts for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "events_own" on public.events for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "chunks_by_document_owner" on public.document_chunks for select using (exists (select 1 from public.documents d where d.id = document_id and d.user_id = auth.uid()));
create policy "pyqs_by_exam_owner" on public.pyq_questions for select using (exists (select 1 from public.exams e where e.id = exam_id and e.user_id = auth.uid()));
create policy "sheets_by_session_owner" on public.cheat_sheets for all using (exists (select 1 from public.rescue_sessions s where s.id = session_id and s.user_id = auth.uid())) with check (exists (select 1 from public.rescue_sessions s where s.id = session_id and s.user_id = auth.uid()));
create policy "cards_by_session_owner" on public.flashcards for all using (exists (select 1 from public.rescue_sessions s where s.id = session_id and s.user_id = auth.uid())) with check (exists (select 1 from public.rescue_sessions s where s.id = session_id and s.user_id = auth.uid()));
create policy "mistakes_own" on public.mistakes for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "agent_runs_by_session_owner" on public.agent_runs for select using (exists (select 1 from public.rescue_sessions s where s.id = session_id and s.user_id = auth.uid()));
create policy "jobs_no_client_access" on public.jobs for select using (false);
create policy "idempotency_own" on public.idempotency_keys for all using (user_id = auth.uid()) with check (user_id = auth.uid());

insert into storage.buckets (id, name, public) values ('uploads', 'uploads', false), ('exports', 'exports', false) on conflict (id) do nothing;
create policy "uploads_own_folder" on storage.objects for all using (bucket_id = 'uploads' and (storage.foldername(name))[1] = auth.uid()::text) with check (bucket_id = 'uploads' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "exports_own_folder" on storage.objects for all using (bucket_id = 'exports' and (storage.foldername(name))[1] = auth.uid()::text) with check (bucket_id = 'exports' and (storage.foldername(name))[1] = auth.uid()::text);
