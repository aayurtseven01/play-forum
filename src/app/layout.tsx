import type { Metadata } from 'next';
import './globals.css';
import SiteHeader from '@/components/site-header';

export const metadata: Metadata = {
  title: { default: 'Play Forum', template: '%s · Play Forum' },
  description: 'Play kapalı test topluluk forumu — Supabase tabanlı'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>
        <SiteHeader />
        <main className="container" style={{ paddingTop: 8, paddingBottom: 20 }}>
          {children}
        </main>
        <footer>
          <div className="container f-wrap">
            <span>© {new Date().getFullYear()} Play Forum — Next.js + Supabase</span>
            <span>Topluluk için, toplulukla 🚀</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
