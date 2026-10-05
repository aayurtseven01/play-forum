import Link from 'next/link';
import UserAvatar from '@/components/avatar';
import { displayName, listMembers, memberPostCounts, timeAgo, trustInfo } from '@/lib/data';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Üyeler' };

export default async function MembersPage() {
  const [members, counts] = await Promise.all([listMembers(200), memberPostCounts()]);

  return (
    <>
      <h1 style={{ fontSize: 24, margin: '24px 0 6px' }}>Üyeler</h1>
      <p className="hint" style={{ marginBottom: 18 }}>
        Topluluğumuzda {members.length} üye var.
      </p>

      <div className="widget" style={{ overflowX: 'auto' }}>
        <table className="topic-list">
          <thead>
            <tr>
              <th>Üye</th>
              <th>Güven</th>
              <th className="num">Mesaj</th>
              <th className="num">Katılım</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => {
              const posts = counts[m.id] ?? 0;
              const trust = trustInfo(posts);
              return (
                <tr key={m.id}>
                  <td>
                    <Link href={`/profil/${m.username}`} className="topic-col-main" style={{ color: 'var(--text)' }}>
                      <UserAvatar profile={m} size={38} />
                      <span>
                        <span className="topic-title" style={{ fontSize: 14.5 }}>
                          {displayName(m)}
                        </span>
                        <span className="topic-meta">
                          @{m.username}
                          {m.is_admin && <span className="badge-pill">Yönetici</span>}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td>
                    <span className="trust" data-level={trust.level}>
                      <i /> {trust.label}
                    </span>
                  </td>
                  <td className="num">
                    <b>{posts}</b>
                  </td>
                  <td className="num" style={{ fontSize: 12.5 }}>
                    {timeAgo(m.created_at)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
