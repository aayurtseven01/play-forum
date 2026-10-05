'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { createPostAction } from '@/lib/actions';

/**
 * Discourse tarzı alt kompozör çekmecesi.
 * "Alıntıla" butonları window event'i ile metni buraya ekler.
 */
export default function Composer({ topicId, locked }: { topicId: string; locked?: boolean }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    function onQuote(e: Event) {
      const { author, text: q } = (e as CustomEvent).detail as { author: string; text: string };
      setText((t) => `${t}[quote=${author}]\n${q}\n[/quote]\n\n`);
      setOpen(true);
      setTimeout(() => ref.current?.focus(), 50);
    }
    window.addEventListener('forum:quote', onQuote);
    return () => window.removeEventListener('forum:quote', onQuote);
  }, []);

  if (locked) return null;

  function submit() {
    setErr(null);
    const fd = new FormData();
    fd.set('topic_id', topicId);
    fd.set('content', text.trim());
    start(async () => {
      const res = await createPostAction(fd);
      if (res.ok) {
        setText('');
        setOpen(false);
        window.location.reload();
      } else {
        setErr(res.error ?? 'Gönderilemedi.');
      }
    });
  }

  return (
    <div className={`composer ${open ? '' : 'closed'}`}>
      <div className="composer-bar" onClick={() => setOpen((o) => !o)}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
        Yanıtla {open ? '▾' : '▴'}
      </div>
      <div className="composer-body">
        {err && <div className="error-box">{err}</div>}
        <textarea
          ref={ref}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Cevabını yaz… Alıntı için bir gönderideki ❝ butonunu kullan."
        />
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button className="btn btn-primary" onClick={submit} disabled={pending || text.trim().length < 2}>
            {pending ? 'Gönderiliyor…' : 'Gönder'}
          </button>
          <button className="btn" onClick={() => setOpen(false)}>
            Vazgeç
          </button>
        </div>
      </div>
    </div>
  );
}
