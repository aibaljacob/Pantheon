import React from 'react';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { Sparkles, Kanban, Compass, Users, FolderTree, BarChart3, ArrowUpRight } from 'lucide-react';

interface FeatureItem {
  icon: React.ReactNode;
  title: string;
  tag: string;
  description: string;
  highlights: string[];
}

const FEATURES: FeatureItem[] = [
  {
    icon: <Sparkles className="w-6 h-6 text-[#e6e2df]" />,
    title: 'AI Talent Matching',
    tag: 'NEURAL RECRUITMENT',
    description: 'Instantly match specialized game developers, 3D riggers, shader programmers, and audio engineers based on project stack and engine requirements.',
    highlights: ['Unreal & Unity Skill Graphs', 'Real-time Availability', 'Portfolio Verification'],
  },
  {
    icon: <Kanban className="w-6 h-6 text-[#e6e2df]" />,
    title: 'Project Management',
    tag: 'GAME SPRINT ENGINE',
    description: 'Engineered milestone tracking built explicitly for game production pipelines—from vertical slice preparation to final gold master submission.',
    highlights: ['Gantt & Kanban Views', 'Engine Commit Linking', 'Milestone Gates'],
  },
  {
    icon: <Compass className="w-6 h-6 text-[#e6e2df]" />,
    title: 'Portfolio Discovery',
    tag: 'CREATOR NETWORK',
    description: 'Showcase interactive 3D model viewports, GLTF renders, shader clips, and technical design documents to potential studio leads.',
    highlights: ['3D WebGL Viewport', 'Shader Graph Demos', 'Verified Credentials'],
  },
  {
    icon: <Users className="w-6 h-6 text-[#e6e2df]" />,
    title: 'Team Collaboration',
    tag: 'STUDIO HUB',
    description: 'Real-time voice, text, asset review, and playtest feedback channels integrated seamlessly into desktop & mobile environments.',
    highlights: ['Playtest Video Markers', 'Voice Channels', 'Live Screen Draw'],
  },
  {
    icon: <FolderTree className="w-6 h-6 text-[#e6e2df]" />,
    title: 'Asset Organization',
    tag: '3D/2D REPOSITORY',
    description: 'Centralized cloud repository supporting massive FBX, OBJ, BLEND, and EXR textures with version control and LOD auto-generation.',
    highlights: ['LOD Decimation', 'Git LFS Integration', 'Metadata Tagging'],
  },
  {
    icon: <BarChart3 className="w-6 h-6 text-[#e6e2df]" />,
    title: 'Production Analytics',
    tag: 'PERFORMANCE DATA',
    description: 'Track frame budget allocations, memory footprints, build compilation times, and sprint velocity with automated telemetry dashboards.',
    highlights: ['FPS Budget Telemetry', 'Build Health Score', 'Resource Allocation'],
  },
];

export const Features: React.FC = () => {
  return (
    <section id="features" className="py-24 relative overflow-hidden bg-[#141312]">
      {/* Background Subtle Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#2b2a2915_1px,transparent_1px),linear-gradient(to_bottom,#2b2a2915_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-20 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <Badge variant="accent" className="border-[#48473f]">
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
            <Card key={idx} className="group hover:border-[#48473f] flex flex-col justify-between h-full">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-xl bg-[#201f1e] border border-[#363433] group-hover:border-[#48473f] transition-colors">
                    {feature.icon}
                  </div>
                  <Badge variant="bronze" className="text-[10px] tracking-widest font-mono">
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
