import { createBrowserClient } from '@supabase/ssr';

/**
 * İstemci tarafı (client component) Supabase istemcisi.
 * Anahtarlar girilmemişse null döner -> uygulama demo moduna düşer.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createBrowserClient(url, key);
}
