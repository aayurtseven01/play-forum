'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from './supabase/server';
import * as db from './data';

export type ActionResult = { ok: boolean; error?: string };

/* ---------------- Kimlik ---------------- */

export async function signIn(email: string, password: string, next?: string): Promise<ActionResult> {
  if (db.isDemoEnv()) {
    // Demo modunda gerçek giriş yok; örnek kullanıcıyla devam edilir.
    redirect(next && next.startsWith('/') ? next : '/');
  }
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: 'Supabase yapılandırılmamış.' };

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: 'E-posta veya şifre hatalı.' };
  redirect(next && next.startsWith('/') ? next : '/');
}

export async function signUp(email: string, password: string, username: string): Promise<ActionResult> {
  if (db.isDemoEnv()) {
    return {
      ok: false,
      error:
        'Demo modu açık: gerçek kayıt yapılamaz. .env.local dosyasına Supabase anahtarlarını girince çalışır.'
    };
  }
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: 'Supabase yapılandırılmamış.' };

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username, full_name: username } }
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function signOut(): Promise<void> {
  if (db.isDemoEnv()) redirect('/');
  const supabase = await createClient();
  await supabase?.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/');
}

/* ---------------- Konular ---------------- */

export async function createTopicAction(formData: FormData): Promise<ActionResult> {
  const categoryId = String(formData.get('category_id') ?? '');
  const title = String(formData.get('title') ?? '');
  const content = String(formData.get('content') ?? '');

  const res = await db.createTopic({ categoryId, title, content });
  if (!res.ok || !res.id) return { ok: false, error: res.error };

  const path = `/konu/${res.id}`;
  revalidatePath('/');
  redirect(path);
}

export async function createCategoryAction(formData: FormData): Promise<ActionResult> {
  return await db.createCategory({
    name: String(formData.get('name') ?? ''),
    description: String(formData.get('description') ?? ''),
    color: String(formData.get('color') ?? '#6366f1')
  });
}

export async function deleteTopicAction(id: string): Promise<ActionResult> {
  return await db.deleteTopic(id);
}

/* ---------------- Cevaplar ---------------- */

export async function createPostAction(formData: FormData): Promise<ActionResult> {
  const topicId = String(formData.get('topic_id') ?? '');
  const content = String(formData.get('content') ?? '');
  return await db.createPost({ topicId, content });
}

export async function deletePostAction(id: string, topicId: string): Promise<ActionResult> {
  return await db.deletePost(id, topicId);
}

/* ---------------- Beğeni ---------------- */

export async function toggleReactionAction(
  targetType: 'topic' | 'post',
  targetId: string
): Promise<{ ok: boolean; liked: boolean; count: number }> {
  return await db.toggleReaction(targetType, targetId);
}

/* ---------------- Profil ---------------- */

export async function updateProfileAction(formData: FormData): Promise<ActionResult> {
  return await db.updateProfile({
    display_name: String(formData.get('display_name') ?? ''),
    bio: String(formData.get('bio') ?? '')
  });
}
