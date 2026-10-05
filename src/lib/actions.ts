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

  // Anket (yalnızca admin/moderatör — createPoll ayrıca doğrular)
  const pollQuestion = String(formData.get('poll_question') ?? '').trim();
  if (pollQuestion) {
    let opts: string[] = [];
    try {
      opts = JSON.parse(String(formData.get('poll_options') ?? '[]')) as string[];
    } catch {
      opts = [];
    }
    await db.createPoll({
      topicId: res.id,
      question: pollQuestion,
      options: opts,
      multiple: formData.get('poll_multiple') === '1'
    });
  }

  const path = `/konu/${res.id}`;
  revalidatePath('/');
  redirect(path);
}

export async function castPollVotesAction(formData: FormData): Promise<ActionResult> {
  const topicId = String(formData.get('topic_id') ?? '');
  const res = await db.votePoll(
    String(formData.get('poll_id') ?? ''),
    formData.getAll('option_id').map(String)
  );
  if (topicId) revalidatePath(`/konu/${topicId}`);
  return res;
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

/* ---------------- Bildirimler & moderasyon & mesaj ---------------- */

export async function markAllReadAction(): Promise<ActionResult> {
  return await db.markAllNotificationsRead();
}

export async function setTopicFlagsAction(
  id: string,
  flags: { is_pinned?: boolean; is_locked?: boolean }
): Promise<ActionResult> {
  return await db.setTopicFlags(id, flags);
}

export async function createMessageAction(formData: FormData): Promise<ActionResult> {
  const to = String(formData.get('to') ?? '');
  const title = String(formData.get('title') ?? '');
  const content = String(formData.get('content') ?? '');
  const res = await db.createTopic({
    title,
    content,
    isPrivate: true,
    participantIds: [to]
  });
  if (!res.ok || !res.id) return { ok: false, error: res.error };
  redirect(`/konu/${res.id}`);
}

/* ---------------- Profil ---------------- */

export async function updateProfileAction(formData: FormData): Promise<ActionResult> {
  const res = await db.updateProfile({
    display_name: String(formData.get('display_name') ?? ''),
    bio: String(formData.get('bio') ?? '')
  });
  revalidatePath('/ayarlar');
  return res;
}

/** Stok avatar seç */
export async function pickStockAvatarAction(formData: FormData): Promise<ActionResult> {
  const url = String(formData.get('avatar_url') ?? '');
  if (!db.STOCK_AVATARS.includes(url)) return { ok: false, error: 'Geçersiz avatar.' };
  const res = await db.updateProfile({ avatar_url: url });
  revalidatePath('/ayarlar');
  return res;
}

/** Kendi avatarını yükle (Supabase Storage) */
export async function uploadAvatarAction(formData: FormData): Promise<ActionResult> {
  const file = formData.get('avatar');
  if (!(file instanceof File) || file.size === 0)
    return { ok: false, error: 'Önce bir görsel seç.' };
  if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type))
    return { ok: false, error: 'Yalnızca PNG, JPG, WEBP veya GIF yükleyebilirsin.' };
  if (file.size > 4 * 1024 * 1024)
    return { ok: false, error: 'Görsel 4 MB’den küçük olmalı.' };

  const supabase = await createClient();
  if (!supabase) return { ok: false, error: 'Supabase bağlantısı yok.' };
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Giriş yapmalısın.' };

  const ext = file.type === 'image/jpeg' ? 'jpg' : file.type.split('/')[1];
  const path = `${user.id}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('avatars').upload(path, Buffer.from(await file.arrayBuffer()), {
    contentType: file.type,
    upsert: false
  });
  if (error) return { ok: false, error: `Yükleme hatası: ${error.message}` };

  const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path);
  const res = await db.updateProfile({ avatar_url: pub.publicUrl });
  revalidatePath('/ayarlar');
  return res;
}

/** Mesaj/konu eki yükle (Supabase Storage 'attachments') */
export async function uploadAttachmentAction(
  formData: FormData
): Promise<ActionResult & { url?: string }> {
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: 'Önce bir dosya seç.' };
  const okTypes = [
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/gif',
    'application/pdf',
    'application/zip'
  ];
  if (!okTypes.includes(file.type))
    return { ok: false, error: 'İzin verilen türler: PNG, JPG, WEBP, GIF, PDF, ZIP.' };
  if (file.size > 4 * 1024 * 1024) return { ok: false, error: 'Dosya 4 MB’den küçük olmalı.' };

  const supabase = await createClient();
  if (!supabase) return { ok: false, error: 'Supabase bağlantısı yok.' };
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Giriş yapmalısın.' };

  const ext = file.name.includes('.') ? file.name.split('.').pop() : 'bin';
  const path = `${user.id}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from('attachments')
    .upload(path, Buffer.from(await file.arrayBuffer()), {
      contentType: file.type,
      upsert: false
    });
  if (error) return { ok: false, error: `Yükleme hatası: ${error.message}` };

  const { data: pub } = supabase.storage.from('attachments').getPublicUrl(path);
  return { ok: true, url: pub.publicUrl };
}

export async function setAdminAction(formData: FormData): Promise<ActionResult> {
  const res = await db.setAdmin(
    String(formData.get('user_id') ?? ''),
    formData.get('is_admin') === '1'
  );
  revalidatePath('/yonetim');
  return res;
}

export async function setModeratorAction(formData: FormData): Promise<ActionResult> {
  const res = await db.setModerator(
    String(formData.get('user_id') ?? ''),
    formData.get('is_moderator') === '1'
  );
  revalidatePath('/yonetim');
  return res;
}

export async function deleteCategoryAction(formData: FormData): Promise<ActionResult> {
  const res = await db.deleteCategory(String(formData.get('category_id') ?? ''));
  revalidatePath('/yonetim');
  return res;
}

export async function touchPresenceAction(): Promise<ActionResult> {
  return await db.touchPresence();
}

export async function editPostAction(formData: FormData): Promise<ActionResult> {
  return await db.updatePost(
    String(formData.get('post_id') ?? ''),
    String(formData.get('content') ?? '')
  );
}

export async function editTopicAction(formData: FormData): Promise<ActionResult> {
  const res = await db.updateTopic(String(formData.get('topic_id') ?? ''), {
    title: String(formData.get('title') ?? ''),
    content: String(formData.get('content') ?? '')
  });
  if (res.ok) revalidatePath(`/konu/${String(formData.get('topic_id') ?? '')}`);
  return res;
}

export async function markSolutionAction(formData: FormData): Promise<ActionResult> {
  return await db.markSolution(
    String(formData.get('post_id') ?? ''),
    formData.get('v') === '1'
  );
}

/** Şifremi unuttum: sıfırlama e-postası gönder */
export async function resetPasswordAction(formData: FormData): Promise<ActionResult> {
  const email = String(formData.get('email') ?? '').trim();
  if (!email) return { ok: false, error: 'E-posta gerekli.' };
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: 'Supabase bağlantısı yok.' };
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://play-forum.vercel.app'}/ayarlar`
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** Giriş yapmış kullanıcı şifresini değiştirir */
export async function changePasswordAction(formData: FormData): Promise<ActionResult> {
  const pass = String(formData.get('password') ?? '');
  const pass2 = String(formData.get('password2') ?? '');
  if (pass.length < 6) return { ok: false, error: 'Şifre en az 6 karakter olmalı.' };
  if (pass !== pass2) return { ok: false, error: 'Şifreler eşleşmiyor.' };
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: 'Supabase bağlantısı yok.' };
  const { error } = await supabase.auth.updateUser({ password: pass });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
