import Link from 'next/link';
import { notFound } from 'next/navigation';
import LikeButton from '@/components/like-button';
import ReplyForm from '@/components/reply-form';
import DeleteButtons from '@/components/delete-buttons';
import {
  displayName,
  getReactionMap,
  getTopic,
  getCurrentUser,
  initials,
  incrementViews,
  timeAgo
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

  return (
    <>
      <div style={{ marginTop: 18, fontSize: 13, color: 'var(--muted)' }}>
        <Link href="/">Forum</Link>
        {topic.category && (
          <>
            {' / '}
            <Link href={`/kategori/${topic.category.slug}`}>{topic.category.name}</Link>
          </>
        )}
      </div>

      <h1 style={{ fontSize: 24, lineHeight: 1.3, margin: '10px 0 4px' }}>
        {topic.is_pinned && '📌 '}
        {topic.title}
      </h1>
      <div className="topic-meta" style={{ marginBottom: 16 }}>
        {topic.is_locked && <span className="badge badge-muted">🔒 Kilitli</span>}
        <span>
          {topic.author?.username ? (
            <Link href={`/profil/${topic.author.username}`}>{displayName(topic.author)}</Link>
          ) : (
            displayName(topic.author)
          )}
        </span>
        <span>·</span>
        <span>{timeAgo(topic.created_at)}</span>
        <span>·</span>
        <span>{topic.views} görüntüleme</span>
      </div>

      <div className="card">
        <div className="post-card">
          <span className="avatar">{initials(topic.author)}</span>
          <div className="post-body">
            <div className="post-head">
              <b>{displayName(topic.author)}</b>
              <span>{timeAgo(topic.created_at)}</span>
            </div>
            <div className="prose">{topic.content}</div>
            <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
              <LikeButton
                targetType="topic"
                targetId={topic.id}
                initialCount={reactions[topic.id]?.count ?? 0}
                initialLiked={reactions[topic.id]?.liked ?? false}
                disabled={!user}
              />
              {canModerate && <DeleteButtons topicId={topic.id} />}
            </div>
          </div>
        </div>

        {topic.posts.map((p) => (
          <div className="post-card" key={p.id}>
            <span className="avatar">{initials(p.author)}</span>
            <div className="post-body">
              <div className="post-head">
                <b>{displayName(p.author)}</b>
                <span>{timeAgo(p.created_at)}</span>
                {p.is_solution && <span className="badge">✓ Çözüm</span>}
              </div>
              <div className="prose">{p.content}</div>
              <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
                <LikeButton
                  targetType="post"
                  targetId={p.id}
                  initialCount={reactions[p.id]?.count ?? 0}
                  initialLiked={reactions[p.id]?.liked ?? false}
                  disabled={!user}
                />
                {user && (user.is_admin || user.id === p.author_id) && (
                  <DeleteButtons postId={p.id} topicId={topic.id} />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="section-title">
        <span>{topic.posts.length} Cevap</span>
      </div>

      {topic.is_locked ? (
        <div className="card empty">Bu konu kilitlenmiş, yeni cevap yazılamaz.</div>
      ) : user ? (
        <ReplyForm topicId={topic.id} />
      ) : (
        <div className="card empty">
          Cevap yazmak için{' '}
          <Link href={`/giris?next=/konu/${topic.id}`} style={{ color: 'var(--brand)', fontWeight: 600 }}>
            giriş yap
          </Link>
          .
        </div>
      )}
    </>
  );
}
