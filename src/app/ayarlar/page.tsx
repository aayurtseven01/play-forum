import { redirect } from 'next/navigation';
import ProfileForm from '@/components/profile-form';
import PasswordForm from '@/components/password-form';
import { getCurrentUser, getProfileByUsername } from '@/lib/data';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Ayarlar' };

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/giris?next=/ayarlar');
  if (!user.username) redirect('/');

  const profile = await getProfileByUsername(user.username);
  if (!profile) redirect('/');

  return (
    <>
      <h1 style={{ fontSize: 24, margin: '20px 0 14px' }}>Profil Ayarları</h1>
      <ProfileForm profile={profile} />
      <div style={{ height: 18 }} />
      <PasswordForm />
      <p className="hint" style={{ marginTop: 16 }}>
        Şifre ve e-posta değişiklikleri Supabase panelindeki <b>Authentication → Users</b> bölümünden
        yapılır (veya uygulamanın “şifremi unuttum” akışıyla).
      </p>
    </>
  );
}
