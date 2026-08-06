import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Menu , X, ArrowRight } from 'lucide-react';
import pantheonlogo from '../assets/pantheon-logowhole.png';
import pantheonp from '../assets/pantheon-logoP.png';

export const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#141312]/90 backdrop-blur-md border-b border-[#363433]/80 py-3 shadow-2xl shadow-black/60'
          : 'bg-transparent py-5 border-b border-transparent'
      }`}
    >
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group focus:outline-none">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-b from-[#363433] to-[#1c1b1a] border border-[#48473f] flex items-center justify-center shadow-lg group-hover:border-[#939188] transition-colors relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[#e6e2df]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <img src={pantheonp} alt="Pantheon P" className="h-6" />
          </div>
          <div className="flex flex-col">
            <img src={pantheonlogo} alt="Pantheon Logo" className="w-21 h-auto" />
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-sans font-medium text-[#cac6bc]" aria-label="Main Navigation">
          <a
            href="#features"
            className="hover:text-[#e6e2df] transition-colors py-1 relative group focus:outline-none focus:text-[#e6e2df]"
          >
            Features
            <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-[#e6e2df] transition-all duration-200 group-hover:w-full" />
          </a>
          <a
            href="#solutions"
            className="hover:text-[#e6e2df] transition-colors py-1 relative group focus:outline-none focus:text-[#e6e2df]"
          >
            Solutions
            <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-[#e6e2df] transition-all duration-200 group-hover:w-full" />
          </a>
          <a
            href="#how-it-works"
            className="hover:text-[#e6e2df] transition-colors py-1 relative group focus:outline-none focus:text-[#e6e2df]"
          >
            How It Works
            <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-[#e6e2df] transition-all duration-200 group-hover:w-full" />
          </a>
          <div className="flex items-center gap-2">
            <a
              href="#pricing"
              className="hover:text-[#e6e2df] transition-colors py-1 relative group focus:outline-none focus:text-[#e6e2df]"
            >
              Pricing
            </a>
            <Badge variant="bronze" className="text-[10px] py-0.5 px-1.5 font-mono">
              Coming Soon
            </Badge>
          </div>
        </nav>

        {/* Actions */}
        <div className="hidden md:flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
            Log In
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<ArrowRight className="w-4 h-4" />}
            onClick={() => navigate('/register')}
          >
            Get Started
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg text-[#cac6bc] hover:text-[#e6e2df] hover:bg-[#201f1e] focus:outline-none focus:ring-2 focus:ring-[#48473f]"
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#1c1b1a] border-b border-[#363433] px-6 py-6 space-y-4 animate-in slide-in-from-top duration-200 shadow-2xl">
          <nav className="flex flex-col space-y-4 text-base font-sans text-[#cac6bc]">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-[#e6e2df] py-1 border-b border-[#2b2a29]"
            >
              Features
            </a>
            <a
              href="#solutions"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-[#e6e2df] py-1 border-b border-[#2b2a29]"
            >
              Solutions
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-[#e6e2df] py-1 border-b border-[#2b2a29]"
            >
              How It Works
            </a>
            <div className="flex items-center justify-between py-1 border-b border-[#2b2a29]">
              <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#e6e2df]">
                Pricing
              </a>
              <Badge variant="bronze" className="text-[10px]">Coming Soon</Badge>
            </div>
          </nav>

          <div className="pt-4 flex flex-col gap-3">
            <Button
              variant="secondary"
              size="md"
              className="w-full justify-center"
              onClick={() => { setMobileMenuOpen(false); navigate('/login'); }}
            >
              Log In
            </Button>
            <Button
              variant="primary"
              size="md"
              icon={<ArrowRight className="w-4 h-4" />}
              className="w-full justify-center"
              onClick={() => { setMobileMenuOpen(false); navigate('/register'); }}
            >
              Get Started
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};
