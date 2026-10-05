-- Moderatör rolü + yetki escalation kapatma (Play Forum) — DÜZELTİLMIŞ
alter table public.profiles
  add column if not exists is_moderator boolean not null default false;

-- Sahibi kendi profilini günceller ama rol alanlarını (is_admin/is_moderator) DEĞİŞTİREMEZ
drop policy if exists "profiles: sahibi günceller" on public.profiles;
create policy "profiles: sahibi günceller" on public.profiles
for update using (auth.uid() = id)
with check (
  auth.uid() = id
  and is_admin = (select x.is_admin from public.profiles x where x.id = id)
  and is_moderator = (select x.is_moderator from public.profiles x where x.id = id)
);

-- Admin tüm alanları güncelleyebilir (rol atamaları)
drop policy if exists "profiles: admin günceller" on public.profiles;
create policy "profiles: admin günceller" on public.profiles
for update using (
  exists (select 1 from public.profiles me where me.id = auth.uid() and me.is_admin)
) with check (
  exists (select 1 from public.profiles me where me.id = auth.uid() and me.is_admin)
);
