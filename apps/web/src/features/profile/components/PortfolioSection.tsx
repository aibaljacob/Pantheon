import React from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { ExternalLink, Plus, Layers, Edit2, Trash2, Code2, Monitor, Gamepad2 } from 'lucide-react';
import type { PortfolioItem } from '../types';

interface PortfolioSectionProps {
  portfolio: PortfolioItem[];
  isOwner: boolean;
  onAddProject?: () => void;
  onEditProject?: (item: PortfolioItem) => void;
  onDeleteProject?: (id: string) => void;
}

export const PortfolioSection: React.FC<PortfolioSectionProps> = ({
  portfolio,
  isOwner,
  onAddProject,
  onEditProject,
  onDeleteProject,
}) => {
  const getStatusVariant = (status: PortfolioItem['status']) => {
    switch (status) {
      case 'Released':
        return 'accent';
      case 'In Development':
        return 'bronze';
      case 'Prototype':
      case 'Alpha':
      case 'Beta':
        return 'outline';
      default:
        return 'default';
    }
  };

  return (
    <Card className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#2b2a29] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-headline text-xl font-bold text-[#ffffff] tracking-wide">
              Portfolio Showcase
            </h2>
            <span className="rounded-full bg-[#2A2724] px-2.5 py-0.5 font-mono text-xs text-[#e6e2df] border border-[#48473f]">
              {portfolio.length} Projects
            </span>
          </div>
          <p className="text-xs text-[#8c887e]">Selected game development projects and interactive work</p>
        </div>

        {isOwner && (
          <Button
            variant="primary"
            size="sm"
            onClick={onAddProject}
            icon={<Plus className="h-4 w-4" />}
            iconPosition="left"
          >
            Add Project
          </Button>
        )}
      </div>

      {portfolio.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#363433] p-12 text-center">
          <Layers className="mx-auto h-10 w-10 text-[#8c887e]/50" />
          <h3 className="mt-3 font-headline text-base font-semibold text-[#e6e2df]">No portfolio projects yet</h3>
          <p className="mt-1 text-xs text-[#8c887e]">Showcase game prototypes, shipped titles, or technical demos.</p>
          {isOwner && (
            <Button variant="secondary" size="sm" onClick={onAddProject} className="mt-4">
              Add First Project
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {portfolio.map((project) => (
            <div
              key={project.id}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#363433] bg-[#141312] transition-all duration-300 hover:border-[#48473f] hover:shadow-2xl"
            >
              {/* Media Thumbnail Container */}
              <div className="relative h-48 w-full overflow-hidden bg-[#201f1e]">
                {project.coverUrl ? (
                  <img
                    src={project.coverUrl}
                    alt={project.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#2b2a29] to-[#141312]">
                    <Gamepad2 className="h-12 w-12 text-[#8c887e]/40" />
                  </div>
                )}
                {/* Gradient Vignette over media */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#141312] via-transparent to-black/30" />

                {/* Top Badges */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                  <Badge variant={getStatusVariant(project.status)}>
                    {project.status}
                  </Badge>

                  {isOwner && (
                    <div className="flex items-center gap-1.5 rounded-xl border border-[#363433] bg-[#141312]/80 px-2 py-1 backdrop-blur-md">
                      {onEditProject && (
                        <button
                          type="button"
                          onClick={() => onEditProject(project)}
                          className="text-[#cac6bc] hover:text-[#ffffff] p-0.5"
                          title="Edit project"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {onDeleteProject && (
                        <button
                          type="button"
                          onClick={() => onDeleteProject(project.id)}
                          className="text-[#cac6bc] hover:text-red-400 p-0.5"
                          title="Delete project"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Title on Thumbnail */}
                <div className="absolute bottom-3 left-3 right-3">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#8c887e]">
                    {project.role}
                  </span>
                  <h3 className="font-headline text-lg font-bold text-[#ffffff] drop-shadow-md">
                    {project.title}
                  </h3>
                </div>
              </div>

              {/* Card Body */}
              <div className="flex flex-1 flex-col justify-between p-5 space-y-4">
                <p className="text-xs sm:text-sm text-[#cac6bc] leading-relaxed line-clamp-3 font-sans">
                  {project.description}
                </p>

                {/* Metadata details */}
                <div className="space-y-2 border-t border-[#2b2a29] pt-3 text-xs">
                  <div className="flex items-center justify-between text-[#8c887e]">
                    <span className="flex items-center gap-1.5">
                      <Code2 className="h-3.5 w-3.5 text-[#e6e2df]" />
                      Engine:
                    </span>
                    <span className="font-mono font-medium text-[#e6e2df]">{project.gameEngine}</span>
                  </div>

                  <div className="flex items-center justify-between text-[#8c887e]">
                    <span className="flex items-center gap-1.5">
                      <Gamepad2 className="h-3.5 w-3.5 text-[#e6e2df]" />
                      Genre & Platform:
                    </span>
                    <span className="font-mono font-medium text-[#e6e2df]">
                      {project.genre} · {project.platform}
                    </span>
                  </div>

                  {project.technologies && project.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {project.technologies.map((tech, idx) => (
                        <span
                          key={idx}
                          className="rounded-md bg-[#201f1e] px-2 py-0.5 font-mono text-[10px] text-[#cac6bc] border border-[#2b2a29]"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* External Resource Action */}
                {project.projectUrl && (
                  <div className="pt-2">
                    <a
                      href={project.projectUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#48473f]/60 bg-[#201f1e] px-4 py-2.5 text-xs font-mono text-[#e6e2df] transition-all hover:border-[#e6e2df] hover:bg-[#2b2a29] hover:text-[#ffffff] group/btn"
                    >
                      <Monitor className="h-3.5 w-3.5 text-[#8c887e] group-hover/btn:text-[#e6e2df]" />
                      <span>View Project Demo / Repo</span>
                      <ExternalLink className="h-3.5 w-3.5 text-[#8c887e] group-hover/btn:text-[#e6e2df]" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
