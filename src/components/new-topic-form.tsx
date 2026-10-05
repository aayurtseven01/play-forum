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
  defaultCategoryId
}: {
  categories: Category[];
  defaultCategoryId?: string;
}) {
  const [state, action, pending] = useActionState(
    (_: ActionResult, formData: FormData) => createTopicAction(formData),
    initial
  );
  const [content, setContent] = useState('');

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
