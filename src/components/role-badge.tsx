import type { Profile } from '@/lib/types';

/** Rol rozeti: yöneticiye Administrator, moderatöre Moderatör */
export default function RoleBadge({
  profile
}: {
  profile: Pick<Profile, 'is_admin' | 'is_moderator'> | null | undefined;
}) {
  if (!profile) return null;
  if (profile.is_admin) return <span className="role-badge admin">Administrator</span>;
  if (profile.is_moderator) return <span className="role-badge mod">Moderatör</span>;
  return null;
}
