import { redirect } from 'next/navigation';
import NewTopicForm from '@/components/new-topic-form';
import { getCurrentUser, listCategories } from '@/lib/data';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Yeni Konu' };

export default async function NewTopicPage({
  searchParams
}: {
  searchParams: Promise<{ kategori?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/giris?next=/yeni-konu');

  const sp = await searchParams;
  const categories = await listCategories();

  return (
    <>
      <h1 style={{ fontSize: 24, margin: '20px 0 14px' }}>Yeni Konu Aç</h1>
      {categories.length === 0 ? (
        <div className="card empty">
          Henüz kategori yok. Önce Supabase&apos;te kategori oluştur (SQL dosyasında hazır geliyor)
          veya demo modunda örnek kategorileri kullan.
        </div>
      ) : (
        <NewTopicForm
          categories={categories}
          defaultCategoryId={categories.find((c) => c.slug === sp.kategori)?.id}
          canPoll={Boolean(user && (user.is_admin || user.is_moderator))}
        />
      )}
    </>
  );
}
