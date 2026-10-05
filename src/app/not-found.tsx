import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="empty" style={{ padding: '80px 20px' }}>
      <div style={{ fontSize: 44 }}>🔍</div>
      <h1 style={{ fontSize: 22 }}>Aradığın sayfa bulunamadı</h1>
      <p className="hint">Adresi yanlış yazmış olabilirsin ya da içerik silinmiş olabilir.</p>
      <Link href="/" className="btn btn-primary" style={{ marginTop: 10 }}>
        Ana sayfaya dön
      </Link>
    </div>
  );
}
