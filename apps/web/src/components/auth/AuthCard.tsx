import React from 'react';

interface AuthCardProps {
  children: React.ReactNode;
  className?: string;
}

export const AuthCard: React.FC<AuthCardProps> = ({ children, className = '' }) => {
  return (
    <div
      className={`filmic-card rounded-2xl p-8 sm:p-10 border border-[#363433] bg-[#1c1b1a]/95 backdrop-blur-xl shadow-2xl relative overflow-hidden w-full max-w-md mx-auto ${className}`}
    >
      {/* Top light highlight catch */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#939188]/40 to-transparent pointer-events-none" />

      {/* Internal volumetric vignette */}
      <div className="absolute inset-0 bg-radial from-[#201f1e]/50 via-transparent to-transparent opacity-70 pointer-events-none" />

      <div className="relative z-10">{children}</div>
    </div>
  );
};
