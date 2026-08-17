import React from 'react';
import type { AuthUser } from '../types';
import { formatApiAssetUrl } from '../../profile/services/profileService';

interface UserAvatarProps {
  user: AuthUser;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClassMap: Record<NonNullable<UserAvatarProps['size']>, string> = {
  sm: 'h-8 w-8 text-[10px]',
  md: 'h-10 w-10 text-xs',
  lg: 'h-12 w-12 text-sm',
  xl: 'h-16 w-16 text-base',
};

export const UserAvatar: React.FC<UserAvatarProps> = ({ user, size = 'md', className = '' }) => {
  const fallbackInitials = `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase() || 'U';
  const rawAvatar = user.avatar || user.avatarUrl;
  const avatarSrc = rawAvatar ? formatApiAssetUrl(rawAvatar) : null;

  if (avatarSrc) {
    return (
      <img
        src={avatarSrc}
        alt={`${user.fullName} avatar`}
        className={`rounded-full object-cover ${sizeClassMap[size]} ${className}`}
      />
    );
  }

  return (
    <div
      className={`flex items-center justify-center rounded-full border border-[#48473f] bg-[#2A2724] font-mono font-semibold text-[#e6e2df] ${sizeClassMap[size]} ${className}`}
      aria-hidden="true"
    >
      {fallbackInitials}
    </div>
  );
};