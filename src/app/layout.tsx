import type { Metadata } from 'next';
import './globals.css';
import SiteHeader from '@/components/site-header';

export const metadata: Metadata = {
  title: { default: 'LinguaPro Forum', template: '%s · LinguaPro Forum' },
  description: 'LinguaPro kapalı test topluluk forumu — Supabase tabanlı'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>
        <SiteHeader />
        <main className="container" style={{ paddingTop: 8, paddingBottom: 20 }}>
          {children}
        </main>
        <div className="container">
          <footer className="footer">
            <span>© {new Date().getFullYear()} LinguaPro Forum — Next.js + Supabase</span>
            <span>Ücretsiz katmanda çalışıyor 🚀</span>
          </footer>
        </div>
      </body>
    </html>
  );
}
