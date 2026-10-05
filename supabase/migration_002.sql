-- ============================================================
--  MIGRATION 002 · Discourse özellikleri
--  Bildirimler + özel mesajlar + gizlilik
--  SQL Editor'e yapıştır → Run
-- ============================================================

-- ---------- 1) BİLDİRİMLER ----------
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  actor_id   uuid references public.profiles (id) on delete set null,
  type       text not null check (type in ('reply', 'like', 'message')),
  topic_id   uuid references public.topics (id) on delete cascade,
  post_id    uuid references public.posts  (id) on delete cascade,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user
  on public.notifications (user_id, read, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "notif: kendi bildirimlerini okur" on public.notifications;
create policy "notif: kendi bildirimlerini okur" on public.notifications
  for select using (auth.uid() = user_id);

drop policy if exists "notif: kendi bildirimini günceller" on public.notifications;
create policy "notif: kendi bildirimini günceller" on public.notifications
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "notif: kendi bildirimini siler" on public.notifications;
create policy "notif: kendi bildirimini siler" on public.notifications
  for delete using (auth.uid() = user_id);

drop policy if exists "notif: giriş yapan bildirim bırakır" on public.notifications;
create policy "notif: giriş yapan bildirim bırakır" on public.notifications
  for insert with check (auth.uid() is not null and user_id <> auth.uid());

-- ---------- 2) ÖZEL MESAJLAR (gizli konular) ----------
alter table public.topics
  add column if not exists is_private   boolean  not null default false,
  add column if not exists participants uuid[]   not null default '{}';

-- Konu okuma: herkese açık konular + kendi özel konuların
-- (eski ve yeni politika adlarının hepsi önce silinir → tekrar tekrar çalıştırılabilir)
drop policy if exists "topics: herkes okur" on public.topics;
drop policy if exists "topics: görünür konular okunur" on public.topics;
create policy "topics: görünür konular okunur" on public.topics
  for select using (
    not is_private
    or author_id = auth.uid()
    or auth.uid() = any(participants)
  );

-- Cevap okuma: konuyu görebilen cevabı görür
drop policy if exists "posts: herkes okur" on public.posts;
drop policy if exists "posts: görünür konunun cevapları okunur" on public.posts;
create policy "posts: görünür konunun cevapları okunur" on public.posts
  for select using (
    exists (
      select 1 from public.topics t
      where t.id = topic_id
        and (not t.is_private or t.author_id = auth.uid() or auth.uid() = any(t.participants))
    )
  );

-- Cevap yazma: ancak konuyu görebilen (özelde: katılımcı)
drop policy if exists "posts: giriş yapan yazar" on public.posts;
drop policy if exists "posts: görebilen yazar" on public.posts;
create policy "posts: görebilen yazar" on public.posts
  for insert with check (
    auth.uid() = author_id
    and exists (
      select 1 from public.topics t
      where t.id = topic_id
        and (not t.is_private or t.author_id = auth.uid() or auth.uid() = any(t.participants))
    )
  );

-- ---------- 3) KONTROL ----------
select 'migration_002 tamam' as durum;
