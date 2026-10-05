'use client';

import { useState } from 'react';

/** Kompozöre alıntı ekler */
export function QuoteButton({ author, text }: { author: string; text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="p-action"
      onClick={() => {
        window.dispatchEvent(new CustomEvent('forum:quote', { detail: { author, text } }));
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
      title="Alıntıla"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M10 8H6a4 4 0 0 0-4 4v6h8v-8a2 2 0 0 0 0-2Zm12 0h-4a4 4 0 0 0-4 4v6h8v-8a2 2 0 0 0 0-2Z" opacity=".9" />
      </svg>
      {done ? 'Eklendi' : 'Alıntıla'}
    </button>
  );
}

/** Bağlantıyı panoya kopyalar */
export function ShareButton({ url }: { url: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="p-action"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
        } catch {
          // pano izni yoksa sessiz geç
        }
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
      title="Bağlantıyı paylaş"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
      </svg>
      {done ? 'Kopyalandı' : 'Paylaş'}
    </button>
  );
}
