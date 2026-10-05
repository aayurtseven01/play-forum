import { revalidatePath } from 'next/cache';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from './supabase/server';
import { DEMO_USER_ID, randomUUID, readDB, writeDB, type DemoDB } from './demo-store';
import type { AppNotification, Category, Post, Profile, SessionUser, Topic } from './types';

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
  return displayName(p).slice(0, 2).toUpperCase();
}

/** Discourse benzeri güven seviyesi etiketi (mesaj sayısına göre) */
export function trustInfo(postCount: number): { label: string; level: number } {
  if (postCount >= 100) return { label: 'Müdavim', level: 3 };
  if (postCount >= 20) return { label: 'Üye', level: 2 };
  if (postCount >= 1) return { label: 'Katılımcı', level: 1 };
  return { label: 'Yeni Üye', level: 0 };
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
        topic_count: db.topics.filter((t) => t.category_id === c.id && !t.is_private).length
      }))
      .sort((a, b) => a.sort_order - b.sort_order);
  }

  const supabase = await getSupabase();
  if (!supabase) return [];

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
  id, category_id, author_id, title, content, views, reply_count,
  is_pinned, is_locked, is_private, participants,
  created_at, updated_at,
  author:profiles!topics_author_id_fkey ( id, username, display_name, avatar_url ),
  category:categories ( id, name, slug, color )
`;

/** migration_002 henüz yoksa kullanılacak eski seçim */
const TOPIC_SELECT_LEGACY = `
  id, category_id, author_id, title, content, views, reply_count,
  is_pinned, is_locked, created_at, updated_at,
  author:profiles!topics_author_id_fkey ( id, username, display_name, avatar_url ),
  category:categories ( id, name, slug, color )
`;

export type TopicSort = 'yeni' | 'aktif' | 'populer';

function visibleTopicFilter(user: SessionUser | null) {
  if (!user) return 'is_private.is.false';
  return `is_private.is.false,author_id.eq.${user.id},participants.cs.{${user.id}}`;
}

export async function listTopics(opts: {
  categorySlug?: string;
  sort?: TopicSort;
  q?: string;
  authorId?: string;
  privateOnly?: boolean;
  limit?: number;
} = {}): Promise<Topic[]> {
  const { categorySlug, sort = 'yeni', q, authorId, privateOnly = false, limit = 50 } = opts;

  if (isDemoEnv()) {
    const db = await readDB();
    const me = db.profiles.find((p) => p.id === DEMO_USER_ID);
    let rows = db.topics.map((t) => hydrateDemoTopic(db, t));

    if (privateOnly) {
      rows = rows.filter(
        (t) => t.is_private && (t.author_id === me?.id || t.participants.includes(me?.id ?? ''))
      );
    } else {
      rows = rows.filter(
        (t) =>
          !t.is_private ||
          t.author_id === me?.id ||
          t.participants.includes(me?.id ?? '')
      );
      if (!privateOnly && me == null) rows = rows.filter((t) => !t.is_private);
    }

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
  const user = await getCurrentUser();

  let query = supabase.from('topics').select(TOPIC_SELECT);

  if (privateOnly) {
    if (!user) return [];
    query = query
      .eq('is_private', true)
      .or(`author_id.eq.${user.id},participants.cs.{${user.id}}`);
  } else {
    query = query.or(visibleTopicFilter(user));
  }

  if (categorySlug) {
    const { data: cat } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', categorySlug)
      .maybeSingle();
    if (!cat) return [];
    query = query.eq('category_id', cat.id);
  }
  if (authorId) query = query.eq('author_id', authorId);
  if (q) query = query.or(`title.ilike.%${q}%,content.ilike.%${q}%`);

  query = query.order('is_pinned', { ascending: false });
  if (sort === 'aktif') query = query.order('updated_at', { ascending: false });
  else if (sort === 'populer') query = query.order('reply_count', { ascending: false });
  else query = query.order('created_at', { ascending: false });

  let { data, error } = await query.limit(limit);

  // migration_002 henüz çalıştırılmadıysa gizlilik sütunları yoktur;
  // filtreyi düşürüp tekrar dene (eski davranış).
  if (error && /is_private|participants/.test(error.message)) {
    let fallback = supabase.from('topics').select(TOPIC_SELECT_LEGACY);
    if (categorySlug) {
      const { data: cat } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', categorySlug)
        .maybeSingle();
      if (!cat) return [];
      fallback = fallback.eq('category_id', cat.id);
    }
    if (authorId) fallback = fallback.eq('author_id', authorId);
    if (q) fallback = fallback.or(`title.ilike.%${q}%,content.ilike.%${q}%`);
    fallback = fallback.order('is_pinned', { ascending: false });
    if (sort === 'aktif') fallback = fallback.order('updated_at', { ascending: false });
    else if (sort === 'populer') fallback = fallback.order('reply_count', { ascending: false });
    else fallback = fallback.order('created_at', { ascending: false });
    const r = await fallback.limit(limit);
    // eski şemada is_private/participants yok; normalizeTopic boşları doldurur
    data = (r.data ?? null) as typeof data;
    error = r.error;
  }

  if (error) {
    logErr('listTopics', error);
    return [];
  }

  let topics = ((data ?? []) as unknown as Topic[]).map(normalizeTopic);
  topics = await attachLastPosters(supabase, topics);
  return topics;
}

/** Son 3 cevap yazarını avatar kümesi için ekle */
async function attachLastPosters(supabase: SupabaseClient, topics: Topic[]): Promise<Topic[]> {
  if (topics.length === 0) return topics;
  const ids = topics.map((t) => t.id);
  const { data } = await supabase
    .from('posts')
    .select('topic_id, author_id, created_at, author:profiles!posts_author_id_fkey ( id, username, display_name, avatar_url )')
    .in('topic_id', ids)
    .order('created_at', { ascending: false })
    .limit(200);

  const map: Record<string, Topic['last_posters']> = {};
  for (const row of data ?? []) {
    const list = (map[row.topic_id] ??= []);
    const a = Array.isArray(row.author) ? row.author[0] : row.author;
    if (a && list.length < 3 && !list.some((x) => x?.id === (a as { id: string }).id)) {
      list.push(a as never);
    }
  }
  return topics.map((t) => ({ ...t, last_posters: map[t.id] ?? [] }));
}

export async function getTopic(id: string): Promise<(Topic & { posts: Post[] }) | null> {
  if (isDemoEnv()) {
    const db = await readDB();
    const t = db.topics.find((x) => x.id === id);
    if (!t) return null;
    return {
      ...hydrateDemoTopic(db, t),
      posts: db.posts
        .filter((p) => p.topic_id === id)
        .map((p, i) => ({
          ...p,
          post_number: i + 2,
          author: db.profiles.find((x) => x.id === p.author_id) ?? null
        }))
        .sort((a, b) => a.created_at.localeCompare(b.created_at))
    };
  }

  const supabase = await getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('topics')
    .select(TOPIC_SELECT)
    .eq('id', id)
    .maybeSingle();

  if (error && /is_private|participants/.test(error.message)) {
    // migration_002 yok: eski şema ile tekrar dene
    const { data: d2, error: e2 } = await supabase
      .from('topics')
      .select(TOPIC_SELECT_LEGACY)
      .eq('id', id)
      .maybeSingle();
    if (e2) return logErr('getTopic', e2);
    if (!d2) return null;
    const topic = normalizeTopic(d2 as unknown as Topic);
    const posts = await fetchPosts(supabase, id);
    return { ...topic, posts };
  }

  if (error) return logErr('getTopic', error);
  if (!data) return null;

  const topic = normalizeTopic(data as unknown as Topic);

  // Gizlilik kontrolü (istemciye asla sızmasın)
  const user = await getCurrentUser();
  if (topic.is_private) {
    const allowed = user && (user.id === topic.author_id || topic.participants.includes(user.id));
    if (!allowed) return null;
  }

  const posts = await fetchPosts(supabase, id);
  return { ...topic, posts };
}

async function fetchPosts(supabase: SupabaseClient, topicId: string): Promise<Post[]> {
  const { data } = await supabase
    .from('posts')
    .select(
      'id, topic_id, author_id, content, is_solution, created_at, updated_at, author:profiles!posts_author_id_fkey ( id, username, display_name, avatar_url )'
    )
    .eq('topic_id', topicId)
    .order('created_at', { ascending: true });

  return ((data ?? []) as unknown as Post[]).map((p, i) => {
    const raw = p as unknown as { author?: unknown };
    const author = Array.isArray(raw.author) ? raw.author[0] ?? null : raw.author ?? null;
    return { ...p, author, post_number: i + 2 } as Post;
  });
}

export async function createTopic(input: {
  categoryId?: string | null;
  title: string;
  content: string;
  isPrivate?: boolean;
  participantIds?: string[];
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  const title = input.title.trim();
  const content = input.content.trim();
  if (title.length < 4) return { ok: false, error: 'Başlık en az 4 karakter olmalı.' };
  if (content.length < 10) return { ok: false, error: 'İçerik en az 10 karakter olmalı.' };
  const isPrivate = Boolean(input.isPrivate);
  if (isPrivate && (input.participantIds?.length ?? 0) === 0)
    return { ok: false, error: 'Özel mesaj için en az bir alıcı seç.' };

  if (isDemoEnv()) {
    const user = await getCurrentUser();
    const db = await readDB();
    const id = randomUUID();
    const now = new Date().toISOString();
    const participants = isPrivate ? [user?.id ?? DEMO_USER_ID, ...(input.participantIds ?? [])] : [];
    db.topics.push({
      id,
      category_id: isPrivate ? null : (input.categoryId ?? null),
      author_id: user?.id ?? DEMO_USER_ID,
      title,
      content,
      views: 0,
      reply_count: 0,
      is_pinned: false,
      is_locked: false,
      is_private: isPrivate,
      participants,
      created_at: now,
      updated_at: now
    });
    for (const pid of input.participantIds ?? []) {
      db.notifications.push({
        id: randomUUID(),
        user_id: pid,
        actor_id: user?.id ?? DEMO_USER_ID,
        type: 'message',
        topic_id: id,
        post_id: null,
        read: false,
        created_at: now
      });
    }
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

  const payload: Record<string, unknown> = {
    category_id: isPrivate ? null : input.categoryId,
    author_id: user.id,
    title,
    content
  };
  if (isPrivate) {
    payload.is_private = true;
    payload.participants = [user.id, ...(input.participantIds ?? [])];
  }

  const { data, error } = await supabase
    .from('topics')
    .insert(payload)
    .select('id')
    .single();

  if (error) return { ok: false, error: error.message };

  if (isPrivate) {
    for (const pid of input.participantIds ?? []) {
      await supabase.from('notifications').insert({
        user_id: pid,
        actor_id: user.id,
        type: 'message',
        topic_id: data.id
      });
    }
  }

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
  await supabase.rpc('increment_topic_views', { topic_id: topicId });
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

/** Moderasyon: sabitle / kilitle */
export async function setTopicFlags(
  id: string,
  flags: { is_pinned?: boolean; is_locked?: boolean }
): Promise<{ ok: boolean; error?: string }> {
  if (isDemoEnv()) {
    const db = await readDB();
    const t = db.topics.find((x) => x.id === id);
    if (t) Object.assign(t, flags);
    await writeDB(db);
    revalidatePath('/');
    return { ok: true };
  }
  const supabase = await getSupabase();
  if (!supabase) return { ok: false, error: 'Supabase bağlantısı yok.' };
  const user = await getCurrentUser();
  if (!user?.is_admin) return { ok: false, error: 'Yönetici yetkisi gerekli.' };
  const { error } = await supabase.from('topics').update(flags).eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/konu/${id}`);
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
    const topic = db.topics.find((t) => t.id === input.topicId);
    db.posts.push({
      id: randomUUID(),
      topic_id: input.topicId,
      author_id: user?.id ?? DEMO_USER_ID,
      content,
      is_solution: false,
      created_at: now,
      updated_at: now
    });
    if (topic) {
      topic.updated_at = now;
      topic.reply_count = db.posts.filter((p) => p.topic_id === topic.id).length;
      if (topic.author_id !== (user?.id ?? DEMO_USER_ID)) {
        db.notifications.push({
          id: randomUUID(),
          user_id: topic.author_id,
          actor_id: user?.id ?? DEMO_USER_ID,
          type: 'reply',
          topic_id: topic.id,
          post_id: null,
          read: false,
          created_at: now
        });
      }
    }
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

  const { data: topic } = await supabase
    .from('topics')
    .select('author_id, title')
    .eq('id', input.topicId)
    .maybeSingle();

  const { error } = await supabase
    .from('posts')
    .insert({ topic_id: input.topicId, author_id: user.id, content });
  if (error) return { ok: false, error: error.message };

  if (topic && topic.author_id !== user.id) {
    await supabase.from('notifications').insert({
      user_id: topic.author_id,
      actor_id: user.id,
      type: 'reply',
      topic_id: input.topicId
    });
  }

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
    else {
      db.reactions.push({
        id: randomUUID(),
        user_id: DEMO_USER_ID,
        target_type: targetType,
        target_id: targetId
      });
      // beğeni bildirimi
      const authorId =
        targetType === 'topic'
          ? db.topics.find((t) => t.id === targetId)?.author_id
          : db.posts.find((p) => p.id === targetId)?.author_id;
      if (authorId && authorId !== DEMO_USER_ID) {
        db.notifications.push({
          id: randomUUID(),
          user_id: authorId,
          actor_id: DEMO_USER_ID,
          type: 'like',
          topic_id: targetType === 'topic' ? targetId : (db.posts.find((p) => p.id === targetId)?.topic_id ?? null),
          post_id: targetType === 'post' ? targetId : null,
          read: false,
          created_at: new Date().toISOString()
        });
      }
    }
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

    // beğeni bildirimi
    const author =
      targetType === 'topic'
        ? await supabase.from('topics').select('author_id').eq('id', targetId).maybeSingle()
        : await supabase.from('posts').select('author_id, topic_id').eq('id', targetId).maybeSingle();
    if (author?.data && author.data.author_id !== user.id) {
      await supabase.from('notifications').insert({
        user_id: author.data.author_id,
        actor_id: user.id,
        type: 'like',
        topic_id: targetType === 'topic' ? targetId : ((author.data as { topic_id?: string }).topic_id ?? null),
        post_id: targetType === 'post' ? targetId : null
      });
    }
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
  const all = [
    ...ids.topicIds.map((i) => ['topic', i] as const),
    ...ids.postIds.map((i) => ['post', i] as const)
  ];
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

  const targets = [...ids.topicIds, ...ids.postIds];
  if (targets.length === 0) return map;

  const { data } = await supabase
    .from('reactions')
    .select('target_type, target_id, user_id')
    .in('target_id', targets);

  for (const r of data ?? []) {
    if (!map[r.target_id]) map[r.target_id] = { count: 0, liked: false };
    map[r.target_id].count += 1;
    if (r.user_id === userId) map[r.target_id].liked = true;
  }
  return map;
}

/* ------------------------------------------------------------------ */
/*  Bildirimler                                                        */
/* ------------------------------------------------------------------ */

export async function listMyNotifications(): Promise<AppNotification[]> {
  if (isDemoEnv()) {
    const db = await readDB();
    return db.notifications
      .filter((n) => n.user_id === DEMO_USER_ID)
      .map((n) => ({
        ...n,
        actor: db.profiles.find((p) => p.id === n.actor_id) ?? null,
        topic: db.topics.find((t) => t.id === n.topic_id) ?? null
      }))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  const supabase = await getSupabase();
  if (!supabase) return [];
  const user = await getCurrentUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('notifications')
    .select(
      '*, actor:profiles!notifications_actor_id_fkey ( id, username, display_name ), topic:topics ( id, title )'
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    // migration_002 çalıştırılmadıysa sessizce boş dön
    logErr('listMyNotifications', error);
    return [];
  }

  return ((data ?? []) as unknown as AppNotification[]).map((n) => {
    const raw = n as unknown as { actor?: unknown; topic?: unknown };
    return {
      ...n,
      actor: (Array.isArray(raw.actor) ? raw.actor[0] : raw.actor) ?? null,
      topic: (Array.isArray(raw.topic) ? raw.topic[0] : raw.topic) ?? null
    } as AppNotification;
  });
}

export async function unreadNotificationCount(): Promise<number> {
  if (isDemoEnv()) {
    const db = await readDB();
    return db.notifications.filter((n) => n.user_id === DEMO_USER_ID && !n.read).length;
  }
  const supabase = await getSupabase();
  if (!supabase) return 0;
  const user = await getCurrentUser();
  if (!user) return 0;
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('read', false);
  if (error) return 0;
  return count ?? 0;
}

export async function markAllNotificationsRead(): Promise<{ ok: boolean }> {
  if (isDemoEnv()) {
    const db = await readDB();
    db.notifications.forEach((n) => {
      if (n.user_id === DEMO_USER_ID) n.read = true;
    });
    await writeDB(db);
    revalidatePath('/bildirimler');
    return { ok: true };
  }
  const supabase = await getSupabase();
  if (!supabase) return { ok: false };
  const user = await getCurrentUser();
  if (!user) return { ok: false };
  await supabase.from('notifications').update({ read: true }).eq('user_id', user.id);
  revalidatePath('/bildirimler');
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/*  Profil & üye listesi                                               */
/* ------------------------------------------------------------------ */

export async function getProfileByUsername(username: string): Promise<Profile | null> {
  if (isDemoEnv()) {
    const db = await readDB();
    return db.profiles.find((p) => p.username === username) ?? null;
  }
  const supabase = await getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .maybeSingle();
  if (error) return logErr('getProfileByUsername', error);
  return (data as Profile | null) ?? null;
}

export async function listMembers(limit = 50): Promise<Profile[]> {
  if (isDemoEnv()) {
    const db = await readDB();
    return db.profiles.slice(0, limit);
  }
  const supabase = await getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(limit);
  if (error) {
    logErr('listMembers', error);
    return [];
  }
  return (data ?? []) as Profile[];
}

export async function countPostsByAuthor(authorId: string): Promise<number> {
  if (isDemoEnv()) {
    const db = await readDB();
    return db.posts.filter((p) => p.author_id === authorId).length;
  }
  const supabase = await getSupabase();
  if (!supabase) return 0;
  const { count } = await supabase
    .from('posts')
    .select('id', { count: 'exact', head: true })
    .eq('author_id', authorId);
  return count ?? 0;
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
  const publicTopics = topics.filter((t) => !t.is_private);
  const totalReplies = publicTopics.reduce((sum, t) => sum + (t.reply_count ?? 0), 0);
  return { topics: publicTopics.length, replies: totalReplies };
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
  if (m < 60) return `${m} dk`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} sa`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} g`;
  return new Date(iso).toLocaleDateString('tr-TR');
}

function normalizeTopic(t: Topic): Topic {
  const raw = t as unknown as { author?: unknown; category?: unknown };
  const pick = (v: unknown) => (Array.isArray(v) ? v[0] ?? null : v ?? null);
  return {
    ...t,
    is_private: Boolean((t as { is_private?: boolean }).is_private),
    participants: (t as { participants?: string[] }).participants ?? [],
    author: pick(raw.author),
    category: pick(raw.category)
  } as Topic;
}

function hydrateDemoTopic(db: DemoDB, t: Topic): Topic {
  const replies = db.posts.filter((p) => p.topic_id === t.id);
  const posters: Topic['last_posters'] = [];
  for (const p of [...replies].sort((a, b) => b.created_at.localeCompare(a.created_at))) {
    const a = db.profiles.find((x) => x.id === p.author_id);
    if (a && posters.length < 3 && !posters.some((x) => x?.id === a.id)) posters.push(a);
  }
  return {
    ...t,
    is_private: Boolean(t.is_private),
    participants: t.participants ?? [],
    author: db.profiles.find((p) => p.id === t.author_id) ?? null,
    category: db.categories.find((c) => c.id === t.category_id) ?? null,
    reply_count: replies.length,
    last_activity: replies.at(-1)?.created_at ?? t.created_at,
    last_posters: posters
  };
}

function logErr(where: string, error: { message: string; code?: string }): null {
  console.error(`[supabase:${where}]`, error.code, error.message);
  return null;
}
