import TopicList from '@/components/topic-list';
import { listTopics } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function SearchPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? '').trim();
  const topics = query ? await listTopics({ q: query, limit: 100 }) : [];

  return (
    <>
      <h1 style={{ fontSize: 22, margin: '22px 0 4px' }}>
        {query ? `“${query}” için sonuçlar` : 'Arama'}
      </h1>
      <p className="hint" style={{ marginBottom: 14 }}>
        {query ? `${topics.length} konu bulundu.` : 'Aramak için üstteki kutuya bir şey yaz.'}
      </p>
      {query && <TopicList topics={topics} />}
    </>
  );
}
