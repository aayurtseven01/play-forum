'use client';

import { useActionState, useEffect, useRef } from 'react';
import { createPostAction } from '@/lib/actions';
import type { ActionResult } from '@/lib/actions';

const initial: ActionResult = { ok: true };

export default function ReplyForm({ topicId }: { topicId: string }) {
  const ref = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(
    async (_: ActionResult, formData: FormData) => {
      const res = await createPostAction(formData);
      if (res.ok) ref.current?.reset();
      return res;
    },
    initial
  );

  // Başarılı gönderimden sonra sayfayı tazele (Server Component verisi güncellensin)
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (state.ok) window.location.reload();
  }, [state]);

  return (
    <form ref={ref} action={action} className="card card-pad">
      {state && !state.ok && <div className="error-box">{state.error}</div>}
      <input type="hidden" name="topic_id" value={topicId} />
      <label className="field">
        Cevabın
        <textarea
          name="content"
          required
          minLength={2}
          placeholder="Cevabını buraya yaz…"
          style={{ minHeight: 120 }}
        />
      </label>
      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? 'Gönderiliyor…' : 'Cevabı Gönder'}
      </button>
    </form>
  );
}
