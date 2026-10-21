import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { ArrowRight, Play, Sparkles, Cpu, Layers, GitBranch, CheckCircle2 } from 'lucide-react';

export const Hero: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden glow-vignette">
      {/* Volumetric Section Ambient Backdrop */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[550px] hero-halo rounded-full pointer-events-none opacity-80" />
      <div className="absolute top-10 right-10 w-96 h-96 bg-[#e6e2df]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">

          {/* Left Column: Copy & CTAs */}
          <div className="lg:col-span-7 space-y-8 text-left">
            <div className="inline-flex items-center gap-2">
              <Badge variant="accent" className="border-t-[#e6e2df]/40 border-l-[#939188]/30 border-r-[#363433] border-b-[#2b2a29] bg-[#1c1b1a]">
                <Sparkles className="w-3.5 h-3.5 text-[#e6e2df]" />
                PANTHEON PRODUCTION PLATFORM
              </Badge>
              <span className="font-mono text-xs text-[#8c887e]">UNREAL, UNITY & GODOT READY</span>
            </div>

            <h1 className="font-headline font-extrabold text-4xl sm:text-5xl lg:text-6xl xl:text-7xl text-[#ffffff] tracking-tight leading-[1.1]">
              Build Better <br />
              <span className="bg-gradient-to-r from-[#ffffff] via-[#e6e2df] to-[#939188] bg-clip-text text-transparent">
                Games Together.
              </span>
            </h1>

            <p className="font-sans text-base sm:text-xl text-[#cac6bc] max-w-2xl font-normal leading-relaxed">
              The collaborative production platform for game developers, studios, and creators.
              Organize studio sprints, direct game blueprints, match AI-verified talent, and test playable builds in one unified workspace.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Button
                variant="primary"
                size="lg"
                icon={<ArrowRight className="w-5 h-5" />}
                onClick={() => navigate('/register')}
                className="focal-bloom-hero-cta"
              >
                Get Started
              </Button>
              <Button
                variant="secondary"
                size="lg"
                icon={<Play className="w-4 h-4 fill-current text-amber-400" />}
                iconPosition="left"
                onClick={() => navigate('/discover')}
              >
                Explore Projects
              </Button>
            </div>

            {/* Micro Feature Bullet Points */}
            <div className="pt-6 border-t border-[#2b2a29] grid grid-cols-3 gap-4 text-xs font-mono text-[#8c887e]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#e6e2df]" />
                <span>AI Talent Matching</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#e6e2df]" />
                <span>Git & Build Runners</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#e6e2df]" />
                <span>Game Blueprints</span>
              </div>
            </div>
          </div>

          {/* Right Column: Engineered Abstract Dashboard Illustration */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto w-full max-w-lg lg:max-w-none">

              {/* Volumetric Cinematic Halo Wrapping Dashboard */}
              <div className="absolute -inset-6 bg-gradient-to-tr from-[#e6e2df]/10 via-[#cac6bc]/5 to-transparent rounded-3xl blur-2xl pointer-events-none opacity-90" />

              {/* Main Simulated Engine Node Panel */}
              <div className="filmic-card focal-bloom-dashboard rounded-2xl p-5 border border-[#363433] bg-[#1c1b1a]/95 backdrop-blur-xl shadow-2xl relative">
                {/* Surface Light Highlight Catch */}
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#e6e2df]/40 to-transparent pointer-events-none" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_20%,rgba(230,226,223,0.05)_0%,rgba(20,19,18,0.3)_80%)] pointer-events-none" />

                {/* Panel Header */}
                <div className="flex items-center justify-between pb-4 border-b border-[#2b2a29] relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-[#363433] flex items-center justify-center border border-[#48473f]">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    </div>
                    <span className="font-mono text-xs text-[#e6e2df] tracking-wider uppercase font-semibold">
                      PROJECT // ETHEREAL_ODYSSEY
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[10px] py-0.5 px-2 text-[#e6e2df] border-t-[#e6e2df]/30">
                    BUILD #412 PASSED
                  </Badge>
                </div>

                {/* Render & Build Queue Status */}
                <div className="py-4 space-y-3 relative z-10">
                  <div className="bg-[#141312] p-3 rounded-xl border-t border-l border-[#48473f]/40 border-r border-b border-[#2b2a29] flex items-center justify-between shadow-inner">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-[#2b2a29] text-[#e6e2df] border border-[#48473f]/40">
                        <Cpu className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-mono text-[#e6e2df] font-medium">Build Runner Pipeline</div>
                        <div className="text-[11px] font-mono text-[#8c887e]">Godot & Web Export Target</div>
                      </div>
                    </div>
                    <span className="font-mono text-xs text-emerald-400">PASSED</span>
                  </div>

                  <div className="bg-[#141312] p-3 rounded-xl border-t border-l border-[#48473f]/40 border-r border-b border-[#2b2a29] flex items-center justify-between shadow-inner">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-[#2b2a29] text-[#e6e2df] border border-[#48473f]/40">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-mono text-[#e6e2df] font-medium">Sprint Milestone Progress</div>
                        <div className="text-[11px] font-mono text-[#8c887e]">Alpha Prototype Deliverables</div>
                      </div>
                    </div>
                    <span className="font-mono text-xs text-[#e6e2df]">12/14 DONE</span>
                  </div>
                </div>

                {/* Simulated Interactive Asset Preview Box */}
                <div className="relative rounded-xl overflow-hidden border border-[#2b2a29] bg-[#141312] p-4 group z-10">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-[11px] text-[#8c887e]">BLUEPRINT // ART_DIRECTION</span>
                    <span className="font-mono text-[10px] text-[#cac6bc] bg-[#2b2a29] px-2 py-0.5 rounded border border-[#363433]">PALETTE</span>
                  </div>
                  <div className="h-28 rounded-lg bg-gradient-to-br from-[#201f1e] via-[#1c1b1a] to-[#141312] border border-[#2b2a29] flex flex-col items-center justify-center gap-2 group-hover:border-[#48473f] transition-colors relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(#363433_1px,transparent_1px)] [background-size:12px_12px] opacity-40" />
                    <GitBranch className="w-8 h-8 text-[#e6e2df] relative z-10 group-hover:scale-110 transition-transform duration-300" />
                    <span className="font-mono text-xs text-[#e6e2df] relative z-10 font-medium">
                      Game Vision & Narrative Mapped
                    </span>
                  </div>
                </div>

                {/* Floating Overlay Badge: AI Match */}
                <div className="absolute -bottom-5 -left-5 bg-[#201f1e] border-t border-l border-[#e6e2df]/30 border-r border-b border-[#363433] p-3.5 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce-subtle z-20">
                  <div className="w-8 h-8 rounded-lg bg-[#2A2724] border border-[#48473f] flex items-center justify-center text-[#e6e2df]">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <div className="text-xs font-mono font-semibold text-[#e6e2df]">AI Talent Match Found</div>
                    <div className="text-[11px] font-mono text-[#8c887e]">3D Environment Artist • Godot / Unity</div>
                  </div>
                </div>

                {/* Floating Overlay Badge: Analytics */}
                <div className="absolute -top-6 -right-4 bg-[#201f1e] border-t border-l border-[#e6e2df]/30 border-r border-b border-[#363433] p-3 rounded-xl shadow-2xl flex items-center gap-2 z-20">
                  <GitBranch className="w-4 h-4 text-emerald-400" />
                  <span className="font-mono text-xs text-[#e6e2df] font-medium">Git Synchronized</span>
                </div>

              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
