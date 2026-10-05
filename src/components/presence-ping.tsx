'use client';

import { useEffect } from 'react';
import { touchPresenceAction } from '@/lib/actions';

/** 5 dakikada bir "son görülme" zamanını tazele */
export default function PresencePing() {
  useEffect(() => {
    const KEY = 'pf-ping';
    try {
      const last = Number(localStorage.getItem(KEY) ?? 0);
      if (Date.now() - last > 5 * 60 * 1000) {
        localStorage.setItem(KEY, String(Date.now()));
        touchPresenceAction().catch(() => {});
      }
    } catch {
      // localStorage yoksa sessiz geç
    }
  }, []);
  return null;
}
