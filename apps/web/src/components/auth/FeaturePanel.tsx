import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Sparkles, Users, Kanban, ArrowLeft } from 'lucide-react';
import { Badge } from '../ui/Badge';

export const FeaturePanel: React.FC = () => {
  return (
    <div className="relative w-full h-full min-h-[640px] bg-[#141312] border-r border-[#2b2a29] p-10 lg:p-14 flex flex-col justify-between overflow-hidden">
      {/* Abstract Glowing Background Geometry */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(72,71,63,0.25)_0%,rgba(20,19,18,0)_70%)] blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#2b2a2912_1px,transparent_1px),linear-gradient(to_bottom,#2b2a2912_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Top Header: Logo & Return Link */}
      <div className="relative z-10 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-[#939188] rounded-lg"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-b from-[#363433] to-[#1c1b1a] border border-[#48473f] flex items-center justify-center shadow-lg group-hover:border-[#939188] transition-colors">
            <ShieldCheck className="w-5 h-5 text-[#e6e2df]" />
          </div>
          <div className="flex flex-col">
            <span className="font-headline font-bold text-lg tracking-widest text-[#e6e2df] uppercase">
              PANTHEON
            </span>
            <span className="font-mono text-[9px] text-[#8c887e] tracking-wider uppercase -mt-1">
              ENGINEERED SAAS
            </span>
          </div>
        </Link>

        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-mono text-[#cac6bc] hover:text-[#e6e2df] hover:bg-[#201f1e] px-3 py-1.5 rounded-lg border border-transparent hover:border-[#363433] transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>
      </div>

      {/* Center Hero Copy & Mission */}
      <div className="relative z-10 my-auto space-y-6 max-w-lg">
        <Badge variant="accent" className="border-[#48473f]">
          <Sparkles className="w-3.5 h-3.5 text-[#e6e2df]" />
          CREATOR SUITE
        </Badge>

        <h1 className="font-headline font-extrabold text-4xl lg:text-5xl text-[#ffffff] tracking-tight leading-[1.15]">
          One Platform. <br />
          <span className="bg-gradient-to-r from-[#ffffff] via-[#e6e2df] to-[#939188] bg-clip-text text-transparent">
            Infinite Possibilities.
          </span>
        </h1>

        <p className="font-sans text-base text-[#cac6bc] leading-relaxed">
          Pantheon accelerates game production by unifying AI talent matching, high-performance asset management, and live engine telemetry into a single engineered workspace.
        </p>

        {/* 3 Core Feature Highlights */}
        <div className="space-y-4 pt-4">
          <div className="flex items-start gap-4 p-3.5 rounded-xl border border-[#2b2a29] bg-[#1c1b1a]/60 hover:border-[#48473f] transition-all">
            <div className="p-2.5 rounded-lg bg-[#201f1e] border border-[#363433] text-[#e6e2df] shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-headline font-bold text-sm text-[#ffffff]">AI Talent Matching</h4>
              <p className="font-sans text-xs text-[#8c887e] mt-0.5">
                Connect with verified Unreal, Unity, and C++ specialists tailored to your stack.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-3.5 rounded-xl border border-[#2b2a29] bg-[#1c1b1a]/60 hover:border-[#48473f] transition-all">
            <div className="p-2.5 rounded-lg bg-[#201f1e] border border-[#363433] text-[#e6e2df] shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-headline font-bold text-sm text-[#ffffff]">Project Collaboration</h4>
              <p className="font-sans text-xs text-[#8c887e] mt-0.5">
                Real-time 3D asset reviews, in-browser shader previews, and instant playtest channels.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-3.5 rounded-xl border border-[#2b2a29] bg-[#1c1b1a]/60 hover:border-[#48473f] transition-all">
            <div className="p-2.5 rounded-lg bg-[#201f1e] border border-[#363433] text-[#e6e2df] shrink-0">
              <Kanban className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-headline font-bold text-sm text-[#ffffff]">Production Management</h4>
              <p className="font-sans text-xs text-[#8c887e] mt-0.5">
                Automated sprint gates, frame budget telemetry, and live Git LFS repository sync.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer Note */}
      <div className="relative z-10 pt-6 border-t border-[#2b2a29] flex items-center justify-between text-xs font-mono text-[#8c887e]">
        <span>ENGINEERED FOR GAME CREATORS</span>
        <span>v1.0.0</span>
      </div>
    </div>
  );
};
