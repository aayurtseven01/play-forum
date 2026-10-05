import Link from 'next/link';
import { notFound } from 'next/navigation';
import TopicList from '@/components/topic-list';
import {
  countPostsByAuthor,
  displayName,
  getCurrentUser,
  getProfileByUsername,
  initials,
  listTopics,
  timeAgo,
  trustInfo
} from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  return { title: `@${username}` };
}

export default async function ProfilePage({
  params
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const profile = await getProfileByUsername(username);
  if (!profile) notFound();

  const [topics, me, posts] = await Promise.all([
    listTopics({ authorId: profile.id, limit: 50 }),
    getCurrentUser(),
    countPostsByAuthor(profile.id)
  ]);

  const trust = trustInfo(posts);
  const isMe = me?.id === profile.id;

  return (
    <>
      <div className="card card-pad" style={{ marginTop: 22, display: 'flex', gap: 18, flexWrap: 'wrap' }}>
        <span className="avatar lg" style={{ width: 72, height: 72, fontSize: 24 }}>
          {initials(profile)}
        </span>
        <div style={{ flex: 1, minWidth: 220 }}>
          <h1 style={{ fontSize: 22, margin: 0 }}>
            {displayName(profile)}{' '}
            <span className="trust" data-level={trust.level}>
              <i /> {trust.label}
            </span>
          </h1>
          <div className="hint" style={{ marginBottom: 8 }}>
            @{profile.username}
            {profile.is_admin && <span className="badge-pill" style={{ marginLeft: 8 }}>Yönetici</span>}
          </div>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)' }}>
            {profile.bio ?? 'Bu kullanıcı henüz bir açıklama yazmamış.'}
          </p>
          <div className="hint" style={{ marginTop: 10 }}>
            Katılım: {timeAgo(profile.created_at)} · {posts} mesaj · {topics.length} konu
          </div>
        </div>
        {isMe && (
          <Link href="/ayarlar" className="btn btn-sm">
            Profili Düzenle
          </Link>
        )}
      </div>

      <div className="side-title" style={{ marginTop: 22 }}>
        Açtığı Konular
      </div>
      <TopicList topics={topics} />
    </>
  );
}
