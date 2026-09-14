import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, ProjectRoleStatus, ProjectRoleExperienceLevel, ProjectRoleCommitment } from '@prisma/client';
import {
  CandidateQueryDto,
  CandidateProfileSummaryDto,
  MatchBreakdownDto,
  RankedCandidatesResponseDto,
  RecommendedCandidateDto,
} from './projects.dto';

export const MATCHING_WEIGHTS = {
  ROLE: 25,
  SKILLS: 25,
  TOOLS: 15,
  EXPERIENCE: 15,
  AVAILABILITY: 10,
  PROJECT_CONTEXT: 10,
} as const;

export interface RoleMatchSpecification {
  roleId: string;
  roleName?: string;
  experienceLevel: ProjectRoleExperienceLevel;
  commitment: ProjectRoleCommitment;
  requiredSkills: { id: string; name: string }[];
  requiredTools: { id: string; name: string }[];
}

@Injectable()
export class TalentMatchingService {
  private readonly logger = new Logger(TalentMatchingService.name);

  constructor(private readonly prisma: PrismaService) {}

  scoreCandidate(
    candidateUser: any,
    project: { gameEngine?: string | null; genre?: string | null; platform?: string | null },
    roleSpec: RoleMatchSpecification,
    invitationStatus: RecommendedCandidateDto['invitationStatus'] = 'NONE',
  ): RecommendedCandidateDto {
    const profile = candidateUser.profile;
    const identity = profile?.identity;

    // Taxonomy Extractions
    const candidateRoles = identity?.roles.map((r: any) => r.role) || [];
    const candidateRoleIds = new Set(candidateRoles.map((r: any) => r.id));
    const candidateSkills = identity?.skills.map((s: any) => s.skill) || [];
    const candidateSkillIds = new Set(candidateSkills.map((s: any) => s.id));
    const candidateSkillNames = candidateSkills.map((s: any) => s.name);

    const candidateTools = identity?.tools.map((t: any) => t.tool) || [];
    const candidateToolIds = new Set(candidateTools.map((t: any) => t.id));
    const candidateToolNames = candidateTools.map((t: any) => t.name);

    const candidateEngines = identity?.gameEngines.map((e: any) => e.engine.name) || [];
    const candidateGenres = identity?.genres.map((g: any) => g.genre.name) || [];
    const candidatePlatforms = identity?.platforms.map((p: any) => p.platform.name) || [];

    // A. Role Score (Max 25)
    let roleScore = 0;
    if (candidateRoleIds.has(roleSpec.roleId)) {
      roleScore = MATCHING_WEIGHTS.ROLE;
    } else if (candidateRoles.length > 0) {
      roleScore = 5;
    }

    // B. Skill Alignment (Max 25)
    const requiredSkills = roleSpec.requiredSkills || [];
    const matchedSkillsList: string[] = [];
    const missingSkillsList: string[] = [];

    let skillScore: number = MATCHING_WEIGHTS.SKILLS;
    if (requiredSkills.length > 0) {
      let matchedCount = 0;
      for (const reqSkill of requiredSkills) {
        if (candidateSkillIds.has(reqSkill.id)) {
          matchedCount++;
          matchedSkillsList.push(reqSkill.name);
        } else {
          missingSkillsList.push(reqSkill.name);
        }
      }
      skillScore = Math.round((matchedCount / requiredSkills.length) * MATCHING_WEIGHTS.SKILLS);
    }

    // C. Tool Alignment (Max 15)
    const requiredTools = roleSpec.requiredTools || [];
    const matchedToolsList: string[] = [];
    const missingToolsList: string[] = [];

    let toolScore: number = MATCHING_WEIGHTS.TOOLS;
    if (requiredTools.length > 0) {
      let matchedCount = 0;
      for (const reqTool of requiredTools) {
        if (candidateToolIds.has(reqTool.id)) {
          matchedCount++;
          matchedToolsList.push(reqTool.name);
        } else {
          missingToolsList.push(reqTool.name);
        }
      }
      toolScore = Math.round((matchedCount / requiredTools.length) * MATCHING_WEIGHTS.TOOLS);
    }

    // D. Experience Match (Max 15)
    let experienceScore = 0;
    let experienceUnspecified = false;

    if (profile.experienceYears === null || profile.experienceYears === undefined) {
      experienceScore = 7.5;
      experienceUnspecified = true;
    } else {
      const exp = profile.experienceYears;
      const targetLevel = roleSpec.experienceLevel;

      if (
        (targetLevel === ProjectRoleExperienceLevel.JUNIOR && exp >= 0 && exp <= 2) ||
        (targetLevel === ProjectRoleExperienceLevel.MID && exp >= 3 && exp <= 5) ||
        (targetLevel === ProjectRoleExperienceLevel.SENIOR && exp >= 6) ||
        (targetLevel === ProjectRoleExperienceLevel.LEAD && exp >= 8)
      ) {
        experienceScore = MATCHING_WEIGHTS.EXPERIENCE;
      } else if (
        (targetLevel === ProjectRoleExperienceLevel.JUNIOR && exp <= 3) ||
        (targetLevel === ProjectRoleExperienceLevel.MID && exp >= 2 && exp <= 6) ||
        (targetLevel === ProjectRoleExperienceLevel.SENIOR && exp >= 4) ||
        (targetLevel === ProjectRoleExperienceLevel.LEAD && exp >= 6)
      ) {
        experienceScore = 12;
      } else if (
        (targetLevel === ProjectRoleExperienceLevel.MID && exp >= 1) ||
        (targetLevel === ProjectRoleExperienceLevel.SENIOR && exp >= 2) ||
        (targetLevel === ProjectRoleExperienceLevel.LEAD && exp >= 4)
      ) {
        experienceScore = 8;
      } else {
        experienceScore = 5;
      }
    }

    // E. Availability Match (Max 10)
    let availabilityScore = 6;
    const candAvail = profile.availability?.toLowerCase() || '';

    if (!candAvail) {
      availabilityScore = 6;
    } else if (candAvail.includes('not available') || candAvail.includes('busy')) {
      availabilityScore = 3;
    } else if (
      (roleSpec.commitment === ProjectRoleCommitment.FULL_TIME && (candAvail.includes('full') || candAvail.includes('collaboration'))) ||
      (roleSpec.commitment === ProjectRoleCommitment.PART_TIME && (candAvail.includes('part') || candAvail.includes('collaboration'))) ||
      (roleSpec.commitment === ProjectRoleCommitment.CONTRACT && (candAvail.includes('contract') || candAvail.includes('collaboration'))) ||
      (roleSpec.commitment === ProjectRoleCommitment.REV_SHARE && (candAvail.includes('rev') || candAvail.includes('collaboration')))
    ) {
      availabilityScore = MATCHING_WEIGHTS.AVAILABILITY;
    } else if (candAvail.includes('collaboration') || candAvail.includes('available')) {
      availabilityScore = 8;
    }

    // F. Project Context Match (Max 10)
    let contextScore = 0;
    const portfolioEngines = (profile.portfolio || []).map((p: any) => p.gameEngine).filter(Boolean);
    const portfolioGenres = (profile.portfolio || []).map((p: any) => p.genre).filter(Boolean);
    const portfolioPlatforms = (profile.portfolio || []).map((p: any) => p.platform).filter(Boolean);

    if (!project.gameEngine) {
      contextScore += 4;
    } else if (
      candidateEngines.includes(project.gameEngine) ||
      portfolioEngines.includes(project.gameEngine)
    ) {
      contextScore += 4;
    }

    if (!project.genre) {
      contextScore += 3;
    } else if (
      candidateGenres.includes(project.genre) ||
      portfolioGenres.includes(project.genre)
    ) {
      contextScore += 3;
    }

    if (!project.platform) {
      contextScore += 3;
    } else if (
      candidatePlatforms.includes(project.platform) ||
      portfolioPlatforms.includes(project.platform)
    ) {
      contextScore += 3;
    }

    const totalScore = Math.min(
      100,
      Math.round(roleScore + skillScore + toolScore + experienceScore + availabilityScore + contextScore),
    );

    let matchGrade: RecommendedCandidateDto['matchGrade'] = 'POTENTIAL_MATCH';
    if (totalScore >= 85) matchGrade = 'EXCELLENT_MATCH';
    else if (totalScore >= 70) matchGrade = 'STRONG_MATCH';
    else if (totalScore >= 50) matchGrade = 'GOOD_MATCH';

    let missingDataPoints = 0;
    if (candidateSkills.length === 0) missingDataPoints++;
    if (candidateTools.length === 0) missingDataPoints++;
    if (profile.experienceYears === null || profile.experienceYears === undefined) missingDataPoints++;
    if ((profile.portfolio || []).length === 0) missingDataPoints++;
    if (!profile.resume) missingDataPoints++;

    let confidenceLevel: RecommendedCandidateDto['confidenceLevel'] = 'HIGH';
    if (missingDataPoints >= 3) confidenceLevel = 'LOW';
    else if (missingDataPoints >= 1) confidenceLevel = 'MEDIUM';

    const matchReasons: string[] = [];
    const roleLabel = roleSpec.roleName || 'Required Role';
    if (roleScore === MATCHING_WEIGHTS.ROLE) matchReasons.push(`Exact role match (${roleLabel})`);
    if (requiredSkills.length > 0 && matchedSkillsList.length > 0) {
      matchReasons.push(`Matches ${matchedSkillsList.length}/${requiredSkills.length} required skills (${matchedSkillsList.slice(0, 3).join(', ')})`);
    }
    if (requiredTools.length > 0 && matchedToolsList.length > 0) {
      matchReasons.push(`Matches ${matchedToolsList.length}/${requiredTools.length} required tools (${matchedToolsList.slice(0, 2).join(', ')})`);
    }
    if (experienceScore >= 12 && !experienceUnspecified) {
      matchReasons.push(`${profile.experienceYears} yrs experience aligns with ${roleSpec.experienceLevel} requirement`);
    }
    if (contextScore >= 7) matchReasons.push(`Game engine and genre match project requirements`);

    const explanation = matchReasons.length > 0
      ? matchReasons.join(' · ')
      : `Potential candidate matching ${roleLabel} domain`;

    const candidateSummary: CandidateProfileSummaryDto = {
      id: candidateUser.id,
      username: candidateUser.username,
      firstName: profile.firstName,
      lastName: profile.lastName,
      displayName: profile.displayName || `${profile.firstName} ${profile.lastName}`,
      avatarUrl: profile.avatarUrl,
      headline: profile.headline,
      bio: profile.bio,
      location: profile.location,
      timezone: profile.timezone,
      experienceYears: profile.experienceYears,
      availability: profile.availability,
      roles: candidateRoles.map((r: any) => r.name),
      skills: candidateSkillNames,
      tools: candidateToolNames,
      gameEngines: candidateEngines,
      portfolioHighlights: (profile.portfolio || []).slice(0, 3).map((p: any) => ({
        id: p.id,
        title: p.title,
        role: p.role,
        gameEngine: p.gameEngine,
        genre: p.genre,
        platform: p.platform,
        coverUrl: p.coverUrl,
        description: p.description,
      })),
      resume: profile.resume && profile.resume.visibility === 'Public'
        ? {
            fileName: profile.resume.fileName,
            fileSize: profile.resume.fileSize,
            downloadUrl: profile.resume.downloadUrl,
          }
        : null,
    };

    const matchBreakdown: MatchBreakdownDto = {
      roleMatch: roleScore,
      skillMatch: skillScore,
      toolMatch: toolScore,
      experienceMatch: Math.round(experienceScore),
      availabilityMatch: availabilityScore,
      projectContextMatch: contextScore,
      experienceUnspecified,
    };

    return {
      candidate: candidateSummary,
      totalScore,
      matchGrade,
      confidenceLevel,
      matchBreakdown,
      matchedSkills: matchedSkillsList,
      missingSkills: missingSkillsList,
      matchedTools: matchedToolsList,
      missingTools: missingToolsList,
      explanation,
      invitationStatus,
    };
  }

  async getRankedCandidatesForRoleSpec(
    projectId: string,
    roleSpec: RoleMatchSpecification,
    limit: number = 3,
  ): Promise<RecommendedCandidateDto[]> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: { select: { userId: true } },
      },
    });

    if (!project) return [];

    const existingMemberUserIds = new Set(project.members.map((m) => m.userId));
    existingMemberUserIds.add(project.founderId);

    const candidates = await this.prisma.user.findMany({
      where: {
        role: Role.USER,
        id: { notIn: Array.from(existingMemberUserIds) },
        profile: { isNot: null },
      },
      include: {
        profile: {
          include: {
            identity: {
              include: {
                roles: { include: { role: true } },
                skills: { include: { skill: true } },
                tools: { include: { tool: true } },
                gameEngines: { include: { engine: true } },
                genres: { include: { genre: true } },
                platforms: { include: { platform: true } },
              },
            },
            portfolio: true,
            resume: true,
            experiences: true,
            education: true,
          },
        },
      },
    });

    const scoredCandidates: RecommendedCandidateDto[] = [];
    for (const cand of candidates) {
      if (!cand.profile) continue;
      scoredCandidates.push(this.scoreCandidate(cand, project, roleSpec, 'NONE'));
    }

    const confidenceRank = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    scoredCandidates.sort((a, b) => {
      if (b.totalScore !== a.totalScore) {
        return b.totalScore - a.totalScore;
      }
      if (confidenceRank[b.confidenceLevel] !== confidenceRank[a.confidenceLevel]) {
        return confidenceRank[b.confidenceLevel] - confidenceRank[a.confidenceLevel];
      }
      return a.candidate.displayName.localeCompare(b.candidate.displayName);
    });

    return scoredCandidates.slice(0, limit);
  }

  async getRankedCandidates(
    projectId: string,
    projectRoleId: string,
    userId: string,
    userRole: string,
    query: CandidateQueryDto,
  ): Promise<RankedCandidatesResponseDto> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(50, Math.max(1, query.limit || 10));
    const minScore = Math.max(0, Math.min(100, query.minScore || 0));
    const search = query.search?.trim().toLowerCase();

    // 1. Fetch target Project & ProjectRole
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: { select: { userId: true } },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    const forceRescan = (query as any)?.forceRescan === true;
    const savedTalentMap = (project as any).savedTalentRecommendations;
    if (!search && !forceRescan && savedTalentMap && savedTalentMap[projectRoleId]) {
      return savedTalentMap[projectRoleId];
    }

    const projectRole = await this.prisma.projectRole.findUnique({
      where: { id: projectRoleId },
      include: {
        role: true,
        requiredSkills: { include: { skill: true } },
        requiredTools: { include: { tool: true } },
      },
    });

    if (!projectRole || projectRole.projectId !== projectId) {
      throw new NotFoundException('Project role not found for this project.');
    }

    // Authorization Check: Only project founder or Administrator can access
    const isFounder = project.founderId === userId;
    const isAdmin = userRole === 'ADMINISTRATOR';
    if (!isFounder && !isAdmin) {
      throw new ForbiddenException('Only the project founder or administrator can access candidate recommendations.');
    }

    // Role Status Check: Must be OPEN or IN_REVIEW
    if (projectRole.status === ProjectRoleStatus.CLOSED || projectRole.status === ProjectRoleStatus.FILLED) {
      throw new BadRequestException('Candidate recommendations are only available for OPEN or IN_REVIEW project roles.');
    }

    // 2. Identify excluded User IDs (founder + existing team members)
    const existingMemberUserIds = new Set(project.members.map((m) => m.userId));
    existingMemberUserIds.add(project.founderId);

    // Query existing invitations for this role
    const existingInvitations = this.prisma.projectInvitation
      ? await this.prisma.projectInvitation.findMany({
          where: {
            projectId,
            projectRoleId,
          },
          select: {
            inviteeId: true,
            status: true,
          },
        })
      : [];

    const invitationMap = new Map<string, RecommendedCandidateDto['invitationStatus']>();
    for (const inv of existingInvitations) {
      invitationMap.set(inv.inviteeId, inv.status as RecommendedCandidateDto['invitationStatus']);
    }

    // 3. Query all eligible USER accounts (excluding ADMINs, founder, and existing members)
    const candidates = await this.prisma.user.findMany({
      where: {
        role: Role.USER,
        id: { notIn: Array.from(existingMemberUserIds) },
        profile: { isNot: null },
      },
      include: {
        profile: {
          include: {
            identity: {
              include: {
                roles: { include: { role: true } },
                skills: { include: { skill: true } },
                tools: { include: { tool: true } },
                gameEngines: { include: { engine: true } },
                genres: { include: { genre: true } },
                platforms: { include: { platform: true } },
              },
            },
            portfolio: true,
            resume: true,
            experiences: true,
            education: true,
          },
        },
      },
    });

    const roleSpec: RoleMatchSpecification = {
      roleId: projectRole.roleId,
      roleName: projectRole.role.name,
      experienceLevel: projectRole.experienceLevel,
      commitment: projectRole.commitment,
      requiredSkills: (projectRole.requiredSkills || []).map((rs) => ({
        id: rs.skill.id,
        name: rs.skill.name,
      })),
      requiredTools: (projectRole.requiredTools || []).map((rt) => ({
        id: rt.tool.id,
        name: rt.tool.name,
      })),
    };

    const scoredCandidates: RecommendedCandidateDto[] = [];

    // 4. Calculate deterministic matching score for each candidate
    for (const candidateUser of candidates) {
      if (!candidateUser.profile) continue;
      const invStatus = invitationMap.get(candidateUser.id) || 'NONE';
      scoredCandidates.push(this.scoreCandidate(candidateUser, project, roleSpec, invStatus));
    }

    // 5. Filtering by minScore and optional search text
    let filtered = scoredCandidates.filter((c) => c.totalScore >= minScore);

    if (search) {
      filtered = filtered.filter((c) => {
        const text = `${c.candidate.displayName} ${c.candidate.username} ${c.candidate.headline || ''} ${c.candidate.skills.join(' ')}`.toLowerCase();
        return text.includes(search);
      });
    }

    // 6. Deterministic Sorting
    // 1st: totalScore desc
    // 2nd: confidenceLevel (HIGH > MEDIUM > LOW)
    // 3rd: displayName / username asc (tie-breaker)
    const confidenceRank = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    filtered.sort((a, b) => {
      if (b.totalScore !== a.totalScore) {
        return b.totalScore - a.totalScore;
      }
      if (confidenceRank[b.confidenceLevel] !== confidenceRank[a.confidenceLevel]) {
        return confidenceRank[b.confidenceLevel] - confidenceRank[a.confidenceLevel];
      }
      return a.candidate.displayName.localeCompare(b.candidate.displayName);
    });

    // 7. Pagination
    const totalCandidatesScored = candidates.length;
    const matchingCandidatesCount = filtered.length;
    const totalPages = Math.ceil(matchingCandidatesCount / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginatedCandidates = filtered.slice(startIndex, startIndex + limit);

    const result: RankedCandidatesResponseDto = {
      projectRoleId,
      projectRoleTitle: projectRole.title || projectRole.role.name,
      totalCandidatesScored,
      matchingCandidatesCount,
      page,
      limit,
      totalPages,
      candidates: paginatedCandidates,
    };

    if (!search) {
      try {
        const savedMap =
          savedTalentMap && typeof savedTalentMap === 'object' ? { ...savedTalentMap } : {};
        savedMap[projectRoleId] = result;
        await (this.prisma.project as any).update({
          where: { id: projectId },
          data: { savedTalentRecommendations: savedMap },
        });
      } catch (saveErr) {
        this.logger.warn(
          `Failed to persist talent recommendations for role ${projectRoleId}:`,
          saveErr,
        );
      }
    }

    return result;
  }

  async rescanRankedCandidates(
    projectId: string,
    projectRoleId: string,
    userId: string,
    userRole: string,
  ): Promise<RankedCandidatesResponseDto> {
    return this.getRankedCandidates(projectId, projectRoleId, userId, userRole, {
      forceRescan: true,
    } as any);
  }
}
