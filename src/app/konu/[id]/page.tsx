import Link from 'next/link';
import { notFound } from 'next/navigation';
import LikeButton from '@/components/like-button';
import Composer from '@/components/composer';
import RoleBadge from '@/components/role-badge';
import PollCard from '@/components/poll-card';
import ProgressBar from '@/components/progress-bar';
import { QuoteButton, ShareButton } from '@/components/post-buttons';
import { EditPostButton, EditTopicButton, MarkSolutionButton } from '@/components/edit-buttons';
import { renderContent } from '@/components/post-content';
import DeleteButtons from '@/components/delete-buttons';
import UserAvatar from '@/components/avatar';
import { setTopicFlagsAction } from '@/lib/actions';
import {
  countPostsByAuthor,
  displayName,
  getReactionMap,
  getPollForTopic,
  getTopic,
  getCurrentUser,
  incrementViews,
  timeAgo,
  trustInfo,
  likeCountsForAuthors
} from '@/lib/data';
import type { Topic } from '@/lib/types';

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
  const poll = await getPollForTopic(id);

  const reactions = await getReactionMap(user?.id ?? null, {
    topicIds: [topic.id],
    postIds: topic.posts.map((p) => p.id)
  });

  const canModerate = Boolean(user && (user.is_admin || user.id === topic.author_id));
  const canEditTopic = Boolean(user && (user.is_admin || user.id === topic.author_id));
  const siteUrl = `https://play-forum.vercel.app/konu/${topic.id}`;

  // güven seviyesi: yazarların toplam mesaj sayısına göre
  const authorIds = [...new Set([topic.author_id, ...topic.posts.map((p) => p.author_id)])];
  const counts = await Promise.all(authorIds.map((aid) => countPostsByAuthor(aid)));
  const likesMap = await likeCountsForAuthors(authorIds);
  const countOf = (aid: string) => counts[authorIds.indexOf(aid)] ?? 0;
  const trustOf = (aid: string) => trustInfo(countOf(aid));

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
        {canEditTopic && (
          <div style={{ marginTop: 12 }}>
            <EditTopicButton topicId={topic.id} title={topic.title} content={topic.content} />
          </div>
        )}
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
        {poll && <PollCard poll={poll} topicId={topic.id} />}

        <article className="post">
          <AuthorCard
            profile={topic.author}
            aid={topic.author_id}
            countOf={countOf}
            likesMap={likesMap}
            trustOf={trustOf}
          />
          <div className="post-body">
            <div className="post-head">
              {topic.author?.username ? (
                <Link href={`/profil/${topic.author.username}`}>
                  <b>{displayName(topic.author)}</b>
                </Link>
              ) : (
                <b>{displayName(topic.author)}</b>
              )}
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
            <AuthorCard
              profile={p.author}
              aid={p.author_id}
              countOf={countOf}
              likesMap={likesMap}
              trustOf={trustOf}
            />
            <div className="post-body">
              <div className="post-head">
                {p.author?.username ? (
                  <Link href={`/profil/${p.author.username}`}>
                    <b>{displayName(p.author)}</b>
                  </Link>
                ) : (
                  <b>{displayName(p.author)}</b>
                )}
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
                  <EditPostButton postId={p.id} initial={p.content} />
                )}
                {canEditTopic && <MarkSolutionButton postId={p.id} isSolution={Boolean(p.is_solution)} />}
                {user && (user.is_admin || user.id === p.author_id) && (
                  <DeleteButtons postId={p.id} topicId={topic.id} />
                )}
              </div>
            </div>
          </article>
        ))}
      </div>

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

/** XenForo tarzı yazar kartı: avatar + ünvan + istatistikler */
function AuthorCard({
  profile,
  aid,
  countOf,
  likesMap,
  trustOf
}: {
  profile: Topic['author'];
  aid: string;
  countOf: (aid: string) => number;
  likesMap: Record<string, number>;
  trustOf: (aid: string) => { label: string; level: number };
}) {
  const posts = countOf(aid);
  const likes = likesMap[aid] ?? 0;
  const joined = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    : '—';
  const t = trustOf(aid);
  return (
    <div className="post-avatar-col">
      <UserAvatar profile={profile} className="avatar lg" size={84} />
      {profile?.username ? (
        <Link href={`/profil/${profile.username}`} className="name">
          {displayName(profile)}
        </Link>
      ) : (
        <span className="name">{displayName(profile)}</span>
      )}
      <RoleBadge profile={profile} />
      <span className="trust" data-level={t.level}>
        <i /> {t.label}
      </span>
      <div className="author-stats">
        <div className="as-row">
          <span>Katılım:</span>
          <b>{joined}</b>
        </div>
        <div className="as-row">
          <span>Mesajlar:</span>
          <b>{posts}</b>
        </div>
        <div className="as-row">
          <span>Beğeni:</span>
          <b>{likes}</b>
        </div>
        <div className="as-row">
          <span>Puan:</span>
          <b>{posts * 2 + likes * 3}</b>
        </div>
      </div>
    </div>
  );
}
