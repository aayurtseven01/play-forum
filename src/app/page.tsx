import Link from 'next/link';
import TopicList from '@/components/topic-list';
import { listCategories, listTopics, siteStats, type TopicSort } from '@/lib/data';

export const dynamic = 'force-dynamic';

type Props = { searchParams: Promise<{ sort?: string }> };

const SORTS: { id: TopicSort; label: string }[] = [
  { id: 'yeni', label: 'Yeni' },
  { id: 'aktif', label: 'Aktif' },
  { id: 'populer', label: 'Popüler' }
];

export default async function HomePage({ searchParams }: Props) {
  const { sort } = await searchParams;
  const active = (SORTS.find((s) => s.id === sort)?.id ?? 'yeni') as TopicSort;

  const [categories, topics, stats] = await Promise.all([
    listCategories(),
    listTopics({ sort: active }),
    siteStats()
  ]);

  return (
    <>
      <div className="section-title">
        <span>Kategoriler</span>
        <Link href="/kategoriler" style={{ textTransform: 'none', fontSize: 13 }}>
          Tümünü gör →
        </Link>
      </div>

      <div className="cat-grid">
        {categories.slice(0, 4).map((c) => (
          <Link key={c.id} href={`/kategori/${c.slug}`} className="cat-card">
            <div className="cat-name">
              <span className="cat-dot" style={{ background: c.color ?? '#6366f1' }} />
              {c.name}
            </div>
            <div className="cat-desc">{c.description}</div>
            <div className="cat-meta">{c.topic_count ?? 0} konu</div>
          </Link>
        ))}
      </div>

      <div className="section-title">
        <span>Son Konular · {stats.topics} konu / {stats.replies} cevap</span>
        <div className="sort-tabs">
          {SORTS.map((s) => (
            <Link
              key={s.id}
              href={s.id === 'yeni' ? '/' : `/?sort=${s.id}`}
              className={s.id === active ? 'active' : ''}
            >
              {s.label}
            </Link>
          ))}
        </div>
      </div>

      <TopicList topics={topics} />
    </>
  );
}
