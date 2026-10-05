import Link from 'next/link';
import TopicList from '@/components/topic-list';
import UserAvatar from '@/components/avatar';
import {
  displayName,
  getCurrentUser,
  listCategories,
  latestMember,
  listLatestPosts,
  listTopics,
  onlineStats,
  siteStats,
  timeAgo,
  type TopicSort
} from '@/lib/data';

export const dynamic = 'force-dynamic';

type Props = { searchParams: Promise<{ sort?: string }> };

const SORTS: { id: TopicSort; label: string }[] = [
  { id: 'yeni', label: 'Son' },
  { id: 'aktif', label: 'Aktif' },
  { id: 'populer', label: 'En İyi' }
];

const IcTopic = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);
const IcMsg = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
    <path d="M4 6h16M4 12h16M4 18h10" />
  </svg>
);
const IcUser = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const IcHeart = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </svg>
);
const IcGrid = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
);
const IcUsers = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
  </svg>
);
const IcFlame = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
  </svg>
);
const IcPlus = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export default async function HomePage({ searchParams }: Props) {
  const { sort } = await searchParams;
  const active = (SORTS.find((s) => s.id === sort)?.id ?? 'yeni') as TopicSort;

  const [categories, topics, stats, user, latest, newest, online] = await Promise.all([
    listCategories(),
    listTopics({ sort: active }),
    siteStats(),
    getCurrentUser(),
    listLatestPosts(6),
    latestMember(),
    onlineStats()
  ]);

  return (
    <>
      <div className="d-banner">
        <div className="banner-brand">
          <span className="banner-logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Play Forum logosu" />
          </span>
          <div>
            <h1>Play Forum</h1>
            <p>
              Kapalı test topluluğunun buluşma noktası{user ? ` — hoş geldin, ${user.display_name ?? user.username}` : ''}.
              Soru sor, deneyimini paylaş, geribildirim ver.
            </p>
          </div>
        </div>
        <div className="stats">
          <div className="stat">
            <b>{stats.topics}</b>
            <span>konu</span>
          </div>
          <div className="stat">
            <b>{stats.replies}</b>
            <span>cevap</span>
          </div>
          <div className="stat">
            <b>{stats.members}</b>
            <span>üye</span>
          </div>
        </div>
      </div>

      <div className="d-main">
        <div>
          <nav className="nav-pills">
            {SORTS.map((s) => (
              <Link
                key={s.id}
                href={s.id === 'yeni' ? '/' : `/?sort=${s.id}`}
                className={s.id === active ? 'active' : ''}
              >
                {s.label}
              </Link>
            ))}
          </nav>
          <TopicList topics={topics} />
        </div>

        <aside className="d-side">
          {user && (
            <Link href="/mesaj/yeni" className="btn btn-primary btn-block">
              ✉️ Özel Mesaj Gönder
            </Link>
          )}

          <div>
            <div className="side-title">Kategoriler</div>
            <div className="widget">
              {categories.map((c) => (
                <Link key={c.id} href={`/kategori/${c.slug}`} className="cat-row">
                  <span className="cat-bar" style={{ background: c.color ?? '#919191' }} />
                  {c.name}
                  <span className="n">{c.topic_count ?? 0}</span>
                </Link>
              ))}
            </div>
          </div>

          <div>
            <div className="side-title">Son Mesajlar</div>
            <div className="widget">
              {latest.length === 0 ? (
                <div className="widget-pad" style={{ color: 'var(--muted)', fontSize: 13 }}>
                  Henüz mesaj yok. İlk cevabı sen yaz!
                </div>
              ) : (
                latest.map((p) => (
                  <Link key={p.id} href={`/konu/${p.topic_id}`} className="latest-row">
                    <UserAvatar profile={p.author} size={30} />
                    <span style={{ minWidth: 0 }}>
                      <span className="t">{p.topic_title}</span>
                      <span className="m">
                        {displayName(p.author)} · {timeAgo(p.created_at)}
                      </span>
                    </span>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div>
            <div className="side-title">Topluluk</div>
            <div className="widget">
              <div className="stat-grid">
                <div className="cell">
                  <b>{stats.members}</b>
                  <span>üye</span>
                </div>
                <div className="cell">
                  <b>{stats.topics}</b>
                  <span>konu</span>
                </div>
                <div className="cell">
                  <b>{stats.replies}</b>
                  <span>cevap</span>
                </div>
              </div>
              <div
                style={{
                  padding: '0 16px 14px',
                  fontSize: 13,
                  color: 'var(--muted)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 8,
                  flexWrap: 'wrap'
                }}
              >
                {newest?.username && (
                  <span>
                    En yeni üye:{' '}
                    <Link href={`/profil/${newest.username}`} style={{ fontWeight: 700 }}>
                      {displayName(newest)}
                    </Link>
                  </span>
                )}
                <Link href="/uyeler" style={{ fontWeight: 700 }}>
                  Tüm üyeler →
                </Link>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* ---- İSTATİSTİK KARTLARI ---- */}
      <div className="stat-band">
        <div className="stat-card">
          <div>
            <b>{stats.topics}</b>
            <span className="lb">Konular</span>
          </div>
          <span className="ic">{IcTopic}</span>
        </div>
        <div className="stat-card">
          <div>
            <b>{stats.replies}</b>
            <span className="lb">Mesajlar</span>
          </div>
          <span className="ic">{IcMsg}</span>
        </div>
        <div className="stat-card">
          <div>
            <b>{stats.members}</b>
            <span className="lb">Kullanıcılar</span>
          </div>
          <span className="ic">{IcUser}</span>
        </div>
        <div className="stat-card">
          <div style={{ minWidth: 0 }}>
            <b style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {newest ? displayName(newest) : '—'}
            </b>
            <span className="lb">Son üye</span>
          </div>
          <span className="ic">{IcHeart}</span>
        </div>
      </div>

      {/* ---- HAKKIMIZDA / ÇEVRİM İÇİ / HIZLI MENÜ ---- */}
      <div className="home-cols">
        <div className="widget">
          <div className="widget-title">Hakkımızda</div>
          <div className="widget-pad" style={{ fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.75 }}>
            Play Forum, Play uygulamasının Google Play kapalı test topluluğu için kuruldu.
            Amacımız; test sürecindeki deneyimleri paylaşmak, sorulara birlikte cevap bulmak
            ve uygulamayı topluluk geri bildirimiyle daha iyiye taşımak. Saygılı, reklamsız
            ve doğru kategoride paylaşılan her konu bu topluluğu büyütür.
          </div>
        </div>

        <div className="widget">
          <div className="widget-title">Çevrim İçi İstatistikler</div>
          <div className="kv-row">
            <span>Çevrim içi kullanıcılar (15 dk):</span>
            <b>{online.online}</b>
          </div>
          <div className="kv-row">
            <span>Toplam üye:</span>
            <b>{online.members}</b>
          </div>
          <div className="kv-row">
            <span>Toplam görüntülenme:</span>
            <b>{online.views}</b>
          </div>
          <div className="widget-note">Toplamlar, gizli ziyaretçileri içerebilir.</div>
        </div>

        <div className="widget">
          <div className="widget-title">Hızlı Menü</div>
          <Link className="qm-row" href="/kategoriler">
            <span className="ic">{IcGrid}</span> Kategoriler
          </Link>
          <Link className="qm-row" href="/uyeler">
            <span className="ic">{IcUsers}</span> Üyeler
          </Link>
          <Link className="qm-row" href="/?sort=populer">
            <span className="ic">{IcFlame}</span> Popüler Konular
          </Link>
          <Link className="qm-row" href="/yeni-konu">
            <span className="ic">{IcPlus}</span> Yeni Konu Aç
          </Link>
        </div>
      </div>
    </>
  );
}
