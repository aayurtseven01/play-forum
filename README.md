# Forum — Next.js + Supabase (Ücretsiz Katman)

Türkçe arayüzlü, Supabase tabanlı topluluk forumu. Ücretsiz katmanda çalışır,
büyüyünce tek tıkla ücretli plana geçer (kod değişikliği gerekmez).

📖 **Kurulum için: [KURULUM.md](./KURULUM.md)**

## Özellikler

- E-posta + şifre ile kayıt/giriş (Supabase Auth)
- Kategoriler, konular, cevaplar
- Beğeni, görüntülenme sayacı, cevap sayacı
- Konu arama, sıralama (Yeni / Aktif / Popüler)
- Profil sayfası ve profil düzenleme
- Yönetici yetkisi (`is_admin`) ile içerik silme
- Row Level Security ile veritabanı seviyesinde yetkilendirme
- Koyu/açık tema (sistem tercihine göre otomatik)
- **Demo modu**: Supabase anahtarı girilmeden de arayüzü deneyebilirsin

## Hızlı başlangıç

```bash
npm install
npm run dev        # http://localhost:3000  (demo modunda açılır)
```

Gerçek veritabanına geçmek için `supabase/schema.sql` dosyasını Supabase SQL
Editor'de çalıştır ve `.env.local` dosyasına anahtarlarını gir → **KURULUM.md**.

## Sayfalar

| Yol | Açıklama |
| --- | --- |
| `/` | Son konular + kategoriler |
| `/kategoriler` | Tüm kategoriler |
| `/kategori/[slug]` | Kategori içindeki konular |
| `/konu/[id]` | Konu detayı + cevaplar |
| `/yeni-konu` | Yeni konu aç (giriş gerekir) |
| `/ara?q=` | Arama |
| `/profil/[username]` | Kullanıcı profili |
| `/ayarlar` | Profil düzenleme (giriş gerekir) |
| `/giris`, `/kayit` | Kimlik doğrulama |

## Komutlar

```bash
npm run dev         # geliştirme sunucusu
npm run build       # üretim derlemesi
npm start           # üretim sunucusu
npm run typecheck   # TypeScript kontrolü
```

## Teknoloji

- **Next.js 15** (App Router, Server Components, Server Actions)
- **Supabase** (PostgreSQL + Auth + Row Level Security)
- **@supabase/ssr** (çerez tabanlı oturum)
- **TypeScript**, harici CSS bağımlılığı yok (tek dosya `globals.css`)
