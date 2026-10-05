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
        {tb('Bağlantı ekle', addLink, '🔗')}
        {tb('Görsel (adres ile)', addImageUrl, '🖼️')}
        {tb('Dosya ekle / görsel yükle', () => fileRef.current?.click(), '📎')}
        {tb('Alıntı', () => wrap('[quote=Yazar]\n', '\n[/quote]', 'alıntılanacak metin'), '❝')}
        {tb('Kod bloğu', () => wrap('```\n', '\n```', 'kod'), '</>')}
        <span className="re-emojipop">
          {tb('Emoji', () => setEmojiOpen((o) => !o), '😊', emojiOpen)}
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
          👁 Önizleme
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
          **kalın** · *italik* · [metin](adres) · ![resim](adres) · 📎 ile dosya yükle
        </span>
        {busy && <span className="re-status">⏳ {status}</span>}
        {!busy && status && <span className="re-status err">{status}</span>}
      </div>
    </div>
  );
}
