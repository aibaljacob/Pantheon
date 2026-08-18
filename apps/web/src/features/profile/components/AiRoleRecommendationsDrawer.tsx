import React from 'react';
import { X, Sparkles, ArrowRight, AlertCircle } from 'lucide-react';
import type { DraftRoleRecommendation } from '../../projects/types';

interface AiRoleRecommendationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  recommendations: DraftRoleRecommendation[];
  onAcceptRecommendation: (draft: DraftRoleRecommendation) => void;
}

function formatExperience(level: string): string {
  switch (level) {
    case 'JUNIOR':
      return 'Junior';
    case 'MID':
      return 'Mid-Level';
    case 'SENIOR':
      return 'Senior';
    case 'LEAD':
      return 'Lead';
    default:
      return level;
  }
}

function formatCommitment(commitment: string): string {
  switch (commitment) {
    case 'FULL_TIME':
      return 'Full-Time';
    case 'PART_TIME':
      return 'Part-Time';
    case 'CONTRACT':
      return 'Contract';
    case 'REV_SHARE':
      return 'Rev-Share';
    default:
      return commitment;
  }
}

export const AiRoleRecommendationsDrawer: React.FC<
  AiRoleRecommendationsDrawerProps
> = ({ isOpen, onClose, recommendations, onAcceptRecommendation }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative h-full w-full max-w-xl border-l border-[#363433] bg-[#141312] p-6 sm:p-8 shadow-2xl flex flex-col justify-between overflow-y-auto text-[#e6e2df]">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#2b2a29] pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-amber-500/40 bg-amber-950/30 text-amber-300">
                <Sparkles className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <h2 className="font-headline text-xl font-bold text-[#ffffff]">
                  AI Role Recommendations
                </h2>
                <p className="text-xs font-mono text-[#8c887e]">
                  Gemini-suggested positions tailored to your project setup
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#363433] p-2 text-[#8c887e] hover:border-[#e6e2df] hover:text-[#ffffff] transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Warning / Boundary Banner */}
          <div className="rounded-2xl border border-[#48473f] bg-[#1c1b1a] p-3.5 flex items-start gap-3 text-xs text-[#cac6bc] font-sans">
            <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <p>
              These are temporary AI recommendations based on active studio taxonomy. <strong className="text-[#ffffff]">No database records have been created.</strong> Review and customize each draft before publishing.
            </p>
          </div>

          {/* List of Draft Recommendations */}
          {recommendations.length === 0 ? (
            <div className="py-12 text-center text-xs font-mono text-[#8c887e]">
              No AI role recommendations generated.
            </div>
          ) : (
            <div className="space-y-4">
              {recommendations.map((draft, idx) => (
                <div
                  key={`${draft.roleId}-${idx}`}
                  className="rounded-2xl border border-[#363433] bg-[#1c1b1a] p-5 space-y-4 transition-all hover:border-[#48473f]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-headline text-base font-bold text-[#ffffff]">
                        {draft.title || draft.roleName}
                      </h3>
                      <p className="text-xs font-mono text-[#8c887e] mt-0.5">
                        Role Taxonomy: {draft.roleName}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="rounded-xl border border-[#363433] bg-[#141312] px-2.5 py-1 text-[11px] font-mono text-[#cac6bc]">
                        {formatExperience(draft.experienceLevel)}
                      </span>
                      <span className="rounded-xl border border-[#363433] bg-[#141312] px-2.5 py-1 text-[11px] font-mono text-[#cac6bc]">
                        {formatCommitment(draft.commitment)}
                      </span>
                    </div>
                  </div>

                  {/* AI Reasoning Pill */}
                  <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3 text-xs text-amber-200/90 font-sans space-y-1">
                    <span className="font-mono text-[10px] uppercase font-bold text-amber-300 flex items-center gap-1">
                      <Sparkles className="h-3 w-3" /> AI Production Rationale
                    </span>
                    <p>{draft.reasoning}</p>
                  </div>

                  {draft.description && (
                    <p className="text-xs leading-relaxed text-[#cac6bc] font-sans">
                      {draft.description}
                    </p>
                  )}

                  {/* Required Skills & Tools Chips */}
                  {(draft.requiredSkills.length > 0 ||
                    draft.requiredTools.length > 0) && (
                    <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-[#2b2a29]">
                      {draft.requiredSkills.map((s) => (
                        <span
                          key={s.id}
                          className="rounded-lg border border-[#48473f] bg-[#141312] px-2.5 py-1 text-[10px] font-mono text-[#e6e2df]"
                        >
                          Skill: {s.name}
                        </span>
                      ))}
                      {draft.requiredTools.map((t) => (
                        <span
                          key={t.id}
                          className="rounded-lg border border-[#48473f] bg-[#201f1e] px-2.5 py-1 text-[10px] font-mono text-[#cac6bc]"
                        >
                          Tool: {t.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Accept Action */}
                  <div className="pt-2 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => onAcceptRecommendation(draft)}
                      className="inline-flex items-center gap-2 rounded-xl border border-[#e6e2d7] bg-[#e6e2df] px-4 py-2 font-mono text-xs font-semibold text-[#141312] hover:bg-[#ffffff] transition-colors"
                    >
                      <span>Review & Accept</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-6 border-t border-[#2b2a29] mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#363433] bg-transparent px-5 py-2 font-mono text-xs text-[#cac6bc] hover:text-[#ffffff] transition-colors"
          >
            Close Drawer
          </button>
        </div>
      </div>
    </div>
  );
};
