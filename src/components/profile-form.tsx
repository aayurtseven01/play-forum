'use client';

import { useActionState } from 'react';
import { pickStockAvatarAction, updateProfileAction, uploadAvatarAction } from '@/lib/actions';
import type { ActionResult } from '@/lib/actions';
import { STOCK_AVATARS } from '@/lib/format';
import type { Profile } from '@/lib/types';
import UserAvatar from './avatar';

const initial: ActionResult = { ok: true };

export default function ProfileForm({ profile }: { profile: Profile }) {
  const [state, action, pending] = useActionState(
    (_: ActionResult, formData: FormData) => updateProfileAction(formData),
    initial
  );
  const [avatarState, avatarAction, avatarPending] = useActionState(
    (_: ActionResult, formData: FormData) => uploadAvatarAction(formData),
    initial
  );
  const [stockState, stockAction, stockPending] = useActionState(
    (_: ActionResult, formData: FormData) => pickStockAvatarAction(formData),
    initial
  );

  const lastError = !state.ok ? state.error : !avatarState.ok ? avatarState.error : !stockState.ok ? stockState.error : null;

  return (
    <div className="card card-pad">
      {lastError && <div className="error-box">{lastError}</div>}
      {state.ok && avatarState.ok && stockState.ok && (
        <div className="ok-box">Profilin güncel.</div>
      )}

      {/* ---------- AVATAR ---------- */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
        <UserAvatar profile={profile} size={84} className="avatar lg" />
        <div style={{ flex: 1, minWidth: 240 }}>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 6 }}>Avatarın</div>
          <form action={avatarAction} style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="file"
              name="avatar"
              accept="image/png,image/jpeg,image/webp,image/gif"
              required
              style={{ fontSize: 13, color: 'var(--muted)' }}
            />
            <button className="btn btn-primary btn-sm" disabled={avatarPending}>
              {avatarPending ? 'Yükleniyor…' : 'Yükle'}
            </button>
          </form>
          <div className="hint">PNG / JPG / WEBP / GIF · en fazla 512 KB</div>
        </div>
      </div>

      <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--muted)', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '.06em' }}>
        veya hazır avatar seç
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(56px, 1fr))', gap: 10, marginBottom: 26 }}>
        {STOCK_AVATARS.map((url) => (
          <form key={url} action={stockAction}>
            <input type="hidden" name="avatar_url" value={url} />
            <button
              type="submit"
              disabled={stockPending}
              title="Bu avatarı kullan"
              style={{
                border: profile.avatar_url === url ? '3px solid var(--accent)' : '3px solid transparent',
                borderRadius: 16,
                padding: 0,
                background: 'none',
                cursor: 'pointer',
                lineHeight: 0
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" style={{ width: 52, height: 52, borderRadius: 13, display: 'block' }} />
            </button>
          </form>
        ))}
      </div>

      {/* ---------- BİLGİLER ---------- */}
      <form action={action}>
        <label className="field">
          Görünen ad
          <input name="display_name" defaultValue={profile.display_name ?? ''} maxLength={60} />
        </label>

        <label className="field">
          Hakkında
          <textarea
            name="bio"
            defaultValue={profile.bio ?? ''}
            maxLength={300}
            style={{ minHeight: 100 }}
          />
          <div className="hint">En fazla 300 karakter.</div>
        </label>

        <button className="btn btn-primary" type="submit" disabled={pending}>
          {pending ? 'Kaydediliyor…' : 'Kaydet'}
        </button>
      </form>
    </div>
  );
}
