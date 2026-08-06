import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', glow = false }) => {
  return (
    <div
      className={`filmic-card rounded-2xl p-6 relative overflow-hidden group ${
        glow ? 'border-[#48473f]/60' : ''
      } ${className}`}
    >
      {/* Top light highlight catch */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#939188]/30 to-transparent group-hover:via-[#e6e2df]/50 transition-all duration-300 pointer-events-none" />
      
      {/* Background vignette illumination */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#201f1e]/40 to-transparent opacity-60 pointer-events-none" />
      
      <div className="relative z-10">{children}</div>
    </div>
  );
};
