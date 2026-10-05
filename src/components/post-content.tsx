import type { ReactNode } from 'react';

/** [quote=yazar]...[/quote] bloklarını modern alıntı kutusu olarak göster */
export function renderContent(content: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\[quote=([^\]\n]+)\]([\s\S]*?)\[\/quote\]/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;

  while ((m = re.exec(content))) {
    if (m.index > last) out.push(content.slice(last, m.index));
    out.push(
      <div className="quote-box" key={`q${key++}`}>
        <div className="q-head">❝ {m[1]} yazdı:</div>
        <div className="q-body">{m[2].trim()}</div>
      </div>
    );
    last = m.index + m[0].length;
  }
  if (last < content.length) out.push(content.slice(last));
  return out;
}
