import React from 'react';
import { ShieldCheck, MessageSquare, Globe, Share2, Code2 } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#0f0e0d] border-t border-[#2b2a29] text-[#cac6bc] text-sm pt-16 pb-12 relative">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-20">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-16 border-b border-[#2b2a29]">
          
          {/* Brand Info Column */}
          <div className="lg:col-span-2 space-y-4">
            <a href="#" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-b from-[#363433] to-[#1c1b1a] border border-[#48473f] flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-[#e6e2df]" />
              </div>
              <span className="font-headline font-bold text-lg tracking-widest text-[#e6e2df] uppercase">
                PANTHEON
              </span>
            </a>

            <p className="font-sans text-xs text-[#8c887e] max-w-sm leading-relaxed">
              The engineered SaaS platform for game developers, studios, and creators. Built for deep focus, technical precision, and rapid production iteration.
            </p>

            {/* System Status Indicator */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1c1b1a] border border-[#2b2a29] text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[#e6e2df]">ALL SYSTEMS OPERATIONAL</span>
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-3">
            <h4 className="font-mono text-xs font-bold text-[#e6e2df] uppercase tracking-wider">
              Product
            </h4>
            <ul className="space-y-2 text-xs font-sans text-[#8c887e]">
              <li><a href="#features" className="hover:text-[#e6e2df] transition-colors">AI Talent Matching</a></li>
              <li><a href="#features" className="hover:text-[#e6e2df] transition-colors">Project Management</a></li>
              <li><a href="#features" className="hover:text-[#e6e2df] transition-colors">3D Asset Repository</a></li>
              <li><a href="#features" className="hover:text-[#e6e2df] transition-colors">Production Analytics</a></li>
              <li><a href="#pricing" className="hover:text-[#e6e2df] transition-colors">Pricing & Plans</a></li>
            </ul>
          </div>

          {/* Company Links */}
          <div className="space-y-3">
            <h4 className="font-mono text-xs font-bold text-[#e6e2df] uppercase tracking-wider">
              Company
            </h4>
            <ul className="space-y-2 text-xs font-sans text-[#8c887e]">
              <li><a href="#" className="hover:text-[#e6e2df] transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-[#e6e2df] transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-[#e6e2df] transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-[#e6e2df] transition-colors">Press Kit</a></li>
              <li><a href="#" className="hover:text-[#e6e2df] transition-colors">Contact</a></li>
            </ul>
          </div>

          {/* Resources & Legal Links */}
          <div className="space-y-3">
            <h4 className="font-mono text-xs font-bold text-[#e6e2df] uppercase tracking-wider">
              Resources & Legal
            </h4>
            <ul className="space-y-2 text-xs font-sans text-[#8c887e]">
              <li><a href="#" className="hover:text-[#e6e2df] transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-[#e6e2df] transition-colors">API Reference</a></li>
              <li><a href="#" className="hover:text-[#e6e2df] transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-[#e6e2df] transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-[#e6e2df] transition-colors">Security</a></li>
            </ul>
          </div>

        </div>

        {/* Bottom Copyright & Social Icons */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-[#8c887e]">
          <div>
            © {new Date().getFullYear()} Pantheon Inc. All rights reserved. Built for game creators.
          </div>

          <div className="flex items-center gap-4 text-[#8c887e]">
            <a href="https://github.com" target="_blank" rel="noreferrer" aria-label="GitHub" className="hover:text-[#e6e2df] transition-colors flex items-center gap-1">
              <Code2 className="w-4 h-4" />
              <span>GitHub</span>
            </a>
            <a href="https://x.com" target="_blank" rel="noreferrer" aria-label="X Twitter" className="hover:text-[#e6e2df] transition-colors flex items-center gap-1">
              <Share2 className="w-4 h-4" />
              <span>X</span>
            </a>
            <a href="https://discord.com" target="_blank" rel="noreferrer" aria-label="Discord" className="hover:text-[#e6e2df] transition-colors flex items-center gap-1">
              <MessageSquare className="w-4 h-4" />
              <span>Discord</span>
            </a>
            <a href="https://pantheon.dev" target="_blank" rel="noreferrer" aria-label="Network" className="hover:text-[#e6e2df] transition-colors flex items-center gap-1">
              <Globe className="w-4 h-4" />
              <span>Global</span>
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
};
