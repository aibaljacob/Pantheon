import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  icon,
  iconPosition = 'right',
  className = '',
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs font-mono',
    md: 'px-5 py-2.5 text-sm font-sans font-medium',
    lg: 'px-7 py-3.5 text-base font-sans font-semibold',
  };

  const variantClasses = {
    primary: 'sculpted-btn group rounded-md inline-flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60',
    secondary: 'secondary-btn group rounded-md inline-flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60',
    ghost: 'bg-transparent text-[#cac6bc] hover:text-[#e6e2df] hover:bg-[#201f1e] rounded-md inline-flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:cursor-not-allowed disabled:opacity-60',
  };

  return (
    <button
      className={`${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {icon && iconPosition === 'left' && <span className="inline-flex">{icon}</span>}
      <span className="inline-flex">{children}</span>
      {icon && iconPosition === 'right' && <span className="inline-flex transition-transform duration-200 group-hover:translate-x-0.5">{icon}</span>}
    </button>
  );
};
