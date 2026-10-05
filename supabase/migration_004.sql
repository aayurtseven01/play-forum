-- ============================================================
--  MIGRATION 004 · Çevrimiçi istatistikleri (last_seen)
--  SQL Editor'e yapıştır → Run
-- ============================================================

alter table public.profiles
  add column if not exists last_seen timestamptz not null default now();

create index if not exists idx_profiles_last_seen
  on public.profiles (last_seen desc);

select 'migration_004 tamam' as durum;
