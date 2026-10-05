# Yayına Alma — Vercel (ücretsiz)

Bu adımlar forumu `https://forum-adin.vercel.app` gibi kalıcı bir adrese taşır.
**Vercel Hobby planı ücretsizdir**, kredi kartı istemez.

---

## 1. Kodu GitHub'a yükle

### Seçenek A — Tarayıcıdan (git kurmadan)

1. Proje klasörünü **zip** olarak indir.
2. [github.com/new](https://github.com/new) → **Repository name**: `forum`
   → **Public** → **Create repository**
3. Oluşan sayfada **"uploading an existing file"** bağlantısına tıkla.
4. Zip'in **içindeki dosyaları** (klasörün kendisini değil) sürükle-bırak.
   Şunlar görünmeli: `src/`, `supabase/`, `package.json`, `next.config.mjs`,
   `tsconfig.json`, `README.md`, `KURULUM.md`
5. **Commit changes** butonuna bas.

> ⚠️ `.env.local` dosyasını **yükleme**. Zaten zip'te yok; anahtarlar
> Vercel'e ayrıca girilecek (adım 3).

### Seçenek B — Terminalden

```bash
cd forum
git init
git add .
git commit -m "Forum: Next.js + Supabase"
git branch -M main
git remote add origin https://github.com/aayurtseven01/forum.git
git push -u origin main
```

---

## 2. Vercel'e bağla

1. [vercel.com](https://vercel.com) → **Sign Up** → **Continue with GitHub**
   (ücretsiz Hobby planı seç).
2. Panel → **Add New…** → **Project**.
3. GitHub hesabına erişim izni isteğinde **Only select repositories** deyip
   `forum` reposunu seç.
4. Repo listesinde `forum`'un yanındaki **Import**.
5. Framework otomatik **Next.js** olarak algılanır, dokunma.

---

## 3. Ortam değişkenlerini gir (kritik adım)

Deploy'a basmadan **önce** "Environment Variables" bölümüne ikisini ekle:

| Name | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://iaznmrrjmfxyumxclmvq.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → Connect → publishable key |

> Bu ikisini girmezsen site açılır ama **boş** görünür (demo moduna düşer).

Sonra **Deploy**. Yaklaşık 1-2 dakikada canlı adresin hazır.

---

## 4. Supabase tarafını güncelle

Supabase Dashboard → **Authentication** → **URL Configuration**:

- **Site URL** → Vercel'in verdiği adres
  (örn. `https://forum.vercel.app`)
- **Redirect URLs** → aynı adresi `/**` ile ekle
  (örn. `https://forum.vercel.app/**`)

Bunu yapmazsan giriş yaptıktan sonra yönlendirme bozulur.

---

## 5. Kontrol listesi

- [ ] Site açılıyor ve kategoriler görünüyor (boşsa env değişkenleri eksik)
- [ ] Sarı "Demo modu" şeridi **yok** (varsa env değişkenleri okunmuyor)
- [ ] Kayıt ol → giriş yap çalışıyor
- [ ] Konu aç → cevap yaz → beğen çalışıyor
- [ ] Supabase → Authentication → URL Configuration güncellendi

---

## 6. Kendi domainini bağlamak (opsiyonel)

Vercel → projen → **Settings** → **Domains** → domainini yaz.
Vercel sana iki DNS kaydı verir (`A` ve `CNAME`); bunları domainini aldığın
yerin (Natro, Turhost, Cloudflare vb.) DNS paneline ekle.
SSL sertifikası otomatik ve ücretsiz gelir.

---

## Sık sorunlar

**Site açılıyor ama hiç kategori yok / sarı şerit var**
→ Vercel'de Environment Variables girilmemiş. Ekle, sonra
**Deployments → son dağıtım → ⋯ → Redeploy**.

**`Application error: a server-side exception has occurred`**
→ Vercel → projen → **Logs** sekmesine bak; `[supabase:...]` ile başlayan
satır hatanın hangi sorgudan geldiğini söyler.

**Giriş yaptıktan sonra ana sayfaya dönmüyor**
→ Adım 4'teki Site URL / Redirect URLs ayarı eksik.

**Değişiklik yaptım ama sitede görünmüyor**
→ GitHub'a `git push` (veya tarayıcıdan yükle) → Vercel otomatik yeniden
dağıtır. Env değişkeni değiştirdiysen **Redeploy** şart.
