import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import SiteHeader from '@/components/site-header';
import PresencePing from '@/components/presence-ping';

export const metadata: Metadata = {
  title: { default: 'Play Forum', template: '%s · Play Forum' },
  description: 'Play kapalı test topluluk forumu — Supabase tabanlı',
  icons: { icon: '/logo.png' }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>
        <PresencePing />
        <SiteHeader />
        <main className="container" style={{ paddingTop: 8, paddingBottom: 20 }}>
          {children}
        </main>
        <footer>
          <div className="container f-wrap">
            <span>© {new Date().getFullYear()} Play Forum — Next.js + Supabase</span>
            <span style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <Link href="/kurallar">Şartlar ve Kurallar</Link>
              <Link href="/gizlilik">Gizlilik Politikası</Link>
              <Link href="/yardim">Yardım</Link>
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
