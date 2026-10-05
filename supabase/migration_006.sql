-- Moderatör rolü + yetki escalation kapatma (Play Forum)
alter table public.profiles
  add column if not exists is_moderator boolean not null default false;

-- Sahibi yalnızca profil alanlarını güncelleyebilir (is_admin/is_moderator hariç)
drop policy if exists "profiles: sahibi günceller" on public.profiles;
create policy "profiles: sahibi günceller" on public.profiles
for update of username, display_name, bio, avatar_url
using (auth.uid() = id) with check (auth.uid() = id);

-- Admin tüm alanları güncelleyebilir (rol atamaları)
drop policy if exists "profiles: admin günceller" on public.profiles;
create policy "profiles: admin günceller" on public.profiles
for update using (
  exists (select 1 from public.profiles me where me.id = auth.uid() and me.is_admin)
) with check (
  exists (select 1 from public.profiles me where me.id = auth.uid() and me.is_admin)
);
