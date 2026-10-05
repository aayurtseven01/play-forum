-- İçerik yalnızca üyelere (API seviyesinde de kilit)
drop policy if exists "topics: herkes okur" on public.topics;
create policy "topics: uye okur" on public.topics
for select using (auth.uid() is not null);

drop policy if exists "posts: herkes okur" on public.posts;
create policy "posts: uye okur" on public.posts
for select using (auth.uid() is not null);

drop policy if exists "categories: herkes okur" on public.categories;
create policy "categories: uye okur" on public.categories
for select using (auth.uid() is not null);

drop policy if exists "reactions: herkes okur" on public.reactions;
create policy "reactions: uye okur" on public.reactions
for select using (auth.uid() is not null);
