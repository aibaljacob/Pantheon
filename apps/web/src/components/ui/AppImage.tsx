import React, { useState, useEffect } from 'react';
import { resolveImageUrl } from '../../lib/imageUrl';
import { ImageIcon } from 'lucide-react';

export interface AppImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string | null;
  alt: string;
  fallback?: React.ReactNode;
  fallbackIcon?: React.ComponentType<{ className?: string }>;
  containerClassName?: string;
  aspectRatio?: string;
}

export const AppImage: React.FC<AppImageProps> = ({
  src,
  alt,
  fallback,
  fallbackIcon: FallbackIcon = ImageIcon,
  className = '',
  containerClassName = '',
  aspectRatio,
  referrerPolicy = 'no-referrer',
  loading = 'lazy',
  onError,
  onLoad,
  ...props
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const resolvedSrc = resolveImageUrl(src);

  // Reset error and load state if the source URL changes
  useEffect(() => {
    setHasError(false);
    setIsLoaded(false);
  }, [resolvedSrc]);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setHasError(true);
    setIsLoaded(true);
    if (onError) {
      onError(e);
    }
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setIsLoaded(true);
    if (onLoad) {
      onLoad(e);
    }
  };

  const wrapperClass = [
    'relative overflow-hidden',
    aspectRatio || '',
    containerClassName,
  ]
    .filter(Boolean)
    .join(' ');

  if (!resolvedSrc || hasError) {
    if (fallback !== undefined) {
      return <>{fallback}</>;
    }

    return (
      <div
        className={`flex h-full w-full items-center justify-center bg-[#201f1e] text-[#8c887e] border border-[#2b2a29] ${wrapperClass}`}
        role="img"
        aria-label={alt}
      >
        <FallbackIcon className="h-8 w-8 text-[#8c887e]/60" />
      </div>
    );
  }

  return (
    <div className={wrapperClass}>
      {!isLoaded && (
        <div
          className="absolute inset-0 bg-[#201f1e] animate-pulse"
          aria-hidden="true"
        />
      )}
      <img
        src={resolvedSrc}
        alt={alt}
        loading={loading}
        referrerPolicy={referrerPolicy}
        onError={handleImageError}
        onLoad={handleImageLoad}
        className={`${className} ${!isLoaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        {...props}
      />
    </div>
  );
};
