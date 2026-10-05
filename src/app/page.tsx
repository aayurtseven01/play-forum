import Link from 'next/link';
import TopicList from '@/components/topic-list';
import {
  displayName,
  getCurrentUser,
  initials,
  listCategories,
  listLatestPosts,
  listTopics,
  siteStats,
  timeAgo,
  type TopicSort
} from '@/lib/data';

export const dynamic = 'force-dynamic';

type Props = { searchParams: Promise<{ sort?: string }> };

const SORTS: { id: TopicSort; label: string }[] = [
  { id: 'yeni', label: 'Son' },
  { id: 'aktif', label: 'Aktif' },
  { id: 'populer', label: 'En İyi' }
];

export default async function HomePage({ searchParams }: Props) {
  const { sort } = await searchParams;
  const active = (SORTS.find((s) => s.id === sort)?.id ?? 'yeni') as TopicSort;

  const [categories, topics, stats, user, latest] = await Promise.all([
    listCategories(),
    listTopics({ sort: active }),
    siteStats(),
    getCurrentUser(),
    listLatestPosts(6)
  ]);

  return (
    <>
      <div className="d-banner">
        <div className="banner-brand">
          <span className="banner-logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Play Forum logosu" />
          </span>
          <div>
            <h1>Play Forum</h1>
            <p>
              Kapalı test topluluğunun buluşma noktası{user ? ` — hoş geldin, ${user.display_name ?? user.username}` : ''}.
              Soru sor, deneyimini paylaş, geribildirim ver.
            </p>
          </div>
        </div>
        <div className="stats">
          <div className="stat">
            <b>{stats.topics}</b>
            <span>konu</span>
          </div>
          <div className="stat">
            <b>{stats.replies}</b>
            <span>cevap</span>
          </div>
          <div className="stat">
            <b>{stats.members}</b>
            <span>üye</span>
          </div>
        </div>
      </div>

      <div className="d-main">
        <div>
          <nav className="nav-pills">
            {SORTS.map((s) => (
              <Link
                key={s.id}
                href={s.id === 'yeni' ? '/' : `/?sort=${s.id}`}
                className={s.id === active ? 'active' : ''}
              >
                {s.label}
              </Link>
            ))}
          </nav>
          <TopicList topics={topics} />
        </div>

        <aside className="d-side">
          {user && (
            <Link href="/mesaj/yeni" className="btn btn-primary btn-block">
              ✉️ Özel Mesaj Gönder
            </Link>
          )}

          <div>
            <div className="side-title">Kategoriler</div>
            <div className="widget">
              {categories.map((c) => (
                <Link key={c.id} href={`/kategori/${c.slug}`} className="cat-row">
                  <span className="cat-bar" style={{ background: c.color ?? '#919191' }} />
                  {c.name}
                  <span className="n">{c.topic_count ?? 0}</span>
                </Link>
              ))}
            </div>
          </div>

          <div>
            <div className="side-title">Son Mesajlar</div>
            <div className="widget">
              {latest.length === 0 ? (
                <div className="widget-pad" style={{ color: 'var(--muted)', fontSize: 13 }}>
                  Henüz mesaj yok. İlk cevabı sen yaz!
                </div>
              ) : (
                latest.map((p) => (
                  <Link key={p.id} href={`/konu/${p.topic_id}`} className="latest-row">
                    <span className="avatar" style={{ width: 30, height: 30, fontSize: 11, borderRadius: 9 }}>
                      {initials(p.author)}
                    </span>
                    <span style={{ minWidth: 0 }}>
                      <span className="t">{p.topic_title}</span>
                      <span className="m">
                        {displayName(p.author)} · {timeAgo(p.created_at)}
                      </span>
                    </span>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div>
            <div className="side-title">Topluluk</div>
            <div className="widget">
              <div className="stat-grid">
                <div className="cell">
                  <b>{stats.members}</b>
                  <span>üye</span>
                </div>
                <div className="cell">
                  <b>{stats.topics}</b>
                  <span>konu</span>
                </div>
                <div className="cell">
                  <b>{stats.replies}</b>
                  <span>cevap</span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
