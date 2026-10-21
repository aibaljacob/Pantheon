import React, { useState } from 'react';
import {
  ThumbsUp,
  ThumbsDown,
  MinusCircle,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Sparkles,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  ExternalLink,
  X,
  Edit2,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '../../../../../components/ui/Button';
import type {
  ArtProposalCategory,
  ArtProposalItem,
  ArtVoteType,
  ProjectDetail,
} from '../../../types';
import { formatApiAssetUrl } from '../../../../profile/services/profileService';
import { useAuthStore } from '../../../../auth/store/authStore';
import {
  voteArtProposal,
  reviseArtProposal,
  founderDecisionArtProposal,
  updateArtProposal,
  deleteArtProposal,
} from '../../../services/artDesignService';

interface ArtProposalsViewProps {
  project: ProjectDetail;
  proposals: ArtProposalItem[];
  token?: string;
  onRefresh: () => void;
  onOpenNewProposal: () => void;
  onOpenConvertTask: (proposal: ArtProposalItem) => void;
}

const CATEGORY_LABELS: Record<ArtProposalCategory, string> = {
  CHARACTERS_COSTUMES: 'Characters & Costumes',
  ENVIRONMENTS_ARCHITECTURE: 'Environments & Architecture',
  PROPS_WEAPONS: 'Props & Weapons',
  UI_ICONS: 'UI & Icons',
  LIGHTING_COLOR: 'Lighting & Color Studies',
};

export const ArtProposalsView: React.FC<ArtProposalsViewProps> = ({
  project,
  proposals,
  token,
  onRefresh,
  onOpenNewProposal,
  onOpenConvertTask,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeProposal, setActiveProposal] = useState<ArtProposalItem | null>(null);

  // Lightbox preview for references
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  // Voting state inside drawer
  const [voteFeedback, setVoteFeedback] = useState('');
  const [isVoting, setIsVoting] = useState(false);

  // Founder decision state
  const [founderNotes, setFounderNotes] = useState('');
  const [isDeciding, setIsDeciding] = useState(false);

  // Revision state
  const [isRevising, setIsRevising] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState('');
  const [revisedTitle, setRevisedTitle] = useState('');
  const [isSubmittingRevision, setIsSubmittingRevision] = useState(false);

  const currentUser = useAuthStore((state) => state.currentUser);
  const accessToken = useAuthStore((state) => state.accessToken);
  const effectiveToken = token || accessToken || undefined;

  // Edit proposal state
  const [editingProposal, setEditingProposal] = useState<ArtProposalItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState<ArtProposalCategory>('ENVIRONMENTS_ARCHITECTURE');
  const [editRationale, setEditRationale] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete confirmation state
  const [deletingProposal, setDeletingProposal] = useState<ArtProposalItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  // Filtered proposals
  const filteredProposals = proposals.filter((p) => {
    if (selectedCategory !== 'ALL' && p.category !== selectedCategory) return false;
    if (selectedStatus !== 'ALL' && p.status !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchRationale = p.rationale.toLowerCase().includes(q);
      const matchAuthor = p.author.displayName.toLowerCase().includes(q);
      if (!matchTitle && !matchRationale && !matchAuthor) return false;
    }
    return true;
  });

  const handleVote = async (voteType: ArtVoteType) => {
    if (!activeProposal || !token) return;
    setIsVoting(true);
    setFeedbackError(null);
    try {
      const updated = await voteArtProposal(
        project.id,
        activeProposal.id,
        { voteType, feedback: voteFeedback.trim() || undefined },
        token,
      );
      setActiveProposal(updated);
      setVoteFeedback('');
      onRefresh();
    } catch (err: unknown) {
      setFeedbackError(err instanceof Error ? err.message : 'Failed to cast vote.');
    } finally {
      setIsVoting(false);
    }
  };


  const handleFounderDecision = async (decision: 'APPROVED' | 'REJECTED') => {
    if (!activeProposal || !token) return;
    setIsDeciding(true);
    setFeedbackError(null);
    try {
      const updated = await founderDecisionArtProposal(
        project.id,
        activeProposal.id,
        { decision, decisionNotes: founderNotes.trim() || undefined },
        token,
      );
      setActiveProposal(updated);
      setFounderNotes('');
      onRefresh();
    } catch (err: unknown) {
      setFeedbackError(err instanceof Error ? err.message : 'Founder decision failed.');
    } finally {
      setIsDeciding(false);
    }
  };

  const handleRevisionSubmit = async () => {
    if (!activeProposal || !token || !revisionNotes.trim()) return;
    setIsSubmittingRevision(true);
    setFeedbackError(null);
    try {
      const updated = await reviseArtProposal(
        project.id,
        activeProposal.id,
        {
          revisionNotes: revisionNotes.trim(),
          title: revisedTitle.trim() || undefined,
        },
        token,
      );
      setActiveProposal(updated);
      setIsRevising(false);
      setRevisionNotes('');
      setRevisedTitle('');
      onRefresh();
    } catch (err: unknown) {
      setFeedbackError(err instanceof Error ? err.message : 'Failed to submit revision.');
    } finally {
      setIsSubmittingRevision(false);
    }
  };
  const handleEditClick = (p: ArtProposalItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingProposal(p);
    setEditTitle(p.title);
    setEditCategory(p.category);
    setEditRationale(p.rationale);
    setEditNotes(p.designNotes || '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProposal || !effectiveToken) return;
    setIsSavingEdit(true);
    setFeedbackError(null);
    try {
      const updated = await updateArtProposal(
        project.id,
        editingProposal.id,
        {
          title: editTitle.trim(),
          category: editCategory,
          rationale: editRationale.trim() || editTitle.trim(),
          designNotes: editNotes.trim() || undefined,
        },
        effectiveToken,
      );
      if (activeProposal && activeProposal.id === updated.id) {
        setActiveProposal(updated);
      }
      setEditingProposal(null);
      onRefresh();
    } catch (err: unknown) {
      setFeedbackError(err instanceof Error ? err.message : 'Failed to update proposal.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteProposal = async () => {
    if (!deletingProposal) return;
    if (!effectiveToken) {
      setDeleteError('Authentication token not found. Please log in.');
      return;
    }
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteArtProposal(project.id, deletingProposal.id, effectiveToken);
      if (activeProposal && activeProposal.id === deletingProposal.id) {
        setActiveProposal(null);
      }
      setDeletingProposal(null);
      onRefresh();
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete proposal.');
    } finally {
      setIsDeleting(false);
    }
  };
  return (
    <div className="space-y-6">
      {/* Top Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 rounded-2xl border border-[#2b2a29] bg-[#141312] p-4">
        <div className="flex items-center gap-3 flex-1 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#8c887e]" />
            <input
              type="text"
              placeholder="Search proposals, rationale, artists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-[#363433] bg-[#1c1b1a] pl-9 pr-3 py-2 text-xs font-sans text-[#ffffff] focus:border-amber-400 focus:outline-none"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-[#8c887e]" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-xl border border-[#363433] bg-[#1c1b1a] px-3 py-2 text-xs font-mono text-[#cac6bc] focus:border-amber-400 focus:outline-none"
            >
              <option value="ALL">All Categories</option>
              <option value="CHARACTERS_COSTUMES">Characters & Costumes</option>
              <option value="ENVIRONMENTS_ARCHITECTURE">Environments & Arch</option>
              <option value="PROPS_WEAPONS">Props & Weapons</option>
              <option value="UI_ICONS">UI & Icons</option>
              <option value="LIGHTING_COLOR">Lighting & Colors</option>
            </select>
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-xl border border-[#363433] bg-[#1c1b1a] px-3 py-2 text-xs font-mono text-[#cac6bc] focus:border-amber-400 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="IN_VOTING">In Voting</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="REVISION_REQUESTED">Revision Active</option>
          </select>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={<Plus className="h-4 w-4 text-[#141312]" />}
          onClick={onOpenNewProposal}
        >
          Submit Proposal
        </Button>
      </div>

      {/* Proposals Grid */}
      {filteredProposals.length === 0 ? (
        <div className="rounded-3xl border border-[#2b2a29] bg-[#141312] p-12 text-center space-y-3">
          <Sparkles className="mx-auto h-8 w-8 text-amber-400/60" />
          <h4 className="font-headline text-base font-bold text-[#ffffff]">
            No Art Proposals Found
          </h4>
          <p className="max-w-md mx-auto text-xs font-mono text-[#8c887e]">
            Submit a new proposal with concept references and color swatches to start collaborative review and voting.
          </p>
          <div className="pt-2">
            <Button variant="secondary" size="sm" onClick={onOpenNewProposal}>
              Submit First Art Proposal
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProposals.map((proposal) => {
            const isApproved = proposal.status === 'APPROVED';
            const isRejected = proposal.status === 'REJECTED';
            const isInVoting = proposal.status === 'IN_VOTING';

            return (
              <div
                key={proposal.id}
                onClick={() => setActiveProposal(proposal)}
                className={`group relative flex flex-col justify-between rounded-2xl border p-5 transition-all cursor-pointer hover:scale-[1.01] ${
                  isApproved
                    ? 'border-emerald-500/30 bg-[#141815] hover:border-emerald-500/60'
                    : isRejected
                    ? 'border-red-500/30 bg-[#181313] hover:border-red-500/60'
                    : 'border-[#363433] bg-[#1c1b1a] hover:border-amber-500/50 hover:bg-[#201f1e]'
                }`}
              >
                <div className="space-y-3">
                  {/* Category & Status Badges */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="rounded-md border border-[#363433] bg-[#141312] px-2 py-0.5 text-[10px] font-mono text-amber-300">
                      {CATEGORY_LABELS[proposal.category] || proposal.category}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <span className="rounded-md border border-[#363433] bg-[#141312] px-2 py-0.5 text-[10px] font-mono font-bold text-[#8c887e]">
                        Round {proposal.currentRound}
                      </span>
                      {isApproved && (
                        <span className="rounded-full border border-emerald-500/40 bg-emerald-950/40 px-2 py-0.5 text-[10px] font-mono text-emerald-300 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Approved
                        </span>
                      )}
                      {isRejected && (
                        <span className="rounded-full border border-red-500/40 bg-red-950/40 px-2 py-0.5 text-[10px] font-mono text-red-300 flex items-center gap-1">
                          <XCircle className="h-3 w-3" /> Rejected
                        </span>
                      )}
                      {isInVoting && (
                        <span className="rounded-full border border-amber-500/40 bg-amber-950/40 px-2 py-0.5 text-[10px] font-mono text-amber-300 flex items-center gap-1">
                          <Clock className="h-3 w-3 animate-pulse" /> In Voting
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Author */}
                  <div>
                    <h4 className="font-headline text-base font-bold text-[#ffffff] group-hover:text-amber-300 transition-colors line-clamp-1">
                      {proposal.title}
                    </h4>
                    <p className="text-[11px] font-mono text-[#8c887e] mt-0.5">
                      by {proposal.author.displayName} • {new Date(proposal.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Rationale snippet */}
                  <p className="text-xs font-sans text-[#cac6bc] line-clamp-2 leading-relaxed">
                    {proposal.rationale}
                  </p>

                  {/* Palette Swatches Preview */}
                  {proposal.paletteColors && proposal.paletteColors.length > 0 && (
                    <div className="flex items-center gap-1 pt-1">
                      {proposal.paletteColors.slice(0, 5).map((color, i) => (
                        <div
                          key={i}
                          className="h-4 w-7 rounded border border-black/40 shadow-inner"
                          style={{ backgroundColor: color.hex }}
                          title={`${color.role}: ${color.hex}`}
                        />
                      ))}
                    </div>
                  )}

                  {/* Thumbnail Preview */}
                  {proposal.referenceImages && proposal.referenceImages.length > 0 && (
                    <div className="h-28 w-full overflow-hidden rounded-xl border border-[#2b2a29] bg-black/40">
                      <img
                        src={formatApiAssetUrl(proposal.referenceImages[0].url)}
                        alt="Reference"
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                  )}
                </div>

                {/* Card Actions if Author or Founder */}
                {(proposal.author.id === currentUser?.id || project.isFounder) && (
                  <div className="pt-2 flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={(e) => handleEditClick(proposal, e)}
                      className="p-1 rounded text-[#8c887e] hover:text-amber-400 hover:bg-[#141312] transition-colors"
                      title="Edit Submission"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingProposal(proposal);
                      }}
                      className="p-1 rounded text-[#8c887e] hover:text-red-400 hover:bg-[#141312] transition-colors"
                      title="Delete Submission"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                {/* Bottom Voting Stats Bar */}
                <div className="mt-4 pt-3 border-t border-[#2b2a29] space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono text-[#8c887e]">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-emerald-400">
                        <ThumbsUp className="h-3 w-3" /> {proposal.voteSummary.approveCount}
                      </span>
                      <span className="flex items-center gap-1 text-red-400">
                        <ThumbsDown className="h-3 w-3" /> {proposal.voteSummary.disapproveCount}
                      </span>
                      <span className="flex items-center gap-1 text-[#8c887e]">
                        <MinusCircle className="h-3 w-3" /> {proposal.voteSummary.neutralCount}
                      </span>
                    </div>

                    <span className="text-amber-400 font-semibold">
                      {proposal.voteSummary.participationRate}% Participation
                    </span>
                  </div>

                  {/* Task conversion badge */}
                  {proposal.createdTask && (
                    <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 px-2 py-1 text-[10px] font-mono text-emerald-300 flex items-center justify-between">
                      <span>Production Task: {proposal.createdTask.taskCode}</span>
                      <ExternalLink className="h-3 w-3" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Proposal Detail Drawer */}
      {activeProposal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 lg:p-6 xl:pl-[18.5rem] xl:pt-[6rem] bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-4xl max-h-[calc(100vh-6rem)] sm:max-h-[calc(100vh-7rem)] flex flex-col rounded-3xl border border-[#363433] bg-[#141312] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-[#2b2a29] px-6 py-5 shrink-0 bg-[#171615]">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="rounded-md border border-[#363433] bg-[#1c1b1a] px-2.5 py-0.5 text-xs font-mono text-amber-300">
                    {CATEGORY_LABELS[activeProposal.category]}
                  </span>
                  <span className="rounded-md border border-[#363433] bg-[#1c1b1a] px-2 py-0.5 text-xs font-mono font-bold text-[#8c887e]">
                    Voting Round {activeProposal.currentRound}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-mono font-semibold ${
                      activeProposal.status === 'APPROVED'
                        ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40'
                        : activeProposal.status === 'REJECTED'
                        ? 'bg-red-950/60 text-red-300 border border-red-500/40'
                        : 'bg-amber-950/60 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    {activeProposal.status}
                  </span>
                </div>
                <h2 className="font-headline text-2xl font-bold text-[#ffffff]">
                  {activeProposal.title}
                </h2>
                <p className="text-xs font-mono text-[#8c887e]">
                  Proposed by {activeProposal.author.displayName} (@{activeProposal.author.username}) on{' '}
                  {new Date(activeProposal.createdAt).toLocaleString()}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {(activeProposal.author.id === currentUser?.id || project.isFounder) && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Edit2 className="h-3.5 w-3.5" />}
                      onClick={() => handleEditClick(activeProposal)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Trash2 className="h-3.5 w-3.5 text-red-400" />}
                      onClick={() => setDeletingProposal(activeProposal)}
                      className="border border-red-500/30 text-red-400 hover:bg-red-950/30 hover:text-red-300"
                    >
                      Delete
                    </Button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setActiveProposal(null);
                    setIsRevising(false);
                  }}
                  className="rounded-lg p-2 text-[#8c887e] hover:bg-[#201f1e] hover:text-[#e6e2df]"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Scrollable Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">

            {feedbackError && (
              <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-3 text-xs font-mono text-red-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{feedbackError}</span>
              </div>
            )}

            {/* Rationale and Design Notes */}
            <div className="space-y-4">
              <div className="rounded-2xl border border-[#2b2a29] bg-[#1c1b1a] p-5 space-y-2">
                <div className="text-xs font-mono font-semibold text-amber-400 uppercase tracking-wider">
                  Creative Rationale
                </div>
                <p className="text-sm font-sans text-[#e6e2df] leading-relaxed whitespace-pre-wrap">
                  {activeProposal.rationale}
                </p>
              </div>

              {activeProposal.designNotes && (
                <div className="rounded-2xl border border-[#2b2a29] bg-[#1c1b1a] p-5 space-y-2">
                  <div className="text-xs font-mono font-semibold text-amber-400 uppercase tracking-wider">
                    Technical Design Notes & Material Targets
                  </div>
                  <p className="text-xs font-mono text-[#cac6bc] leading-relaxed whitespace-pre-wrap">
                    {activeProposal.designNotes}
                  </p>
                </div>
              )}

              {/* Palette swatches */}
              {activeProposal.paletteColors && activeProposal.paletteColors.length > 0 && (
                <div className="rounded-2xl border border-[#2b2a29] bg-[#1c1b1a] p-4 space-y-2">
                  <div className="text-xs font-mono font-semibold text-amber-400 uppercase tracking-wider">
                    Associated Color Palette
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {activeProposal.paletteColors.map((color, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-[#2b2a29] bg-[#141312] p-2 space-y-1"
                      >
                        <div
                          className="h-10 w-full rounded-lg border border-black/30"
                          style={{ backgroundColor: color.hex }}
                        />
                        <div className="text-[10px] font-mono font-bold text-amber-300">
                          {color.role}
                        </div>
                        <div className="text-[10px] font-mono text-[#8c887e]">
                          {color.hex}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reference Images */}
              {activeProposal.referenceImages && activeProposal.referenceImages.length > 0 && (
                <div className="rounded-2xl border border-[#2b2a29] bg-[#1c1b1a] p-4 space-y-3">
                  <div className="text-xs font-mono font-semibold text-amber-400 uppercase tracking-wider">
                    Reference Files & Art Boards
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {activeProposal.referenceImages.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() =>
                          setPreviewImage({
                            url: formatApiAssetUrl(img.url),
                            title: img.name || `${activeProposal.title} - Reference ${idx + 1}`,
                          })
                        }
                        className="group relative block w-full text-left rounded-xl border border-[#2b2a29] bg-[#141312] overflow-hidden focus:outline-none focus:border-amber-400"
                      >
                        <img
                          src={formatApiAssetUrl(img.url)}
                          alt={img.name || `Reference ${idx + 1}`}
                          className="h-36 w-full object-cover transition-transform group-hover:scale-105"
                        />
                        <div className="p-2 text-[10px] font-mono text-[#8c887e] truncate flex items-center justify-between">
                          <span className="truncate">{img.name || `Reference ${idx + 1}`}</span>
                          <span className="text-[10px] text-amber-400 shrink-0">View Larger</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Voting & Reviews Section */}
            <div className="rounded-2xl border border-amber-500/30 bg-[#1c1b1a] p-5 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h4 className="font-headline text-base font-bold text-[#ffffff]">
                    Round {activeProposal.currentRound} Team Voting
                  </h4>
                  <p className="text-xs font-mono text-[#8c887e]">
                    Active team members vote to inform production decision
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono">
                  <span className="text-emerald-400 font-bold">
                    ✓ {activeProposal.voteSummary.approveCount} Approve
                  </span>
                  <span className="text-red-400 font-bold">
                    ✗ {activeProposal.voteSummary.disapproveCount} Disapprove
                  </span>
                  <span className="text-[#8c887e]">
                    ○ {activeProposal.voteSummary.neutralCount} Neutral
                  </span>
                  <span className="rounded bg-[#141312] px-2 py-1 text-amber-400 font-bold border border-[#2b2a29]">
                    {activeProposal.voteSummary.participationRate}% participation
                  </span>
                </div>
              </div>

              {/* Voting buttons if in voting */}
              {activeProposal.status === 'IN_VOTING' && (
                <div className="space-y-3 pt-2 border-t border-[#2b2a29]">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Optional voting rationale / feedback..."
                      value={voteFeedback}
                      onChange={(e) => setVoteFeedback(e.target.value)}
                      className="flex-1 rounded-xl border border-[#363433] bg-[#141312] px-3.5 py-2 text-xs font-mono text-[#ffffff] focus:border-amber-400 focus:outline-none"
                    />
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<ThumbsUp className="h-4 w-4 text-[#141312]" />}
                      onClick={() => handleVote('APPROVE')}
                      disabled={isVoting}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<ThumbsDown className="h-4 w-4 text-red-400" />}
                      onClick={() => handleVote('DISAPPROVE')}
                      disabled={isVoting}
                      className="border border-red-500/30 text-red-400 hover:bg-red-950/30 hover:text-red-300"
                    >
                      Disapprove
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<MinusCircle className="h-4 w-4" />}
                      onClick={() => handleVote('NEUTRAL')}
                      disabled={isVoting}
                    >
                      Neutral
                    </Button>
                  </div>

                  {activeProposal.userVote && (
                    <p className="text-[11px] font-mono text-amber-300">
                      Your current vote: <span className="font-bold">{activeProposal.userVote.voteType}</span>
                      {activeProposal.userVote.feedback && ` — "${activeProposal.userVote.feedback}"`}
                    </p>
                  )}
                </div>
              )}

              {/* Member Vote Feedback & Notes */}
              {activeProposal.currentRoundVotes && activeProposal.currentRoundVotes.length > 0 && (
                <div className="space-y-2 pt-3 border-t border-[#2b2a29]">
                  <div className="text-[11px] font-mono font-semibold text-[#8c887e] uppercase tracking-wider">
                    Member Votes & Comments ({activeProposal.currentRoundVotes.length})
                  </div>
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {activeProposal.currentRoundVotes.map((v) => (
                      <div
                        key={v.id}
                        className="rounded-xl border border-[#2b2a29] bg-[#141312] p-3 space-y-1 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-[#ffffff]">
                            {v.displayName} (@{v.username})
                          </span>
                          <span
                            className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded ${
                              v.voteType === 'APPROVE'
                                ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/30'
                                : v.voteType === 'DISAPPROVE'
                                ? 'bg-red-950/70 text-red-300 border border-red-500/30'
                                : 'bg-[#201f1e] text-[#cac6bc] border border-[#363433]'
                            }`}
                          >
                            {v.voteType}
                          </span>
                        </div>
                        {v.feedback && (
                          <p className="text-xs font-sans text-[#cac6bc] leading-relaxed">
                            {v.feedback}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Founder Decision Bar (Strict Founder Only) */}
            {project.isFounder && (
              <div className="rounded-2xl border border-amber-500/40 bg-[#171512] p-5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-mono text-amber-400 font-bold uppercase tracking-wider">
                  <ShieldCheck className="h-4 w-4" /> Project Founder Decision Authority
                </div>
                <p className="text-xs font-mono text-[#8c887e]">
                  Voting informs direction. The project founder executes the final approval or rejection.
                </p>

                <div className="flex items-center gap-3 flex-wrap">
                  <input
                    type="text"
                    placeholder="Decision notes (e.g. Approved for Phase 1 3D blockout)..."
                    value={founderNotes}
                    onChange={(e) => setFounderNotes(e.target.value)}
                    className="flex-1 min-w-[240px] rounded-xl border border-[#363433] bg-[#141312] px-3.5 py-2 text-xs font-mono text-[#ffffff] focus:border-amber-400 focus:outline-none"
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<CheckCircle2 className="h-4 w-4 text-[#141312]" />}
                    onClick={() => handleFounderDecision('APPROVED')}
                    disabled={isDeciding}
                  >
                    Approve Proposal
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<XCircle className="h-4 w-4 text-red-400" />}
                    onClick={() => handleFounderDecision('REJECTED')}
                    disabled={isDeciding}
                    className="border border-red-500/30 text-red-400 hover:bg-red-950/30 hover:text-red-300"
                  >
                    Reject Proposal
                  </Button>
                </div>
              </div>
            )}

            {/* If Approved: Convert to Production Task Action */}
            {activeProposal.status === 'APPROVED' && (
              <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/20 p-5 flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h4 className="font-headline text-base font-bold text-emerald-300">
                    Approved for Game Production
                  </h4>
                  <p className="text-xs font-mono text-[#8c887e]">
                    {activeProposal.createdTaskId
                      ? `Task ${activeProposal.createdTask?.taskCode} created: "${activeProposal.createdTask?.title}"`
                      : 'Create an official ART / DESIGN production task with prepopulated specs.'}
                  </p>
                </div>

                {activeProposal.createdTaskId ? (
                  <span className="rounded-xl border border-emerald-500/50 bg-emerald-900/30 px-3 py-1.5 text-xs font-mono text-emerald-200 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" /> Production Task Active
                  </span>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<ArrowRight className="h-4 w-4 text-[#141312]" />}
                    onClick={() => onOpenConvertTask(activeProposal)}
                  >
                    Create Production Task
                  </Button>
                )}
              </div>
            )}

            {/* Revisions & Multiple Voting Rounds History */}
            {activeProposal.revisions && activeProposal.revisions.length > 0 && (
              <div className="rounded-2xl border border-[#2b2a29] bg-[#1c1b1a] p-4 space-y-3">
                <div className="text-xs font-mono font-semibold text-amber-400 uppercase tracking-wider">
                  Previous Voting Rounds & Revisions History
                </div>
                <div className="space-y-2">
                  {activeProposal.revisions.map((rev, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-[#2b2a29] bg-[#141312] p-3 text-xs font-mono space-y-1"
                    >
                      <div className="flex items-center justify-between text-amber-300 font-bold">
                        <span>Round {rev.round} Historical Results</span>
                        <span className="text-[#8c887e] font-normal text-[10px]">
                          {new Date(rev.revisedAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-[#cac6bc] font-sans">
                        Notes: {rev.revisionNotes}
                      </p>
                      <div className="text-[10px] text-[#8c887e] flex items-center gap-3 pt-1">
                        <span className="text-emerald-400">
                          {rev.votesSummary?.approve ?? 0} Approve
                        </span>
                        <span className="text-red-400">
                          {rev.votesSummary?.disapprove ?? 0} Disapprove
                        </span>
                        <span>{rev.votesSummary?.neutral ?? 0} Neutral</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Revisions Trigger Form */}
            {!isRevising ? (
              <div className="flex justify-end">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<RefreshCw className="h-3.5 w-3.5" />}
                  onClick={() => setIsRevising(true)}
                >
                  Submit Revision & Open New Round
                </Button>
              </div>
            ) : (
              <div className="rounded-2xl border border-amber-500/40 bg-[#1c1b1a] p-4 space-y-3">
                <h5 className="font-headline text-sm font-bold text-amber-300">
                  Submit Proposal Revision (Round {activeProposal.currentRound + 1})
                </h5>
                <input
                  type="text"
                  placeholder="Optional updated proposal title..."
                  value={revisedTitle}
                  onChange={(e) => setRevisedTitle(e.target.value)}
                  className="w-full rounded-xl border border-[#363433] bg-[#141312] px-3 py-2 text-xs font-mono text-[#ffffff] focus:border-amber-400 focus:outline-none"
                />
                <textarea
                  rows={2}
                  required
                  placeholder="Explain what was revised based on team feedback..."
                  value={revisionNotes}
                  onChange={(e) => setRevisionNotes(e.target.value)}
                  className="w-full rounded-xl border border-[#363433] bg-[#141312] p-3 text-xs font-mono text-[#cac6bc] focus:border-amber-400 focus:outline-none"
                />
                <div className="flex items-center justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setIsRevising(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleRevisionSubmit}
                    disabled={isSubmittingRevision || !revisionNotes.trim()}
                  >
                    {isSubmittingRevision ? 'Advancing Round...' : 'Launch New Round'}
                  </Button>
                </div>
              </div>
            )}

            </div>

            {/* Sticky Modal Footer */}
            <div className="flex items-center justify-end border-t border-[#2b2a29] px-6 py-4 shrink-0 bg-[#141312]">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setActiveProposal(null);
                  setIsRevising(false);
                }}
              >
                Close View
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 lg:p-6 xl:pl-[18.5rem] xl:pt-[6rem] bg-black/90 backdrop-blur-md"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative w-full max-w-4xl max-h-[calc(100vh-6rem)] sm:max-h-[calc(100vh-7rem)] flex flex-col rounded-2xl border border-[#363433] bg-[#141312] overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#2b2a29] px-4 py-3 shrink-0 bg-[#171615]">
              <span className="text-xs font-mono font-semibold text-[#ffffff] truncate max-w-md">
                {previewImage.title}
              </span>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="rounded-lg p-1.5 text-[#8c887e] hover:bg-[#201f1e] hover:text-[#e6e2df]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-black/40 min-h-[220px]">
              <img
                src={previewImage.url}
                alt={previewImage.title}
                className="max-h-[calc(100vh-13rem)] sm:max-h-[calc(100vh-14rem)] w-auto max-w-full object-contain rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Proposal Modal */}
      {editingProposal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setEditingProposal(null)}
        >
          <div
            className="relative w-full max-w-lg max-h-[85vh] flex flex-col rounded-2xl border border-[#363433] bg-[#1c1b1a] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#2b2a29] px-6 py-4 shrink-0 bg-[#141312]">
              <div>
                <h3 className="text-base font-semibold text-[#ffffff] font-sans">Edit Reference Proposal</h3>
                <p className="text-xs text-[#8c887e]">Update submission details and metadata</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingProposal(null)}
                className="rounded-lg p-1.5 text-[#8c887e] hover:bg-[#201f1e] hover:text-[#e6e2df]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form id="edit-proposal-form" onSubmit={handleSaveEdit} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-xs font-mono font-medium text-[#cac6bc] mb-1.5">
                  Proposal Title <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full rounded-xl border border-[#363433] bg-[#141312] px-3.5 py-2.5 text-xs font-sans text-[#ffffff] focus:border-amber-400 focus:outline-none"
                  placeholder="e.g. Ancient Temple Ruins - Environment Study"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-medium text-[#cac6bc] mb-1.5">
                  Category <span className="text-amber-400">*</span>
                </label>
                <select
                  required
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value as ArtProposalCategory)}
                  className="w-full rounded-xl border border-[#363433] bg-[#141312] px-3.5 py-2.5 text-xs font-sans text-[#ffffff] focus:border-amber-400 focus:outline-none"
                >
                  <option value="CHARACTERS_COSTUMES">Characters & Costumes</option>
                  <option value="ENVIRONMENTS_ARCHITECTURE">Environments & Architecture</option>
                  <option value="PROPS_WEAPONS">Props & Weapons</option>
                  <option value="UI_ICONS">UI & Icons</option>
                  <option value="LIGHTING_COLOR">Lighting & Color Scripts</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono font-medium text-[#cac6bc] mb-1.5">
                  Design Notes / Rationale
                </label>
                <textarea
                  rows={4}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full rounded-xl border border-[#363433] bg-[#141312] p-3 text-xs font-sans text-[#ffffff] focus:border-amber-400 focus:outline-none"
                  placeholder="Add design rationale, style guide instructions, or lighting specs..."
                />
              </div>
            </form>

            {/* Sticky Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-[#2b2a29] px-6 py-4 shrink-0 bg-[#141312]">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setEditingProposal(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="edit-proposal-form"
                variant="primary"
                size="sm"
                disabled={isSavingEdit || !editTitle.trim()}
              >
                {isSavingEdit ? 'Saving Changes...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Warning Modal */}
      {deletingProposal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setDeletingProposal(null)}
        >
          <div
            className="relative w-full max-w-md max-h-[85vh] flex flex-col rounded-2xl border border-red-500/30 bg-[#1c1b1a] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#2b2a29] px-6 py-4 shrink-0 bg-[#141312]">
              <div className="flex items-center gap-2 text-red-400">
                <AlertTriangle className="h-5 w-5" />
                <h3 className="text-base font-semibold text-[#ffffff] font-sans">Delete Reference Proposal</h3>
              </div>
              <button
                type="button"
                onClick={() => setDeletingProposal(null)}
                className="rounded-lg p-1.5 text-[#8c887e] hover:bg-[#201f1e] hover:text-[#e6e2df]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-3">
              <p className="text-xs font-sans text-[#cac6bc] leading-relaxed">
                Are you sure you want to delete <strong className="text-white font-medium">"{deletingProposal.title}"</strong>?
              </p>
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs font-mono text-red-200">
                Warning: This action is permanent. All votes, feedback, and reference images associated with this proposal will be removed immediately.
              </div>
              {deleteError && (
                <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-2.5 text-xs font-mono text-red-300">
                  {deleteError}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-[#2b2a29] px-6 py-4 shrink-0 bg-[#141312]">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setDeletingProposal(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                className="!bg-red-700 hover:!bg-red-600 !text-white !border-red-600"
                onClick={handleDeleteProposal}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete Proposal'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
