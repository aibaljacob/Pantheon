import React, { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Plus, Trash2, Edit2, ChevronDown, ChevronUp } from 'lucide-react';
import type { ExperienceItem } from '../types';

interface ExperienceSectionProps {
  experiences: ExperienceItem[];
  isOwner: boolean;
  onAddExperience?: () => void;
  onEditExperience?: (exp: ExperienceItem) => void;
  onDeleteExperience?: (id: string) => void;
}

export const ExperienceSection: React.FC<ExperienceSectionProps> = ({
  experiences,
  isOwner,
  onAddExperience,
  onEditExperience,
  onDeleteExperience,
}) => {
  const [expandedIds, setExpandedIds] = useState<{ [key: string]: boolean }>({});

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between border-b border-[#2b2a29] pb-3">
        <h2 className="font-headline text-xs font-mono uppercase tracking-[0.2em] text-[#8c887e]">
          Experience Timeline
        </h2>
        {isOwner && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onAddExperience}
            icon={<Plus className="h-3.5 w-3.5" />}
            iconPosition="left"
          >
            Add Experience
          </Button>
        )}
      </div>

      {experiences.length === 0 ? (
        <p className="text-xs font-mono text-[#8c887e]">No work experience added yet.</p>
      ) : (
        <div className="relative space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1px] before:bg-[#2b2a29]">
          {experiences.map((exp) => {
            const isExpanded = Boolean(expandedIds[exp.id]);
            const topTech = exp.technologies ? exp.technologies.slice(0, 2).join(' · ') : '';
            const remainingTechCount = exp.technologies && exp.technologies.length > 2 ? exp.technologies.length - 2 : 0;

            return (
              <div key={exp.id} className="group relative flex items-start gap-4 pl-6">
                {/* Timeline node */}
                <div className="absolute left-[3px] top-1.5 h-2.5 w-2.5 rounded-full border border-[#1c1b1a] bg-[#48473f] group-hover:bg-[#e6e2df] transition-colors" />

                <div className="flex-1 space-y-1.5 rounded-xl border border-[#2b2a29]/60 bg-[#1c1b1a]/40 p-4 transition-colors hover:border-[#363433]">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <div>
                      <h3 className="font-headline text-sm font-bold text-[#ffffff]">
                        {exp.position}
                      </h3>
                      <p className="text-xs text-[#cac6bc] font-mono">
                        {exp.company} {exp.location ? `· ${exp.location}` : ''}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono text-[#8c887e]">
                      <span>
                        {exp.startDate} — {exp.isCurrent ? 'Present' : exp.endDate}
                      </span>
                      {exp.isCurrent && <Badge variant="accent">Present</Badge>}
                      {isOwner && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                          {onEditExperience && (
                            <button
                              type="button"
                              onClick={() => onEditExperience(exp)}
                              className="p-1 text-[#8c887e] hover:text-[#e6e2df]"
                              title="Edit experience"
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>
                          )}
                          {onDeleteExperience && (
                            <button
                              type="button"
                              onClick={() => onDeleteExperience(exp.id)}
                              className="p-1 text-[#8c887e] hover:text-red-400"
                              title="Delete experience"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Summary Description */}
                  <p className={`text-xs text-[#cac6bc] leading-relaxed font-sans ${isExpanded ? '' : 'line-clamp-2'}`}>
                    {exp.description}
                  </p>

                  {/* Compact Tech Summary & Expand toggle */}
                  <div className="flex items-center justify-between pt-1 text-xs font-mono">
                    {topTech && (
                      <span className="text-[#8c887e]">
                        {topTech} {remainingTechCount > 0 && `(+${remainingTechCount} more)`}
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => toggleExpand(exp.id)}
                      className="ml-auto inline-flex items-center gap-1 text-[11px] text-[#8c887e] hover:text-[#e6e2df] transition-colors"
                    >
                      <span>{isExpanded ? 'Collapse' : 'View details'}</span>
                      {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </button>
                  </div>

                  {/* Expanded Full Technologies List */}
                  {isExpanded && exp.technologies && exp.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-2 border-t border-[#2b2a29]">
                      {exp.technologies.map((tech, i) => (
                        <span
                          key={i}
                          className="rounded bg-[#141312] border border-[#2b2a29] px-2 py-0.5 font-mono text-[10px] text-[#e6e2df]"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
