import Link from 'next/link';
import { displayName, initials, timeAgo } from '@/lib/data';
import type { Topic } from '@/lib/types';

export default function TopicList({ topics }: { topics: Topic[] }) {
  if (topics.length === 0) {
    return <div className="empty">Henüz konu yok. İlk konuyu sen aç! 🎉</div>;
  }

  return (
    <table className="topic-list">
      <thead>
        <tr>
          <th style={{ width: '62%' }}>Konu</th>
          <th className="num">Cevap</th>
          <th className="num">Görüntülenme</th>
          <th className="num">Etkinlik</th>
        </tr>
      </thead>
      <tbody>
        {topics.map((t) => {
          const catColor = t.category?.color ?? '#919191';
          return (
            <tr key={t.id}>
              <td>
                <div className="topic-col-main">
                  <span className="avatar">{initials(t.author)}</span>
                  <div>
                    <Link href={`/konu/${t.id}`} className="topic-title">
                      {t.is_pinned && '📌 '}
                      {t.is_locked && '🔒 '}
                      {t.is_private ? '✉️ ' : ''}
                      {t.title}
                    </Link>
                    <div className="topic-meta">
                      {t.category ? (
                        <Link href={`/kategori/${t.category.slug}`}>
                          <span className="badge-cat" style={{ color: catColor }}>
                            {t.category.name}
                          </span>
                        </Link>
                      ) : t.is_private ? (
                        <span className="pm-chip">Özel Mesaj</span>
                      ) : null}
                      <span>{displayName(t.author)}</span>
                    </div>
                  </div>
                </div>
              </td>
              <td className="num">
                <b>{t.reply_count ?? 0}</b>
              </td>
              <td className="num">{t.views}</td>
              <td className="num">
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                  <span className="activity">
                    {timeAgo(t.last_activity ?? t.updated_at ?? t.created_at)}
                  </span>
                  {(t.last_posters?.length ?? 0) > 0 && (
                    <span className="last-posters">
                      {t.last_posters!.map((p) => (
                        <span
                          key={p!.id}
                          className="avatar"
                          style={{ width: 24, height: 24, fontSize: 10 }}
                          title={displayName(p)}
                        >
                          {initials(p)}
                        </span>
                      ))}
                    </span>
                  )}
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
