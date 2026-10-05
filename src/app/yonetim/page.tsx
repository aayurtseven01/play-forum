import { redirect } from 'next/navigation';
import Link from 'next/link';
import UserAvatar from '@/components/avatar';
import {
  createCategoryAction,
  deleteCategoryAction,
  deleteTopicAction,
  setAdminAction,
  setTopicFlagsAction
} from '@/lib/actions';
import {
  adminListTopics,
  adminStats,
  displayName,
  getCurrentUser,
  listCategories,
  listMembers,
  timeAgo
} from '@/lib/data';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Yönetici Paneli' };

/* Modül seviyesi sunucu eylemleri — form'larla kullanılır */
async function wrapDelTopic(formData: FormData) {
  'use server';
  await deleteTopicAction(String(formData.get('id') ?? ''));
}
async function wrapPin(formData: FormData) {
  'use server';
  await setTopicFlagsAction(String(formData.get('id') ?? ''), {
    is_pinned: formData.get('v') === '1'
  });
}
async function wrapLock(formData: FormData) {
  'use server';
  await setTopicFlagsAction(String(formData.get('id') ?? ''), {
    is_locked: formData.get('v') === '1'
  });
}
async function wrapCreateCat(formData: FormData) {
  'use server';
  await createCategoryAction(formData);
}
async function wrapSetAdmin(formData: FormData) {
  'use server';
  await setAdminAction(formData);
}
async function wrapDelCat(formData: FormData) {
  'use server';
  await deleteCategoryAction(formData);
}

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/giris?next=/yonetim');
  if (!user.is_admin) redirect('/');

  const [stats, members, topics, categories] = await Promise.all([
    adminStats(),
    listMembers(200),
    adminListTopics(100),
    listCategories()
  ]);

  return (
    <>
      <h1 style={{ fontSize: 24, margin: '24px 0 6px' }}>🛠️ Yönetici Paneli</h1>
      <p className="hint" style={{ marginBottom: 20 }}>
        Forumu buradan yönetirsin: üyeler, konular ve kategoriler.
      </p>

      {/* İSTATİSTİKLER */}
      <div className="widget" style={{ marginBottom: 26 }}>
        <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <div className="cell">
            <b>{stats.members}</b>
            <span>üye</span>
          </div>
          <div className="cell">
            <b>{stats.topics}</b>
            <span>konu</span>
          </div>
          <div className="cell">
            <b>{stats.posts}</b>
            <span>mesaj</span>
          </div>
          <div className="cell">
            <b>{stats.categories}</b>
            <span>kategori</span>
          </div>
        </div>
      </div>

      {/* ÜYELER */}
      <div className="side-title">Üyeler</div>
      <div className="widget" style={{ marginBottom: 26, overflowX: 'auto' }}>
        <table className="topic-list">
          <thead>
            <tr>
              <th>Üye</th>
              <th>Katılım</th>
              <th style={{ width: 120 }}>Rol</th>
              <th className="num">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id}>
                <td>
                  <span className="topic-col-main">
                    <UserAvatar profile={m} size={34} />
                    <span>
                      <Link href={`/profil/${m.username}`} className="topic-title" style={{ fontSize: 14 }}>
                        {displayName(m)}
                      </Link>
                      <span className="topic-meta">@{m.username}</span>
                    </span>
                  </span>
                </td>
                <td style={{ fontSize: 13, color: 'var(--muted)' }}>{timeAgo(m.created_at)}</td>
                <td>{m.is_admin ? <span className="badge-pill">Yönetici</span> : <span className="badge-pill">Üye</span>}</td>
                <td className="num">
                  {m.id !== user.id && (
                    <form action={wrapSetAdmin}>
                      <input type="hidden" name="user_id" value={m.id} />
                      <input type="hidden" name="is_admin" value={m.is_admin ? '0' : '1'} />
                      <button className={`btn btn-sm ${m.is_admin ? '' : 'btn-primary'}`} type="submit">
                        {m.is_admin ? 'Yetkiyi Al' : 'Admin Yap'}
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* KONULAR */}
      <div className="side-title">Konular (gizliler dahil)</div>
      <div className="widget" style={{ marginBottom: 26, overflowX: 'auto' }}>
        <table className="topic-list">
          <thead>
            <tr>
              <th>Konu</th>
              <th>Durum</th>
              <th className="num">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {topics.map((t) => (
              <tr key={t.id}>
                <td>
                  <Link href={`/konu/${t.id}`} className="topic-title" style={{ fontSize: 14 }}>
                    {t.title}
                  </Link>
                  <span className="topic-meta">
                    {displayName(t.author)} · {timeAgo(t.created_at)}
                  </span>
                </td>
                <td>
                  <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {t.is_private && <span className="pm-chip">Özel</span>}
                    {t.is_pinned && <span className="badge-pill">📌</span>}
                    {t.is_locked && <span className="badge-pill">🔒</span>}
                  </span>
                </td>
                <td className="num">
                  <span style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    <form action={wrapPin}>
                      <input type="hidden" name="id" value={t.id} />
                      <input type="hidden" name="v" value={t.is_pinned ? '0' : '1'} />
                      <button className="btn btn-sm" type="submit" title="Sabitle / kaldır">
                        📌
                      </button>
                    </form>
                    <form action={wrapLock}>
                      <input type="hidden" name="id" value={t.id} />
                      <input type="hidden" name="v" value={t.is_locked ? '0' : '1'} />
                      <button className="btn btn-sm" type="submit" title="Kilitle / aç">
                        🔒
                      </button>
                    </form>
                    <form action={wrapDelTopic}>
                      <input type="hidden" name="id" value={t.id} />
                      <button className="btn btn-sm btn-danger" type="submit" title="Konuyu sil">
                        Sil
                      </button>
                    </form>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* KATEGORİLER */}
      <div className="side-title">Kategoriler</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 320px', gap: 20 }} className="admin-cats">
        <div className="widget" style={{ overflowX: 'auto' }}>
          <table className="topic-list">
            <thead>
              <tr>
                <th>Kategori</th>
                <th className="num">Konu</th>
                <th className="num">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id}>
                  <td>
                    <span className="topic-col-main">
                      <span className="cat-bar" style={{ background: c.color ?? '#919191' }} />
                      <span>
                        {c.name}
                        <span className="topic-meta">{c.description}</span>
                      </span>
                    </span>
                  </td>
                  <td className="num">{c.topic_count ?? 0}</td>
                  <td className="num">
                    <form action={wrapDelCat}>
                      <input type="hidden" name="category_id" value={c.id} />
                      <button className="btn btn-sm btn-danger" type="submit" disabled={(c.topic_count ?? 0) > 0}>
                        Sil
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="widget">
          <form action={wrapCreateCat} className="widget-pad">
            <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 12 }}>Yeni Kategori</div>
            <div className="field">
              <label>Ad</label>
              <input name="name" required minLength={2} maxLength={60} />
            </div>
            <div className="field">
              <label>Açıklama</label>
              <input name="description" maxLength={140} />
            </div>
            <div className="field">
              <label>Renk</label>
              <input name="color" type="color" defaultValue="#6366f1" style={{ height: 42, padding: 4 }} />
            </div>
            <button className="btn btn-primary btn-block" type="submit">
              Kategori Ekle
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
