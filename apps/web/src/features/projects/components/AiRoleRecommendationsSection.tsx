import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, RefreshCw, UserCheck, ExternalLink, Loader2 } from 'lucide-react';
import type { DraftRoleRecommendation, ProjectDetail } from '../types';
import { formatApiAssetUrl } from '../../profile/services/profileService';
import { Badge } from '../../../components/ui/Badge';

interface AiRoleRecommendationsSectionProps {
  project: ProjectDetail;
  recommendations: DraftRoleRecommendation[];
  isLoading: boolean;
  onAcceptRecommendation: (draft: DraftRoleRecommendation) => void;
  onRescan: () => void;
}

function formatLevel(lvl?: string): string {
  switch (lvl) {
    case 'JUNIOR': return 'Junior';
    case 'MID': return 'Mid-Level';
    case 'SENIOR': return 'Senior';
    case 'LEAD': return 'Lead';
    default: return lvl || 'Mid-Level';
  }
}

function formatCommitment(c?: string): string {
  switch (c) {
    case 'FULL_TIME': return 'Full-Time';
    case 'PART_TIME': return 'Part-Time';
    case 'CONTRACT': return 'Contract';
    case 'REV_SHARE': return 'Rev-Share';
    default: return c ? c.replace('_', ' ') : 'Part-Time';
  }
}

export const AiRoleRecommendationsSection: React.FC<AiRoleRecommendationsSectionProps> = ({
  project,
  recommendations,
  isLoading,
  onAcceptRecommendation,
  onRescan,
}) => {
  return (
    <div className="rounded-3xl border border-[#363433] bg-[#1c1b1a] p-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2b2a29] pb-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-amber-500/40 bg-amber-950/30 text-amber-300">
            <Sparkles className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-headline text-lg font-bold text-[#ffffff]">
                AI Staffing Intelligence & Role Recommendations
              </h3>
              <Badge variant="accent" className="normal-case text-[10px]">
                Autonomous Project Scan
              </Badge>
            </div>
            <p className="text-xs font-mono text-[#8c887e] mt-0.5">
              Live analysis of {project.name} stage ({project.status.replace('_', ' ')}), technology, and matched talent
            </p>
          </div>
        </div>

        {project.isFounder && (
          <button
            type="button"
            onClick={onRescan}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#363433] bg-[#141312] px-3 py-1.5 font-mono text-xs text-[#cac6bc] hover:border-[#e6e2df] hover:text-[#ffffff] transition-colors disabled:opacity-50 shrink-0"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Rescan Project</span>
          </button>
        )}
      </div>

      {/* Loading Scanning State */}
      {isLoading && (
        <div className="rounded-2xl border border-[#2b2a29] bg-[#141312] p-8 text-center space-y-3">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-amber-400" />
          <div>
            <p className="font-headline text-sm font-semibold text-[#ffffff]">
              Scanning Project State & Talent Ecosystem...
            </p>
            <p className="text-xs font-mono text-[#8c887e] mt-1">
              Evaluating production stage ({project.status}), engine ({project.gameEngine || 'Standard'}), and matching candidate developers
            </p>
          </div>
        </div>
      )}

      {/* Empty Recommendations State */}
      {!isLoading && recommendations.length === 0 && (
        <div className="rounded-2xl border border-[#2b2a29] bg-[#141312] p-6 text-center space-y-2">
          <UserCheck className="mx-auto h-6 w-6 text-[#8c887e]" />
          <p className="text-xs font-mono text-[#8c887e]">
            All essential roles appear filled for current stage. Click &ldquo;Rescan Project&rdquo; to re-evaluate anytime.
          </p>
        </div>
      )}

      {/* Role Recommendations List */}
      {!isLoading && recommendations.length > 0 && (
        <div className="space-y-6">
          {recommendations.map((draft, idx) => (
            <div
              key={`${draft.roleId}-${idx}`}
              className="rounded-2xl border border-[#2b2a29] bg-[#141312] p-5 space-y-4 transition-all hover:border-[#363433]"
            >
              {/* Role Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-headline text-base font-bold text-[#ffffff]">
                      {draft.title || draft.roleName}
                    </h4>
                    <span className="rounded-full border border-amber-500/40 bg-amber-950/20 px-2 py-0.5 text-[10px] font-mono text-amber-300">
                      ★ RECOMMENDED ROLE
                    </span>
                  </div>
                  <p className="text-xs font-mono text-[#8c887e] mt-0.5">
                    Category: {draft.roleName}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="rounded-xl border border-[#363433] bg-[#1c1b1a] px-2.5 py-1 text-[11px] font-mono text-[#cac6bc]">
                    {formatLevel(draft.experienceLevel)}
                  </span>
                  <span className="rounded-xl border border-[#363433] bg-[#1c1b1a] px-2.5 py-1 text-[11px] font-mono text-[#cac6bc]">
                    {formatCommitment(draft.commitment)}
                  </span>
                  {project.isFounder && (
                    <button
                      type="button"
                      onClick={() => onAcceptRecommendation(draft)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[#e6e2d7] bg-[#e6e2df] px-3.5 py-1.5 font-mono text-xs font-semibold text-[#141312] hover:bg-[#ffffff] transition-colors"
                    >
                      <span>Adopt Role</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* WHY IT IS NEEDED Banner */}
              <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3 text-xs text-amber-200/90 font-sans space-y-1">
                <span className="font-mono text-[10px] uppercase font-bold text-amber-300 flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-amber-400" /> Why this role is needed
                </span>
                <p className="leading-relaxed">{draft.reasoning}</p>
              </div>

              {draft.description && (
                <p className="text-xs leading-relaxed text-[#cac6bc] font-sans">
                  {draft.description}
                </p>
              )}

              {/* Skills & Tools */}
              {((draft.requiredSkills && draft.requiredSkills.length > 0) ||
                (draft.requiredTools && draft.requiredTools.length > 0)) && (
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  {(draft.requiredSkills || []).map((s) => (
                    <span
                      key={s.id}
                      className="rounded-lg border border-[#363433] bg-[#1c1b1a] px-2.5 py-1 text-[10px] font-mono text-[#e6e2df]"
                    >
                      Skill: {s.name}
                    </span>
                  ))}
                  {(draft.requiredTools || []).map((t) => (
                    <span
                      key={t.id}
                      className="rounded-lg border border-[#363433] bg-[#201f1e] px-2.5 py-1 text-[10px] font-mono text-[#cac6bc]"
                    >
                      Tool: {t.name}
                    </span>
                  ))}
                </div>
              )}

              {/* RECOMMENDED USERS FOR THIS ROLE */}
              {draft.topCandidates && draft.topCandidates.length > 0 && (
                <div className="border-t border-[#201f1e] pt-3 space-y-2">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#8c887e]">
                    Recommended Developers For This Role
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {draft.topCandidates.map((tc) => (
                      <div
                        key={tc.candidate.id}
                        className="rounded-xl border border-[#2b2a29] bg-[#1c1b1a] p-3 space-y-2 flex flex-col justify-between hover:border-[#48473f] transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            {tc.candidate.avatarUrl ? (
                              <img
                                src={formatApiAssetUrl(tc.candidate.avatarUrl)}
                                alt={tc.candidate.displayName}
                                className="h-7 w-7 rounded-full object-cover border border-[#48473f] shrink-0"
                              />
                            ) : (
                              <div className="h-7 w-7 rounded-full bg-[#201f1e] border border-[#48473f] flex items-center justify-center font-bold text-xs text-[#ffffff] shrink-0">
                                {tc.candidate.displayName.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-headline text-xs font-bold text-[#ffffff] truncate">
                                {tc.candidate.displayName}
                              </p>
                              <p className="text-[10px] font-mono text-[#8c887e] truncate">
                                @{tc.candidate.username}
                              </p>
                            </div>
                          </div>

                          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-400 shrink-0">
                            {tc.totalScore}%
                          </span>
                        </div>

                        {/* Why this user is recommended */}
                        <p className="text-[11px] text-[#cac6bc] line-clamp-2 font-sans bg-[#141312] p-1.5 rounded-lg border border-[#201f1e]">
                          <span className="font-bold text-[#e6e2df]">Why recommended: </span>
                          {tc.explanation}
                        </p>

                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[10px] font-mono text-[#8c887e]">
                            {tc.candidate.experienceYears !== null && tc.candidate.experienceYears !== undefined
                              ? `${tc.candidate.experienceYears} yrs exp`
                              : 'Exp unspecified'}
                          </span>
                          <Link
                            to={`/u/${tc.candidate.username}`}
                            className="inline-flex items-center gap-1 font-mono text-[10px] text-[#e6e2df] hover:text-[#ffffff] underline"
                          >
                            <span>Profile</span>
                            <ExternalLink className="h-2.5 w-2.5" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
