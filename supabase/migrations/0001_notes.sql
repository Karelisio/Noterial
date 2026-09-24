create table if not exists public.notes (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default '',
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  synced_at timestamptz
);

create index if not exists notes_user_updated_idx on public.notes (user_id, updated_at);

alter table public.notes enable row level security;

create policy "notes_select_own" on public.notes
  for select using (auth.uid() = user_id);

create policy "notes_insert_own" on public.notes
  for insert with check (auth.uid() = user_id);

create policy "notes_update_own" on public.notes
  for update using (auth.uid() = user_id);

create policy "notes_delete_own" on public.notes
  for delete using (auth.uid() = user_id);
