import Link from 'next/link';
import { getCurrentUser, initials, isDemoEnv, unreadNotificationCount } from '@/lib/data';
import { signOut } from '@/lib/actions';

const BellIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.7 21a2 2 0 0 1-3.4 0" />
  </svg>
);

const MailIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-10 6L2 7" />
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
        <div className="container d-header-inner">
          <Link href="/" className="logo">
            <span className="logo-mark">P</span>
            Play Forum
          </Link>

          <div className="d-icons">
            <form className="d-search" action="/ara" method="get">
              <input name="q" type="search" placeholder="Ara…" aria-label="Ara" />
            </form>

            {user ? (
              <>
                <Link href="/bildirimler" className="d-icon" title="Bildirimler" aria-label="Bildirimler">
                  {BellIcon}
                  {unread > 0 && <span className="count">{unread}</span>}
                </Link>
                <Link href="/mesajlar" className="d-icon" title="Mesajlar" aria-label="Mesajlar">
                  {MailIcon}
                </Link>
                <Link href="/yeni-konu" className="btn btn-primary btn-sm">
                  + Konu
                </Link>
                {user.username && (
                  <Link
                    href={`/profil/${user.username}`}
                    className="avatar"
                    title={user.display_name ?? user.username}
                  >
                    {initials(user)}
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
