import type { ReactNode } from 'react';

/** [quote=yazar]...[/quote] bloklarını Discourse tarzı göster */
export function renderContent(content: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\[quote=([^\]\n]+)\]([\s\S]*?)\[\/quote\]/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;

  while ((m = re.exec(content))) {
    if (m.index > last) out.push(content.slice(last, m.index));
    out.push(
      <div className="quote-block" key={`q${key++}`}>
        <b>{m[1]}</b> yazdı:
        {'\n'}
        {m[2].trim()}
      </div>
    );
    last = m.index + m[0].length;
  }
  if (last < content.length) out.push(content.slice(last));
  return out;
}
