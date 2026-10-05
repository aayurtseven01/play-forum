'use client';

import { useActionState } from 'react';
import { resetPasswordAction } from '@/lib/actions';
import type { ActionResult } from '@/lib/actions';

const initial: ActionResult = { ok: false };

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState(
    (_: ActionResult, fd: FormData) => resetPasswordAction(fd),
    initial
  );

  return (
    <div className="auth-wrap">
      <div className="card card-pad">
        <h1>Şifremi Unuttum</h1>
        <p className="hint" style={{ marginBottom: 14 }}>
          E-postanı yaz, sana şifre sıfırlama bağlantısı gönderelim.
        </p>

        {state.ok && (
          <div className="ok-box">
            Sıfırlama bağlantısı gönderildi — gelen kutunu (ve spam klasörünü) kontrol et.
          </div>
        )}
        {!state.ok && state.error && <div className="error-box">{state.error}</div>}

        <form action={action}>
          <label className="field">
            E-posta
            <input name="email" type="email" required placeholder="sen@ornek.com" />
          </label>
          <button className="btn btn-primary btn-block" disabled={pending}>
            {pending ? 'Gönderiliyor…' : 'Sıfırlama Bağlantısı Gönder'}
          </button>
        </form>
      </div>
    </div>
  );
}
