'use client';

import { useRef, useState } from 'react';
import { uploadAttachmentAction } from '@/lib/actions';
import { renderContent } from './post-content';

const EMOJIS = ['🙂','😄','😂','🤔','😍','😮','😢','😡','👍','👎','🙏','💪','🎉','❤️','💜','✅','❌','️','🚀','📌','💡','🛠️','📱','💻','🏆','🎮','🔥','✨'];

/**
 * XenForo tarzı zengin yazma editörü.
 * Markdown benzeri sözdizimi üretir; anlık önizleme gösterir.
 */
export default function RichEditor({
  name,
  value,
  onChange,
  placeholder,
  rows = 8,
  required
}: {
  name?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  required?: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  function set(newVal: string, selStart?: number, selEnd?: number) {
    onChange(newVal);
    requestAnimationFrame(() => {
      const el = ref.current;
      if (!el) return;
      el.focus();
      if (selStart !== undefined) el.setSelectionRange(selStart, selEnd ?? selStart);
    });
  }

  /** Seçimi sarmala: **kalın**, *italik* vb. */
  function wrap(before: string, after: string, ph: string) {
    const el = ref.current;
    if (!el) return;
    const s = el.selectionStart;
    const e = el.selectionEnd;
    const sel = value.slice(s, e) || ph;
    const next = value.slice(0, s) + before + sel + after + value.slice(e);
    set(next, s + before.length, s + before.length + sel.length);
  }

  /** Her satırın başına önek ekle (liste/başlık) */
  function prefixLines(prefix: string) {
    const el = ref.current;
    if (!el) return;
    const s = el.selectionStart;
    const e = el.selectionEnd;
    const start = value.lastIndexOf('\n', s - 1) + 1;
    const block = value.slice(start, e);
    const prefixed = block
      .split('\n')
      .map((l) => (l.trim() ? prefix + l : l))
      .join('\n');
    const next = value.slice(0, start) + prefixed + value.slice(e);
    set(next, start + prefixed.length);
  }

  function insert(text: string) {
    const el = ref.current;
    if (!el) return;
    const s = el.selectionStart;
    const next = value.slice(0, s) + text + value.slice(el.selectionEnd);
    set(next, s + text.length);
  }

  function addLink() {
    const el = ref.current;
    const sel = el ? value.slice(el.selectionStart, el.selectionEnd) : '';
    const url = window.prompt('Bağlantı adresi (https://…):', 'https://');
    if (!url || url === 'https://') return;
    const label = sel || window.prompt('Bağlantı metni (boş = adres):', '') || url;
    insert(`[${label}](${url})`);
  }

  function addImageUrl() {
    const url = window.prompt('Görsel adresi (https://…):', 'https://');
    if (!url || url === 'https://') return;
    insert(`\n![görsel](${url})\n`);
  }

  async function onFile(f: File | undefined) {
    if (!f) return;
    setBusy(true);
    setStatus('Yükleniyor…');
    const fd = new FormData();
    fd.set('file', f);
    const res = await uploadAttachmentAction(fd);
    setBusy(false);
    if (res.ok && res.url) {
      const isImg = f.type.startsWith('image/');
      insert(`\n${isImg ? `![${f.name}](${res.url})` : `[${f.name}](${res.url})`}\n`);
      setStatus(null);
    } else {
      setStatus(res.error ?? 'Yüklenemedi.');
      setTimeout(() => setStatus(null), 5000);
    }
    if (fileRef.current) fileRef.current.value = '';
  }

  const tb = (title: string, onClick: () => void, children: React.ReactNode, active = false) => (
    <button
      type="button"
      title={title}
      aria-label={title}
      className={`re-btn${active ? ' active' : ''}`}
      onClick={onClick}
    >
      {children}
    </button>
  );

  return (
    <div className="re">
      <div className="re-toolbar" role="toolbar" aria-label="Biçimlendirme">
        {tb('Kalın', () => wrap('**', '**', 'kalın'), <b>B</b>)}
        {tb('İtalik', () => wrap('*', '*', 'italik'), <i>I</i>)}
        {tb('Üstü çizili', () => wrap('~~', '~~', 'üstü çizili'), <s>S</s>)}
        <span className="re-sep" />
        {tb('Başlık', () => prefixLines('## '), <span className="re-h">H</span>)}
        {tb('Madde listesi', () => prefixLines('- '), '•≡')}
        {tb('Numaralı liste', () => prefixLines('1. '), '1.')}
        <span className="re-sep" />
        {tb(
          'Bağlantı ekle',
          addLink,
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
        )}
        {tb(
          'Görsel (adres ile)',
          addImageUrl,
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></svg>
        )}
        {tb(
          'Dosya ekle / görsel yükle',
          () => fileRef.current?.click(),
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
        )}
        {tb('Alıntı', () => wrap('[quote=Yazar]\n', '\n[/quote]', 'alıntılanacak metin'), '❝')}
        {tb('Kod bloğu', () => wrap('```\n', '\n```', 'kod'), '</>')}
        <span className="re-emojipop">
          {tb(
            'Emoji',
            () => setEmojiOpen((o) => !o),
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg>,
            emojiOpen
          )}
          {emojiOpen && (
            <div className="re-emojis">
              {EMOJIS.map((e) => (
                <button
                  type="button"
                  key={e}
                  onClick={() => {
                    insert(e);
                    setEmojiOpen(false);
                  }}
                >
                  {e}
                </button>
              ))}
            </div>
          )}
        </span>
        <span className="re-spacer" />
        <button
          type="button"
          className={`re-preview-btn${preview ? ' active' : ''}`}
          onClick={() => setPreview((p) => !p)}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
          Önizleme
        </button>
      </div>

      {name && <input type="hidden" name={name} value={value} required={required} />}

      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="re-area"
        style={preview ? { display: 'none' } : undefined}
      />
      {preview && (
        <div className="re-preview prose">
          {value.trim() ? renderContent(value) : <span className="re-empty">Önizleme boş — yazdıkların burada görünecek.</span>}
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        hidden
        accept="image/png,image/jpeg,image/webp,image/gif,application/pdf,application/zip"
        onChange={(e) => onFile(e.target.files?.[0])}
      />

      <div className="re-foot">
        <span className="hint">
          **kalın** · *italik* · [metin](adres) · ![resim](adres) · ataç ile dosya yükle
        </span>
        {busy && <span className="re-status">⏳ {status}</span>}
        {!busy && status && <span className="re-status err">{status}</span>}
      </div>
    </div>
  );
}
