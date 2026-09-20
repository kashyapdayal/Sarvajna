create policy "quiz_items_insert_by_quiz_owner" on public.quiz_items
for insert with check (
  exists (
    select 1 from public.quizzes q
    join public.rescue_sessions s on s.id = q.session_id
    where q.id = quiz_id and s.user_id = auth.uid()
  )
);

create policy "agent_runs_insert_by_session_owner" on public.agent_runs
for insert with check (
  exists (
    select 1 from public.rescue_sessions s
    where s.id = session_id and s.user_id = auth.uid()
  )
);
