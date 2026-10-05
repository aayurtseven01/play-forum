'use client';

import { useState } from 'react';
import { useActionState } from 'react';
import { createTopicAction } from '@/lib/actions';
import type { ActionResult } from '@/lib/actions';
import type { Category } from '@/lib/types';
import RichEditor from './rich-editor';

const initial: ActionResult = { ok: true };

export default function NewTopicForm({
  categories,
  defaultCategoryId,
  canPoll
}: {
  categories: Category[];
  defaultCategoryId?: string;
  canPoll?: boolean;
}) {
  const [state, action, pending] = useActionState(
    (_: ActionResult, formData: FormData) => createTopicAction(formData),
    initial
  );
  const [content, setContent] = useState('');
  const [opts, setOpts] = useState<string[]>(['', '']);

  return (
    <form action={action} className="card card-pad">
      {state && !state.ok && <div className="error-box">{state.error}</div>}

      <label className="field">
        Kategori
        <select name="category_id" defaultValue={defaultCategoryId ?? categories[0]?.id} required>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        Başlık
        <input name="title" maxLength={180} placeholder="Kısa ve net bir başlık yaz" required />
        <div className="hint">Örn: “Next.js’te middleware ile giriş kontrolü nasıl yapılır?”</div>
      </label>

      <div className="field">
        İçerik
        <RichEditor
          name="content"
          value={content}
          onChange={setContent}
          placeholder="Sorununu veya paylaşmak istediğini detaylıca anlat… Araç çubuğundan kalın yazı, liste, bağlantı, görsel ve emoji ekleyebilirsin."
          rows={10}
          required
        />
      </div>

      {canPoll && (
        <div className="field poll-setup">
          <b style={{ fontSize: 14.5 }}>📊 Anket ekle (isteğe bağlı)</b>
          <div className="hint">
            Anket açma yetkin var; tüm üyeler oy kullanabilir. Soruyu boş bırakırsan anket oluşmaz.
          </div>
          <input name="poll_question" maxLength={180} placeholder="Anket sorusu… örn: Hangi özelliği önce test edelim?" />
          {opts.map((o, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <input
                value={o}
                maxLength={120}
                placeholder={`Seçenek ${i + 1}`}
                onChange={(e) =>
                  setOpts((prev) => prev.map((x, j) => (j === i ? e.target.value : x)))
                }
              />
              {opts.length > 2 && (
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => setOpts((prev) => prev.filter((_, j) => j !== i))}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 8 }}>
            <button type="button" className="btn btn-sm" onClick={() => setOpts((p) => [...p, ''])}>
              + Seçenek
            </button>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }}>
              <input type="checkbox" name="poll_multiple" value="1" /> Birden fazla seçim yapılabilsin
            </label>
          </div>
          <input type="hidden" name="poll_options" value={JSON.stringify(opts)} />
        </div>
      )}

      <button
        className="btn btn-primary"
        type="submit"
        disabled={pending || categories.length === 0}
      >
        {pending ? 'Gönderiliyor…' : 'Konuyu Yayınla'}
      </button>
    </form>
  );
}
