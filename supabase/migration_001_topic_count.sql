-- ============================================================
--  MIGRATION 001  ·  categories.topic_count   (OPSİYONEL)
--
--  Uygulama artık konu sayısını topics tablosundan gömülü sayım ile
--  okuyor; yani bu migration OLMADAN da forum tam çalışır.
--
--  Ne zaman çalıştırırsın? Konu sayısı binleri bulduğunda listeleme
--  sorgusunu hızlandırmak istersen. Çalıştırırsan zararı yok.
-- ============================================================

alter table public.categories
  add column if not exists topic_count int not null default 0;

-- Mevcut veriyi bir kez sayarak doldur
update public.categories c
set topic_count = (select count(*) from public.topics t where t.category_id = c.id);

-- Konu açıldığında / silindiğinde sayaç otomatik güncellensin
create or replace function public.sync_topic_counters()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  tid uuid := coalesce(new.topic_id, old.topic_id);
  cat uuid;
begin
  -- Konunun cevap sayısını ve son aktivitesini tazele
  update public.topics t
  set reply_count = (select count(*) from public.posts p where p.topic_id = tid),
      updated_at  = (select max(created_at) from public.posts p where p.topic_id = tid)
  where t.id = tid;

  -- İlgili kategorinin konu sayısını tazele
  select category_id into cat from public.topics where id = tid;
  if cat is not null then
    update public.categories c
    set topic_count = (select count(*) from public.topics t where t.category_id = c.id)
    where c.id = cat;
  end if;

  return null;
end;
$$;

-- Konu silinince kategorinin sayacı da düşsün
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

-- Kontrol: 4 kategori ve doğru sayaçlar görünmeli
select name, slug, topic_count from public.categories order by sort_order;
