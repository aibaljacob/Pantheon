import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  UserCheck,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { useAuthStore } from '../../auth/store/authStore';
import { formatApiAssetUrl } from '../../profile/services/profileService';
import {
  fetchProjectApplications,
  respondToProjectApplication,
  type FounderApplicationDetail,
} from '../services/projectApplicationService';

interface FounderApplicationsSectionProps {
  projectId: string;
  onApplicationProcessed?: () => void;
  onMemberAdded?: () => void;
}

export const FounderApplicationsSection: React.FC<FounderApplicationsSectionProps> = ({
  projectId,
  onApplicationProcessed,
  onMemberAdded,
}) => {
  const [applications, setApplications] = useState<FounderApplicationDetail[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'ACCEPTED' | 'REJECTED'>('ALL');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const accessToken = useAuthStore((state) => state.accessToken);

  const loadApplications = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProjectApplications(accessToken, projectId);
      setApplications(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load applications.');
    } finally {
      setLoading(false);
    }
  }, [accessToken, projectId]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const handleRespond = async (applicationId: string, action: 'ACCEPT' | 'REJECT', applicantName: string) => {
    if (!accessToken) return;
    if (
      action === 'ACCEPT' &&
      !window.confirm(
        `Accept application from ${applicantName}? This will add them to the team roster and mark the role as FILLED.`,
      )
    ) {
      return;
    }

    setProcessingId(applicationId);
    setActionError(null);

    try {
      await respondToProjectApplication(accessToken, applicationId, action);
      await loadApplications();
      onApplicationProcessed?.();
      if (action === 'ACCEPT') {
        onMemberAdded?.();
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to respond to application.');
    } finally {
      setProcessingId(null);
    }
  };

  const filtered = applications.filter((app) => {
    if (filter === 'ALL') return true;
    return app.status === filter;
  });

  const pendingCount = applications.filter((a) => a.status === 'PENDING').length;

  return (
    <div className="space-y-6 font-mono">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2b2a29] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-amber-400" />
            <h3 className="font-headline text-xl font-bold text-[#ffffff]">
              Candidate Applications
            </h3>
            {pendingCount > 0 && (
              <span className="rounded-full bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 text-xs text-amber-300 font-bold">
                {pendingCount} Pending
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-[#8c887e]">
            Review candidate pitches, verified skill overlaps, deterministic compatibility scores, and accept applicants into your production team.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 rounded-2xl border border-[#2b2a29] bg-[#141312] p-1.5 text-xs">
          {(['ALL', 'PENDING', 'ACCEPTED', 'REJECTED'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`rounded-xl px-3 py-1.5 transition-colors ${
                filter === tab
                  ? 'bg-[#201f1e] font-bold text-[#ffffff] shadow-md border border-[#363433]'
                  : 'text-[#8c887e] hover:text-[#e6e2df]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Action Error Banner */}
      {actionError && (
        <div className="flex items-center gap-2 rounded-2xl border border-red-500/30 bg-red-950/20 p-3 text-xs text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Loading / Error / Empty States */}
      {loading ? (
        <div className="py-12 text-center text-xs text-[#8c887e] animate-pulse">
          Loading candidate applications...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-xs text-red-400">
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-[#363433] bg-[#1c1b1a] p-8 text-center space-y-2">
          <p className="font-headline text-sm font-semibold text-[#ffffff]">
            No Applications Found
          </p>
          <p className="text-xs text-[#8c887e]">
            {filter === 'ALL'
              ? 'No developers have applied for open roles on this project yet.'
              : `No applications match the '${filter}' filter.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((app) => {
            const applicant = app.applicant;
            const isPending = app.status === 'PENDING';
            const isAccepted = app.status === 'ACCEPTED';
            const isProcessing = processingId === app.id;
            const isExpanded = expandedId === app.id;

            return (
              <div
                key={app.id}
                className="rounded-3xl border border-[#363433] bg-[#1c1b1a] p-5 space-y-4 shadow-xl transition-colors hover:border-[#48473f]"
              >
                {/* Header Row: Applicant Info & Applied Role */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    {applicant.avatarUrl ? (
                      <img
                        src={formatApiAssetUrl(applicant.avatarUrl)}
                        alt={applicant.displayName}
                        className="h-12 w-12 rounded-full object-cover border border-[#48473f]"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-[#201f1e] border border-[#48473f] flex items-center justify-center font-bold text-sm text-[#ffffff]">
                        {applicant.displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-headline text-base font-bold text-[#ffffff]">
                          {applicant.displayName}
                        </h4>
                        <span className="text-xs text-[#8c887e]">@{applicant.username}</span>
                        <Badge
                          variant={
                            isPending
                              ? 'accent'
                              : isAccepted
                              ? 'default'
                              : 'bronze'
                          }
                          className="text-[10px]"
                        >
                          {app.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-[#cac6bc]">{applicant.headline || 'Game Developer'}</p>
                      <div className="flex items-center gap-3 text-[11px] text-[#8c887e] flex-wrap">
                        {applicant.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {applicant.location}
                          </span>
                        )}
                        {applicant.experienceYears !== null && applicant.experienceYears !== undefined && (
                          <span>{applicant.experienceYears} Years Exp</span>
                        )}
                        {applicant.availability && <span>· {applicant.availability}</span>}
                        <span>· Applied {new Date(app.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Role & Match Badge */}
                  <div className="flex flex-col sm:items-end gap-2 shrink-0">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] text-[#8c887e] uppercase block">Applied For</span>
                      <span className="font-bold text-xs text-[#ffffff]">
                        {app.projectRole.title || app.projectRole.roleName}
                      </span>
                    </div>

                    {app.matchScore !== undefined && (
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <span className="text-base font-bold text-[#ffffff]">{app.matchScore}%</span>
                          <span className="text-[10px] uppercase text-[#8c887e] block">Compatibility</span>
                        </div>
                        <Badge variant={app.matchScore >= 75 ? 'accent' : 'bronze'} className="text-[10px]">
                          {app.matchGrade?.replace('_MATCH', '') || 'MATCH'}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>

                {/* Pitch / Message */}
                {app.message && (
                  <div className="rounded-2xl border border-[#2b2a29] bg-[#141312] p-3 text-xs text-[#cac6bc] space-y-1">
                    <span className="text-[10px] uppercase text-[#8c887e] font-semibold block">
                      Applicant Pitch
                    </span>
                    <p className="leading-relaxed whitespace-pre-line font-sans">
                      {app.message}
                    </p>
                  </div>
                )}

                {/* Skills & Tools Tags */}
                {(applicant.skills.length > 0 || applicant.tools.length > 0) && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {applicant.skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-md border border-[#363433] bg-[#141312] px-2 py-0.5 text-[10px] text-[#e6e2df]"
                      >
                        {skill}
                      </span>
                    ))}
                    {applicant.tools.map((tool) => (
                      <span
                        key={tool}
                        className="rounded-md border border-[#363433] bg-[#141312] px-2 py-0.5 text-[10px] text-[#8c887e]"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                )}

                {/* Score Breakdown Toggle */}
                {app.matchBreakdown && (
                  <div>
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : app.id)}
                      className="flex items-center gap-1 text-[11px] text-[#8c887e] hover:text-[#ffffff] transition-colors"
                    >
                      <span>{isExpanded ? 'Hide Score Breakdown' : 'View Score Breakdown'}</span>
                      {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </button>

                    {isExpanded && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3 pt-3 border-t border-[#2b2a29] text-xs">
                        <div className="rounded-xl border border-[#2b2a29] bg-[#141312] p-2.5">
                          <span className="text-[#8c887e] text-[10px] uppercase block">Role Taxonomy</span>
                          <span className="font-bold text-[#ffffff]">{app.matchBreakdown.roleMatch} / 25 Pts</span>
                        </div>
                        <div className="rounded-xl border border-[#2b2a29] bg-[#141312] p-2.5">
                          <span className="text-[#8c887e] text-[10px] uppercase block">Skill Alignment</span>
                          <span className="font-bold text-[#ffffff]">{app.matchBreakdown.skillMatch} / 25 Pts</span>
                        </div>
                        <div className="rounded-xl border border-[#2b2a29] bg-[#141312] p-2.5">
                          <span className="text-[#8c887e] text-[10px] uppercase block">Tool Fit</span>
                          <span className="font-bold text-[#ffffff]">{app.matchBreakdown.toolMatch} / 15 Pts</span>
                        </div>
                        <div className="rounded-xl border border-[#2b2a29] bg-[#141312] p-2.5">
                          <span className="text-[#8c887e] text-[10px] uppercase block">Experience</span>
                          <span className="font-bold text-[#ffffff]">{app.matchBreakdown.experienceMatch} / 15 Pts</span>
                        </div>
                        <div className="rounded-xl border border-[#2b2a29] bg-[#141312] p-2.5">
                          <span className="text-[#8c887e] text-[10px] uppercase block">Availability</span>
                          <span className="font-bold text-[#ffffff]">{app.matchBreakdown.availabilityMatch} / 10 Pts</span>
                        </div>
                        <div className="rounded-xl border border-[#2b2a29] bg-[#141312] p-2.5">
                          <span className="text-[#8c887e] text-[10px] uppercase block">Engine / Context</span>
                          <span className="font-bold text-[#ffffff]">{app.matchBreakdown.projectContextMatch} / 10 Pts</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Footer Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-[#2b2a29] flex-wrap gap-2">
                  <Link
                    to={`/u/${applicant.username}`}
                    className="inline-flex items-center gap-1.5 text-xs text-[#8c887e] hover:text-[#ffffff] transition-colors"
                  >
                    <span>View Profile</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>

                  {isPending ? (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={isProcessing}
                        onClick={() => handleRespond(app.id, 'REJECT', applicant.displayName)}
                        icon={<XCircle className="h-3.5 w-3.5" />}
                      >
                        Reject
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={isProcessing}
                        onClick={() => handleRespond(app.id, 'ACCEPT', applicant.displayName)}
                        icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                      >
                        {isProcessing ? 'Processing...' : 'Accept Application'}
                      </Button>
                    </div>
                  ) : isAccepted ? (
                    <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Accepted into Team</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs text-[#8c887e]">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{app.status}</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
