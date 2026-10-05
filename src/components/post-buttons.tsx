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
      ❝ {done ? 'Eklendi' : 'Alıntıla'}
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
      🔗 {done ? 'Kopyalandı' : 'Paylaş'}
    </button>
  );
}
