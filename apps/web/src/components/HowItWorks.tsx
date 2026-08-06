import React, { useState } from 'react';
import { Badge } from './ui/Badge';
import { UserCheck, Rocket, Zap, CheckCircle } from 'lucide-react';

interface Step {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  description: string;
  details: string[];
  codeSnippet: string;
}

const STEPS: Step[] = [
  {
    id: 'step-1',
    number: '01',
    title: 'Create Your Profile',
    subtitle: 'VERIFY CREDENTIALS & ENGINE STACK',
    icon: <UserCheck className="w-6 h-6 text-[#e6e2df]" />,
    description: 'Set up your developer or studio persona. Connect your GitHub, Unreal Marketplace, or ArtStation portfolios to establish verified skill scores.',
    details: [
      'Engine & Language Tagging (C++, C#, Rust, Blueprints)',
      'Verified Work History & Credits',
      'AI Talent Indexing for Studio Recruiters',
    ],
    codeSnippet: `// Profile Manifest Init
const devProfile = await Pantheon.initProfile({
  engine: "Unreal 5.5",
  specialization: "Graphics Programmer & Shader Dev",
  verifiedPortfolios: ["GitHub", "ArtStation"],
});`,
  },
  {
    id: 'step-2',
    number: '02',
    title: 'Build or Join Projects',
    subtitle: 'ORCHESTRATE TEAMS & REPOSITORIES',
    icon: <Rocket className="w-6 h-6 text-[#e6e2df]" />,
    description: 'Launch a new game repository or join an existing production suite. Configure sprint milestones, frame budgets, and asset repositories in seconds.',
    details: [
      'Git LFS & Perforce Sync Options',
      'Automated Milestone Generation',
      'Role-Based Permission Matrix',
    ],
    codeSnippet: `// Project Suite Pipeline
const gameProject = await Pantheon.createProject({
  name: "Project Ethereal",
  targetFPS: 60,
  assetStorage: "Git LFS + Cloud Vault",
});`,
  },
  {
    id: 'step-3',
    number: '03',
    title: 'Collaborate Efficiently',
    subtitle: 'SHIP FASTER WITH REAL-TIME TELEMETRY',
    icon: <Zap className="w-6 h-6 text-[#e6e2df]" />,
    description: 'Review 3D assets in-browser, track live engine performance metrics, and push verified builds to internal playtesters with zero manual overhead.',
    details: [
      'In-Browser 3D Shader Renders',
      'Automated Telemetry & Crash Reporting',
      'One-Click Alpha/Beta Builds',
    ],
    codeSnippet: `// Live Build Verification
Pantheon.onBuildPushed(async (build) => {
  await build.verifyShaders();
  await build.notifyPlaytesters({ channel: "#alpha-testing" });
});`,
  },
];

export const HowItWorks: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section id="how-it-works" className="py-24 bg-[#1c1b1a]/50 border-y border-[#2b2a29] relative overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-20 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <Badge variant="accent" className="border-[#48473f]">
            PRODUCTION WORKFLOW
          </Badge>

          <h2 className="font-headline font-extrabold text-3xl sm:text-4xl lg:text-5xl text-[#ffffff] tracking-tight">
            How Pantheon Works.
          </h2>

          <p className="font-sans text-base sm:text-lg text-[#cac6bc] leading-relaxed">
            Three simple steps to transform your game development cycle from fragmented tools to an engineered production machine.
          </p>
        </div>

        {/* 3 Step Timeline Display */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Left Side: Step Selectors */}
          <div className="lg:col-span-5 space-y-4">
            {STEPS.map((step, index) => {
              const isActive = activeStep === index;
              return (
                <div
                  key={step.id}
                  onClick={() => setActiveStep(index)}
                  className={`p-6 rounded-2xl border transition-all duration-300 cursor-pointer ${
                    isActive
                      ? 'bg-[#201f1e] border-[#48473f] shadow-xl'
                      : 'bg-[#141312]/60 border-[#2b2a29] hover:border-[#363433]'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold text-sm transition-colors ${
                        isActive
                          ? 'bg-[#e6e2df] text-[#141312]'
                          : 'bg-[#2b2a29] text-[#cac6bc]'
                      }`}
                    >
                      {step.number}
                    </div>

                    <div className="space-y-1 flex-1">
                      <span className="font-mono text-[10px] text-[#8c887e] uppercase tracking-wider block">
                        {step.subtitle}
                      </span>
                      <h3 className={`font-headline font-bold text-lg ${isActive ? 'text-[#ffffff]' : 'text-[#cac6bc]'}`}>
                        {step.title}
                      </h3>
                      <p className="font-sans text-xs text-[#8c887e] line-clamp-2 pt-1">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Side: Active Step Deep Dive & Code Simulation */}
          <div className="lg:col-span-7">
            <div className="filmic-card rounded-2xl p-8 border border-[#363433] bg-[#141312] space-y-6">
              
              {/* Header Badge */}
              <div className="flex items-center justify-between pb-4 border-b border-[#2b2a29]">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-[#201f1e] border border-[#363433]">
                    {STEPS[activeStep].icon}
                  </div>
                  <div>
                    <span className="font-mono text-xs text-[#8c887e]">STEP {STEPS[activeStep].number} IN DETAIL</span>
                    <h4 className="font-headline font-bold text-xl text-[#ffffff]">
                      {STEPS[activeStep].title}
                    </h4>
                  </div>
                </div>
                <Badge variant="outline" className="font-mono text-xs">
                  PHASE {activeStep + 1} OF 3
                </Badge>
              </div>

              {/* Description */}
              <p className="font-sans text-base text-[#cac6bc] leading-relaxed">
                {STEPS[activeStep].description}
              </p>

              {/* Key Deliverables Bullet Points */}
              <div className="space-y-3 pt-2">
                <span className="font-mono text-xs text-[#e6e2df] uppercase tracking-wider block">
                  Key Capabilities:
                </span>
                {STEPS[activeStep].details.map((detail, dIdx) => (
                  <div key={dIdx} className="flex items-center gap-3 text-sm font-sans text-[#e6e2df]">
                    <CheckCircle className="w-4 h-4 text-[#e6e2df] shrink-0" />
                    <span>{detail}</span>
                  </div>
                ))}
              </div>

              {/* Code Snippet Box */}
              <div className="pt-4">
                <div className="flex items-center justify-between px-4 py-2 bg-[#1c1b1a] border-t border-x border-[#2b2a29] rounded-t-xl text-xs font-mono text-[#8c887e]">
                  <span>PANTHEON_CLI // SCRIPT</span>
                  <span>TYPESCRIPT</span>
                </div>
                <pre className="p-4 bg-[#0f0e0d] border border-[#2b2a29] rounded-b-xl overflow-x-auto text-xs font-mono text-[#cac6bc] leading-relaxed">
                  <code>{STEPS[activeStep].codeSnippet}</code>
                </pre>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
