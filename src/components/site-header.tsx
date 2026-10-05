import Link from 'next/link';
import UserAvatar from '@/components/avatar';
import { getCurrentUser, isDemoEnv, unreadNotificationCount } from '@/lib/data';
import { signOut } from '@/lib/actions';

const GearIcon = (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
  </svg>
);

const BellIcon = (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.7 21a2 2 0 0 1-3.4 0" />
  </svg>
);

const MailIcon = (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-10 6L2 7" />
  </svg>
);

const SearchIcon = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

export default async function SiteHeader() {
  const user = await getCurrentUser();
  const demo = isDemoEnv();
  const unread = user ? await unreadNotificationCount() : 0;

  async function logout() {
    'use server';
    await signOut();
  }

  return (
    <>
      {demo && (
        <div className="demo-banner">
          <b>Demo modu</b> — veriler geçici dosyada. Gerçek veritabanı için{' '}
          <code>.env.local</code> dosyasına Supabase anahtarlarını gir.
        </div>
      )}
      <header className="d-header">
        <div className="container d-wrap">
          <Link href="/" className="d-brand">
            <span className="logo-box">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="" />
            </span>
            Play Forum
          </Link>

          <form className="d-search" action="/ara" method="get">
            {SearchIcon}
            <input name="q" type="search" placeholder="Konu ara…" aria-label="Ara" />
          </form>

          <div className="d-actions">
            {user ? (
              <>
                <Link href="/bildirimler" className="icon-btn" title="Bildirimler" aria-label="Bildirimler">
                  {BellIcon}
                  {unread > 0 && <span className="count">{unread}</span>}
                </Link>
                <Link href="/mesajlar" className="icon-btn" title="Özel Mesajlar" aria-label="Mesajlar">
                  {MailIcon}
                </Link>
                {user.is_admin && (
                  <Link href="/yonetim" className="icon-btn" title="Yönetici Paneli" aria-label="Yönetim">
                    {GearIcon}
                  </Link>
                )}
                <Link href="/yeni-konu" className="btn btn-primary btn-sm">
                  + Konu
                </Link>
                {user.username && (
                  <Link
                    href={`/profil/${user.username}`}
                    className="avatar-btn"
                    title={user.display_name ?? user.username}
                    style={{ overflow: 'hidden', padding: 0 }}
                  >
                    <UserAvatar profile={user} size={32} className="avatar-btn" />
                  </Link>
                )}
                <form action={logout}>
                  <button className="btn btn-sm" type="submit" title="Çıkış yap">
                    Çıkış
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link href="/giris" className="btn btn-sm">
                  Giriş
                </Link>
                <Link href="/kayit" className="btn btn-primary btn-sm">
                  Kayıt ol
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
