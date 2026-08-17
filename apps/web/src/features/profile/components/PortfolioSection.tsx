import React, { useState } from 'react';
import { ExternalLink, Plus, Layers, Edit2, Trash2, Gamepad2, X, Monitor } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
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
  const [selectedProject, setSelectedProject] = useState<PortfolioItem | null>(null);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between border-b border-[#2b2a29] pb-3">
        <div className="flex items-center gap-3">
          <h2 className="font-headline text-xs font-mono uppercase tracking-[0.2em] text-[#8c887e]">
            Portfolio Showcase
          </h2>
          <span className="font-mono text-xs text-[#8c887e]">({portfolio.length})</span>
        </div>

        {isOwner && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onAddProject}
            icon={<Plus className="h-3.5 w-3.5" />}
            iconPosition="left"
          >
            Add Project
          </Button>
        )}
      </div>

      {portfolio.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#363433] p-10 text-center">
          <Layers className="mx-auto h-8 w-8 text-[#8c887e]/50" />
          <p className="mt-2 text-xs font-mono text-[#8c887e]">No portfolio projects added yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {portfolio.map((project) => (
            <div
              key={project.id}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#2b2a29] bg-[#1c1b1a] transition-all duration-300 hover:border-[#48473f]"
            >
              {/* Media Thumbnail Container */}
              <div className="relative h-44 w-full overflow-hidden bg-[#201f1e]">
                {project.coverUrl ? (
                  <img
                    src={project.coverUrl}
                    alt={project.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#2b2a29] to-[#141312]">
                    <Gamepad2 className="h-10 w-10 text-[#8c887e]/40" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#1c1b1a] via-transparent to-black/30" />

                {/* Owner Actions Overlay */}
                {isOwner && (
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-xl border border-[#363433] bg-[#141312]/80 px-2 py-1 backdrop-blur-md">
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

                {/* Title & Role overlay */}
                <div className="absolute bottom-3 left-4 right-4">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#8c887e]">
                    {project.role}
                  </span>
                  <h3 className="font-headline text-base font-bold text-[#ffffff]">
                    {project.title}
                  </h3>
                </div>
              </div>

              {/* Simplified Card Body */}
              <div className="flex flex-1 flex-col justify-between p-5 space-y-4">
                <p className="text-xs text-[#cac6bc] leading-relaxed line-clamp-2 font-sans">
                  {project.description}
                </p>

                {/* Summary Metadata Row */}
                <div className="text-xs font-mono text-[#8c887e] border-t border-[#2b2a29] pt-3">
                  {project.gameEngine} · {project.genre} · {project.platform}
                </div>

                {/* Primary Action Button (Triggers Detail Modal) */}
                <button
                  type="button"
                  onClick={() => setSelectedProject(project)}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-[#363433] bg-[#141312] px-4 py-2.5 text-xs font-mono text-[#e6e2df] transition-all hover:border-[#e6e2df] hover:text-[#ffffff]"
                >
                  <span>View Project</span>
                  <ExternalLink className="h-3.5 w-3.5 text-[#8c887e]" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Complete Project Detail Modal (Progressive Disclosure) */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 sm:p-6 overflow-y-auto">
          <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border border-[#363433] bg-[#1c1b1a] shadow-2xl overflow-hidden animate-fadeIn">
            {/* Thumbnail Header */}
            <div className="relative h-56 w-full overflow-hidden bg-[#201f1e]">
              {selectedProject.coverUrl ? (
                <img
                  src={selectedProject.coverUrl}
                  alt={selectedProject.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[#2b2a29]">
                  <Gamepad2 className="h-16 w-16 text-[#8c887e]/40" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#1c1b1a] via-transparent to-black/40" />

              <button
                type="button"
                onClick={() => setSelectedProject(null)}
                className="absolute top-4 right-4 rounded-xl border border-[#363433] bg-[#141312]/80 p-2 text-[#e6e2df] hover:text-[#ffffff] backdrop-blur-md"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="absolute bottom-4 left-6 right-6">
                <span className="rounded-md bg-[#2b2a29] px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-[#e6e2df]">
                  {selectedProject.status}
                </span>
                <h3 className="mt-1.5 font-headline text-2xl font-bold text-[#ffffff]">
                  {selectedProject.title}
                </h3>
                <p className="font-mono text-xs text-[#cac6bc]">{selectedProject.role}</p>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              <div>
                <h4 className="font-mono text-[10px] uppercase tracking-wider text-[#8c887e] mb-1">
                  Description
                </h4>
                <p className="text-sm leading-relaxed text-[#e6e2df] font-sans">
                  {selectedProject.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-[#2b2a29] pt-4">
                <div>
                  <span className="font-mono text-[#8c887e]">Game Engine:</span>
                  <p className="font-mono text-sm text-[#ffffff] font-semibold">{selectedProject.gameEngine}</p>
                </div>
                <div>
                  <span className="font-mono text-[#8c887e]">Genre & Platform:</span>
                  <p className="font-mono text-sm text-[#ffffff] font-semibold">
                    {selectedProject.genre} ({selectedProject.platform})
                  </p>
                </div>
              </div>

              {selectedProject.technologies && selectedProject.technologies.length > 0 && (
                <div className="border-t border-[#2b2a29] pt-4 space-y-2">
                  <h4 className="font-mono text-[10px] uppercase tracking-wider text-[#8c887e]">
                    Technologies Used
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedProject.technologies.map((tech, idx) => (
                      <span
                        key={idx}
                        className="rounded-lg border border-[#363433] bg-[#141312] px-3 py-1 font-mono text-xs text-[#e6e2df]"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedProject.tools && selectedProject.tools.length > 0 && (
                <div className="border-t border-[#2b2a29] pt-4 space-y-2">
                  <h4 className="font-mono text-[10px] uppercase tracking-wider text-[#8c887e]">
                    Tools Used
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedProject.tools.map((tool, idx) => (
                      <span
                        key={idx}
                        className="rounded-lg border border-[#363433] bg-[#141312] px-3 py-1 font-mono text-xs text-[#e6e2df]"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedProject.projectUrl && (
                <div className="border-t border-[#2b2a29] pt-5">
                  <a
                    href={selectedProject.projectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#48473f] bg-[#201f1e] py-3 font-mono text-xs font-semibold text-[#ffffff] hover:border-[#e6e2df] transition-colors"
                  >
                    <Monitor className="h-4 w-4" />
                    <span>Open External Repository / Demo</span>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
