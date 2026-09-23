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
    default: 'bg-pantheon-high text-pantheon-ivory border border-pantheon-border',
    outline: 'bg-transparent text-pantheon-muted border border-pantheon-border',
    accent: 'bg-pantheon-bronze text-pantheon-ivory border border-pantheon-border',
    bronze: 'bg-pantheon-mid text-pantheon-muted border border-pantheon-border-dark',
  };

  return (
    <span className={`${baseStyles} ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};
