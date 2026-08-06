import React from 'react';

interface SkeletonLoaderProps {
  className?: string;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ className = '' }) => {
  return <div className={`animate-pulse rounded-2xl bg-[#201f1e] ${className}`} />;
};