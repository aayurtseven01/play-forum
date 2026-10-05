import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

type CookieSet = { name: string; value: string; options?: Record<string, unknown> };

/**
 * Supabase adresi ve publishable/anon anahtarı.
 * Yeni ad (PUBLISHABLE_KEY) öncelikli; eski ad (ANON_KEY) yedek olarak desteklenir.
 * Kod tabanının geri kalanı createClient()/isDemoEnv() üzerinden okur.
 */
function supabaseEnv() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    key:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  };
}

/**
 * Sunucu tarafı Supabase istemcisi (Server Components, Server Actions, Route Handlers).
 * Oturum çerezleri otomatik okunur/yenilenir.
 */
export async function createClient() {
  const { url, key } = supabaseEnv();
  if (!url || !key) return null;

  const cookieStore = await cookies();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Server Component içinde çerez yazılamaz; middleware'de yenilenir.
        }
      }
    }
  });
}
