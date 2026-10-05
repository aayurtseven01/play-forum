-- ============================================================
--  MIGRATION 003 · Avatar yükleme (Storage)
--  SQL Editor'e yapıştır → Run
-- ============================================================

-- Herkese açık avatar kovası
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Giriş yapan kullanıcı kendi klasörüne avatar yükler
drop policy if exists "avatars: sahibi yukler" on storage.objects;
create policy "avatars: sahibi yukler" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Kendi avatarını değiştirir
drop policy if exists "avatars: sahibi gunceller" on storage.objects;
create policy "avatars: sahibi gunceller" on storage.objects
for update to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Kendi avatarını siler
drop policy if exists "avatars: sahibi siler" on storage.objects;
create policy "avatars: sahibi siler" on storage.objects
for delete to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

select 'migration_003 tamam' as durum;
