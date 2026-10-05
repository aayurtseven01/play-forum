import Link from 'next/link';
import { displayName, initials, timeAgo } from '@/lib/data';
import type { Topic } from '@/lib/types';

export default function TopicList({ topics }: { topics: Topic[] }) {
  if (topics.length === 0) {
    return <div className="empty">Henüz konu yok. İlk konuyu sen aç! 🎉</div>;
  }

  return (
    <div className="card">
      {topics.map((t) => (
        <div className="topic-row" key={t.id}>
          <span className="avatar">{initials(t.author)}</span>

          <div className="topic-main">
            <Link href={`/konu/${t.id}`} className="topic-title">
              {t.is_pinned && <span className="badge">📌 Sabit</span>}{' '}
              {t.is_locked && <span className="badge badge-muted">🔒 Kilitli</span>} {t.title}
            </Link>
            <div className="topic-meta">
              {t.category && (
                <Link href={`/kategori/${t.category.slug}`}>
                  <span
                    className="badge"
                    style={{
                      background: `${t.category.color ?? '#6366f1'}22`,
                      color: t.category.color ?? '#6366f1'
                    }}
                  >
                    {t.category.name}
                  </span>
                </Link>
              )}
              <span>{displayName(t.author)}</span>
              <span>·</span>
              <span>{timeAgo(t.created_at)}</span>
            </div>
          </div>

          <div className="topic-stats">
            <div className="stat">
              <b>{t.reply_count ?? 0}</b>
              <span>cevap</span>
            </div>
            <div className="stat">
              <b>{t.views}</b>
              <span>görüntüleme</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
