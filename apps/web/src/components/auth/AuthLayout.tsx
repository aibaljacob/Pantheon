import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { FeaturePanel } from './FeaturePanel';
import { AuthCard } from './AuthCard';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#141312] text-[#e6e2df] flex flex-col font-sans selection:bg-[#48473f] selection:text-[#ffffff]">
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-screen">
        
        {/* Left Side: Desktop Branding & Feature Panel */}
        <div className="hidden lg:block lg:col-span-5 xl:col-span-5 h-full">
          <FeaturePanel />
        </div>

        {/* Right Side: Auth Form Container */}
        <div className="lg:col-span-7 xl:col-span-7 flex flex-col justify-between p-6 sm:p-10 lg:p-12 relative overflow-hidden bg-[#141312] glow-vignette">
          
          {/* Mobile Top Header */}
          <div className="lg:hidden flex items-center justify-between pb-6 border-b border-[#2b2a29]">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-b from-[#363433] to-[#1c1b1a] border border-[#48473f] flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-[#e6e2df]" />
              </div>
              <span className="font-headline font-bold text-base tracking-widest text-[#e6e2df] uppercase">
                PANTHEON
              </span>
            </Link>

            <Link to="/" className="text-xs font-mono text-[#cac6bc] hover:text-[#e6e2df]">
              ← Home
            </Link>
          </div>

          {/* Centered Auth Card */}
          <div className="my-auto py-8 w-full flex items-center justify-center relative z-10">
            <AuthCard>
              {children}
            </AuthCard>
          </div>

          {/* Bottom Copyright */}
          <div className="pt-6 text-center text-xs font-mono text-[#8c887e] relative z-10">
            © {new Date().getFullYear()} Pantheon Inc. All rights reserved.
          </div>

        </div>

      </div>
    </div>
  );
};
