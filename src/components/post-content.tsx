import type { ReactNode } from 'react';

/**
 * Hafif ve güvenli markdown benzeri içerik render'ı.
 * Destekler: [quote=yazar]...[/quote], #/##/### başlık, - ve 1. listeler,
 * ``` kod bloğu, **kalın**, *italik*, ~~üstü çizili~~, `kod`,
 * [metin](url) bağlantı, ![alt](url) görsel.
 * Yalnızca http(s), göreli yol ve mailto: URL'lerine izin verilir (XSS koruması).
 */

const SAFE_URL = /^(https?:\/\/|\/|#|mailto:)/i;
const safeUrl = (u: string) => (SAFE_URL.test(u.trim()) ? u.trim() : '#');

const INLINE =
  /(!\[([^\]]*)\]\(([^)\s]+)\))|(\[([^\]]+)\]\(([^)\s]+)\))|(\*\*([^*]+)\*\*)|(~~([^~]+)~~)|(\*([^*\n]+)\*)|(`([^`\n]+)`)|(https?:\/\/[^\s)]+)/g;

function renderInlineText(text: string, keyBase: string): ReactNode {
  const nodes: ReactNode[] = [];
  const re = new RegExp(INLINE.source, 'g');
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    const key = `${keyBase}-${k++}`;
    if (m[1] !== undefined) {
      nodes.push(
        <img key={key} className="p-img" src={safeUrl(m[3])} alt={m[2] || 'görsel'} loading="lazy" />
      );
    } else if (m[4] !== undefined) {
      nodes.push(
        <a key={key} href={safeUrl(m[6])} target="_blank" rel="noopener noreferrer">
          {m[5]}
        </a>
      );
    } else if (m[7] !== undefined) {
      nodes.push(<strong key={key}>{m[8]}</strong>);
    } else if (m[9] !== undefined) {
      nodes.push(<s key={key}>{m[10]}</s>);
    } else if (m[11] !== undefined) {
      nodes.push(<em key={key}>{m[12]}</em>);
    } else if (m[13] !== undefined) {
      nodes.push(
        <code key={key} className="inline-code">
          {m[14]}
        </code>
      );
    } else if (m[15] !== undefined) {
      // Çıplak URL -> tıklanabilir bağlantı (sondaki noktalama hariç)
      let u = m[15];
      let trail = '';
      const tm = u.match(/[.,;:!?'"]+$/);
      if (tm) {
        trail = tm[0];
        u = u.slice(0, u.length - trail.length);
      }
      nodes.push(
        <a key={key} href={safeUrl(u)} target="_blank" rel="noopener noreferrer">
          {u}
        </a>
      );
      if (trail) nodes.push(trail);
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

/** Paragraf içi satır sonlarını <br> olarak göster */
function renderInline(text: string, keyBase: string): ReactNode {
  const lines = text.split('\n');
  if (lines.length === 1) return renderInlineText(text, keyBase);
  const out: ReactNode[] = [];
  lines.forEach((line, i) => {
    if (i > 0) out.push(<br key={`${keyBase}-br${i}`} />);
    out.push(renderInlineText(line, `${keyBase}-l${i}`));
  });
  return out;
}

export function renderContent(content: string): ReactNode[] {
  const lines = content.split('\n');
  const out: ReactNode[] = [];
  let para: string[] = [];
  let key = 0;

  const flushPara = () => {
    if (!para.length) return;
    out.push(<p key={`p${key++}`}>{renderInline(para.join('\n'), `p${key}`)}</p>);
    para = [];
  };

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const t = line.trim();

    // Kod bloğu
    if (t.startsWith('```')) {
      flushPara();
      const buf: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) buf.push(lines[i++]);
      i++; // kapatıcı ```
      out.push(
        <pre key={`pre${key++}`} className="code-block">
          <code>{buf.join('\n')}</code>
        </pre>
      );
      continue;
    }

    // Alıntı bloğu
    const qm = t.match(/^\[quote(?:=([^\]]*))?\]$/i);
    if (qm) {
      flushPara();
      const buf: string[] = [];
      i++;
      while (i < lines.length && !/^\[\/quote\]$/i.test(lines[i].trim())) buf.push(lines[i++]);
      i++;
      const author = (qm[1] ?? '').trim();
      out.push(
        <div key={`q${key++}`} className="quote-box">
          <div className="q-head">❝ {author ? `${author} yazdı:` : 'Alıntı:'}</div>
          <div className="q-body">{renderInline(buf.join('\n'), `q${key}`)}</div>
        </div>
      );
      continue;
    }

    // Başlıklar
    const hm = t.match(/^(#{1,3})\s+(.*)$/);
    if (hm) {
      flushPara();
      const level = hm[1].length;
      const inner = renderInline(hm[2], `h${key}`);
      if (level === 1) out.push(<h2 key={`h${key++}`}>{inner}</h2>);
      else if (level === 2) out.push(<h3 key={`h${key++}`}>{inner}</h3>);
      else out.push(<h4 key={`h${key++}`}>{inner}</h4>);
      i++;
      continue;
    }

    // Listeler
    if (/^[-*]\s+/.test(t)) {
      flushPara();
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ''));
        i++;
      }
      out.push(
        <ul key={`ul${key++}`}>
          {items.map((it, j) => (
            <li key={j}>{renderInline(it, `ul${key}-${j}`)}</li>
          ))}
        </ul>
      );
      continue;
    }
    if (/^\d+[.)]\s+/.test(t)) {
      flushPara();
      const items: string[] = [];
      while (i < lines.length && /^\d+[.)]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+[.)]\s+/, ''));
        i++;
      }
      out.push(
        <ol key={`ol${key++}`}>
          {items.map((it, j) => (
            <li key={j}>{renderInline(it, `ol${key}-${j}`)}</li>
          ))}
        </ol>
      );
      continue;
    }

    if (t === '') {
      flushPara();
      i++;
      continue;
    }

    para.push(line);
    i++;
  }
  flushPara();
  return out;
}
