import React, { useState } from 'react';
import { ArrowRight, X, Sparkles, Edit2 } from 'lucide-react';
import type { ProfessionalIdentity, TaxonomyItem } from '../types';

interface ProfessionalIdentitySectionProps {
  identity?: ProfessionalIdentity | null;
  isOwner?: boolean;
  onEditIdentity?: () => void;
}

export const ProfessionalIdentitySection: React.FC<ProfessionalIdentitySectionProps> = ({
  identity,
  isOwner,
  onEditIdentity,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getItemName = (item: TaxonomyItem | string): string => {
    if (!item) return '';
    return typeof item === 'string' ? item : item.name;
  };

  const getNamesList = (items: (TaxonomyItem | string)[] = []): string[] => {
    if (!Array.isArray(items)) return [];
    return items.map(getItemName).filter(Boolean);
  };

  const rolesNames = getNamesList(identity?.roles);
  const enginesNames = getNamesList(identity?.gameEngines);
  const skillsNames = getNamesList(identity?.skills);

  const rolesSummary = rolesNames.slice(0, 3).join(' · ');
  const enginesSummary = enginesNames.join(' · ');
  const topSkills = skillsNames.slice(0, 4).join(' · ');

  const remainingCount =
    (skillsNames.length > 4 ? skillsNames.length - 4 : 0) +
    getNamesList(identity?.specializations).length +
    getNamesList(identity?.tools).length +
    getNamesList(identity?.platforms).length +
    getNamesList(identity?.genres).length;

  const categories = [
    { title: 'Primary Roles', items: rolesNames },
    { title: 'Specializations', items: getNamesList(identity?.specializations) },
    { title: 'Game Engines', items: enginesNames },
    { title: 'Technical Skills', items: skillsNames },
    { title: 'Tools & Software', items: getNamesList(identity?.tools) },
    { title: 'Platform Experience', items: getNamesList(identity?.platforms) },
    { title: 'Genres', items: getNamesList(identity?.genres) },
  ];

  const totalExpertiseCount = categories.reduce((sum, cat) => sum + cat.items.length, 0);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between border-b border-[#2b2a29] pb-3">
        <h2 className="font-headline text-xs font-mono uppercase tracking-[0.2em] text-[#8c887e]">
          Professional Identity & Expertise
        </h2>
        <div className="flex items-center gap-3">
          {totalExpertiseCount > 0 && (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1 font-mono text-xs font-medium text-[#cac6bc] hover:text-[#ffffff] transition-colors"
            >
              <span>View all expertise</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}

          {isOwner && onEditIdentity && (
            <button
              type="button"
              onClick={onEditIdentity}
              className="inline-flex items-center gap-1 font-mono text-xs text-[#cac6bc] hover:text-[#ffffff] transition-colors"
            >
              <Edit2 className="h-3.5 w-3.5" />
              <span>Edit Identity</span>
            </button>
          )}
        </div>
      </div>

      {/* Default Concise View (Progressive Disclosure) */}
      <div className="rounded-2xl border border-[#2b2a29] bg-[#1c1b1a]/60 p-5 space-y-3">
        {totalExpertiseCount === 0 ? (
          <p className="text-xs text-[#8c887e] font-sans">
            No professional identity items added yet. Click "Edit Profile" above to select your roles, skills, and game engines.
          </p>
        ) : (
          <>
            {rolesSummary && (
              <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-[#ffffff]">
                <span>{rolesSummary}</span>
              </div>
            )}

            {enginesSummary && (
              <div className="flex items-center gap-2 text-xs font-mono text-[#cac6bc]">
                <span className="text-[#8c887e]">Engines:</span>
                <span>{enginesSummary}</span>
              </div>
            )}

            {topSkills && (
              <div className="flex items-center gap-2 text-xs font-mono text-[#8c887e]">
                <span className="text-[#8c887e]">Skills:</span>
                <span className="text-[#e6e2df]">{topSkills}</span>
                {remainingCount > 0 && (
                  <span className="rounded-full bg-[#2b2a29] px-2 py-0.5 text-[10px] text-[#cac6bc]">
                    +{remainingCount} more
                  </span>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Full Expertise Drawer / Modal (Progressive Disclosure) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 sm:p-6 overflow-y-auto">
          <div className="relative w-full max-w-3xl max-h-[85vh] flex flex-col rounded-3xl border border-[#363433] bg-[#1c1b1a] shadow-2xl overflow-hidden animate-fadeIn">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#2b2a29] px-6 py-5">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[#e6e2df]" />
                <h3 className="font-headline text-lg font-bold text-[#ffffff]">
                  Complete Technical & Creative Expertise
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl border border-[#363433] bg-[#141312] p-2 text-[#8c887e] hover:text-[#ffffff] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* All 7 Categories Display */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {categories.map(({ title, items }) => (
                items && items.length > 0 ? (
                  <div key={title} className="space-y-2 border-b border-[#2b2a29]/60 pb-4 last:border-0">
                    <h4 className="font-mono text-xs uppercase tracking-wider text-[#8c887e]">
                      {title} ({items.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {items.map((name, idx) => (
                        <span
                          key={`${title}-${idx}`}
                          className="rounded-lg border border-[#363433] bg-[#141312] px-3 py-1.5 font-mono text-xs text-[#e6e2df]"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null
              ))}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-[#2b2a29] bg-[#141312] px-6 py-4 flex justify-end">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl border border-[#48473f] bg-[#201f1e] px-5 py-2 text-xs font-mono font-semibold text-[#e6e2df] hover:border-[#e6e2df]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
