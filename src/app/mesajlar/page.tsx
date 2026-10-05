import Link from 'next/link';
import { redirect } from 'next/navigation';
import TopicList from '@/components/topic-list';
import { getCurrentUser, listTopics } from '@/lib/data';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Özel Mesajlar' };

export default async function MessagesPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/giris?next=/mesajlar');

  const messages = await listTopics({ privateOnly: true });

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '22px 0 12px' }}>
        <h1 style={{ fontSize: 22, margin: 0 }}>Özel Mesajlar</h1>
        <Link href="/mesaj/yeni" className="btn btn-sm" style={{ marginLeft: 'auto' }}>
          ✉️ Yeni Mesaj
        </Link>
      </div>

      {messages.length === 0 ? (
        <div className="card empty">Henüz özel mesajın yok. Birine mesaj göndermek için yukarıdaki butonu kullan.</div>
      ) : (
        <TopicList topics={messages} />
      )}
    </div>
  );
}
