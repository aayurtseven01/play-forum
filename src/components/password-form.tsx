'use client';

import { useActionState } from 'react';
import { changePasswordAction } from '@/lib/actions';
import type { ActionResult } from '@/lib/actions';

const initial: ActionResult = { ok: false };

export default function PasswordForm() {
  const [state, action, pending] = useActionState(
    (_: ActionResult, fd: FormData) => changePasswordAction(fd),
    initial
  );

  return (
    <form action={action} className="card card-pad">
      <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 12 }}>Şifre Değiştir</div>
      {state.ok && <div className="ok-box">Şifren güncellendi.</div>}
      {!state.ok && state.error && <div className="error-box">{state.error}</div>}

      <label className="field">
        Yeni şifre
        <input name="password" type="password" required minLength={6} placeholder="En az 6 karakter" />
      </label>
      <label className="field">
        Yeni şifre (tekrar)
        <input name="password2" type="password" required minLength={6} placeholder="Tekrar yaz" />
      </label>
      <button className="btn btn-primary" disabled={pending}>
        {pending ? 'Kaydediliyor…' : 'Şifreyi Güncelle'}
      </button>
    </form>
  );
}
