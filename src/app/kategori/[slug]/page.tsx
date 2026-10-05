import Link from 'next/link';
import TopicList from '@/components/topic-list';
import { getCategoryBySlug, listTopics, type TopicSort } from '@/lib/data';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cat = await getCategoryBySlug(slug);
  return { title: cat?.name ?? 'Kategori' };
}

const SORTS: { id: TopicSort; label: string }[] = [
  { id: 'yeni', label: 'Son' },
  { id: 'aktif', label: 'Aktif' },
  { id: 'populer', label: 'En İyi' }
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
      <div className="card card-pad" style={{ marginTop: 20, display: 'flex', gap: 14, alignItems: 'center' }}>
        <span className="cat-bar" style={{ background: cat.color ?? '#919191', width: 12, height: 34, borderRadius: 4 }} />
        <div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{cat.name}</div>
          <div style={{ color: 'var(--muted)', fontSize: 13.5 }}>{cat.description}</div>
        </div>
      </div>

      <nav className="nav-pills">
        {SORTS.map((s) => (
          <Link
            key={s.id}
            href={s.id === 'yeni' ? `/kategori/${slug}` : `/kategori/${slug}?sort=${s.id}`}
            className={s.id === active ? 'active' : ''}
          >
            {s.label}
          </Link>
        ))}
      </nav>

      <TopicList topics={topics} />
    </>
  );
}
