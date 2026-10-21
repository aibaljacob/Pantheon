import React from 'react';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { Sparkles, Kanban, Compass, Users, GitBranch, Gamepad2, ArrowUpRight } from 'lucide-react';

interface FeatureItem {
  icon: React.ReactNode;
  title: string;
  tag: string;
  description: string;
  highlights: string[];
}

const FEATURES: FeatureItem[] = [
  {
    icon: <Sparkles className="w-6 h-6 text-amber-400" />,
    title: 'AI Talent Matching',
    tag: 'GRAPH RECOMMENDATIONS',
    description: 'Match specialized game developers, 3D artists, narrative writers, and audio engineers using taxonomy-based graph team formation.',
    highlights: ['Engine & Skill Taxonomy', 'Graph Match Scoring', 'Verified Credentials'],
  },
  {
    icon: <Kanban className="w-6 h-6 text-[#e6e2df]" />,
    title: 'Sprint & Task Tracking',
    tag: 'PRODUCTION SPRINT ENGINE',
    description: 'Milestone and task tracking engineered explicitly for game production pipelines—from prototype slices to final release candidates.',
    highlights: ['Kanban Task Workflows', 'Task Dependency Tracking', 'Role Assignments'],
  },
  {
    icon: <Compass className="w-6 h-6 text-[#e6e2df]" />,
    title: 'Game Blueprint & Vision',
    tag: 'CREATIVE DIRECTION',
    description: 'Direct core gameplay loops, narrative quest arcs, art proposals with team voting rounds, and aesthetic palette curation.',
    highlights: ['Art Direction & Voting', 'Narrative Arc Studio', 'Color & Mood Curation'],
  },
  {
    icon: <GitBranch className="w-6 h-6 text-[#e6e2df]" />,
    title: 'Integrated Git & Build Runners',
    tag: 'CI/CD & VERSION CONTROL',
    description: 'Connect project Git repositories, inspect commit history, and execute automated build runners for Godot and multi-engine exports.',
    highlights: ['Commit Stream & Diffs', 'Automated Build Runners', 'Release Artifact Storage'],
  },
  {
    icon: <Gamepad2 className="w-6 h-6 text-[#e6e2df]" />,
    title: 'Playable Builds & Playtesting',
    tag: 'RELEASE & FEEDBACK',
    description: 'Deploy playable WebGL builds directly into the browser, coordinate playtest sessions, and gather structured player feedback.',
    highlights: ['In-Browser WebGL Play', 'Playtest Survey Forms', 'Versioned Release Channels'],
  },
  {
    icon: <Users className="w-6 h-6 text-[#e6e2df]" />,
    title: 'Studio Recruitment & Network',
    tag: 'CREATOR HUB',
    description: 'Discover community studios, post open roles, review developer portfolios, and manage candidate invitations and applications.',
    highlights: ['Project Discovery Hub', 'Candidate Applications', 'Studio Invitations'],
  },
];

export const Features: React.FC = () => {
  return (
    <section id="features" className="py-24 relative overflow-hidden bg-[#141312]">
      {/* Volumetric Section Backdrop Lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[650px] section-volumetric-glow rounded-full blur-3xl pointer-events-none opacity-80" />

      {/* Background Subtle Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#2b2a2915_1px,transparent_1px),linear-gradient(to_bottom,#2b2a2915_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-20 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <Badge variant="accent" className="border-t-[#e6e2df]/40 border-l-[#939188]/30 border-r-[#363433] border-b-[#2b2a29]">
            SYSTEM CAPABILITIES
          </Badge>

          <h2 className="font-headline font-extrabold text-3xl sm:text-4xl lg:text-5xl text-[#ffffff] tracking-tight">
            Engineered for Modern Game Production.
          </h2>

          <p className="font-sans text-base sm:text-lg text-[#cac6bc] leading-relaxed">
            Every feature in Pantheon is designed to remove friction between concept, asset creation, and final engine build execution.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {FEATURES.map((feature, idx) => (
            <Card key={idx} className="group flex flex-col justify-between h-full">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-xl bg-[#201f1e] border-t border-l border-[#48473f]/40 border-r border-b border-[#2b2a29] group-hover:border-[#48473f] transition-colors shadow-inner">
                    {feature.icon}
                  </div>
                  <Badge variant="bronze" className="text-[10px] tracking-widest font-mono border-t-[#e6e2df]/20">
                    {feature.tag}
                  </Badge>
                </div>

                {/* Title */}
                <div className="pt-2">
                  <h3 className="font-headline font-bold text-xl text-[#ffffff] group-hover:text-[#e6e2df] flex items-center justify-between">
                    <span>{feature.title}</span>
                    <ArrowUpRight className="w-4 h-4 text-[#8c887e] opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </h3>
                </div>

                {/* Description */}
                <p className="font-sans text-sm text-[#cac6bc] leading-relaxed">
                  {feature.description}
                </p>
              </div>

              {/* Highlights List */}
              <div className="pt-6 mt-6 border-t border-[#2b2a29] space-y-2">
                {feature.highlights.map((item, hIdx) => (
                  <div key={hIdx} className="flex items-center gap-2 text-xs font-mono text-[#8c887e]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#48473f] group-hover:bg-[#e6e2df] transition-colors" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>

      </div>
    </section>
  );
};
