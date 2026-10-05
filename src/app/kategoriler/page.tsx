import Link from 'next/link';
import { listCategories } from '@/lib/data';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Kategoriler' };

export default async function CategoriesPage() {
  const categories = await listCategories();

  return (
    <>
      <div className="side-title" style={{ marginTop: 22 }}>
        Tüm Kategoriler
      </div>
      <div className="cat-box">
        {categories.map((c) => (
          <Link key={c.id} href={`/kategori/${c.slug}`} className="cat-row">
            <span className="cat-bar" style={{ background: c.color ?? '#919191' }} />
            <span>
              {c.name}
              <span style={{ display: 'block', fontWeight: 400, fontSize: 12.5, color: 'var(--muted)' }}>
                {c.description ?? ''}
              </span>
            </span>
            <span className="n">{c.topic_count ?? 0} konu</span>
          </Link>
        ))}
      </div>
    </>
  );
}
