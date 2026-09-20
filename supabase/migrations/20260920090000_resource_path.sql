create table public.learning_path_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topic text not null,
  level text not null check (level in ('beginner','intermediate','advanced')),
  resource jsonb not null,
  status text not null default 'queued' check (status in ('queued','active','done','skipped')),
  progress numeric not null default 0 check (progress between 0 and 1),
  sequence integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.learning_activity (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  path_item_id uuid references public.learning_path_items(id) on delete cascade,
  type text not null check (type in ('resource_opened','resource_completed','quiz_answer','focus_end','hint_used','path_skipped')),
  duration_ms integer,
  correct boolean,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index learning_path_user_sequence_idx on public.learning_path_items(user_id, sequence, created_at);
create index learning_activity_user_created_idx on public.learning_activity(user_id, created_at desc);
alter table public.learning_path_items enable row level security;
alter table public.learning_activity enable row level security;
create policy "learning_path_own" on public.learning_path_items for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "learning_activity_own" on public.learning_activity for all using (user_id = auth.uid()) with check (user_id = auth.uid());
