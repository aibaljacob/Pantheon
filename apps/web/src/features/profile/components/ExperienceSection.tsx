import React from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Plus, Briefcase, Trash2, Edit2 } from 'lucide-react';
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
  return (
    <Card className="space-y-6">
      <div className="flex items-center justify-between border-b border-[#2b2a29] pb-4">
        <div>
          <h2 className="font-headline text-lg font-bold text-[#ffffff] tracking-wide">
            Experience
          </h2>
          <p className="text-xs text-[#8c887e]">Game dev employment & studio history</p>
        </div>
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
        <div className="rounded-xl border border-dashed border-[#363433] p-8 text-center">
          <Briefcase className="mx-auto h-8 w-8 text-[#8c887e]/60" />
          <p className="mt-2 text-sm text-[#8c887e]">No work experience added yet.</p>
        </div>
      ) : (
        <div className="relative space-y-6 before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-[1px] before:bg-[#2b2a29]">
          {experiences.map((exp) => (
            <div key={exp.id} className="group relative flex items-start gap-4 pl-9">
              {/* Timeline Indicator Node */}
              <div className="absolute left-1.5 top-1.5 h-4 w-4 rounded-full border-2 border-[#1c1b1a] bg-[#48473f] group-hover:border-[#e6e2df] transition-colors" />

              <div className="flex-1 space-y-2 rounded-2xl border border-[#2b2a29] bg-[#141312] p-4 transition-colors group-hover:border-[#363433]">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-headline text-base font-bold text-[#ffffff]">
                      {exp.position}
                    </h3>
                    <p className="text-sm font-medium text-[#cac6bc]">
                      {exp.company} {exp.location ? `· ${exp.location}` : ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-[#8c887e]">
                      {exp.startDate} — {exp.isCurrent ? 'Present' : exp.endDate}
                    </span>
                    {exp.isCurrent && <Badge variant="accent">Present</Badge>}
                    {isOwner && (
                      <div className="ml-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {onEditExperience && (
                          <button
                            type="button"
                            onClick={() => onEditExperience(exp)}
                            className="p-1 text-[#8c887e] hover:text-[#e6e2df]"
                            title="Edit experience"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {onDeleteExperience && (
                          <button
                            type="button"
                            onClick={() => onDeleteExperience(exp.id)}
                            className="p-1 text-[#8c887e] hover:text-red-400"
                            title="Delete experience"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-sm leading-relaxed text-[#cac6bc] font-sans">
                  {exp.description}
                </p>

                {exp.technologies && exp.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {exp.technologies.map((tech, i) => (
                      <span
                        key={i}
                        className="rounded-md border border-[#363433] bg-[#1c1b1a] px-2 py-0.5 font-mono text-[11px] text-[#e6e2df]"
                      >
                        {tech}
                      </span>
                    ))}
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
