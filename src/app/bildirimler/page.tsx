import Link from 'next/link';
import { redirect } from 'next/navigation';
import { markAllReadAction } from '@/lib/actions';
import { displayName, getCurrentUser, listMyNotifications, timeAgo } from '@/lib/data';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Bildirimler' };

const ICONS: Record<string, string> = { reply: '💬', like: '♥️', message: '✉️' };
const TEXT: Record<string, string> = {
  reply: 'konuna cevap yazdı',
  like: 'bir gönderini beğendi',
  message: 'sana özel bir mesaj gönderdi'
};

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/giris?next=/bildirimler');

  const items = await listMyNotifications();

  async function markAll() {
    'use server';
    await markAllReadAction();
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '22px 0 12px' }}>
        <h1 style={{ fontSize: 22, margin: 0 }}>Bildirimler</h1>
        <div style={{ marginLeft: 'auto' }}>
            <form action={markAll}>
            <button className="btn btn-sm" type="submit">
              Tümünü okundu say
            </button>
          </form>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="card empty">Henüz bildirimin yok. Bir konu aç, topluluk sesini duysun 🙂</div>
      ) : (
        <div className="card">
          {items.map((n) => (
            <Link
              key={n.id}
              href={n.topic_id ? `/konu/${n.topic_id}` : '/'}
              className={`notif-row ${n.read ? '' : 'unread'}`}
            >
              <span className="icon">{ICONS[n.type] ?? '🔔'}</span>
              <span>
                <b>{displayName(n.actor)}</b> {TEXT[n.type]}
                {n.topic && (
                  <span style={{ color: 'var(--muted)' }}> — {n.topic.title}</span>
                )}
              </span>
              <time>{timeAgo(n.created_at)}</time>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
