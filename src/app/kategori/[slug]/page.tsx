import Link from 'next/link';
import TopicList from '@/components/topic-list';
import { getCategoryBySlug, listCategories, listTopics, type TopicSort } from '@/lib/data';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cat = await getCategoryBySlug(slug);
  return { title: cat?.name ?? 'Kategori' };
}

const SORTS: { id: TopicSort; label: string }[] = [
  { id: 'yeni', label: 'Yeni' },
  { id: 'aktif', label: 'Aktif' },
  { id: 'populer', label: 'Popüler' }
];

export default async function CategoryPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const cat = await getCategoryBySlug(slug);
  if (!cat) notFound();

  const active = (SORTS.find((s) => s.id === sp.sort)?.id ?? 'yeni') as TopicSort;
  const topics = await listTopics({ categorySlug: slug, sort: active });

  return (
    <>
      <div className="card card-pad" style={{ marginTop: 18 }}>
        <div className="cat-name" style={{ fontSize: 20 }}>
          <span className="cat-dot" style={{ background: cat.color ?? '#6366f1' }} />
          {cat.name}
        </div>
        <p style={{ color: 'var(--muted)', margin: '6px 0 0', fontSize: 14 }}>
          {cat.description}
        </p>
      </div>

      <div className="section-title">
        <span>{topics.length} konu</span>
        <div className="sort-tabs">
          {SORTS.map((s) => (
            <Link
              key={s.id}
              href={s.id === 'yeni' ? `/kategori/${slug}` : `/kategori/${slug}?sort=${s.id}`}
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
