import React from 'react';
import { Link } from 'react-router-dom';
import {
  FolderKanban,
  Users,
  Briefcase,
  ArrowUpRight,
  User,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import type { DashboardProjectItem } from '../types';

interface DiscoverProjectCardProps {
  project: DashboardProjectItem;
}

function formatStatus(status: string): string {
  switch (status) {
    case 'PLANNING':
      return 'Planning';
    case 'PRE_PRODUCTION':
      return 'Pre-Production';
    case 'PROTOTYPE':
      return 'Prototype';
    case 'IN_DEVELOPMENT':
      return 'In Development';
    case 'ALPHA':
      return 'Alpha';
    case 'BETA':
      return 'Beta';
    case 'COMPLETED':
      return 'Completed';
    case 'PAUSED':
      return 'Paused';
    default:
      return status;
  }
}

export const DiscoverProjectCard: React.FC<DiscoverProjectCardProps> = ({
  project,
}) => {
  const targetId = project.slug || project.id;
  const founder = project.founder;
  const openRoleCount = project.openRoleCount ?? (project.openRoles?.length ?? 0);
  const openRoles = project.openRoles || [];

  return (
    <Link
      to={`/projects/${targetId}`}
      className="group block h-full focus:outline-none"
    >
      <Card
        className="h-full border border-[#2b2a29] bg-[#1c1b1a] p-0 overflow-hidden transition-all duration-300 hover:border-[#48473f] hover:shadow-2xl hover:shadow-black/60 flex flex-col justify-between"
        glow
      >
        <div>
          {/* Cover Media */}
          <div className="relative aspect-video w-full overflow-hidden bg-[#141312] border-b border-[#2b2a29]">
            {project.coverUrl ? (
              <img
                src={project.coverUrl}
                alt={project.name}
                className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#201f1e] via-[#141312] to-[#0f0e0d]">
                <FolderKanban className="h-12 w-12 text-[#363433]" />
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-[#141312] via-transparent to-transparent opacity-60" />

            {/* Status Indicator */}
            <div className="absolute top-3 left-3 rounded-full border border-[#48473f] bg-[#141312]/85 backdrop-blur-md px-3 py-0.5 text-[10px] font-mono text-[#e6e2df]">
              ● {formatStatus(project.status)}
            </div>

            {/* Open Roles Badge (Recruiting indicator) */}
            {openRoleCount > 0 && (
              <div className="absolute top-3 right-3 rounded-full border border-amber-500/40 bg-amber-950/80 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-mono text-amber-300 flex items-center gap-1 shadow-lg">
                <Briefcase className="h-3 w-3 text-amber-400" />
                <span>
                  {openRoleCount} Open {openRoleCount === 1 ? 'Role' : 'Roles'}
                </span>
              </div>
            )}
          </div>

          {/* Body Content */}
          <div className="p-5 space-y-3">
            <div>
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-headline text-lg font-bold text-[#ffffff] group-hover:text-amber-200 transition-colors line-clamp-1">
                  {project.name}
                </h3>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-[#8c887e] group-hover:text-amber-300 transition-colors mt-1" />
              </div>
              <p className="mt-1 text-xs text-[#cac6bc] line-clamp-2 leading-relaxed">
                {project.description || 'No project description provided.'}
              </p>
            </div>

            {/* Metadata Tags */}
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono text-[#cac6bc] pt-1">
              {project.genre && (
                <span className="rounded-lg border border-[#2b2a29] bg-[#141312] px-2 py-0.5 text-[#e6e2df]">
                  {project.genre}
                </span>
              )}
              {project.platform && (
                <span className="rounded-lg border border-[#2b2a29] bg-[#141312] px-2 py-0.5 text-[#cac6bc]">
                  {project.platform}
                </span>
              )}
              {project.gameEngine && (
                <span className="rounded-lg border border-[#2b2a29] bg-[#141312] px-2 py-0.5 text-[#8c887e]">
                  {project.gameEngine}
                </span>
              )}
            </div>

            {/* Open Roles Preview Chips */}
            {openRoles.length > 0 && (
              <div className="pt-2 border-t border-[#2b2a29]/60">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#8c887e] block mb-1.5">
                  Recruiting:
                </span>
                <div className="flex flex-wrap gap-1">
                  {openRoles.slice(0, 2).map((role) => (
                    <span
                      key={role.id}
                      className="rounded-md border border-[#363433] bg-[#201f1e] px-2 py-0.5 text-[10px] font-mono text-amber-200/90 truncate max-w-[200px]"
                    >
                      {role.title || role.roleName}
                    </span>
                  ))}
                  {openRoles.length > 2 && (
                    <span className="rounded-md border border-[#363433] bg-[#201f1e] px-1.5 py-0.5 text-[10px] font-mono text-[#8c887e]">
                      +{openRoles.length - 2} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer info: Founder & Team */}
        <div className="border-t border-[#2b2a29] px-5 py-3 text-xs font-mono text-[#8c887e] flex items-center justify-between bg-[#141312]/40">
          <div className="flex items-center gap-2 min-w-0">
            {founder?.avatarUrl ? (
              <img
                src={founder.avatarUrl}
                alt={founder.displayName || founder.username}
                className="h-5 w-5 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="h-5 w-5 rounded-full bg-[#2b2a29] flex items-center justify-center text-[10px] text-[#e6e2df] shrink-0">
                <User className="h-3 w-3 text-[#8c887e]" />
              </div>
            )}
            <span className="truncate text-[11px] text-[#cac6bc]">
              {founder?.displayName || (founder?.username ? `@${founder.username}` : 'Studio Founder')}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0 text-[#8c887e] text-[11px]">
            <Users className="h-3.5 w-3.5" />
            <span>
              {project.memberCount} {project.memberCount === 1 ? 'dev' : 'devs'}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
};
