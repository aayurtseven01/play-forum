-- Anket sistemi (yalnızca admin/moderatör açar, üyeler oy kullanır)
create table if not exists public.polls (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics(id) on delete cascade,
  question text not null,
  multiple boolean not null default false,
  created_at timestamptz not null default now(),
  unique (topic_id)
);

create table if not exists public.poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  label text not null,
  position int not null default 0
);

create table if not exists public.poll_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  option_id uuid not null references public.poll_options(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (poll_id, option_id, user_id)
);

alter table public.polls enable row level security;
alter table public.poll_options enable row level security;
alter table public.poll_votes enable row level security;

drop policy if exists "polls: uye okur" on public.polls;
create policy "polls: uye okur" on public.polls
for select using (auth.uid() is not null);

drop policy if exists "polls: admin-mod acar" on public.polls;
create policy "polls: admin-mod acar" on public.polls
for insert with check (
  exists (select 1 from public.profiles me where me.id = auth.uid() and (me.is_admin or me.is_moderator))
);

drop policy if exists "polls: admin-mod yonetir" on public.polls;
create policy "polls: admin-mod yonetir" on public.polls
for update using (
  exists (select 1 from public.profiles me where me.id = auth.uid() and (me.is_admin or me.is_moderator))
);
drop policy if exists "polls: admin-mod siler" on public.polls;
create policy "polls: admin-mod siler" on public.polls
for delete using (
  exists (select 1 from public.profiles me where me.id = auth.uid() and (me.is_admin or me.is_moderator))
);

drop policy if exists "poll_options: uye okur" on public.poll_options;
create policy "poll_options: uye okur" on public.poll_options
for select using (auth.uid() is not null);

drop policy if exists "poll_options: admin-mod ekler" on public.poll_options;
create policy "poll_options: admin-mod ekler" on public.poll_options
for insert with check (
  exists (select 1 from public.profiles me where me.id = auth.uid() and (me.is_admin or me.is_moderator))
);

drop policy if exists "poll_votes: uye okur" on public.poll_votes;
create policy "poll_votes: uye okur" on public.poll_votes
for select using (auth.uid() is not null);

drop policy if exists "poll_votes: uye oy verir" on public.poll_votes;
create policy "poll_votes: uye oy verir" on public.poll_votes
for insert with check (user_id = auth.uid());

drop policy if exists "poll_votes: kendi oyunu degistirir" on public.poll_votes;
create policy "poll_votes: kendi oyunu degistirir" on public.poll_votes
for delete using (user_id = auth.uid());
