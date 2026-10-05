/**
 * İstemci + sunucu taraflı ortak, saf yardımcılar.
 * (Buraya sunucuya özgü import KOYMAYIN — 'use client' bileşenleri de kullanır.)
 */

export type Nameable = {
  username?: string | null;
  display_name?: string | null;
} | null | undefined;

export function displayName(p: Nameable): string {
  return p?.display_name || p?.username || 'Silinmiş kullanıcı';
}

export function initials(p: Nameable): string {
  return displayName(p).slice(0, 2).toUpperCase();
}

/** Hazır stok avatarlar (public/avatars) */
export const STOCK_AVATARS = Array.from({ length: 12 }, (_, i) => `/avatars/a${i + 1}.svg`);
