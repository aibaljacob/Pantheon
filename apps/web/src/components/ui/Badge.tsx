import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'accent' | 'bronze';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  className = '',
}) => {
  const baseStyles = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium tracking-wide uppercase transition-colors';
  
  const variants = {
    default: 'bg-[#2b2a29] text-[#e6e2df] border border-[#363433]',
    outline: 'bg-transparent text-[#cac6bc] border border-[#48473f]',
    accent: 'bg-[#2A2724] text-[#e6e2df] border border-[#48473f]',
    bronze: 'bg-[#201f1e] text-[#cac6bc] border border-[#48473f]/60',
  };

  return (
    <span className={`${baseStyles} ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};
