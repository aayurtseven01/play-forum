import { initials } from '@/lib/format';
import type { Profile } from '@/lib/types';

/**
 * Avatar: yüklenmiş görsel varsa onu, yoksa baş harfleri gösterir.
 */
export default function UserAvatar({
  profile,
  size = 38,
  className = 'avatar'
}: {
  profile: Pick<Profile, 'avatar_url' | 'username' | 'display_name'> | null | undefined;
  size?: number;
  className?: string;
}) {
  const style = { width: size, height: size };
  if (profile?.avatar_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={profile.avatar_url} alt="" className={className} style={{ ...style, objectFit: 'cover' }} />
    );
  }
  return (
    <span className={className} style={style}>
      {initials(profile)}
    </span>
  );
}
