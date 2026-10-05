import Link from 'next/link';
import { listCategories } from '@/lib/data';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Kategoriler' };

export default async function CategoriesPage() {
  const categories = await listCategories();

  return (
    <>
      <div className="section-title">
        <span>Tüm Kategoriler</span>
      </div>

      <div className="cat-grid">
        {categories.map((c) => (
          <Link key={c.id} href={`/kategori/${c.slug}`} className="cat-card">
            <div className="cat-name">
              <span className="cat-dot" style={{ background: c.color ?? '#6366f1' }} />
              {c.name}
            </div>
            <div className="cat-desc">{c.description ?? '—'}</div>
            <div className="cat-meta">{c.topic_count ?? 0} konu</div>
          </Link>
        ))}
      </div>
    </>
  );
}
