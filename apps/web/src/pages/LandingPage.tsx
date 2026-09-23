import React from 'react';
import { Navbar } from '../components/Navbar';
import { Hero } from '../components/Hero';
import { TrustedBy } from '../components/TrustedBy';
import { Features } from '../components/Features';
import { HowItWorks } from '../components/HowItWorks';
import { PlatformPreview } from '../components/PlatformPreview';
import { Testimonials } from '../components/Testimonials';
import { CTASection } from '../components/CTASection';
import { Footer } from '../components/Footer';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-pantheon-bg text-pantheon-ivory flex flex-col font-sans selection:bg-pantheon-border selection:text-pantheon-ivory relative transition-colors duration-200">
      {/* Global Soft Ambient Daylight/Noir Light Source */}
      <div className="absolute top-0 left-0 right-0 h-[1200px] global-ambient-light pointer-events-none z-0" />
      
      {/* Subtle Natural Studio Vignette Along Viewport Edges */}
      <div className="fixed inset-0 pointer-events-none z-40 dark:shadow-[inset_0_0_120px_rgba(15,14,13,0.65)] shadow-[inset_0_0_80px_rgba(216,210,200,0.2)]" />

      <Navbar />
      <main className="flex-1 relative z-10">
        <Hero />
        <TrustedBy />
        <Features />
        <HowItWorks />
        <PlatformPreview />
        <Testimonials />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};
