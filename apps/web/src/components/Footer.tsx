import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import pantheonlogo from '../assets/pantheon-logowhole.png';

export const Footer: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleHashClick = (e: React.MouseEvent<HTMLAnchorElement>, hash: string) => {
    e.preventDefault();
    if (location.pathname === '/') {
      const targetId = hash.replace('#', '');
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        window.history.pushState(null, '', hash);
      }
    } else {
      navigate(`/${hash}`);
    }
  };

  return (
    <footer className="bg-[#0f0e0d] border-t border-[#2b2a29] text-[#cac6bc] text-sm pt-16 pb-12 relative">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-20">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-16 border-b border-[#2b2a29]">
          
          {/* Brand Info Column */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="inline-block focus:outline-none">
              <img src={pantheonlogo} alt="Pantheon Logo" className="w-24 h-auto" />
            </Link>

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
              <li>
                <a
                  href="/#features"
                  onClick={(e) => handleHashClick(e, '#features')}
                  className="hover:text-[#e6e2df] transition-colors"
                >
                  Platform Features
                </a>
              </li>
              <li>
                <a
                  href="/#workspace"
                  onClick={(e) => handleHashClick(e, '#workspace')}
                  className="hover:text-[#e6e2df] transition-colors"
                >
                  Studio Workspace
                </a>
              </li>
              <li>
                <a
                  href="/#how-it-works"
                  onClick={(e) => handleHashClick(e, '#how-it-works')}
                  className="hover:text-[#e6e2df] transition-colors"
                >
                  Production Workflow
                </a>
              </li>
              <li>
                <Link to="/discover" className="hover:text-[#e6e2df] transition-colors">
                  Discover Projects
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform & Account Links */}
          <div className="space-y-3">
            <h4 className="font-mono text-xs font-bold text-[#e6e2df] uppercase tracking-wider">
              Platform
            </h4>
            <ul className="space-y-2 text-xs font-sans text-[#8c887e]">
              <li>
                <Link to="/login" className="hover:text-[#e6e2df] transition-colors">
                  Sign In
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-[#e6e2df] transition-colors">
                  Create Studio Account
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-[#e6e2df] transition-colors">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-[#8c887e]">
          <div>
            © {new Date().getFullYear()} Pantheon. All rights reserved. Built for game creators.
          </div>
          <div className="text-xs text-[#8c887e]">
            Collaborative Game Production Platform
          </div>
        </div>

      </div>
    </footer>
  );
};
