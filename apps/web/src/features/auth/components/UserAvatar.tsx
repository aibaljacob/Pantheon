import React from 'react';
import type { AuthUser } from '../types';
import { resolveImageUrl, getInitials } from '../../../lib/imageUrl';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
  src?: string | null;
  avatarUrl?: string | null;
  name?: string | null;
  size?: AvatarSize;
  className?: string;
  alt?: string;
}

const sizeClassMap: Record<AvatarSize, string> = {
  xs: 'h-6 w-6 text-[9px]',
  sm: 'h-8 w-8 text-[10px]',
  md: 'h-10 w-10 text-xs',
  lg: 'h-12 w-12 text-sm',
  xl: 'h-16 w-16 text-base',
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  avatarUrl,
  name,
  size = 'md',
  className = '',
  alt,
}) => {
  const [imageError, setImageError] = React.useState(false);
  const initials = getInitials(name);
  const rawUrl = src !== undefined ? src : avatarUrl;
  const resolvedSrc = resolveImageUrl(rawUrl);

  React.useEffect(() => {
    setImageError(false);
  }, [resolvedSrc]);

  if (resolvedSrc && !imageError) {
    return (
      <img
        src={resolvedSrc}
        alt={alt || `${name || 'User'} avatar`}
        referrerPolicy="no-referrer"
        onError={() => setImageError(true)}
        className={`rounded-full object-cover shrink-0 ${sizeClassMap[size]} ${className}`}
      />
    );
  }

  return (
    <div
      className={`flex items-center justify-center rounded-full border border-[#48473f] bg-[#2A2724] font-mono font-semibold text-[#e6e2df] shrink-0 select-none ${sizeClassMap[size]} ${className}`}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
};

export interface UserAvatarProps {
  user: Partial<AuthUser> & {
    avatarUrl?: string | null;
    avatar?: string | null;
    displayName?: string | null;
    username?: string | null;
  };
  size?: AvatarSize;
  className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  size = 'md',
  className = '',
}) => {
  const rawAvatar = user.avatar || user.avatarUrl;
  const name =
    user.fullName ||
    user.displayName ||
    [user.firstName, user.lastName].filter(Boolean).join(' ') ||
    user.username ||
    'User';

  return (
    <Avatar
      avatarUrl={rawAvatar}
      name={name}
      size={size}
      className={className}
      alt={`${name} avatar`}
    />
  );
};