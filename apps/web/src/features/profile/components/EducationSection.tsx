import React from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Plus, GraduationCap, Trash2, Edit2 } from 'lucide-react';
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
  return (
    <Card className="space-y-6">
      <div className="flex items-center justify-between border-b border-[#2b2a29] pb-4">
        <div>
          <h2 className="font-headline text-lg font-bold text-[#ffffff] tracking-wide">
            Education
          </h2>
          <p className="text-xs text-[#8c887e]">Academic background & qualifications</p>
        </div>
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
        <div className="rounded-xl border border-dashed border-[#363433] p-6 text-center">
          <GraduationCap className="mx-auto h-8 w-8 text-[#8c887e]/60" />
          <p className="mt-2 text-sm text-[#8c887e]">No education details added yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {education.map((edu) => (
            <div
              key={edu.id}
              className="group flex flex-col justify-between rounded-xl border border-[#2b2a29] bg-[#141312] p-4 transition-colors hover:border-[#363433]"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-headline text-base font-bold text-[#ffffff]">
                    {edu.degree}
                  </h3>
                  <p className="text-sm font-medium text-[#cac6bc]">{edu.institution}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-[#8c887e]">
                    {edu.startDate} — {edu.endDate || 'Present'}
                  </span>
                  {isOwner && (
                    <div className="ml-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {onEditEducation && (
                        <button
                          type="button"
                          onClick={() => onEditEducation(edu)}
                          className="p-1 text-[#8c887e] hover:text-[#e6e2df]"
                          title="Edit education"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {onDeleteEducation && (
                        <button
                          type="button"
                          onClick={() => onDeleteEducation(edu.id)}
                          className="p-1 text-[#8c887e] hover:text-red-400"
                          title="Delete education"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {edu.description && (
                <p className="mt-2 text-xs leading-relaxed text-[#cac6bc] font-sans">
                  {edu.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
