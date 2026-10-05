import Link from 'next/link';
import TopicList from '@/components/topic-list';
import {
  getCurrentUser,
  listCategories,
  listTopics,
  siteStats,
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

  const [categories, topics, stats, user] = await Promise.all([
    listCategories(),
    listTopics({ sort: active }),
    siteStats(),
    getCurrentUser()
  ]);

  return (
    <>
      <div className="d-banner">
        <div>
          <h1>Play Forum&apos;a hoş geldin{user ? ` ${user.display_name ?? user.username}` : ''} 👋</h1>
          <p>
            Kapalı test topluluğunun buluşma noktası. Soru sor, deneyimini paylaş,
            geribildirim ver — hep birlikte daha iyiye.
          </p>
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
            <b>{categories.length}</b>
            <span>kategori</span>
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
          <div className="side-title">Kategoriler</div>
          <div className="cat-box">
            {categories.map((c) => (
              <Link key={c.id} href={`/kategori/${c.slug}`} className="cat-row">
                <span className="cat-bar" style={{ background: c.color ?? '#919191' }} />
                {c.name}
                <span className="n">{c.topic_count ?? 0}</span>
              </Link>
            ))}
          </div>

          {user && (
            <Link href="/mesaj/yeni" className="btn btn-block" style={{ marginTop: 14 }}>
              ✉️ Özel Mesaj Gönder
            </Link>
          )}
        </aside>
      </div>
    </>
  );
}
