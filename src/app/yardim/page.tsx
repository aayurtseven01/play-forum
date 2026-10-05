import Link from 'next/link';

export const metadata = { title: 'Yardım' };

export default function HelpPage() {
  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, margin: '26px 0 14px' }}>Yardım</h1>
      <div className="card card-pad prose">
        <p>
          <b>Kayıt/Giriş:</b> Sağ üstten <Link href="/kayit">kayıt ol</Link>, ardından{' '}
          <Link href="/giris">giriş yap</Link>. Şifreni unutursan{' '}
          <Link href="/sifre">sıfırlama bağlantısı</Link> iste.
        </p>
        <p>
          <b>Konu açma:</b> Giriş yaptıktan sonra <Link href="/yeni-konu">+ Konu</Link>{' '}
          butonunu kullan; doğru kategoriyi seçmeyi unutma.
        </p>
        <p>
          <b>Alıntı & beğeni:</b> Her gönderinin altındaki ❝ Alıntıla ve ♡ beğen
          butonlarını kullanabilirsin.
        </p>
        <p>
          <b>Avatar:</b> Ayarlar sayfasından kendi görselini yükleyebilir veya hazır
          avatarlardan seçebilirsin.
        </p>
        <p>
          <b>Özel mesaj:</b> Üst bardaki zarf ikonundan mesajlarına ulaşır, &quot;Yeni
          Mesaj&quot; ile bir üyeye yazarsın.
        </p>
        <p>Sorun mu var? Bir yöneticiye özel mesaj göndermen yeterli.</p>
      </div>
    </div>
  );
}
