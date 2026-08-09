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
        glow ? 'border-t-[#e6e2df]/40 border-l-[#939188]/30' : ''
      } ${className}`}
    >
      {/* Top light highlight catch */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#e6e2df]/35 to-transparent group-hover:via-[#e6e2df]/65 transition-all duration-300 pointer-events-none" />
      
      {/* Left light catch */}
      <div className="absolute top-0 left-0 bottom-0 w-[1px] bg-gradient-to-b from-[#e6e2df]/25 via-transparent to-transparent pointer-events-none" />

      {/* Surface illumination: slightly brighter center, subtle corner falloff */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(230,226,223,0.04)_0%,rgba(20,19,18,0.2)_80%)] pointer-events-none" />
      
      <div className="relative z-10">{children}</div>
    </div>
  );
};
