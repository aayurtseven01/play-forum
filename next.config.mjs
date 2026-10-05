/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Canlı önizleme / Vercel alt alanlarından gelen isteklere izin ver
  allowedDevOrigins: ['*.e2b.app', '*.vercel.app', 'localhost'],
  // Supabase Storage'tan yüklenen avatar/resimleri gösterebilmek için
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' }
    ]
  }
};

export default nextConfig;
