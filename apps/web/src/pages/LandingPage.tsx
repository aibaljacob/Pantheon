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
    <div className="min-h-screen bg-[#141312] text-[#e6e2df] flex flex-col font-sans selection:bg-[#48473f] selection:text-[#ffffff]">
      <Navbar />
      <main className="flex-1">
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
