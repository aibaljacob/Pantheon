import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  UserCheck,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Briefcase,
  MapPin,
  CheckCircle2,
  AlertCircle,
  FileText,
  Search,
} from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import { useAuthStore } from '../../auth/store/authStore';
import { formatApiAssetUrl } from '../../profile/services/profileService';
import type { ProjectDetail, ProjectRoleItem } from '../types';
import { fetchRecommendedTalent } from '../services/talentMatchingService';
import type { RankedCandidatesResponse } from '../services/talentMatchingService';

interface RecommendedTalentSectionProps {
  project: ProjectDetail;
  roles: ProjectRoleItem[];
}

export const RecommendedTalentSection: React.FC<RecommendedTalentSectionProps> = ({
  project,
  roles,
}) => {
  const openRoles = roles.filter((r) => r.status === 'OPEN' || r.status === 'IN_REVIEW');
  const [selectedRoleId, setSelectedRoleId] = useState<string>(openRoles[0]?.id || '');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<RankedCandidatesResponse | null>(null);
  const [expandedCandidateId, setExpandedCandidateId] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');

  const accessToken = useAuthStore((state) => state.accessToken);

  // Sync selected role ID when open roles update
  useEffect(() => {
    if (openRoles.length > 0 && !openRoles.some((r) => r.id === selectedRoleId)) {
      setSelectedRoleId(openRoles[0].id);
    }
  }, [openRoles, selectedRoleId]);

  const loadCandidates = useCallback(async () => {
    if (!accessToken || !selectedRoleId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetchRecommendedTalent(accessToken, project.id, selectedRoleId, {
        search: search.trim() || undefined,
        limit: 10,
      });
      setData(response);
    } catch (err: any) {
      setError(err.message || 'Unable to load candidate recommendations.');
    } finally {
      setLoading(false);
    }
  }, [accessToken, project.id, selectedRoleId, search]);

  useEffect(() => {
    loadCandidates();
  }, [loadCandidates]);

  if (openRoles.length === 0) {
    return (
      <div className="rounded-3xl border border-[#363433] bg-[#1c1b1a] p-6 text-center space-y-3">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-[#363433] bg-[#141312] text-[#8c887e]">
          <UserCheck className="h-6 w-6" />
        </div>
        <h3 className="font-headline text-base font-semibold text-[#ffffff]">Recommended Talent Engine</h3>
        <p className="text-xs text-[#8c887e] max-w-md mx-auto">
          Add an open project role to generate real-time candidate recommendations ranked by role, skills, tools, experience, and domain synergy.
        </p>
      </div>
    );
  }

  const selectedRole = openRoles.find((r) => r.id === selectedRoleId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2b2a29] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-400" />
            <h2 className="font-headline text-xl font-bold text-[#ffffff]">Recommended Talent</h2>
            <Badge variant="accent" className="normal-case text-[10px]">
              Deterministic AI Match
            </Badge>
          </div>
          <p className="mt-1 text-xs text-[#8c887e]">
            Ranked candidate recommendations based on verified role taxonomy, skills, tools, experience, and project context.
          </p>
        </div>

        {/* Role Selector Tabs */}
        {openRoles.length > 1 && (
          <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-[#2b2a29] bg-[#141312] p-1.5">
            {openRoles.map((roleItem) => (
              <button
                key={roleItem.id}
                type="button"
                onClick={() => {
                  setSelectedRoleId(roleItem.id);
                  setExpandedCandidateId(null);
                }}
                className={`rounded-xl px-3 py-1.5 font-mono text-xs transition-colors ${
                  selectedRoleId === roleItem.id
                    ? 'bg-[#201f1e] font-bold text-[#ffffff] shadow-md border border-[#363433]'
                    : 'text-[#8c887e] hover:text-[#e6e2df]'
                }`}
              >
                {roleItem.title || roleItem.roleName}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Role Summary Banner */}
      {selectedRole && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#2b2a29] bg-[#141312] p-4 text-xs font-mono">
          <div className="flex items-center gap-3">
            <Briefcase className="h-4 w-4 text-[#8c887e]" />
            <span className="font-bold text-[#ffffff]">{selectedRole.title || selectedRole.roleName}</span>
            <span className="text-[#8c887e]">·</span>
            <span className="text-[#cac6bc]">{selectedRole.experienceLevel}</span>
            <span className="text-[#8c887e]">·</span>
            <span className="text-[#cac6bc]">{selectedRole.commitment.replace('_', ' ')}</span>
          </div>

          {/* Search Filter Input */}
          <div className="relative min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8c887e]" />
            <input
              type="text"
              placeholder="Search candidate name or skill..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-[#363433] bg-[#1c1b1a] pl-8 pr-3 py-1.5 text-xs text-[#e6e2df] placeholder-[#8c887e] focus:border-[#e6e2df] focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* Candidate List Container */}
      {loading ? (
        <div className="py-12 text-center font-mono text-xs text-[#8c887e] animate-pulse">
          Computing candidate compatibility scores & taxonomy intersections...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-xs text-red-400">
          {error}
        </div>
      ) : !data || data.candidates.length === 0 ? (
        <div className="rounded-3xl border border-[#363433] bg-[#1c1b1a] p-8 text-center space-y-2">
          <p className="font-headline text-sm font-semibold text-[#ffffff]">No Matching Candidates Found</p>
          <p className="text-xs text-[#8c887e]">
            {search
              ? 'No candidates match your current search query.'
              : 'No available developers currently meet the minimum score criteria for this role.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.candidates.map((item) => {
            const candidate = item.candidate;
            const isExpanded = expandedCandidateId === candidate.id;

            return (
              <div
                key={candidate.id}
                className="rounded-3xl border border-[#363433] bg-[#1c1b1a] p-5 space-y-4 shadow-xl transition-colors hover:border-[#48473f]"
              >
                {/* Main Card Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    {candidate.avatarUrl ? (
                      <img
                        src={formatApiAssetUrl(candidate.avatarUrl)}
                        alt={candidate.displayName}
                        className="h-12 w-12 rounded-full object-cover border border-[#48473f]"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-[#201f1e] border border-[#48473f] flex items-center justify-center font-bold text-sm text-[#ffffff]">
                        {candidate.displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-headline text-base font-bold text-[#ffffff]">{candidate.displayName}</h3>
                        <span className="font-mono text-xs text-[#8c887e]">@{candidate.username}</span>
                        {candidate.resume && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-[#48473f] bg-[#141312] px-2 py-0.5 font-mono text-[10px] text-emerald-400">
                            <FileText className="h-3 w-3" /> CV Available
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-mono text-[#cac6bc]">{candidate.headline || 'Game Developer'}</p>
                      <div className="flex items-center gap-3 text-[11px] text-[#8c887e] font-mono flex-wrap">
                        {candidate.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {candidate.location}
                          </span>
                        )}
                        {candidate.experienceYears !== null && candidate.experienceYears !== undefined ? (
                          <span>{candidate.experienceYears} Years Exp</span>
                        ) : (
                          <span className="text-amber-400">Exp Unspecified</span>
                        )}
                        {candidate.availability && <span>· {candidate.availability}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Score Badges */}
                  <div className="flex sm:flex-col items-end justify-between sm:justify-start gap-2 shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="text-right font-mono">
                        <div className="text-lg font-bold text-[#ffffff]">{item.totalScore}%</div>
                        <div className="text-[10px] uppercase text-[#8c887e]">Match Score</div>
                      </div>
                      <Badge
                        variant={
                          item.totalScore >= 85
                            ? 'accent'
                            : item.totalScore >= 70
                            ? 'bronze'
                            : 'default'
                        }
                        className="normal-case text-xs"
                      >
                        {item.matchGrade.replace('_MATCH', '')}
                      </Badge>
                    </div>
                    <Badge
                      variant="default"
                      className="text-[10px] font-mono uppercase text-[#8c887e]"
                    >
                      Confidence: {item.confidenceLevel}
                    </Badge>
                  </div>
                </div>

                {/* Explanation Banner */}
                <div className="rounded-2xl border border-[#2b2a29] bg-[#141312] p-3 text-xs text-[#cac6bc] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    <span>{item.explanation}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setExpandedCandidateId(isExpanded ? null : candidate.id)}
                    className="flex items-center gap-1 font-mono text-[11px] text-[#e6e2df] hover:text-[#ffffff] shrink-0"
                  >
                    <span>{isExpanded ? 'Hide Breakdown' : 'View Breakdown'}</span>
                    {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>
                </div>

                {/* Skill Overlap Preview */}
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono pt-1">
                  {item.matchedSkills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] text-emerald-400"
                    >
                      <CheckCircle2 className="h-3 w-3" /> {skill}
                    </span>
                  ))}
                  {item.missingSkills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1 rounded-full border border-[#363433] bg-[#141312] px-2.5 py-0.5 text-[11px] text-[#8c887e]"
                    >
                      <AlertCircle className="h-3 w-3" /> {skill} (Missing)
                    </span>
                  ))}
                </div>

                {/* Expanded Detailed Breakdown */}
                {isExpanded && (
                  <div className="border-t border-[#2b2a29] pt-4 space-y-4">
                    {/* Component Score Progress Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs">
                      <div className="rounded-2xl border border-[#2b2a29] bg-[#141312] p-3 space-y-1">
                        <span className="text-[#8c887e] text-[10px] uppercase">Role Match</span>
                        <p className="font-bold text-[#ffffff]">{item.matchBreakdown.roleMatch} / 25 Pts</p>
                      </div>
                      <div className="rounded-2xl border border-[#2b2a29] bg-[#141312] p-3 space-y-1">
                        <span className="text-[#8c887e] text-[10px] uppercase">Skill Alignment</span>
                        <p className="font-bold text-[#ffffff]">{item.matchBreakdown.skillMatch} / 25 Pts</p>
                      </div>
                      <div className="rounded-2xl border border-[#2b2a29] bg-[#141312] p-3 space-y-1">
                        <span className="text-[#8c887e] text-[10px] uppercase">Tool Proficiency</span>
                        <p className="font-bold text-[#ffffff]">{item.matchBreakdown.toolMatch} / 15 Pts</p>
                      </div>
                      <div className="rounded-2xl border border-[#2b2a29] bg-[#141312] p-3 space-y-1">
                        <span className="text-[#8c887e] text-[10px] uppercase">Experience Level</span>
                        <p className="font-bold text-[#ffffff]">
                          {item.matchBreakdown.experienceMatch} / 15 Pts
                          {item.matchBreakdown.experienceUnspecified && ' (Unspecified)'}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-[#2b2a29] bg-[#141312] p-3 space-y-1">
                        <span className="text-[#8c887e] text-[10px] uppercase">Availability Fit</span>
                        <p className="font-bold text-[#ffffff]">{item.matchBreakdown.availabilityMatch} / 10 Pts</p>
                      </div>
                      <div className="rounded-2xl border border-[#2b2a29] bg-[#141312] p-3 space-y-1">
                        <span className="text-[#8c887e] text-[10px] uppercase">Project Context</span>
                        <p className="font-bold text-[#ffffff]">{item.matchBreakdown.projectContextMatch} / 10 Pts</p>
                      </div>
                    </div>

                    {/* Portfolio Highlights */}
                    {candidate.portfolioHighlights.length > 0 && (
                      <div className="space-y-2">
                        <span className="font-mono text-xs uppercase text-[#8c887e]">Portfolio Highlights</span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {candidate.portfolioHighlights.map((port) => (
                            <div key={port.id} className="rounded-2xl border border-[#2b2a29] bg-[#141312] p-3 space-y-1 text-xs">
                              <p className="font-bold text-[#ffffff] truncate">{port.title}</p>
                              <p className="text-[11px] text-[#8c887e] font-mono">{port.role}</p>
                              <div className="text-[10px] text-[#cac6bc] font-mono pt-1">
                                {port.gameEngine} · {port.genre}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Links */}
                    <div className="flex items-center justify-between pt-2">
                      {candidate.resume && candidate.resume.downloadUrl ? (
                        <a
                          href={candidate.resume.downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 font-mono text-xs text-emerald-400 hover:underline"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          <span>View Candidate Resume</span>
                        </a>
                      ) : (
                        <span />
                      )}

                      <Link
                        to={`/u/${candidate.username}`}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-[#48473f] bg-[#141312] px-3.5 py-1.5 font-mono text-xs text-[#e6e2df] hover:border-[#e6e2df] transition-colors"
                      >
                        <span>View Full Profile</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
