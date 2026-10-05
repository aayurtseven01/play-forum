import { redirect } from 'next/navigation';
import MessageForm from '@/components/message-form';
import { getCurrentUser, listMembers } from '@/lib/data';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Yeni Özel Mesaj' };

export default async function NewMessagePage({
  searchParams
}: {
  searchParams: Promise<{ to?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/giris?next=/mesaj/yeni');

  const sp = await searchParams;
  const members = (await listMembers()).filter((m) => m.id !== user.id);

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, margin: '22px 0 12px' }}>✉️ Yeni Özel Mesaj</h1>
      <div className="card card-pad">
        <MessageForm members={members} preselect={sp.to} />
      </div>
    </div>
  );
}
