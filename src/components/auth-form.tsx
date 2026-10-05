'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { signIn, signUp } from '@/lib/actions';
import type { ActionResult } from '@/lib/actions';

const initial: ActionResult = { ok: true };

export function SignInForm({ next, demo }: { next?: string; demo: boolean }) {
  const [state, action, pending] = useActionState(
    (_: ActionResult, formData: FormData) =>
      signIn(String(formData.get('email')), String(formData.get('password')), next),
    initial
  );

  return (
    <div className="auth-wrap">
      <h1 style={{ fontSize: 24, marginBottom: 4 }}>Giriş yap</h1>
      <p className="hint" style={{ marginBottom: 18 }}>
        Hesabın yok mu? <Link href="/kayit">Kayıt ol</Link>
      </p>

      {demo && (
        <div className="ok-box">
          Demo modu açık. Aşağıdaki butona basman yeterli — örnek kullanıcıyla giriş yapılmış olur.
        </div>
      )}

      <form action={action} className="card card-pad">
        {state && !state.ok && <div className="error-box">{state.error}</div>}
        <label className="field">
          E-posta
          <input type="email" name="email" required placeholder="sen@ornek.com" />
        </label>
        <label className="field">
          Şifre
          <input type="password" name="password" required placeholder="••••••••" />
        </label>
        <button className="btn btn-primary btn-block" type="submit" disabled={pending}>
          {pending ? 'Giriş yapılıyor…' : 'Giriş Yap'}
        </button>
      </form>
    </div>
  );
}

export function SignUpForm({ demo }: { demo: boolean }) {
  const [state, action, pending] = useActionState(
    async (_: ActionResult, formData: FormData) => {
      const pw = String(formData.get('password'));
      const pw2 = String(formData.get('password2'));
      if (pw !== pw2) return { ok: false, error: 'Şifreler eşleşmiyor.' };
      return signUp(String(formData.get('email')), pw, String(formData.get('username')));
    },
    initial
  );

  return (
    <div className="auth-wrap">
      <h1 style={{ fontSize: 24, marginBottom: 4 }}>Kayıt ol</h1>
      <p className="hint" style={{ marginBottom: 18 }}>
        Zaten hesabın var mı? <Link href="/giris">Giriş yap</Link>
      </p>

      {demo && (
        <div className="error-box">
          Demo modunda gerçek kayıt yapılamaz. Gerçek kayıt için <code>.env.local</code> dosyasına
          Supabase anahtarlarını girmen gerekiyor (KURULUM.md adımları).
        </div>
      )}

      <form action={action} className="card card-pad">
        {state && !state.ok && <div className="error-box">{state.error}</div>}
        {state?.ok && !demo && (
          <div className="ok-box">
            Kayıt tamam. E-postanı doğruladıktan sonra giriş yapabilirsin.
          </div>
        )}
        <label className="field">
          Kullanıcı adı
          <input name="username" required minLength={3} maxLength={24} placeholder="kullaniciadi" />
          <div className="hint">Profil adresin olacak: forum.com/profil/kullaniciadi</div>
        </label>
        <label className="field">
          E-posta
          <input type="email" name="email" required placeholder="sen@ornek.com" />
        </label>
        <label className="field">
          Şifre
          <input type="password" name="password" required minLength={6} placeholder="En az 6 karakter" />
        </label>
        <label className="field">
          Şifre (tekrar)
          <input type="password" name="password2" required minLength={6} placeholder="Tekrar yaz" />
        </label>
        <button className="btn btn-primary btn-block" type="submit" disabled={pending}>
          {pending ? 'Oluşturuluyor…' : 'Hesap Oluştur'}
        </button>
      </form>
    </div>
  );
}
