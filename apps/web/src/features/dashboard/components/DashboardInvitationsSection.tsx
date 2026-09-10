import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Mail,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
  ChevronRight,
  Send,
  Ban,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { useAuthStore } from '../../auth/store/authStore';
import { formatApiAssetUrl } from '../../profile/services/profileService';
import {
  fetchUserInvitations,
  respondToInvitation,
  cancelProjectInvitation,
} from '../../projects/services/talentMatchingService';
import type { UserInvitationDetail, UserInvitationsResponse } from '../../projects/services/talentMatchingService';

export const DashboardInvitationsSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pending' | 'received_history' | 'sent'>('pending');
  const [data, setData] = useState<UserInvitationsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const accessToken = useAuthStore((state) => state.accessToken);

  const loadInvitations = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchUserInvitations(accessToken);
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load invitations.');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    loadInvitations();
  }, [loadInvitations]);

  const handleRespond = async (invitationId: string, action: 'ACCEPT' | 'REJECT', projectName: string) => {
    if (!accessToken) return;
    setProcessingId(invitationId);
    setActionError(null);
    setSuccessMessage(null);

    try {
      await respondToInvitation(accessToken, invitationId, action);
      if (action === 'ACCEPT') {
        setSuccessMessage(`Invitation accepted! You are now an official team member of ${projectName}.`);
      } else {
        setSuccessMessage(`Invitation declined.`);
      }

      // Immediate state update without full reload
      setData((prev) => {
        if (!prev) return prev;
        const newReceived = prev.received.map((inv) =>
          inv.id === invitationId ? { ...inv, status: action === 'ACCEPT' ? 'ACCEPTED' : 'REJECTED' } : inv,
        );
        const pendingCount = newReceived.filter((i) => i.status === 'PENDING').length;
        return { ...prev, received: newReceived, pendingCount };
      });
    } catch (err: any) {
      setActionError(err.message || `Failed to ${action.toLowerCase()} invitation.`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancel = async (invitationId: string) => {
    if (!accessToken) return;
    setProcessingId(invitationId);
    setActionError(null);
    setSuccessMessage(null);

    try {
      await cancelProjectInvitation(accessToken, invitationId);
      setSuccessMessage('Invitation cancelled successfully.');

      // Immediate state update
      setData((prev) => {
        if (!prev) return prev;
        const newSent = prev.sent.map((inv) =>
          inv.id === invitationId ? { ...inv, status: 'CANCELLED' } : inv,
        );
        return { ...prev, sent: newSent };
      });
    } catch (err: any) {
      setActionError(err.message || 'Failed to cancel invitation.');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="rounded-3xl border border-[#363433] bg-[#1c1b1a] p-12 text-center font-mono text-xs text-[#8c887e] animate-pulse">
        Fetching your project invitations...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-xs text-red-400 font-mono">
        {error}
      </div>
    );
  }

  const receivedPending = data?.received.filter((i) => i.status === 'PENDING') || [];
  const receivedHistory = data?.received.filter((i) => i.status !== 'PENDING') || [];
  const sentInvitations = data?.sent || [];

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2b2a29] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-amber-400" />
            <h2 className="font-headline text-xl font-bold text-[#ffffff]">Project Invitations</h2>
            {receivedPending.length > 0 && (
              <Badge variant="accent" className="normal-case text-[10px]">
                {receivedPending.length} Action Required
              </Badge>
            )}
          </div>
          <p className="mt-1 text-xs text-[#8c887e]">
            Review official team invitations from project founders or track invitations sent to prospective collaborators.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1.5 rounded-2xl border border-[#2b2a29] bg-[#141312] p-1.5 font-mono text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`rounded-xl px-3 py-1.5 transition-colors flex items-center gap-2 ${
              activeTab === 'pending'
                ? 'bg-[#201f1e] font-bold text-[#ffffff] shadow-md border border-[#363433]'
                : 'text-[#8c887e] hover:text-[#e6e2df]'
            }`}
          >
            <span>Pending</span>
            {receivedPending.length > 0 && (
              <span className="rounded-full bg-amber-500/20 text-amber-400 text-[10px] px-1.5 py-0.2">
                {receivedPending.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('received_history')}
            className={`rounded-xl px-3 py-1.5 transition-colors ${
              activeTab === 'received_history'
                ? 'bg-[#201f1e] font-bold text-[#ffffff] shadow-md border border-[#363433]'
                : 'text-[#8c887e] hover:text-[#e6e2df]'
            }`}
          >
            Received History ({receivedHistory.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sent')}
            className={`rounded-xl px-3 py-1.5 transition-colors ${
              activeTab === 'sent'
                ? 'bg-[#201f1e] font-bold text-[#ffffff] shadow-md border border-[#363433]'
                : 'text-[#8c887e] hover:text-[#e6e2df]'
            }`}
          >
            Sent by Me ({sentInvitations.length})
          </button>
        </div>
      </div>

      {/* Alert Banners */}
      {successMessage && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs font-mono text-emerald-400 animate-fadeIn">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {actionError && (
        <div className="flex items-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-xs font-mono text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'pending' && (
        receivedPending.length === 0 ? (
          <div className="rounded-3xl border border-[#363433] bg-[#1c1b1a] p-10 text-center space-y-2">
            <Mail className="mx-auto h-8 w-8 text-[#8c887e]" />
            <p className="font-headline text-sm font-semibold text-[#ffffff]">No Pending Invitations</p>
            <p className="text-xs text-[#8c887e] max-w-sm mx-auto">
              You currently have no outstanding recruitment invitations requiring your response.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {receivedPending.map((inv) => (
              <InvitationCard
                key={inv.id}
                invitation={inv}
                mode="received"
                isProcessing={processingId === inv.id}
                onAccept={() => handleRespond(inv.id, 'ACCEPT', inv.project.name)}
                onReject={() => handleRespond(inv.id, 'REJECT', inv.project.name)}
              />
            ))}
          </div>
        )
      )}

      {activeTab === 'received_history' && (
        receivedHistory.length === 0 ? (
          <div className="rounded-3xl border border-[#363433] bg-[#1c1b1a] p-10 text-center space-y-2">
            <Clock className="mx-auto h-8 w-8 text-[#8c887e]" />
            <p className="font-headline text-sm font-semibold text-[#ffffff]">No Invitation History</p>
            <p className="text-xs text-[#8c887e]">You have no previously accepted, declined, or expired invitations.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {receivedHistory.map((inv) => (
              <InvitationCard key={inv.id} invitation={inv} mode="history" />
            ))}
          </div>
        )
      )}

      {activeTab === 'sent' && (
        sentInvitations.length === 0 ? (
          <div className="rounded-3xl border border-[#363433] bg-[#1c1b1a] p-10 text-center space-y-2">
            <Send className="mx-auto h-8 w-8 text-[#8c887e]" />
            <p className="font-headline text-sm font-semibold text-[#ffffff]">No Sent Invitations</p>
            <p className="text-xs text-[#8c887e]">Invitations you send to candidates as a project founder will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sentInvitations.map((inv) => (
              <InvitationCard
                key={inv.id}
                invitation={inv}
                mode="sent"
                isProcessing={processingId === inv.id}
                onCancel={() => handleCancel(inv.id)}
              />
            ))}
          </div>
        )
      )}
    </div>
  );
};

interface InvitationCardProps {
  invitation: UserInvitationDetail;
  mode: 'received' | 'history' | 'sent';
  isProcessing?: boolean;
  onAccept?: () => void;
  onReject?: () => void;
  onCancel?: () => void;
}

const InvitationCard: React.FC<InvitationCardProps> = ({
  invitation,
  mode,
  isProcessing,
  onAccept,
  onReject,
  onCancel,
}) => {
  const { project, projectRole, inviter, invitee, status, message, createdAt } = invitation;

  return (
    <div className="rounded-3xl border border-[#363433] bg-[#1c1b1a] p-6 space-y-5 shadow-xl transition-colors hover:border-[#48473f]">
      {/* Top Banner: Project + Status */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-[#2b2a29] pb-4">
        <div className="flex items-start gap-4">
          {project.coverUrl ? (
            <img
              src={formatApiAssetUrl(project.coverUrl)}
              alt={project.name}
              className="h-14 w-14 rounded-2xl object-cover border border-[#48473f]"
            />
          ) : (
            <div className="h-14 w-14 rounded-2xl bg-[#201f1e] border border-[#48473f] flex items-center justify-center font-bold text-sm text-[#ffffff]">
              {project.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="space-y-1">
            <Link
              to={`/projects/${project.id}`}
              className="font-headline text-lg font-bold text-[#ffffff] hover:underline flex items-center gap-1.5"
            >
              <span>{project.name}</span>
              <ChevronRight className="h-4 w-4 text-[#8c887e]" />
            </Link>
            <p className="text-xs text-[#cac6bc] line-clamp-2">{project.description}</p>
            <div className="flex items-center gap-3 text-[11px] font-mono text-[#8c887e] flex-wrap pt-1">
              {project.genre && <span>Genre: {project.genre}</span>}
              {project.gameEngine && <span>Engine: {project.gameEngine}</span>}
              {project.platform && <span>Platform: {project.platform}</span>}
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="shrink-0 font-mono text-xs">
          {status === 'PENDING' && (
            <Badge variant="bronze" className="normal-case text-amber-400">
              <Clock className="mr-1 h-3 w-3 inline" /> Pending Response
            </Badge>
          )}
          {status === 'ACCEPTED' && (
            <Badge variant="accent" className="normal-case text-emerald-400">
              <CheckCircle2 className="mr-1 h-3 w-3 inline" /> Accepted
            </Badge>
          )}
          {status === 'REJECTED' && (
            <Badge variant="default" className="normal-case text-red-400">
              <XCircle className="mr-1 h-3 w-3 inline" /> Declined
            </Badge>
          )}
          {status === 'CANCELLED' && (
            <Badge variant="default" className="normal-case text-zinc-400">
              <Ban className="mr-1 h-3 w-3 inline" /> Cancelled
            </Badge>
          )}
        </div>
      </div>

      {/* Role & Inviter Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
        {/* Role Details */}
        <div className="rounded-2xl border border-[#2b2a29] bg-[#141312] p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[#8c887e] text-[11px] uppercase">Offered Position</span>
            <Badge variant="accent" className="text-[9px]">
              {projectRole.commitment.replace('_', ' ')}
            </Badge>
          </div>
          <p className="font-bold text-sm text-[#ffffff]">{projectRole.title}</p>
          <p className="text-[11px] text-[#cac6bc]">Required Level: {projectRole.experienceLevel}</p>
        </div>

        {/* Inviter / Candidate Details */}
        <div className="rounded-2xl border border-[#2b2a29] bg-[#141312] p-4 space-y-2">
          <span className="text-[#8c887e] text-[11px] uppercase">
            {mode === 'sent' ? 'Invited Candidate' : 'Project Founder'}
          </span>
          <div className="flex items-center gap-3 pt-1">
            {mode === 'sent' ? (
              invitee.avatarUrl ? (
                <img
                  src={formatApiAssetUrl(invitee.avatarUrl)}
                  alt={invitee.displayName}
                  className="h-8 w-8 rounded-full object-cover border border-[#48473f]"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-[#201f1e] border border-[#48473f] flex items-center justify-center font-bold text-xs text-[#ffffff]">
                  {invitee.displayName.charAt(0).toUpperCase()}
                </div>
              )
            ) : inviter.avatarUrl ? (
              <img
                src={formatApiAssetUrl(inviter.avatarUrl)}
                alt={inviter.displayName}
                className="h-8 w-8 rounded-full object-cover border border-[#48473f]"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-[#201f1e] border border-[#48473f] flex items-center justify-center font-bold text-xs text-[#ffffff]">
                {inviter.displayName.charAt(0).toUpperCase()}
              </div>
            )}

            <div>
              <p className="font-bold text-[#ffffff]">
                {mode === 'sent' ? invitee.displayName : inviter.displayName}
              </p>
              <p className="text-[11px] text-[#8c887e]">
                @{mode === 'sent' ? invitee.username : inviter.username}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Personal Message */}
      {message && (
        <div className="rounded-2xl border border-[#2b2a29] bg-[#141312] p-3 text-xs italic text-[#cac6bc] font-mono">
          "{message}"
        </div>
      )}

      {/* Card Footer: Timestamp & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[#2b2a29] pt-4 font-mono text-xs">
        <span className="text-[#8c887e]">
          Sent {new Date(createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>

        {/* Actions for Received Pending */}
        {mode === 'received' && status === 'PENDING' && (
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={isProcessing}
              onClick={onReject}
            >
              {isProcessing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Decline'}
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={isProcessing}
              icon={isProcessing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
              onClick={onAccept}
            >
              {isProcessing ? 'Accepting...' : 'Accept Invitation'}
            </Button>
          </div>
        )}

        {/* Action for Sent Pending */}
        {mode === 'sent' && status === 'PENDING' && onCancel && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={isProcessing}
            onClick={onCancel}
          >
            {isProcessing ? 'Cancelling...' : 'Cancel Invitation'}
          </Button>
        )}
      </div>
    </div>
  );
};
