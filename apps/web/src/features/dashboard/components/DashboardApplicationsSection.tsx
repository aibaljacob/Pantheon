import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  AlertCircle,
  Undo2,
  Briefcase,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { useAuthStore } from '../../auth/store/authStore';
import { formatApiAssetUrl } from '../../profile/services/profileService';
import {
  fetchCandidateApplications,
  withdrawCandidateApplication,
  type CandidateApplicationDetail,
} from '../../projects/services/projectApplicationService';

export const DashboardApplicationsSection: React.FC = () => {
  const [applications, setApplications] = useState<CandidateApplicationDetail[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const accessToken = useAuthStore((state) => state.accessToken);

  const loadApplications = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCandidateApplications(accessToken);
      setApplications(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load your submitted applications.');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const handleWithdraw = async (applicationId: string, projectName: string, roleName: string) => {
    if (!accessToken) return;
    if (
      !window.confirm(
        `Are you sure you want to withdraw your application for "${roleName}" on "${projectName}"?`,
      )
    ) {
      return;
    }

    setProcessingId(applicationId);
    setActionError(null);

    try {
      await withdrawCandidateApplication(accessToken, applicationId);
      await loadApplications();
    } catch (err: any) {
      setActionError(err.message || 'Failed to withdraw application.');
    } finally {
      setProcessingId(null);
    }
  };

  const pendingCount = applications.filter((a) => a.status === 'PENDING').length;

  return (
    <div className="space-y-4 font-mono">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#2b2a29] pb-3 text-xs">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-amber-400" />
          <h3 className="font-headline text-base font-bold text-[#ffffff]">
            My Applications
          </h3>
          {pendingCount > 0 && (
            <span className="rounded-full bg-amber-500/20 border border-amber-500/40 px-2 py-0.2 text-[10px] text-amber-300 font-bold">
              {pendingCount} Active
            </span>
          )}
        </div>
        <span className="text-[#8c887e]">
          {applications.length} {applications.length === 1 ? 'submission' : 'submissions'}
        </span>
      </div>

      {/* Action Error */}
      {actionError && (
        <div className="flex items-center gap-2 rounded-2xl border border-red-500/30 bg-red-950/20 p-3 text-xs text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="py-8 text-center text-xs text-[#8c887e] animate-pulse">
          Loading your applications...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-xs text-red-400">
          {error}
        </div>
      ) : applications.length === 0 ? (
        <div className="rounded-3xl border border-[#363433] bg-[#1c1b1a] p-6 text-center space-y-2">
          <p className="font-headline text-sm font-semibold text-[#ffffff]">
            No Applications Submitted
          </p>
          <p className="text-xs text-[#8c887e]">
            Browse published productions and submit applications for open positions that match your game dev skills.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => {
            const project = app.project;
            const role = app.projectRole;
            const isPending = app.status === 'PENDING';
            const isAccepted = app.status === 'ACCEPTED';
            const isProcessing = processingId === app.id;

            return (
              <div
                key={app.id}
                className="rounded-2xl border border-[#2b2a29] bg-[#1c1b1a] p-4 space-y-3 transition-colors hover:border-[#363433]"
              >
                {/* Top Row: Project & Role info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {project.coverUrl ? (
                      <img
                        src={formatApiAssetUrl(project.coverUrl)}
                        alt={project.name}
                        className="h-10 w-10 rounded-xl object-cover border border-[#48473f]"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-xl bg-[#141312] border border-[#363433] flex items-center justify-center text-amber-400">
                        <Briefcase className="h-4 w-4" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          to={`/projects/${project.id}`}
                          className="font-headline text-sm font-bold text-[#ffffff] hover:text-amber-200 transition-colors"
                        >
                          {project.name}
                        </Link>
                        <Badge
                          variant={
                            isPending
                              ? 'accent'
                              : isAccepted
                              ? 'default'
                              : 'bronze'
                          }
                          className="text-[9px]"
                        >
                          {app.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-[#8c887e] mt-0.5">
                        <span className="text-[#cac6bc] font-semibold">{role.title || role.roleName}</span>
                        <span>·</span>
                        <span>{role.experienceLevel}</span>
                        <span>·</span>
                        <span>{role.commitment.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Submission date & status */}
                  <div className="flex items-center gap-2 self-end sm:self-auto text-xs">
                    <span className="text-[11px] text-[#8c887e]">
                      Applied {new Date(app.createdAt).toLocaleDateString()}
                    </span>
                    {isPending && (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isProcessing}
                        onClick={() => handleWithdraw(app.id, project.name, role.title || role.roleName)}
                        icon={<Undo2 className="h-3 w-3" />}
                        className="text-red-400 hover:text-red-300"
                      >
                        {isProcessing ? 'Withdrawing...' : 'Withdraw'}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Pitch Message preview */}
                {app.message && (
                  <p className="text-xs text-[#8c887e] font-sans bg-[#141312] rounded-xl p-2.5 border border-[#201f1e]">
                    "{app.message}"
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
