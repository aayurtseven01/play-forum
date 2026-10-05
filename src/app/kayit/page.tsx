import { SignUpForm } from '@/components/auth-form';
import { isDemoEnv } from '@/lib/data';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Kayıt Ol' };

export default function RegisterPage() {
  return <SignUpForm demo={isDemoEnv()} />;
}
