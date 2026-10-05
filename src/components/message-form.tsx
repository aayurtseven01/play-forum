'use client';

import { useState, useTransition } from 'react';
import { createMessageAction } from '@/lib/actions';
import type { Profile } from '@/lib/types';

export default function MessageForm({
  members,
  preselect
}: {
  members: Profile[];
  preselect?: string;
}) {
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function onSubmit(fd: FormData) {
    setErr(null);
    start(async () => {
      const res = await createMessageAction(fd);
      if (!res.ok) setErr(res.error ?? 'Mesaj gönderilemedi.');
    });
  }

  return (
    <form action={onSubmit}>
      {err && <div className="error-box">{err}</div>}
      <div className="field">
        <label>Alıcı</label>
        <select name="to" defaultValue={preselect ?? ''} required>
          <option value="" disabled>
            Kullanıcı seç…
          </option>
          {members
            .filter((m) => Boolean(m.username))
            .map((m) => (
              <option key={m.id} value={m.username ?? ''}>
                @{m.username}
                {m.display_name ? ` — ${m.display_name}` : ''}
              </option>
            ))}
        </select>
      </div>
      <div className="field">
        <label>Konu</label>
        <input name="title" placeholder="Mesajın konusu" required minLength={2} maxLength={180} />
      </div>
      <div className="field">
        <label>Mesaj</label>
        <textarea name="content" rows={6} placeholder="Mesajını yaz…" required minLength={2} maxLength={10000} />
      </div>
      <button className="btn btn-primary" disabled={pending}>
        {pending ? 'Gönderiliyor…' : '✉️ Mesajı Gönder'}
      </button>
    </form>
  );
}
