import Link from 'next/link';
import { notFound } from 'next/navigation';
import TopicList from '@/components/topic-list';
import {
  displayName,
  getCurrentUser,
  getProfileByUsername,
  initials,
  listTopics,
  timeAgo
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

  const [topics, me] = await Promise.all([
    listTopics({ authorId: profile.id, limit: 50 }),
    getCurrentUser()
  ]);

  const isMe = me?.id === profile.id;

  return (
    <>
      <div className="card card-pad" style={{ marginTop: 20, display: 'flex', gap: 18 }}>
        <span className="avatar lg">{initials(profile)}</span>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 22, margin: 0 }}>{displayName(profile)}</h1>
          <div className="hint" style={{ marginBottom: 8 }}>
            @{profile.username}
            {profile.is_admin && <span className="badge" style={{ marginLeft: 8 }}>Yönetici</span>}
          </div>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)' }}>
            {profile.bio ?? 'Bu kullanıcı henüz bir açıklama yazmamış.'}
          </p>
          <div className="hint" style={{ marginTop: 10 }}>
            Üyelik: {new Date(profile.created_at).toLocaleDateString('tr-TR')} · {topics.length} konu
          </div>
        </div>
        {isMe && (
          <Link href="/ayarlar" className="btn btn-sm">
            Profili Düzenle
          </Link>
        )}
      </div>

      <div className="section-title">
        <span>Açtığı Konular</span>
      </div>
      <TopicList topics={topics} />
    </>
  );
}
