-- Görsel/dosya ekleri için 'attachments' kovası (Play Forum)
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', true)
on conflict (id) do nothing;

drop policy if exists "attachments: herkes okur" on storage.objects;
create policy "attachments: herkes okur" on storage.objects
for select using (bucket_id = 'attachments');

drop policy if exists "attachments: uye yukler" on storage.objects;
create policy "attachments: uye yukler" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'attachments'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "attachments: sahibi siler" on storage.objects;
create policy "attachments: sahibi siler" on storage.objects
for delete to authenticated
using (
  bucket_id = 'attachments'
  and (storage.foldername(name))[1] = auth.uid()::text
);
