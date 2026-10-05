import Link from 'next/link';
import { notFound } from 'next/navigation';
import LikeButton from '@/components/like-button';
import Composer from '@/components/composer';
import ProgressBar from '@/components/progress-bar';
import { QuoteButton, ShareButton } from '@/components/post-buttons';
import { renderContent } from '@/components/post-content';
import DeleteButtons from '@/components/delete-buttons';
import { setTopicFlagsAction } from '@/lib/actions';
import {
  countPostsByAuthor,
  displayName,
  getReactionMap,
  getTopic,
  getCurrentUser,
  initials,
  incrementViews,
  timeAgo,
  trustInfo
} from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTopic(id);
  return { title: t?.title ?? 'Konu' };
}

export default async function TopicPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const topic = await getTopic(id);
  if (!topic) notFound();

  const [user] = await Promise.all([getCurrentUser(), incrementViews(id)]);

  const reactions = await getReactionMap(user?.id ?? null, {
    topicIds: [topic.id],
    postIds: topic.posts.map((p) => p.id)
  });

  const canModerate = Boolean(user && (user.is_admin || user.id === topic.author_id));
  const siteUrl = `https://play-forum.vercel.app/konu/${topic.id}`;

  // güven seviyesi: yazarların toplam mesaj sayısına göre
  const authorIds = [...new Set([topic.author_id, ...topic.posts.map((p) => p.author_id)])];
  const counts = await Promise.all(authorIds.map((aid) => countPostsByAuthor(aid)));
  const trustOf = (aid: string) => trustInfo(counts[authorIds.indexOf(aid)] ?? 0);

  const pinnedNow = topic.is_pinned;
  const lockedNow = topic.is_locked;

  async function togglePin() {
    'use server';
    await setTopicFlagsAction(id, { is_pinned: !pinnedNow });
  }
  async function toggleLock() {
    'use server';
    await setTopicFlagsAction(id, { is_locked: !lockedNow });
  }

  return (
    <>
      <ProgressBar />

      <div className="topic-head">
        <div className="topic-meta" style={{ marginBottom: 8 }}>
          {topic.category && (
            <Link href={`/kategori/${topic.category.slug}`}>
              <span className="badge-cat" style={{ color: topic.category.color ?? '#919191' }}>
                {topic.category.name}
              </span>
            </Link>
          )}
          {topic.is_private && <span className="pm-chip">✉️ Özel Mesaj</span>}
          {topic.is_pinned && <span className="badge-pill">📌 Sabit</span>}
          {topic.is_locked && <span className="badge-pill">🔒 Kilitli</span>}
        </div>
        <h1>{topic.title}</h1>
        <div className="topic-meta">
          <span>{topic.views} görüntülenme</span>
          <span>·</span>
          <span>{topic.reply_count ?? topic.posts.length} cevap</span>
          <span>·</span>
          <span>{timeAgo(topic.created_at)} başladı</span>
        </div>
      </div>

      {canModerate && (
        <div className="admin-bar">
          <form action={togglePin}>
            <button className="btn btn-sm" type="submit">
              {topic.is_pinned ? '📌 Sabitlemeyi Kaldır' : '📌 Sabitle'}
            </button>
          </form>
          <form action={toggleLock}>
            <button className="btn btn-sm" type="submit">
              {topic.is_locked ? '🔒 Kilidi Aç' : '🔒 Kilitle'}
            </button>
          </form>
          {user?.is_admin && <DeleteButtons topicId={topic.id} />}
        </div>
      )}

      <div className="post-stream">
        {/* İlk mesaj */}
        <article className="post">
          <div className="post-avatar-col">
            <span className="avatar lg">{initials(topic.author)}</span>
            <span className="name">{displayName(topic.author)}</span>
          </div>
          <div className="post-body">
            <div className="post-head">
              <b>{displayName(topic.author)}</b>
              <span className="trust" data-level={trustOf(topic.author_id).level}>
                <i /> {trustOf(topic.author_id).label}
              </span>
              <span>{timeAgo(topic.created_at)}</span>
              <span className="num">#1</span>
            </div>
            <div className="prose">{renderContent(topic.content)}</div>
            <div className="post-actions">
              <LikeButton
                targetType="topic"
                targetId={topic.id}
                initialCount={reactions[topic.id]?.count ?? 0}
                initialLiked={reactions[topic.id]?.liked ?? false}
                disabled={!user}
              />
              {user && <QuoteButton author={displayName(topic.author)} text={topic.content} />}
              <ShareButton url={siteUrl} />
            </div>
          </div>
        </article>

        {topic.posts.map((p) => (
          <article className="post" key={p.id}>
            <div className="post-avatar-col">
              <span className="avatar lg">{initials(p.author)}</span>
              <span className="name">{displayName(p.author)}</span>
            </div>
            <div className="post-body">
              <div className="post-head">
                <b>{displayName(p.author)}</b>
                <span className="trust" data-level={trustOf(p.author_id).level}>
                  <i /> {trustOf(p.author_id).label}
                </span>
                <span>{timeAgo(p.created_at)}</span>
                {p.is_solution && <span className="badge-pill">✓ Çözüm</span>}
                <span className="num">#{p.post_number}</span>
              </div>
              <div className="prose">{renderContent(p.content)}</div>
              <div className="post-actions">
                <LikeButton
                  targetType="post"
                  targetId={p.id}
                  initialCount={reactions[p.id]?.count ?? 0}
                  initialLiked={reactions[p.id]?.liked ?? false}
                  disabled={!user}
                />
                {user && <QuoteButton author={displayName(p.author)} text={p.content} />}
                <ShareButton url={`${siteUrl}?u=${p.id.slice(0, 8)}`} />
                {user && (user.is_admin || user.id === p.author_id) && (
                  <DeleteButtons postId={p.id} topicId={topic.id} />
                )}
              </div>
            </div>
          </article>
        ))}
      </div>

      <div style={{ height: 70 }} />

      {user ? (
        topic.is_locked ? (
          <div className="card empty">Bu konu kilitlenmiş, yeni cevap yazılamaz.</div>
        ) : (
          <Composer topicId={topic.id} />
        )
      ) : (
        <div className="card empty">
          Cevap yazmak için{' '}
          <Link href={`/giris?next=/konu/${topic.id}`} style={{ color: 'var(--link)', fontWeight: 600 }}>
            giriş yap
          </Link>
          .
        </div>
      )}
    </>
  );
}
