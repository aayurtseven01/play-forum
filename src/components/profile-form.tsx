'use client';

import { useActionState } from 'react';
import { updateProfileAction } from '@/lib/actions';
import type { ActionResult } from '@/lib/actions';
import type { Profile } from '@/lib/types';

const initial: ActionResult = { ok: true };

export default function ProfileForm({ profile }: { profile: Profile }) {
  const [state, action, pending] = useActionState(
    (_: ActionResult, formData: FormData) => updateProfileAction(formData),
    initial
  );

  return (
    <form action={action} className="card card-pad">
      {state && !state.ok && <div className="error-box">{state.error}</div>}
      {state?.ok && <div className="ok-box">Profilin güncellendi.</div>}

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
  );
}
