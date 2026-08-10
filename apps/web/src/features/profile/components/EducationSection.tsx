import React, { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { Plus, Trash2, Edit2, ChevronDown, ChevronUp } from 'lucide-react';
import type { EducationItem } from '../types';

interface EducationSectionProps {
  education: EducationItem[];
  isOwner: boolean;
  onAddEducation?: () => void;
  onEditEducation?: (edu: EducationItem) => void;
  onDeleteEducation?: (id: string) => void;
}

export const EducationSection: React.FC<EducationSectionProps> = ({
  education,
  isOwner,
  onAddEducation,
  onEditEducation,
  onDeleteEducation,
}) => {
  const [expandedIds, setExpandedIds] = useState<{ [key: string]: boolean }>({});

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between border-b border-[#2b2a29] pb-3">
        <h2 className="font-headline text-xs font-mono uppercase tracking-[0.2em] text-[#8c887e]">
          Education
        </h2>
        {isOwner && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onAddEducation}
            icon={<Plus className="h-3.5 w-3.5" />}
            iconPosition="left"
          >
            Add Education
          </Button>
        )}
      </div>

      {education.length === 0 ? (
        <p className="text-xs font-mono text-[#8c887e]">No education details added.</p>
      ) : (
        <div className="space-y-3">
          {education.map((edu) => {
            const isExpanded = Boolean(expandedIds[edu.id]);

            return (
              <div
                key={edu.id}
                className="group rounded-xl border border-[#2b2a29]/60 bg-[#1c1b1a]/40 p-3.5 transition-colors hover:border-[#363433]"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <div>
                    <h3 className="font-headline text-xs font-bold text-[#ffffff]">
                      {edu.degree}
                    </h3>
                    <p className="text-xs font-mono text-[#cac6bc]">{edu.institution}</p>
                  </div>

                  <div className="flex items-center gap-2 font-mono text-xs text-[#8c887e]">
                    <span>
                      {edu.startDate} — {edu.endDate || 'Present'}
                    </span>
                    {isOwner && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                        {onEditEducation && (
                          <button
                            type="button"
                            onClick={() => onEditEducation(edu)}
                            className="p-1 text-[#8c887e] hover:text-[#e6e2df]"
                            title="Edit education"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                        )}
                        {onDeleteEducation && (
                          <button
                            type="button"
                            onClick={() => onDeleteEducation(edu.id)}
                            className="p-1 text-[#8c887e] hover:text-red-400"
                            title="Delete education"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {edu.description && (
                  <div className="mt-2 text-xs">
                    {isExpanded ? (
                      <p className="leading-relaxed text-[#cac6bc] font-sans pt-1 border-t border-[#2b2a29]">
                        {edu.description}
                      </p>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => toggleExpand(edu.id)}
                      className="mt-1 inline-flex items-center gap-1 font-mono text-[11px] text-[#8c887e] hover:text-[#e6e2df]"
                    >
                      <span>{isExpanded ? 'Hide details' : 'View description'}</span>
                      {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
