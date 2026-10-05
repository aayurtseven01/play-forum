export const metadata = { title: 'Şartlar ve Kurallar' };

export default function RulesPage() {
  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, margin: '26px 0 14px' }}>Şartlar ve Kurallar</h1>
      <div className="card card-pad prose">
        <p>Play Forum&apos;a katılarak aşağıdaki kuralları kabul etmiş olursun:</p>
        <p>
          1. <b>Saygılı ol.</b> Hakaret, tehdit, ayrımcılık ve kişisel saldırılar yasaktır.
        </p>
        <p>
          2. <b>Spam ve reklam yok.</b> İzinsiz tanıtım, zincir mesaj ve tekrar içerik kaldırılır.
        </p>
        <p>
          3. <b>Doğru kategoriye yaz.</b> Konunu ilgili kategoride aç; yöneticiler yanlış
          kategorideki konuları taşıyabilir.
        </p>
        <p>
          4. <b>Gizliliğe saygı.</b> Özel mesajlar ve kişisel bilgiler izinsiz paylaşılamaz.
        </p>
        <p>
          5. <b>Kapalı test içeriği dışarı sızdırma.</b> Google Play kapalı testine ait
          bilgiler topluluk dışında paylaşılmamalıdır.
        </p>
        <p>
          Kurallara uymayan içerikler yöneticiler tarafından düzenlenebilir veya silinebilir;
          tekrarında üyelik yetkileri kısıtlanabilir.
        </p>
      </div>
    </div>
  );
}
