import Link from 'next/link';
import { getCurrentUser } from '@/lib/data';
import { initials } from '@/lib/data';
import { signOut } from '@/lib/actions';
import { isDemoEnv } from '@/lib/data';

export default async function SiteHeader() {
  const user = await getCurrentUser();
  const demo = isDemoEnv();

  async function logout() {
    'use server';
    await signOut();
  }

  return (
    <>
      {demo && (
        <div className="demo-banner">
          <b>Demo modu</b> — veriler geçici dosyada tutuluyor. Gerçek veritabanı için{' '}
          <code>.env.local</code> dosyasına Supabase anahtarlarını gir.
        </div>
      )}
      <header className="topbar">
        <div className="container topbar-inner">
          <Link href="/" className="logo">
            <span className="logo-mark">F</span>
            Forum
          </Link>

          <nav className="nav-links">
            <Link href="/">Konular</Link>
            <Link href="/kategoriler">Kategoriler</Link>
          </nav>

          <div className="spacer" />

          <form className="search-form" action="/ara" method="get">
            <input name="q" type="search" placeholder="Konularda ara…" aria-label="Ara" />
          </form>

          {user ? (
            <>
              <Link href="/yeni-konu" className="btn btn-primary btn-sm">
                + Yeni Konu
              </Link>
              {user.username && (
                <Link
                  href={`/profil/${user.username}`}
                  className="avatar"
                  title={user.display_name ?? user.username}
                >
                  {user.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.avatar_url}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    initials(user)
                  )}
                </Link>
              )}
              <form action={logout}>
                <button className="btn btn-sm" type="submit">
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
      </header>
    </>
  );
}
