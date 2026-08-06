import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';

export const CTASection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="py-24 relative overflow-hidden bg-[#141312]">
      {/* Background Lighting Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] spotlight-glow rounded-full blur-3xl pointer-events-none opacity-80" />

      <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-20 relative z-10">
        <div className="filmic-card rounded-3xl p-10 md:p-16 border border-[#48473f]/70 bg-gradient-to-b from-[#201f1e] via-[#1c1b1a] to-[#141312] text-center space-y-8 shadow-2xl relative overflow-hidden">
          
          {/* Subtle Accent Glow Edge */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#e6e2df]/40 to-transparent" />

          <div className="inline-flex items-center gap-2 mx-auto">
            <Badge variant="accent" className="border-[#48473f]">
              <Sparkles className="w-3.5 h-3.5 text-[#e6e2df]" />
              JOIN THE PANTHEON NETWORK
            </Badge>
          </div>

          <h2 className="font-headline font-extrabold text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[#ffffff] tracking-tight max-w-4xl mx-auto leading-tight">
            Ready to build your next game?
          </h2>

          <p className="font-sans text-base sm:text-lg text-[#cac6bc] max-w-2xl mx-auto leading-relaxed">
            Join thousands of developers, technical directors, 3D artists, and studios creating the next generation of games on Pantheon.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button
              variant="primary"
              size="lg"
              icon={<ArrowRight className="w-5 h-5" />}
              onClick={() => navigate('/register')}
              className="w-full sm:w-auto text-base"
            >
              Create Your Account
            </Button>
          </div>

          {/* Micro Guarantee Metrics */}
          <div className="pt-8 border-t border-[#2b2a29] flex flex-wrap items-center justify-center gap-8 text-xs font-mono text-[#8c887e]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#e6e2df]" />
              <span>14-Day Free Studio Trial</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#e6e2df]" />
              <span>No Credit Card Required</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#e6e2df]" />
              <span>Instant Git LFS Provisioning</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
