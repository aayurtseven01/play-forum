'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { editPostAction, editTopicAction, markSolutionAction } from '@/lib/actions';

const PencilIcon = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);

/** Kendi gönderisini satır içinde düzenler */
export function EditPostButton({ postId, initial }: { postId: string; initial: string }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(initial);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  function save() {
    setErr(null);
    const fd = new FormData();
    fd.set('post_id', postId);
    fd.set('content', text);
    start(async () => {
      const res = await editPostAction(fd);
      if (res.ok) {
        setOpen(false);
        router.refresh();
      } else setErr(res.error ?? 'Kaydedilemedi.');
    });
  }

  return (
    <>
      <button type="button" className="p-action" onClick={() => setOpen((o) => !o)} title="Düzenle">
        {PencilIcon} Düzenle
      </button>
      {open && (
        <div style={{ width: '100%' }}>
          {err && <div className="error-box">{err}</div>}
          <textarea className="edit-area" value={text} onChange={(e) => setText(e.target.value)} />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button className="btn btn-primary btn-sm" onClick={save} disabled={pending}>
              {pending ? 'Kaydediliyor…' : 'Kaydet'}
            </button>
            <button className="btn btn-sm" onClick={() => setOpen(false)}>
              Vazgeç
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/** Konu başlığı + ilk mesajı düzenler */
export function EditTopicButton({
  topicId,
  title,
  content
}: {
  topicId: string;
  title: string;
  content: string;
}) {
  const [open, setOpen] = useState(false);
  const [t, setT] = useState(title);
  const [c, setC] = useState(content);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  function save() {
    setErr(null);
    const fd = new FormData();
    fd.set('topic_id', topicId);
    fd.set('title', t);
    fd.set('content', c);
    start(async () => {
      const res = await editTopicAction(fd);
      if (res.ok) {
        setOpen(false);
        router.refresh();
      } else setErr(res.error ?? 'Kaydedilemedi.');
    });
  }

  return (
    <>
      <button type="button" className="btn btn-sm" onClick={() => setOpen((o) => !o)}>
        ✎ Düzenle
      </button>
      {open && (
        <div className="card card-pad" style={{ margin: '0 0 18px' }}>
          {err && <div className="error-box">{err}</div>}
          <div className="field">
            <label>Başlık</label>
            <input value={t} onChange={(e) => setT(e.target.value)} maxLength={180} />
          </div>
          <div className="field">
            <label>İlk mesaj</label>
            <textarea className="edit-area" value={c} onChange={(e) => setC(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary btn-sm" onClick={save} disabled={pending}>
              {pending ? 'Kaydediliyor…' : 'Kaydet'}
            </button>
            <button className="btn btn-sm" onClick={() => setOpen(false)}>
              Vazgeç
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/** Konu sahibi / admin çözüm işaretler */
export function MarkSolutionButton({ postId, isSolution }: { postId: string; isSolution: boolean }) {
  const [pending, start] = useTransition();
  const router = useRouter();

  function toggle() {
    const fd = new FormData();
    fd.set('post_id', postId);
    fd.set('v', isSolution ? '0' : '1');
    start(async () => {
      const res = await markSolutionAction(fd);
      if (res.ok) router.refresh();
    });
  }

  return (
    <button type="button" className={`p-action ${isSolution ? 'on' : ''}`} onClick={toggle} disabled={pending} title="Çözüm olarak işaretle">
      ✓ {isSolution ? 'Çözümü Kaldır' : 'Çözüm'}
    </button>
  );
}
