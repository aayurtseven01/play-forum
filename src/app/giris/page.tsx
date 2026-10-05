import { SignInForm } from '@/components/auth-form';
import { isDemoEnv } from '@/lib/data';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Giriş Yap' };

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return <SignInForm next={next} demo={isDemoEnv()} />;
}
