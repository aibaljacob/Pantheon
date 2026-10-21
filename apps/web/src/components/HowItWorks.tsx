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
    subtitle: 'SPECIALIZATION & ENGINE STACK',
    icon: <UserCheck className="w-6 h-6 text-[#e6e2df]" />,
    description: 'Set up your developer profile. Tag your primary game engine, specialties (programming, 3D art, narrative, sound), and showcase your portfolio projects to studio leads.',
    details: [
      'Engine & Role Taxonomy (Godot, Unreal, Unity, C++, C#)',
      'Showcase Portfolio Projects & Live Demos',
      'AI Talent Indexing & Availability Status',
    ],
    codeSnippet: `// Developer Profile Manifest
const profile = await Pantheon.initProfile({
  primaryEngine: "Godot 4",
  specialization: "Gameplay Programmer & Systems Design",
  skills: ["GDScript", "C#", "Multiplayer Netcode"],
});`,
  },
  {
    id: 'step-2',
    number: '02',
    title: 'Form Studios & Direct Blueprints',
    subtitle: 'RECRUIT TEAMS & MAP GAME VISION',
    icon: <Rocket className="w-6 h-6 text-[#e6e2df]" />,
    description: 'Launch your game studio production. Define open roles for recruiting, match candidate talent, map game blueprints, and vote on art direction proposals.',
    details: [
      'AI Graph Team Matching & Open Roles',
      'Interactive Game Blueprints & Narrative Studio',
      'Art Proposals with Historical Voting Rounds',
    ],
    codeSnippet: `// Game Studio Production & Blueprint
const project = await Pantheon.createProject({
  name: "Ethereal Odyssey",
  genre: "Action RPG",
  engine: "Godot 4",
  openRoles: ["3D Environment Artist", "Audio Lead"],
});`,
  },
  {
    id: 'step-3',
    number: '03',
    title: 'Execute Sprints & Playtest Builds',
    subtitle: 'DELIVER PLAYABLE BUILDS & COLLECT FEEDBACK',
    icon: <Zap className="w-6 h-6 text-[#e6e2df]" />,
    description: 'Track tasks across sprint kanbans, push code to integrated Git repositories, execute automated build runners, and host in-browser playtests.',
    details: [
      'Kanban Task Boards with Role Assignments',
      'Integrated Git Commits & Automated Build Runners',
      'In-Browser WebGL Playtesting & Survey Feedback',
    ],
    codeSnippet: `// Automated Build Runner & Playtest Channel
Pantheon.onBuildPushed(async (build) => {
  await build.runExportRunner({ platform: "WebGL" });
  await build.openPlaytestSession({ title: "Alpha V0.3 Pass" });
});`,
  },
];

export const HowItWorks: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section id="how-it-works" className="py-24 bg-[#1c1b1a]/50 border-y border-[#2b2a29] relative overflow-hidden">
      {/* Volumetric Section Backdrop Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1100px] h-[600px] section-volumetric-glow rounded-full blur-3xl pointer-events-none opacity-80" />

      <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-20 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <Badge variant="accent" className="border-t-[#e6e2df]/40 border-l-[#939188]/30 border-r-[#363433] border-b-[#2b2a29]">
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
                      ? 'bg-[#201f1e] border-t-[#e6e2df]/50 border-l-[#939188]/35 border-r-[#363433] border-b-[#2b2a29] shadow-xl relative overflow-hidden'
                      : 'bg-[#141312]/60 border-[#2b2a29] hover:border-[#363433]'
                  }`}
                >
                  {isActive && (
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#e6e2df]/50 to-transparent pointer-events-none" />
                  )}
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold text-sm transition-colors border ${
                        isActive
                          ? 'bg-[#e6e2df] text-[#141312] border-[#ffffff] shadow-md'
                          : 'bg-[#2b2a29] text-[#cac6bc] border-[#363433]'
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
            <div className="filmic-card rounded-2xl p-8 border border-[#363433] bg-[#141312] space-y-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#e6e2df]/40 to-transparent pointer-events-none" />
              
              {/* Header Badge */}
              <div className="flex items-center justify-between pb-4 border-b border-[#2b2a29] relative z-10">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-[#201f1e] border-t border-l border-[#48473f]/40 border-r border-b border-[#2b2a29] shadow-inner">
                    {STEPS[activeStep].icon}
                  </div>
                  <div>
                    <span className="font-mono text-xs text-[#8c887e]">STEP {STEPS[activeStep].number} IN DETAIL</span>
                    <h4 className="font-headline font-bold text-xl text-[#ffffff]">
                      {STEPS[activeStep].title}
                    </h4>
                  </div>
                </div>
                <Badge variant="outline" className="font-mono text-xs border-t-[#e6e2df]/30">
                  PHASE {activeStep + 1} OF 3
                </Badge>
              </div>

              {/* Description */}
              <p className="font-sans text-base text-[#cac6bc] leading-relaxed relative z-10">
                {STEPS[activeStep].description}
              </p>

              {/* Key Deliverables Bullet Points */}
              <div className="space-y-3 pt-2 relative z-10">
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
              <div className="pt-4 relative z-10">
                <div className="flex items-center justify-between px-4 py-2 bg-[#1c1b1a] border-t border-x border-[#2b2a29] rounded-t-xl text-xs font-mono text-[#8c887e]">
                  <span>PANTHEON_CLI // SCRIPT</span>
                  <span>TYPESCRIPT</span>
                </div>
                <pre className="p-4 bg-[#0f0e0d] border border-[#2b2a29] rounded-b-xl overflow-x-auto text-xs font-mono text-[#cac6bc] leading-relaxed shadow-inner">
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
