import React from 'react';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { Quote, Star, ShieldCheck } from 'lucide-react';

interface Testimonial {
  quote: string;
  author: string;
  role: string;
  studio: string;
  engine: string;
  metric: string;
  avatarInitials: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote: "Pantheon reduced our asset iteration cycle by 65%. We shipped our Unreal 5 demo 3 weeks ahead of schedule with complete confidence.",
    author: "Elena Rostova",
    role: "Executive Producer",
    studio: "Aetheria Interactive",
    engine: "UNREAL 5.5",
    metric: "3 WEEKS AHEAD OF SCHEDULE",
    avatarInitials: "ER",
  },
  {
    quote: "The AI talent matching connected us with an expert graphics programmer in 48 hours. This platform is a game-changer for indie studios.",
    author: "Marcus Vance",
    role: "Technical Director",
    studio: "Obsidian Realm",
    engine: "CUSTOM C++",
    metric: "48hr MATCH TIME",
    avatarInitials: "MV",
  },
  {
    quote: "Finally a production suite built specifically for game dev pipelines, not web app task trackers. Asset LFS sync alone is worth everything.",
    author: "Sora Takahashi",
    role: "Studio Founder & Lead Dev",
    studio: "VoxelForge Studios",
    engine: "UNITY 6",
    metric: "65% FASTER ASSET SYNC",
    avatarInitials: "ST",
  },
];

export const Testimonials: React.FC = () => {
  return (
    <section className="py-24 bg-[#1c1b1a]/40 border-y border-[#2b2a29] relative overflow-hidden">
      {/* Volumetric Section Backdrop Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[500px] section-volumetric-glow rounded-full blur-3xl pointer-events-none opacity-85" />

      <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-20 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <Badge variant="accent" className="border-t-[#e6e2df]/40 border-l-[#939188]/30 border-r-[#363433] border-b-[#2b2a29]">
            STUDIO VERDICT
          </Badge>

          <h2 className="font-headline font-extrabold text-3xl sm:text-4xl lg:text-5xl text-[#ffffff] tracking-tight">
            Loved by Developers & Creators.
          </h2>

          <p className="font-sans text-base sm:text-lg text-[#cac6bc] leading-relaxed">
            See how top indie studios and AAA veterans use Pantheon to streamline game releases.
          </p>
        </div>

        {/* 3 Testimonial Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((item, idx) => (
            <Card key={idx} className="flex flex-col justify-between h-full bg-[#141312]">
              <div className="space-y-6">
                
                {/* Header Quote Icon & Engine Badge */}
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[#201f1e] border-t border-l border-[#48473f]/40 border-r border-b border-[#2b2a29] flex items-center justify-center text-[#e6e2df] shadow-inner">
                    <Quote className="w-5 h-5 text-[#cac6bc]" />
                  </div>
                  <Badge variant="bronze" className="text-[10px] font-mono border-t-[#e6e2df]/20">
                    {item.engine}
                  </Badge>
                </div>

                {/* Rating Stars */}
                <div className="flex items-center gap-1 text-[#e6e2df]">
                  {[...Array(5)].map((_, sIdx) => (
                    <Star key={sIdx} className="w-4 h-4 fill-current text-[#e6e2df]" />
                  ))}
                </div>

                {/* Quote Text */}
                <p className="font-sans text-base text-[#cac6bc] leading-relaxed italic">
                  "{item.quote}"
                </p>

              </div>

              {/* Author Info */}
              <div className="pt-6 mt-6 border-t border-[#2b2a29] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#2b2a29] border border-[#48473f] flex items-center justify-center font-mono font-bold text-xs text-[#e6e2df] shadow-sm">
                    {item.avatarInitials}
                  </div>
                  <div>
                    <div className="font-headline font-bold text-sm text-[#ffffff] flex items-center gap-1.5">
                      <span>{item.author}</span>
                      <ShieldCheck className="w-3.5 h-3.5 text-[#e6e2df]" />
                    </div>
                    <div className="font-mono text-xs text-[#8c887e]">
                      {item.role} @ {item.studio}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

      </div>
    </section>
  );
};
