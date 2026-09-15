import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  MapPin,
  CheckCircle2,
  AlertCircle,
  FileText,
  Send,
  UserPlus,
  Loader2,
  Users,
} from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { formatApiAssetUrl } from '../../profile/services/profileService';
import type { RecommendedCandidate } from '../services/talentMatchingService';

interface CandidateMatchCardProps {
  item: RecommendedCandidate;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onInvite: () => void;
  onAssignRole: () => void;
  isAssigning?: boolean;
}

export const CandidateMatchCard: React.FC<CandidateMatchCardProps> = ({
  item,
  isExpanded,
  onToggleExpand,
  onInvite,
  onAssignRole,
  isAssigning = false,
}) => {
  const candidate = item.candidate;

  return (
    <div className="rounded-3xl border border-[#363433] bg-[#1c1b1a] p-5 space-y-4 shadow-xl transition-colors hover:border-[#48473f]">
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
              {item.isTeamMember && (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-amber-300">
                  <Users className="h-3 w-3" /> Team Member
                </span>
              )}
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

        {/* Actions & Score Badges */}
        <div className="flex sm:flex-col items-end justify-between sm:justify-start gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="text-right font-mono">
              <div className="text-lg font-bold text-[#ffffff]">{item.totalScore}%</div>
              <div className="text-[10px] uppercase text-[#8c887e]">Match Score</div>
            </div>
            <Badge
              variant={item.totalScore >= 85 ? 'accent' : item.totalScore >= 70 ? 'bronze' : 'default'}
              className="normal-case text-xs"
            >
              {item.matchGrade.replace('_MATCH', '')}
            </Badge>
          </div>

          {/* Action Button: Assign Role (Team Member) vs Invite vs Status Badge */}
          <div>
            {item.isAssignedToThisRole ? (
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 font-mono text-xs text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" /> Assigned
              </span>
            ) : item.isTeamMember ? (
              <Button
                variant="primary"
                size="sm"
                icon={isAssigning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
                onClick={onAssignRole}
                disabled={isAssigning}
              >
                {isAssigning ? 'Assigning...' : 'Assign Role'}
              </Button>
            ) : item.invitationStatus === 'PENDING' ? (
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 font-mono text-xs text-amber-400">
                <CheckCircle2 className="h-3.5 w-3.5" /> Invited (Pending)
              </span>
            ) : item.invitationStatus === 'ACCEPTED' ? (
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 font-mono text-xs text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" /> Accepted
              </span>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                icon={<Send className="h-3.5 w-3.5" />}
                onClick={onInvite}
              >
                Invite
              </Button>
            )}
          </div>
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
          onClick={onToggleExpand}
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

      {/* Expanded Breakdown */}
      {isExpanded && (
        <div className="border-t border-[#2b2a29] pt-4 space-y-4">
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
};
