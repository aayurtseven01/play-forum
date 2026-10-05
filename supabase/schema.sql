-- ============================================================
--  FORUM ŞEMASI  ·  Supabase (PostgreSQL)
--  Nasıl kullanılır:
--   Supabase paneli -> sol menü "SQL Editor" -> "New query"
--   -> bu dosyanın tamamını yapıştır -> "Run" (Çalıştır)
--  Ücretsiz katmanda çalışır, ekstra ücret gerektirmez.
-- ============================================================

-- ---------- Uzantılar ----------
create extension if not exists "pgcrypto";   -- gen_random_uuid()
create extension if not exists "citext";     -- büyük/küçük harf duyarsız kullanıcı adı

-- ============================================================
--  1. TABLOLAR
-- ============================================================

-- Kullanıcı profilleri (auth.users ile 1-1)
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  username     citext unique,
  display_name text,
  bio          text check (bio is null or char_length(bio) <= 300),
  avatar_url   text,
  is_admin     boolean not null default false,
  created_at   timestamptz not null default now()
);

-- Kategoriler
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 2 and 60),
  slug        text not null unique,
  description text,
  color       text default '#6366f1',
  sort_order  int  not null default 0,
  topic_count int  not null default 0,   -- trigger ile otomatik güncellenir
  created_at  timestamptz not null default now()
);

-- Konular
create table if not exists public.topics (
  id          uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories (id) on delete cascade,
  author_id   uuid not null references public.profiles   (id) on delete cascade,
  title       text not null check (char_length(title) between 4 and 180),
  content     text not null check (char_length(content) >= 10),
  views       int  not null default 0,
  reply_count int  not null default 0,
  is_pinned   boolean not null default false,
  is_locked   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Cevaplar
create table if not exists public.posts (
  id         uuid primary key default gen_random_uuid(),
  topic_id   uuid not null references public.topics  (id) on delete cascade,
  author_id  uuid not null references public.profiles (id) on delete cascade,
  content    text not null check (char_length(content) >= 2),
  is_solution boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Beğeniler (topic veya post için)
create table if not exists public.reactions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  target_type text not null check (target_type in ('topic', 'post')),
  target_id   uuid not null,
  created_at  timestamptz not null default now(),
  unique (user_id, target_type, target_id)
);

-- ============================================================
--  2. İNDEKSLER (hız için)
-- ============================================================
create index if not exists idx_topics_category on public.topics (category_id, created_at desc);
create index if not exists idx_topics_author   on public.topics (author_id);
create index if not exists idx_topics_updated  on public.topics (updated_at desc);
create index if not exists idx_posts_topic     on public.posts  (topic_id, created_at);
create index if not exists idx_reactions_target on public.reactions (target_type, target_id);
create index if not exists idx_profiles_username on public.profiles ((lower(username::text)));

-- ============================================================
--  3. FONKSİYONLAR
-- ============================================================

-- Yeni üye olan herkes için otomatik profil oluştur
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1))), ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at otomatik güncelle
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists topics_touch on public.topics;
create trigger topics_touch before update on public.topics
  for each row execute function public.touch_updated_at();

drop trigger if exists posts_touch on public.posts;
create trigger posts_touch before update on public.posts
  for each row execute function public.touch_updated_at();

-- Görüntülenme sayacını güvenli şekilde artır (uygulamadan rpc ile çağrılır)
create or replace function public.increment_topic_views(topic_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.topics set views = views + 1 where id = topic_id;
$$;

-- Cevap eklenince/silince konunun sayacını ve son aktivitesini güncelle;
-- konu açılınca ilgili kategorinin konu sayacını tazele.
create or replace function public.sync_topic_counters()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  tid uuid := coalesce(new.topic_id, old.topic_id);
  cat uuid;
begin
  update public.topics t
  set reply_count = (select count(*) from public.posts p where p.topic_id = tid),
      updated_at  = (select max(created_at) from public.posts p where p.topic_id = tid)
  where t.id = tid;

  select category_id into cat from public.topics where id = tid;
  if cat is not null then
    update public.categories c
    set topic_count = (select count(*) from public.topics t where t.category_id = c.id)
    where c.id = cat;
  end if;

  return null;
end;
$$;

drop trigger if exists posts_counter on public.posts;
create trigger posts_counter
  after insert or delete on public.posts
  for each row execute function public.sync_topic_counters();

drop trigger if exists topics_counter on public.topics;
create trigger topics_counter
  after insert on public.topics
  for each row execute function public.sync_topic_counters();

-- Konu silinince kategorinin konu sayacı da düşsün
create or replace function public.sync_category_counter_on_delete()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.categories c
  set topic_count = (select count(*) from public.topics t where t.category_id = old.category_id)
  where c.id = old.category_id;
  return null;
end;
$$;

drop trigger if exists topics_category_counter on public.topics;
create trigger topics_category_counter
  after delete on public.topics
  for each row execute function public.sync_category_counter_on_delete();

-- ============================================================
--  4. GÜVENLİK (Row Level Security)
--     Herkese açık okuma, yazma sadece giriş yapmış kullanıcıya.
-- ============================================================
alter table public.profiles   enable row level security;
alter table public.categories enable row level security;
alter table public.topics     enable row level security;
alter table public.posts      enable row level security;
alter table public.reactions  enable row level security;

-- Yardımcı: giriş yapmış kullanıcı mı?
create or replace function public.is_signed_in()
returns boolean language sql stable as $$
  select exists (select 1 from auth.users where id = auth.uid());
$$;

-- ---------- profiles ----------
drop policy if exists "profiles: herkes okur" on public.profiles;
create policy "profiles: herkes okur" on public.profiles
  for select using (true);

drop policy if exists "profiles: sahibi günceller" on public.profiles;
create policy "profiles: sahibi günceller" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "profiles: sahibi siler" on public.profiles;
create policy "profiles: sahibi siler" on public.profiles
  for delete using (auth.uid() = id);

-- ---------- categories ----------
drop policy if exists "categories: herkes okur" on public.categories;
create policy "categories: herkes okur" on public.categories
  for select using (true);

drop policy if exists "categories: sadece admin yazar" on public.categories;
create policy "categories: sadece admin yazar" on public.categories
  for all using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

-- ---------- topics ----------
drop policy if exists "topics: herkes okur" on public.topics;
create policy "topics: herkes okur" on public.topics for select using (true);

drop policy if exists "topics: giriş yapan açar" on public.topics;
create policy "topics: giriş yapan açar" on public.topics
  for insert with check (auth.uid() = author_id);

drop policy if exists "topics: sahibi günceller" on public.topics;
create policy "topics: sahibi günceller" on public.topics
  for update using (auth.uid() = author_id) with check (auth.uid() = author_id);

drop policy if exists "topics: sahibi veya admin siler" on public.topics;
create policy "topics: sahibi veya admin siler" on public.topics
  for delete using (
    auth.uid() = author_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );

-- ---------- posts ----------
drop policy if exists "posts: herkes okur" on public.posts;
create policy "posts: herkes okur" on public.posts for select using (true);

drop policy if exists "posts: giriş yapan yazar" on public.posts;
create policy "posts: giriş yapan yazar" on public.posts
  for insert with check (auth.uid() = author_id);

drop policy if exists "posts: sahibi günceller" on public.posts;
create policy "posts: sahibi günceller" on public.posts
  for update using (auth.uid() = author_id) with check (auth.uid() = author_id);

drop policy if exists "posts: sahibi veya admin siler" on public.posts;
create policy "posts: sahibi veya admin siler" on public.posts
  for delete using (
    auth.uid() = author_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );

-- ---------- reactions ----------
drop policy if exists "reactions: herkes okur" on public.reactions;
create policy "reactions: herkes okur" on public.reactions for select using (true);

drop policy if exists "reactions: kendi beğenisini ekler" on public.reactions;
create policy "reactions: kendi beğenisini ekler" on public.reactions
  for insert with check (auth.uid() = user_id);

drop policy if exists "reactions: kendi beğenisini siler" on public.reactions;
create policy "reactions: kendi beğenisini siler" on public.reactions
  for delete using (auth.uid() = user_id);

-- ============================================================
--  5. BAŞLANGIÇ VERİSİ (kategoriler)
--     Kendine göre isimleri değiştir / çoğalt.
-- ============================================================
insert into public.categories (name, slug, description, color, sort_order) values
  ('Duyurular',      'duyurular',      'Site kuralları ve yönetim duyuruları.', '#6366f1', 1),
  ('Genel Sohbet',   'genel-sohbet',   'Her konuda serbest konuşma alanı.',     '#0ea5e9', 2),
  ('Yardım & Destek','yardim-destek',  'Sorularını sor, topluluk cevaplasın.',  '#10b981', 3),
  ('Tanıtım',        'tanimtim',       'Projelerini ve kendini tanıt.',         '#f59e0b', 4)
on conflict (slug) do nothing;

-- ============================================================
--  6. ARAMA (basit, ücretsiz)
--     Büyük forumlarda Supabase'in pg_trgm eklentisi yeterli.
-- ============================================================
create extension if not exists pg_trgm;
create index if not exists idx_topics_title_trgm on public.topics using gin (title gin_trgm_ops);

-- ============================================================
--  BİTTİ ✅  Şimdi KURULUM.md'deki adımlarla devam et.
-- ============================================================
