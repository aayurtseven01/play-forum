import { revalidatePath } from 'next/cache';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from './supabase/server';
import { DEMO_USER_ID, randomUUID, readDB, writeDB } from './demo-store';
import type { Category, Post, Profile, SessionUser, Topic } from './types';

/** Anahtarlar yoksa demo modu */
export async function getSupabase(): Promise<SupabaseClient | null> {
  return await createServerClient();
}

export function isDemoEnv() {
  return !(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  );
}

/* ------------------------------------------------------------------ */
/*  Kimlik                                                             */
/* ------------------------------------------------------------------ */

export async function getCurrentUser(): Promise<SessionUser | null> {
  if (isDemoEnv()) {
    const db = await readDB();
    const p = db.profiles.find((x) => x.id === DEMO_USER_ID);
    if (!p) return null;
    return {
      id: p.id,
      email: 'demo@forum.local',
      username: p.username,
      display_name: p.display_name,
      avatar_url: p.avatar_url,
      is_admin: p.is_admin
    };
  }

  const supabase = await getSupabase();
  if (!supabase) return null;

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, display_name, avatar_url, is_admin')
    .eq('id', user.id)
    .single();

  return {
    id: user.id,
    email: user.email ?? null,
    username: profile?.username ?? null,
    display_name: profile?.display_name ?? (user.user_metadata?.full_name ?? null),
    avatar_url: profile?.avatar_url ?? null,
    is_admin: Boolean(profile?.is_admin)
  };
}

type Nameable = {
  username?: string | null;
  display_name?: string | null;
} | null | undefined;

export function displayName(p: Nameable): string {
  return p?.display_name || p?.username || 'Silinmiş kullanıcı';
}

export function initials(p: Nameable): string {
  const n = displayName(p);
  return n.slice(0, 2).toUpperCase();
}

/* ------------------------------------------------------------------ */
/*  Kategoriler                                                        */
/* ------------------------------------------------------------------ */

export async function listCategories(): Promise<Category[]> {
  if (isDemoEnv()) {
    const db = await readDB();
    return db.categories
      .map((c) => ({
        ...c,
        topic_count: db.topics.filter((t) => t.category_id === c.id).length
      }))
      .sort((a, b) => a.sort_order - b.sort_order);
  }

  const supabase = await getSupabase();
  if (!supabase) return [];

  // Konu sayısı, topics tablosundan gömülü (embedded) sayım ile alınır.
  // Böylece categories'te ayrıca bir topic_count sütunu tutmaya gerek kalmaz.
  const { data, error } = await supabase
    .from('categories')
    .select('*, topics(count)')
    .order('sort_order', { ascending: true });

  if (error) {
    logErr('listCategories', error);
    return [];
  }

  type Row = Omit<Category, 'topic_count'> & { topics?: { count: number }[] };
  return (data ?? []).map((row) => {
    const { topics, ...cat } = row as Row;
    return { ...cat, topic_count: topics?.[0]?.count ?? 0 } as Category;
  });
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  if (isDemoEnv()) {
    const db = await readDB();
    return db.categories.find((c) => c.slug === slug) ?? null;
  }
  const supabase = await getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  if (error) return logErr('getCategoryBySlug', error);
  return (data as Category | null) ?? null;
}

export async function createCategory(input: {
  name: string;
  description?: string;
  color?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const slug = slugify(input.name);

  if (isDemoEnv()) {
    const db = await readDB();
    if (db.categories.some((c) => c.slug === slug))
      return { ok: false, error: 'Bu isimde bir kategori zaten var.' };
    db.categories.push({
      id: randomUUID(),
      name: input.name.trim(),
      slug,
      description: input.description?.trim() || null,
      color: input.color ?? '#6366f1',
      sort_order: db.categories.length + 1,
      created_at: new Date().toISOString()
    });
    await writeDB(db);
    revalidatePath('/');
    return { ok: true };
  }

  const supabase = await getSupabase();
  if (!supabase) return { ok: false, error: 'Supabase bağlantısı yok.' };
  const { error } = await supabase.from('categories').insert({
    name: input.name.trim(),
    slug,
    description: input.description?.trim() || null,
    color: input.color ?? '#6366f1'
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath('/');
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/*  Konular                                                            */
/* ------------------------------------------------------------------ */

const TOPIC_SELECT = `
  id, category_id, author_id, title, content, views, is_pinned, is_locked,
  created_at, updated_at,
  author:profiles!topics_author_id_fkey ( id, username, display_name, avatar_url ),
  category:categories ( id, name, slug, color ),
  reply_count
`;

export type TopicSort = 'yeni' | 'aktif' | 'populer';

export async function listTopics(opts: {
  categorySlug?: string;
  sort?: TopicSort;
  q?: string;
  authorId?: string;
  limit?: number;
} = {}): Promise<Topic[]> {
  const { categorySlug, sort = 'yeni', q, authorId, limit = 50 } = opts;

  if (isDemoEnv()) {
    const db = await readDB();
    let rows = db.topics.map((t) => {
      const replies = db.posts.filter((p) => p.topic_id === t.id);
      return {
        ...t,
        author: db.profiles.find((p) => p.id === t.author_id) ?? null,
        category: db.categories.find((c) => c.id === t.category_id) ?? null,
        reply_count: replies.length,
        last_activity: replies.at(-1)?.created_at ?? t.created_at
      };
    });

    if (categorySlug) rows = rows.filter((t) => t.category?.slug === categorySlug);
    if (authorId) rows = rows.filter((t) => t.author_id === authorId);
    if (q) {
      const s = q.toLowerCase();
      rows = rows.filter(
        (t) => t.title.toLowerCase().includes(s) || t.content.toLowerCase().includes(s)
      );
    }

    rows.sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
      if (sort === 'aktif')
        return (b.last_activity ?? b.created_at).localeCompare(a.last_activity ?? a.created_at);
      if (sort === 'populer') return (b.reply_count ?? 0) - (a.reply_count ?? 0);
      return b.created_at.localeCompare(a.created_at);
    });

    return rows.slice(0, limit);
  }

  const supabase = await getSupabase();
  if (!supabase) return [];

  let query = supabase.from('topics').select(TOPIC_SELECT, { count: 'exact' });

  if (categorySlug) {
    const { data: cat } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', categorySlug)
      .single();
    if (!cat) return [];
    query = query.eq('category_id', cat.id);
  }
  if (authorId) query = query.eq('author_id', authorId);
  if (q) query = query.or(`title.ilike.%${q}%,content.ilike.%${q}%`);

  query = query.order('is_pinned', { ascending: false });
  if (sort === 'aktif') query = query.order('updated_at', { ascending: false });
  else if (sort === 'populer') query = query.order('reply_count', { ascending: false });
  else query = query.order('created_at', { ascending: false });

  const { data, error } = await query.limit(limit);
  if (error) {
    logErr('listTopics', error);
    return [];
  }
  return ((data ?? []) as unknown as Topic[]).map(normalizeTopic);
}

export async function getTopic(id: string): Promise<(Topic & { posts: Post[] }) | null> {
  if (isDemoEnv()) {
    const db = await readDB();
    const t = db.topics.find((x) => x.id === id);
    if (!t) return null;
    return {
      ...t,
      author: db.profiles.find((p) => p.id === t.author_id) ?? null,
      category: db.categories.find((c) => c.id === t.category_id) ?? null,
      reply_count: db.posts.filter((p) => p.topic_id === id).length,
      posts: db.posts
        .filter((p) => p.topic_id === id)
        .map((p) => ({ ...p, author: db.profiles.find((x) => x.id === p.author_id) ?? null }))
        .sort((a, b) => a.created_at.localeCompare(b.created_at))
    };
  }

  const supabase = await getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('topics')
    .select(`${TOPIC_SELECT}, posts ( id, topic_id, author_id, content, is_solution, created_at, updated_at, author:profiles!posts_author_id_fkey ( id, username, display_name, avatar_url ) )`)
    .eq('id', id)
    .maybeSingle();

  if (error) return logErr('getTopic', error);
  if (!data) return null;

  const { data: posts } = await supabase
    .from('posts')
    .select(
      'id, topic_id, author_id, content, is_solution, created_at, updated_at, author:profiles!posts_author_id_fkey ( id, username, display_name, avatar_url )'
    )
    .eq('topic_id', id)
    .order('created_at', { ascending: true });

  return {
    ...normalizeTopic(data as unknown as Topic),
    posts: (posts ?? []) as unknown as Post[]
  };
}

/** Supabase join sonuçları dizi dönebiliyor; tekil nesneye indir. */
function normalizeTopic(t: Topic): Topic {
  const raw = t as unknown as { author?: unknown; category?: unknown };
  const pick = (v: unknown) => (Array.isArray(v) ? v[0] ?? null : v ?? null);
  return { ...t, author: pick(raw.author), category: pick(raw.category) } as Topic;
}

export async function createTopic(input: {
  categoryId: string;
  title: string;
  content: string;
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  const title = input.title.trim();
  const content = input.content.trim();
  if (title.length < 4) return { ok: false, error: 'Başlık en az 4 karakter olmalı.' };
  if (content.length < 10) return { ok: false, error: 'İçerik en az 10 karakter olmalı.' };

  if (isDemoEnv()) {
    const user = await getCurrentUser();
    const db = await readDB();
    const id = randomUUID();
    const now = new Date().toISOString();
    db.topics.push({
      id,
      category_id: input.categoryId,
      author_id: user?.id ?? DEMO_USER_ID,
      title,
      content,
      views: 0,
      is_pinned: false,
      is_locked: false,
      created_at: now,
      updated_at: now
    });
    await writeDB(db);
    revalidatePath('/');
    return { ok: true, id };
  }

  const supabase = await getSupabase();
  if (!supabase) return { ok: false, error: 'Supabase bağlantısı yok.' };
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Önce giriş yapmalısın.' };

  const { data, error } = await supabase
    .from('topics')
    .insert({ category_id: input.categoryId, author_id: user.id, title, content })
    .select('id')
    .single();

  if (error) return { ok: false, error: error.message };
  revalidatePath('/');
  return { ok: true, id: data.id };
}

export async function incrementViews(topicId: string) {
  if (isDemoEnv()) {
    const db = await readDB();
    const t = db.topics.find((x) => x.id === topicId);
    if (t) {
      t.views += 1;
      await writeDB(db);
    }
    return;
  }
  const supabase = await getSupabase();
  if (!supabase) return;
  const { data } = await supabase.from('topics').select('views').eq('id', topicId).single();
  if (data) await supabase.rpc('increment_topic_views', { topic_id: topicId });
}

export async function deleteTopic(id: string): Promise<{ ok: boolean; error?: string }> {
  if (isDemoEnv()) {
    const db = await readDB();
    db.topics = db.topics.filter((t) => t.id !== id);
    db.posts = db.posts.filter((p) => p.topic_id !== id);
    await writeDB(db);
    revalidatePath('/');
    return { ok: true };
  }
  const supabase = await getSupabase();
  if (!supabase) return { ok: false, error: 'Supabase bağlantısı yok.' };
  const { error } = await supabase.from('topics').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/');
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/*  Cevaplar                                                           */
/* ------------------------------------------------------------------ */

export async function createPost(input: {
  topicId: string;
  content: string;
}): Promise<{ ok: boolean; error?: string }> {
  const content = input.content.trim();
  if (content.length < 2) return { ok: false, error: 'Cevap boş olamaz.' };

  if (isDemoEnv()) {
    const user = await getCurrentUser();
    const db = await readDB();
    const now = new Date().toISOString();
    db.posts.push({
      id: randomUUID(),
      topic_id: input.topicId,
      author_id: user?.id ?? DEMO_USER_ID,
      content,
      is_solution: false,
      created_at: now,
      updated_at: now
    });
    const t = db.topics.find((x) => x.id === input.topicId);
    if (t) t.updated_at = now;
    await writeDB(db);
    revalidatePath(`/konu/${input.topicId}`);
    return { ok: true };
  }

  const supabase = await getSupabase();
  if (!supabase) return { ok: false, error: 'Supabase bağlantısı yok.' };
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Önce giriş yapmalısın.' };

  const { error } = await supabase
    .from('posts')
    .insert({ topic_id: input.topicId, author_id: user.id, content });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/konu/${input.topicId}`);
  return { ok: true };
}

export async function deletePost(id: string, topicId: string): Promise<{ ok: boolean }> {
  if (isDemoEnv()) {
    const db = await readDB();
    db.posts = db.posts.filter((p) => p.id !== id);
    await writeDB(db);
    revalidatePath(`/konu/${topicId}`);
    return { ok: true };
  }
  const supabase = await getSupabase();
  if (!supabase) return { ok: false };
  await supabase.from('posts').delete().eq('id', id);
  revalidatePath(`/konu/${topicId}`);
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/*  Beğeniler                                                          */
/* ------------------------------------------------------------------ */

export async function toggleReaction(
  targetType: 'topic' | 'post',
  targetId: string
): Promise<{ ok: boolean; liked: boolean; count: number }> {
  if (isDemoEnv()) {
    const db = await readDB();
    const existing = db.reactions.find(
      (r) => r.target_type === targetType && r.target_id === targetId && r.user_id === DEMO_USER_ID
    );
    if (existing) db.reactions = db.reactions.filter((r) => r !== existing);
    else db.reactions.push({ id: randomUUID(), user_id: DEMO_USER_ID, target_type: targetType, target_id: targetId });
    await writeDB(db);
    const count = db.reactions.filter(
      (r) => r.target_type === targetType && r.target_id === targetId
    ).length;
    revalidatePath('/');
    return { ok: true, liked: !existing, count };
  }

  const supabase = await getSupabase();
  if (!supabase) return { ok: false, liked: false, count: 0 };
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, liked: false, count: 0 };

  const { data: existing } = await supabase
    .from('reactions')
    .select('id')
    .eq('target_type', targetType)
    .eq('target_id', targetId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existing) {
    await supabase.from('reactions').delete().eq('id', existing.id);
  } else {
    await supabase
      .from('reactions')
      .insert({ target_type: targetType, target_id: targetId, user_id: user.id });
  }

  const { count } = await supabase
    .from('reactions')
    .select('id', { count: 'exact', head: true })
    .eq('target_type', targetType)
    .eq('target_id', targetId);

  revalidatePath('/');
  return { ok: true, liked: !existing, count: count ?? 0 };
}

export async function getReactionMap(
  userId: string | null,
  ids: { topicIds: string[]; postIds: string[] }
): Promise<Record<string, { count: number; liked: boolean }>> {
  const map: Record<string, { count: number; liked: boolean }> = {};
  const all = [...ids.topicIds.map((i) => ['topic', i] as const), ...ids.postIds.map((i) => ['post', i] as const)];
  all.forEach(([, id]) => (map[id] = { count: 0, liked: false }));

  if (isDemoEnv()) {
    const db = await readDB();
    for (const r of db.reactions) {
      if (!map[r.target_id]) continue;
      map[r.target_id].count += 1;
      if (r.user_id === userId) map[r.target_id].liked = true;
    }
    return map;
  }

  const supabase = await getSupabase();
  if (!supabase) return map;

  const { data } = await supabase
    .from('reactions')
    .select('target_type, target_id, user_id')
    .or(
      [
        ids.topicIds.length ? `target_id.in.(${ids.topicIds.join(',')})` : null,
        ids.postIds.length ? `target_id.in.(${ids.postIds.join(',')})` : null
      ]
        .filter(Boolean)
        .join(',')
    );

  for (const r of data ?? []) {
    if (!map[r.target_id]) map[r.target_id] = { count: 0, liked: false };
    map[r.target_id].count += 1;
    if (r.user_id === userId) map[r.target_id].liked = true;
  }
  return map;
}

/* ------------------------------------------------------------------ */
/*  Profil                                                             */
/* ------------------------------------------------------------------ */

export async function getProfileByUsername(username: string): Promise<Profile | null> {
  if (isDemoEnv()) {
    const db = await readDB();
    return db.profiles.find((p) => p.username === username) ?? null;
  }
  const supabase = await getSupabase();
  if (!supabase) return null;
  // .maybeSingle(): satır yoksa hata vermez, data null döner.
  // .eq(): username sütunu citext olduğu için zaten büyük/küçük harf duyarsız.
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .maybeSingle();
  if (error) return logErr('getProfileByUsername', error);
  return (data as Profile | null) ?? null;
}

export async function updateProfile(input: {
  display_name?: string;
  bio?: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (isDemoEnv()) {
    const db = await readDB();
    const p = db.profiles.find((x) => x.id === DEMO_USER_ID);
    if (p) {
      if (input.display_name !== undefined) p.display_name = input.display_name.trim() || null;
      if (input.bio !== undefined) p.bio = input.bio.trim() || null;
    }
    await writeDB(db);
    revalidatePath('/');
    return { ok: true };
  }

  const supabase = await getSupabase();
  if (!supabase) return { ok: false, error: 'Supabase bağlantısı yok.' };
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Giriş yapmalısın.' };

  const { error } = await supabase
    .from('profiles')
    .update({
      display_name: input.display_name?.trim() || null,
      bio: input.bio?.trim() || null
    })
    .eq('id', user.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/');
  return { ok: true };
}

export async function siteStats() {
  const topics = await listTopics({ limit: 1000 });
  const totalReplies = topics.reduce((sum, t) => sum + (t.reply_count ?? 0), 0);
  return { topics: topics.length, replies: totalReplies };
}

/* ------------------------------------------------------------------ */
/*  Yardımcılar                                                        */
/* ------------------------------------------------------------------ */

export function slugify(input: string): string {
  const map: Record<string, string> = {
    ç: 'c', Ç: 'c', ğ: 'g', Ğ: 'g', ı: 'i', I: 'i', İ: 'i', ö: 'o', Ö: 'o',
    ş: 's', Ş: 's', ü: 'u', Ü: 'u'
  };
  return input
    .split('')
    .map((c) => map[c] ?? c)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'az önce';
  if (m < 60) return `${m} dk önce`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} saat önce`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} gün önce`;
  return new Date(iso).toLocaleDateString('tr-TR');
}

function logErr(where: string, error: { message: string; code?: string }): null {
  console.error(`[supabase:${where}]`, error.code, error.message);
  return null;
}
