import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { Avatar } from '../../../auth/components/UserAvatar';
import { useAuthStore } from '../../../auth/store/authStore';
import type {
  ProjectDetail,
  SkillCoverageData,
} from '../../types';
import { fetchSkillCoverage } from '../../services/blueprintService';


interface VisualSkillCoverageProps {
  project: ProjectDetail;
  onNavigateToTab?: (tab: string) => void;
}

export const VisualSkillCoverage: React.FC<VisualSkillCoverageProps> = ({
  project,
  onNavigateToTab,
}) => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coverageData, setCoverageData] = useState<SkillCoverageData | null>(
    null,
  );

  const loadCoverage = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchSkillCoverage(
        project.id,
        accessToken || undefined,
      );
      setCoverageData(data);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Failed to load skill coverage.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCoverage();
  }, [project.id, accessToken]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-3xl border border-[#363433] bg-[#141312]">
        <RefreshCw className="h-6 w-6 animate-spin text-amber-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-red-500/30 bg-red-950/20 p-6 text-center space-y-3">
        <AlertCircle className="mx-auto h-6 w-6 text-red-400" />
        <p className="text-sm font-mono text-red-300">{error}</p>
        <Button variant="secondary" size="sm" onClick={loadCoverage}>
          Retry
        </Button>
      </div>
    );
  }

  if (!coverageData) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header Container */}
      <div className="rounded-3xl border border-[#363433] bg-[#141312] p-6 sm:p-8 space-y-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2b2a29] pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-amber-500/40 bg-amber-950/30 px-3 py-1 text-[11px] font-mono font-semibold tracking-wider text-amber-300">
                TEAM SKILL COVERAGE
              </span>
              <span className="rounded-full border border-[#48473f] bg-[#201f1e] px-3 py-1 text-[11px] font-mono text-[#cac6bc]">
                VERIFIED TALENT MATRIX
              </span>
            </div>
            <h2 className="font-headline text-2xl sm:text-3xl font-extrabold tracking-tight text-[#ffffff]">
              Production Readiness & Capability Map
            </h2>
            <p className="text-xs font-sans text-[#cac6bc] max-w-2xl">
              Cross-references requirements inferred from your game systems against verified skills of active project members, recruiting roles, and talent recommendations.
            </p>
          </div>

          <Button
            variant="secondary"
            size="sm"
            icon={<RefreshCw className="h-3.5 w-3.5" />}
            onClick={loadCoverage}
          >
            Refresh Coverage
          </Button>
        </div>

        {/* High-level Coverage Stats Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-[#2b2a29] bg-[#1c1b1a] p-4 space-y-1">
            <div className="text-[10px] font-mono text-[#8c887e] uppercase">
              Overall Capability
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-headline text-2xl font-bold text-amber-300">
                {coverageData.coveragePercentage}%
              </span>
              <span className="text-xs font-mono text-[#8c887e]">
                Readiness Score
              </span>
            </div>
            {/* Health Meter Bar */}
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#141312] mt-2">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full"
                style={{ width: `${coverageData.coveragePercentage}%` }}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-[#2b2a29] bg-[#1c1b1a] p-4 space-y-1">
            <div className="text-[10px] font-mono text-[#8c887e] uppercase">
              Covered Disciplines
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-headline text-2xl font-bold text-emerald-400">
                {coverageData.coveredCount}
              </span>
              <span className="text-xs font-mono text-[#8c887e]">
                of {coverageData.disciplines.length} Disciplines
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-mono text-emerald-300/80 pt-1">
              <CheckCircle2 className="h-3 w-3" /> Active on Team
            </div>
          </div>

          <div className="rounded-2xl border border-[#2b2a29] bg-[#1c1b1a] p-4 space-y-1">
            <div className="text-[10px] font-mono text-[#8c887e] uppercase">
              Recruiting Open Roles
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-headline text-2xl font-bold text-amber-400">
                {coverageData.recruitingCount}
              </span>
              <span className="text-xs font-mono text-[#8c887e]">
                Open Postings
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-mono text-amber-300/80 pt-1">
              <Briefcase className="h-3 w-3" /> Seeking Talent
            </div>
          </div>

          <div className="rounded-2xl border border-[#2b2a29] bg-[#1c1b1a] p-4 space-y-1">
            <div className="text-[10px] font-mono text-[#8c887e] uppercase">
              Underrepresented Gaps
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-headline text-2xl font-bold text-red-400">
                {coverageData.gapCount}
              </span>
              <span className="text-xs font-mono text-[#8c887e]">
                Unfilled Gaps
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-mono text-red-300/80 pt-1">
              <AlertTriangle className="h-3 w-3" /> Needs Attention
            </div>
          </div>
        </div>

        {/* 4 Discipline Coverage Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          {coverageData.disciplines.map((item) => (
            <div
              key={item.discipline}
              className="flex flex-col justify-between rounded-2xl border border-[#363433] bg-[#1c1b1a] p-5 space-y-4 shadow-lg transition-all hover:border-[#48473f]"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between border-b border-[#2b2a29] pb-3">
                <div className="space-y-0.5">
                  <div className="text-[10px] font-mono text-[#8c887e] uppercase tracking-wider">
                    PRODUCTION DISCIPLINE
                  </div>
                  <h3 className="font-headline text-lg font-bold text-[#ffffff]">
                    {item.discipline}
                  </h3>
                </div>

                {item.status === 'COVERED' ? (
                  <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-950/30 px-3 py-1 text-[11px] font-mono font-bold text-emerald-300">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    COVERED
                  </span>
                ) : item.status === 'RECRUITING' ? (
                  <span className="flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-950/30 px-3 py-1 text-[11px] font-mono font-bold text-amber-300">
                    <Briefcase className="h-3.5 w-3.5" />
                    RECRUITING
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 rounded-full border border-red-500/40 bg-red-950/30 px-3 py-1 text-[11px] font-mono font-bold text-red-300">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    SKILL GAP
                  </span>
                )}
              </div>

              {/* Required Skills Chips */}
              <div className="space-y-1.5">
                <div className="text-[10px] font-mono text-[#8c887e] uppercase">
                  Required Production Skills
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {item.requiredSkills.map((sk, idx) => (
                    <span
                      key={idx}
                      className="rounded-md border border-[#2b2a29] bg-[#141312] px-2 py-0.5 text-[11px] font-mono text-[#cac6bc]"
                    >
                      {sk}
                    </span>
                  ))}
                </div>
              </div>

              {/* Verified Team Coverage */}
              <div className="space-y-2 border-t border-[#2b2a29] pt-3">
                <div className="flex items-center justify-between text-[10px] font-mono text-[#8c887e] uppercase">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                    Verified Active Coverage ({item.coveredByMembers.length})
                  </span>
                  <span className="text-[#8c887e]">From verified profile</span>
                </div>

                {item.coveredByMembers.length > 0 ? (
                  <div className="space-y-2">
                    {item.coveredByMembers.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between rounded-xl border border-[#2b2a29] bg-[#141312] p-2.5"
                      >
                        <div className="flex items-center gap-2.5">
                          <Avatar
                            src={member.avatarUrl}
                            name={member.displayName}
                            size="xs"
                            className="!h-7 !w-7 text-[10px] border border-[#363433]"
                          />
                          <div>
                            <div className="text-xs font-headline font-bold text-white">
                              {member.displayName}
                            </div>
                            <div className="text-[10px] font-mono text-[#8c887e]">
                              @{member.username}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 flex-wrap justify-end">
                          {member.matchedSkills.slice(0, 2).map((ms, i) => (
                            <span
                              key={i}
                              className="rounded bg-emerald-950/40 border border-emerald-500/30 px-1.5 py-0.2 text-[9px] font-mono text-emerald-300"
                            >
                              {ms}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-[#2b2a29] bg-[#141312]/60 p-3 text-center text-xs font-mono text-[#8c887e]">
                    No active project members currently confirm this skill set.
                  </div>
                )}
              </div>

              {/* Open Roles & Recommended Talent */}
              <div className="space-y-2 border-t border-[#2b2a29] pt-3">
                {item.openRoles.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-mono text-amber-300 uppercase">
                      <span>Active Open Roles ({item.openRoles.length})</span>
                      {onNavigateToTab && (
                        <button
                          type="button"
                          onClick={() => onNavigateToTab('team')}
                          className="flex items-center gap-1 text-[10px] font-mono text-amber-400 hover:underline"
                        >
                          View in Team <ArrowRight className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                    {item.openRoles.map((role) => (
                      <div
                        key={role.id}
                        className="flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-950/20 px-3 py-2 text-xs font-sans text-amber-200"
                      >
                        <span className="font-semibold">{role.title}</span>
                        <span className="font-mono text-[10px] text-amber-300/80">
                          {role.openPositions} Opening
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {item.sampleCandidate && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[10px] font-mono text-[#8c887e] uppercase">
                      <span className="flex items-center gap-1 text-amber-300">
                        <Sparkles className="h-3 w-3" /> Talent Recommendation
                      </span>
                      <span className="text-amber-400 font-bold">
                        {item.sampleCandidate.matchScore}% Match
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-[#2b2a29] bg-[#141312] p-2.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar
                          src={item.sampleCandidate.avatarUrl}
                          name={item.sampleCandidate.displayName}
                          size="xs"
                          className="!h-7 !w-7 text-[10px] border border-[#363433]"
                        />
                        <div>
                          <div className="text-xs font-headline font-bold text-white">
                            {item.sampleCandidate.displayName}
                          </div>
                          <div className="text-[10px] font-mono text-[#8c887e] truncate max-w-[180px]">
                            {item.sampleCandidate.headline ||
                              `@${item.sampleCandidate.username}`}
                          </div>
                        </div>
                      </div>

                      {project.isFounder && onNavigateToTab && (
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<ArrowRight className="h-3 w-3" />}
                          onClick={() => onNavigateToTab('team')}
                        >
                          <span className="text-[11px] font-mono">Invite</span>
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
