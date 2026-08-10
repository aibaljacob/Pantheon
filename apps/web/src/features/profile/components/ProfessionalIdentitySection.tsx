import React, { useState } from 'react';
import { ArrowRight, X, Sparkles } from 'lucide-react';
import type { ProfessionalIdentity } from '../types';

interface ProfessionalIdentitySectionProps {
  identity: ProfessionalIdentity;
}

export const ProfessionalIdentitySection: React.FC<ProfessionalIdentitySectionProps> = ({ identity }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Top summary strings
  const rolesSummary = identity.roles.slice(0, 3).join(' · ');
  const enginesSummary = identity.gameEngines.join(' · ');
  const topSkills = identity.skills.slice(0, 4).join(' · ');
  const remainingCount =
    (identity.skills.length > 4 ? identity.skills.length - 4 : 0) +
    identity.specializations.length +
    identity.tools.length +
    identity.platforms.length +
    identity.genres.length;

  const categories = [
    { title: 'Primary Roles', items: identity.roles },
    { title: 'Specializations', items: identity.specializations },
    { title: 'Game Engines', items: identity.gameEngines },
    { title: 'Technical Skills', items: identity.skills },
    { title: 'Tools & Software', items: identity.tools },
    { title: 'Platform Experience', items: identity.platforms },
    { title: 'Genres', items: identity.genres },
  ];

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between border-b border-[#2b2a29] pb-3">
        <h2 className="font-headline text-xs font-mono uppercase tracking-[0.2em] text-[#8c887e]">
          Professional Identity & Expertise
        </h2>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1 font-mono text-xs font-medium text-[#cac6bc] hover:text-[#ffffff] transition-colors"
        >
          <span>View all expertise</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Default Concise View (Progressive Disclosure) */}
      <div className="rounded-2xl border border-[#2b2a29] bg-[#1c1b1a]/60 p-5 space-y-3">
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
                      {items.map((item, idx) => (
                        <span
                          key={`${title}-${idx}`}
                          className="rounded-lg border border-[#363433] bg-[#141312] px-3 py-1.5 font-mono text-xs text-[#e6e2df]"
                        >
                          {item}
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
