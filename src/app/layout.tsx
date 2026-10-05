import type { Metadata } from 'next';
import './globals.css';
import SiteHeader from '@/components/site-header';

export const metadata: Metadata = {
  title: { default: 'Forum', template: '%s · Forum' },
  description: 'Supabase tabanlı topluluk forumu'
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
            <span>© {new Date().getFullYear()} Forum — Next.js + Supabase</span>
            <span>Ücretsiz katmanda çalışıyor 🚀</span>
          </footer>
        </div>
      </body>
    </html>
  );
}
