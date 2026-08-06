import React from 'react';

const STUDIOS = [
  { name: 'AETHERIA', tagline: 'UNREAL 5.5', icon: '◈' },
  { name: 'VOXELFORGE', tagline: 'PROCEDURAL', icon: '❖' },
  { name: 'OBSIDIAN REALM', tagline: 'CUSTOM C++', icon: '⬡' },
  { name: 'NEBULA SOFT', tagline: 'UNITY 6', icon: '✦' },
  { name: 'HYPERION', tagline: 'GODOT 4', icon: '▲' },
  { name: 'PIXELCRAFTERS', tagline: 'RAY TRACING', icon: '⬢' },
];

export const TrustedBy: React.FC = () => {
  return (
    <section className="py-12 border-y border-[#2b2a29] bg-[#1c1b1a]/40 relative overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-20 text-center">
        <p className="font-mono text-xs text-[#8c887e] tracking-widest uppercase mb-8">
          TRUSTED BY LEADING INDIE STUDIOS & NEXT-GEN GAME CREATORS WORLDWIDE
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 items-center">
          {STUDIOS.map((studio, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl border border-[#2b2a29] bg-[#141312]/60 hover:bg-[#201f1e] hover:border-[#48473f] transition-all duration-300 group cursor-pointer flex flex-col items-center justify-center gap-1.5"
            >
              <div className="text-xl text-[#8c887e] group-hover:text-[#e6e2df] transition-colors">
                {studio.icon}
              </div>
              <span className="font-headline font-bold text-sm tracking-wider text-[#cac6bc] group-hover:text-[#ffffff] transition-colors">
                {studio.name}
              </span>
              <span className="font-mono text-[10px] text-[#8c887e] group-hover:text-[#cac6bc]">
                {studio.tagline}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
