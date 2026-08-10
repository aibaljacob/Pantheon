import React from 'react';
import { Layers, FolderKanban, CheckSquare, Sparkles, CheckCircle2 } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';

export const ModuleRoadmapSection: React.FC = () => {
  const modules = [
    {
      title: 'Authentication & Identity',
      description: 'Local & Google OAuth login, JWT refresh tokens, email verification, password reset.',
      status: 'Active',
      prismaModel: 'User, UserProfile, AuthSession',
      icon: CheckCircle2,
      active: true,
    },
    {
      title: 'Canonical Developer Profiles',
      description: 'Public professional identity, experience timeline, game engines, portfolio showcase, and CV.',
      status: 'Active',
      prismaModel: 'UserProfile',
      icon: CheckCircle2,
      active: true,
    },
    {
      title: 'Project Management & Recruitment',
      description: 'Game project creation, studio roles, talent discovery, role applications, team building.',
      status: 'Semester 1 Phase 2',
      prismaModel: 'Project, ProjectMember (Upcoming)',
      icon: FolderKanban,
      active: false,
    },
    {
      title: 'Task Tracking & Boards',
      description: 'Sprint planning, task assignments, milestone tracking, and task status updates.',
      status: 'Semester 1 Phase 2',
      prismaModel: 'Task (Upcoming)',
      icon: CheckSquare,
      active: false,
    },
    {
      title: 'AI Insights & Health Analysis',
      description: 'Production risk prediction, skill extraction from resumes, role recommendations.',
      status: 'Semester 2 Phase 1',
      prismaModel: 'AIInsight, ActivityLog (Upcoming)',
      icon: Sparkles,
      active: false,
    },
    {
      title: 'Asset Management Pipeline',
      description: '3D assets, concept art, audio tracks, and document version control.',
      status: 'Semester 2 Phase 2',
      prismaModel: 'Asset (Upcoming)',
      icon: Layers,
      active: false,
    },
  ];

  return (
    <div className="rounded-3xl border border-[#363433] bg-[#1c1b1a] p-6 sm:p-8 space-y-6 shadow-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#2b2a29] pb-4">
        <div>
          <h2 className="font-headline text-lg font-bold text-[#ffffff]">
            Platform Production Modules & Architecture Status
          </h2>
          <p className="text-xs text-[#8c887e]">
            Pantheon Monorepo Semester Roadmap vs Active Prisma Database Schemas
          </p>
        </div>
        <Badge variant="accent" className="self-start sm:self-auto font-mono text-[10px]">
          Semester 1 Phase 1
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules.map((mod, idx) => {
          const Icon = mod.icon;

          return (
            <div
              key={idx}
              className={`rounded-2xl border p-4 space-y-3 transition-all ${
                mod.active
                  ? 'border-emerald-500/40 bg-[#141312] shadow-lg'
                  : 'border-[#2b2a29] bg-[#141312]/40 opacity-75'
              }`}
            >
              <div className="flex items-center justify-between">
                <div
                  className={`rounded-xl p-2.5 ${
                    mod.active ? 'bg-emerald-950/40 text-emerald-400' : 'bg-[#201f1e] text-[#8c887e]'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <Badge variant={mod.active ? 'accent' : 'outline'} className="text-[10px]">
                  {mod.status}
                </Badge>
              </div>

              <div className="space-y-1">
                <h3 className="font-headline text-sm font-bold text-[#ffffff]">
                  {mod.title}
                </h3>
                <p className="text-xs leading-relaxed text-[#cac6bc] font-sans">
                  {mod.description}
                </p>
              </div>

              <div className="border-t border-[#2b2a29] pt-2 text-[10px] font-mono text-[#8c887e]">
                <span>Prisma Schema: </span>
                <span className={mod.active ? 'text-emerald-300 font-semibold' : 'text-[#8c887e]'}>
                  {mod.prismaModel}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
