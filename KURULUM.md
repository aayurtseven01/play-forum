# Kurulum Rehberi — Supabase + Next.js Forum (Ücretsiz Katman)

Bu rehber seni sıfırdan **yayında çalışan bir foruma** götürür.
Toplam süre: yaklaşık 20-30 dakika. **Hiçbir adımda ödeme gerekmez.**

---

## 0. Proje şu an ne durumda?

Kod hazır ve **demo modunda** çalışıyor: veriler sunucudaki geçici bir JSON
dosyasında tutuluyor, Supabase'e hiç bağlanmıyor. Aşağıdaki 4 adımı yapınca
gerçek veritabanına geçer.

```
forum/
├── src/
│   ├── app/               # Sayfalar (ana sayfa, kategori, konu, giriş, profil…)
│   ├── components/        # Arayüz parçaları
│   ├── lib/
│   │   ├── data.ts        # Tüm veri okuma/yazma işleri (demo + Supabase)
│   │   ├── actions.ts     # Form gönderimleri (Server Actions)
│   │   ├── demo-store.ts  # Demo modu deposu (Supabase yokken)
│   │   └── supabase/      # Supabase istemcileri (sunucu + tarayıcı)
│   └── middleware.ts      # Oturum kontrolü + korumalı sayfalar
├── supabase/schema.sql    # ← Supabase'e yapıştıracağın veritabanı şeması
└── .env.local.example     # ← kopyalayıp .env.local yapacaksın
```

---

## 1. Supabase'te veritabanını kur (5 dk)

1. [supabase.com](https://supabase.com) → **Dashboard** → projeni seç
   (projen yoksa **New project** de; bölge olarak `Central EU (Frankfurt)`
   Türkiye'ye en yakın ücretsiz seçeneklerden biri).
2. Sol menüden **SQL Editor** → **New query**.
3. `supabase/schema.sql` dosyasının **tamamını** kopyala, editöre yapıştır.
4. **Run** (veya `Ctrl/Cmd + Enter`) butonuna bas.
   `Success. No rows returned` yazısını görmelisin.

Bu SQL şunları yapar:

| Ne | Açıklama |
| --- | --- |
| `profiles` | Her üye için profil (kayıt olunca otomatik oluşur) |
| `categories` | Kategoriler (4 tanesi hazır geliyor) |
| `topics` | Konular |
| `posts` | Cevaplar |
| `reactions` | Beğeniler |
| **RLS politikaları** | Herkes okur; yazmak için giriş gerekir; silmeyi yalnızca sahibi veya yönetici yapar |
| **Trigger'lar** | Yeni üye → profil oluştur, cevap sayısı otomatik güncellenir |

> ⚠️ RLS (Row Level Security) açık bırakılmalı. Kapatırsan herkes herkesin
> verisini değiştirebilir.

---

## 2. Anahtarları al (2 dk)

> ⚠️ **Sık yapılan hata:** Anahtarlar **Integrations → Data API** sayfasında
> DEĞİLDİR. Orada yalnızca API URL'i bulunur. Anahtarlar için aşağıya bak.

**En kolay yol:** Dashboard'da sağ üstteki **Connect** butonuna bas →
açılan panelde **Project URL** ve **Publishable key** hazır gelir.

Alternatif: **Settings** (dişli simgesi) → **API Keys**
doğrudan bağlantı: `https://supabase.com/dashboard/project/PROJE_REF/settings/api-keys`

İki değeri kopyala:

| Ne | Neye yazılacak | Nasıl görünür |
| --- | --- | --- |
| **Project URL** (Data API sayfasındaki "API URL" ile aynı şey) | `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxxxxx.supabase.co` |
| **Publishable key** | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_...` |

**İki anahtar biçimi de çalışır** (kod ikisini de kabul eder):

- `sb_publishable_...` → yeni biçim, **bunu kullanmanı öneririm**
- `eyJhbGciOi...` → eski `anon` anahtarı (legacy). Supabase bu ikisini
  **2026 sonunda devre dışı bırakacağını** duyurdu, o yüzden yeni biçim daha
  uzun ömürlü.

> 🔒 **Secret key** (`sb_secret_...`) veya eski **service_role** anahtarını
> ASLA bu projeye koyma. Onlar tüm RLS güvenlik kurallarını atlar.
> Bu projede yalnızca publishable/anon anahtarı kullanılır.

> ℹ️ **Data API kapalı olmamalı.** Integrations → Data API sayfasındaki
> "Enable Data API" anahtarı açık kalmalı (varsayılan açık). Kapatırsan
> uygulama veritabanına hiç erişemez.

---

## 3. Projeye anahtarları gir (2 dk)

> ✅ **Bu proje için zaten yapıldı.** `.env.local` dosyası oluşturuldu ve
> forum şu an gerçek Supabase veritabanına bağlı. Aşağısı referans.

Proje klasöründe `.env.local` dosyası oluştur (`.env.local.example`'ı kopyala):

```bash
cp .env.local.example .env.local
```

İçini doldur:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

> Eski `NEXT_PUBLIC_SUPABASE_ANON_KEY` adı da çalışır (kod ikisini de okur),
> ama yeni adı kullanmak daha doğru.

Sonra sunucuyu yeniden başlat (env değişiklikleri yeniden başlatma ister):

```bash
npm run dev
```

Sayfanın üstündeki sarı **"Demo modu"** şeridi kaybolduysa bağlantı tamam ✅

> ⚠️ `npm run build` komutunu dev sunucusu **çalışırken** çalıştırma: ikisi de
> aynı `.next` klasörünü kullanır ve dev sunucusu
> `Cannot find module './vendor-chunks/@supabase.js'` hatasıyla 500 vermeye
> başlar. Olursa: sunucuyu durdur, `rm -rf .next`, sonra `npm run dev`.

---

## 4. Giriş ayarlarını yap (5 dk)

Sol menü → **Authentication**:

1. **Sign In / Providers** → **Email** açık olmalı (varsayılan açık).
2. Test aşamasında kolaylık için: **Email** sağlayıcısında
   **"Confirm email"** seçeneğini kapat. Böylece kayıt olan kullanıcı anında
   giriş yapabilir.
   > Yayına alırken tekrar açmanı öneririm (sahte kayıtları engeller).
3. **URL Configuration** → **Site URL**: `http://localhost:3000`
   (yayına alınca kendi domainin, örn. `https://forum.siten.com`)
4. **Redirect URLs** listesine ekle: `http://localhost:3000/**`

### İlk yönetici hesabı

1. Uygulamada **Kayıt ol** ile hesap aç.
2. Supabase → **Table Editor** → `profiles` tablosu → kendi satırın →
   `is_admin` kutusunu **true** yap.

Yönetici olunca: başkalarının konu/cevaplarını silebilirsin.

---

## 5. Yerelde çalıştır

```bash
npm install     # ilk seferde
npm run dev     # http://localhost:3000
```

Diğer komutlar:

```bash
npm run typecheck   # TypeScript kontrolü
npm run build       # üretim derlemesi
npm start           # üretim sunucusu
```

---

## 6. Yayına alma (ücretsiz)

### A) Uygulama → Vercel (ücretsiz Hobby planı)

1. Kodu GitHub'a yükle.
2. [vercel.com](https://vercel.com) → **Add New → Project** → repoyu seç.
3. **Environment Variables** kısmına ikisini ekle:
   `NEXT_PUBLIC_SUPABASE_URL` ve `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. **Deploy**. Yaklaşık 1 dakikada `https://forum-xxx.vercel.app` hazır.
5. Supabase → **Authentication → URL Configuration → Site URL**'i bu adres yap.

### B) Alternatif: tamamen ücretsiz tek yer

Supabase ücretsiz katmanı artık statik site barındırma da sunuyor; ancak
Next.js sunucu tarafında çalıştığı için **Vercel + Supabase** ikilisi en
sorunsuz yoldur. İkisi de ücretsiz katmanda kalır.

---

## 7. Ücretsiz katman limitleri (Supabase Free)

| Kaynak | Limit | Forum için anlamı |
| --- | --- | --- |
| Aktif proje | **2 proje** | Biri bu forum, diğeri yedek/deneme için durur |
| Veritabanı | 500 MB | ~1-2 milyon mesaj demek. Yıllarca yeter. |
| Depolama | 1 GB | Avatar/resimler için |
| Aylık aktif kullanıcı | 50.000 | Küçük/orta topluluk için fazlasıyla yeter |
| Bant genişliği | 5 GB/ay | Normal forum trafiği için yeterli |
| Edge Functions | 500.000 çağrı/ay | Bu projede kullanılmıyor |
| **Duraklatma** | **1 hafta aktiflik olmazsa proje uyur** | İlk girişte ~30 sn bekler, sonra normale döner |

**Ücretliye geçiş:** Proje ayarları → **Billing** → **Pro ($25/ay)**.
Kod değişikliği **gerekmez**; sadece limitler artar, duraklatma kalkar.

> 💡 Duraklatmayı önlemek için ücretsiz bir uptime servisiyle
> (örn. UptimeRobot) 10 dakikada bir sitene istek atabilirsin.

---

## 8. Sık karşılaşılan sorunlar

**`relation "public.topics" does not exist`**
→ SQL şeması çalıştırılmamış. 1. adımı yap.

**Her istek `Failed to fetch` / `Connection refused` veriyor**
→ Integrations → Data API sayfasında "Enable Data API" kapalı olabilir. Aç ve
kaydet. Ayrıca `NEXT_PUBLIC_SUPABASE_URL`'de sondaki `/` olmamalı.

**Anahtarları bulamıyorum**
→ `Integrations → Data API` yanlış yer (orada sadece URL var). Doğru yer:
sağ üst **Connect** butonu veya **Settings → API Keys**.

**Kayıt oluyorum ama giriş yapamıyorum**
→ Authentication → Email → "Confirm email" açık ve e-posta gelmemiş.
Test için kapat veya Supabase → Authentication → Users'tan kullanıcıyı onayla.

**"Invalid login credentials"**
→ E-posta/şifre yanlış ya da kullanıcı onaylanmamış.

**Konu açabiliyorum ama başkasınınkini silemiyorum**
→ Doğru davranış. Silme yetkisi yalnızca yazarda ve `is_admin = true`
olan kişilerde (RLS politikası).

**`new row violates row-level security policy`**
→ Giriş yapmadan yazmaya çalışıyorsun ya da `profiles` satırın oluşmamış.
Table Editor'de `profiles` tablosunda kaydın var mı kontrol et.

**CORS hatası**
→ Supabase → Project Settings → API → **CORS**: `*` veya kendi domainin.

---

## 9. Sıradaki adımlar (istek üzerine ekleyebilirim)

- [ ] Moderasyon paneli (şikayet, kullanıcı banlama, toplu silme)
- [ ] Etiket sistemi ve etikete göre filtreleme
- [ ] Resim yükleme (Supabase Storage — 1 GB ücretsiz)
- [ ] E-posta bildirimleri ("konuna cevap geldi")
- [ ] Özel mesaj
- [ ] "Çözüm olarak işaretle" butonu (şemada `is_solution` alanı hazır)
- [ ] RSS beslemesi
- [ ] Kullanıcı puanları / rozetler

Hangisini istediğini söyle, ekleyeyim.
