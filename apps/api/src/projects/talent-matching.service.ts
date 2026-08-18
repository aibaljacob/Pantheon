import {
  BadRequestException,
  ForbiddenException,
  Injectable,
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

@Injectable()
export class TalentMatchingService {
  constructor(private readonly prisma: PrismaService) {}

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

    const scoredCandidates: RecommendedCandidateDto[] = [];

    // 4. Calculate deterministic matching score for each candidate
    for (const candidateUser of candidates) {
      const profile = candidateUser.profile;
      if (!profile) continue;

      const identity = profile.identity;

      // Taxonomy Extractions
      const candidateRoles = identity?.roles.map((r) => r.role) || [];
      const candidateRoleIds = new Set(candidateRoles.map((r) => r.id));
      const candidateSkills = identity?.skills.map((s) => s.skill) || [];
      const candidateSkillIds = new Set(candidateSkills.map((s) => s.id));
      const candidateSkillNames = candidateSkills.map((s) => s.name);

      const candidateTools = identity?.tools.map((t) => t.tool) || [];
      const candidateToolIds = new Set(candidateTools.map((t) => t.id));
      const candidateToolNames = candidateTools.map((t) => t.name);

      const candidateEngines = identity?.gameEngines.map((e) => e.engine.name) || [];
      const candidateGenres = identity?.genres.map((g) => g.genre.name) || [];
      const candidatePlatforms = identity?.platforms.map((p) => p.platform.name) || [];

      // A. Role Score (Max 25)
      let roleScore = 0;
      if (candidateRoleIds.has(projectRole.roleId)) {
        roleScore = MATCHING_WEIGHTS.ROLE;
      } else if (candidateRoles.length > 0) {
        // Partial category domain overlap score if candidate has any verified roles
        roleScore = 5;
      }

      // B. Skill Alignment (Max 25)
      const requiredSkills = projectRole.requiredSkills.map((rs) => rs.skill);
      const matchedSkillsList: string[] = [];
      const missingSkillsList: string[] = [];

      let skillScore: number = MATCHING_WEIGHTS.SKILLS; // Default neutral score if no skills specified
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
      const requiredTools = projectRole.requiredTools.map((rt) => rt.tool);
      const matchedToolsList: string[] = [];
      const missingToolsList: string[] = [];

      let toolScore: number = MATCHING_WEIGHTS.TOOLS; // Default neutral score if no tools specified
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
        experienceScore = 7.5; // Neutral baseline score (50%)
        experienceUnspecified = true;
      } else {
        const exp = profile.experienceYears;
        const targetLevel = projectRole.experienceLevel;

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
      let availabilityScore = 6; // Neutral default for unknown/unspecified
      const candAvail = profile.availability?.toLowerCase() || '';

      if (!candAvail) {
        availabilityScore = 6;
      } else if (candAvail.includes('not available') || candAvail.includes('busy')) {
        availabilityScore = 3;
      } else if (
        (projectRole.commitment === ProjectRoleCommitment.FULL_TIME && (candAvail.includes('full') || candAvail.includes('collaboration'))) ||
        (projectRole.commitment === ProjectRoleCommitment.PART_TIME && (candAvail.includes('part') || candAvail.includes('collaboration'))) ||
        (projectRole.commitment === ProjectRoleCommitment.CONTRACT && (candAvail.includes('contract') || candAvail.includes('collaboration'))) ||
        (projectRole.commitment === ProjectRoleCommitment.REV_SHARE && (candAvail.includes('rev') || candAvail.includes('collaboration')))
      ) {
        availabilityScore = MATCHING_WEIGHTS.AVAILABILITY;
      } else if (candAvail.includes('collaboration') || candAvail.includes('available')) {
        availabilityScore = 8;
      }

      // F. Project Context Match (Max 10: Engine 4, Genre 3, Platform 3)
      let contextScore = 0;
      const portfolioEngines = profile.portfolio.map((p) => p.gameEngine).filter(Boolean);
      const portfolioGenres = profile.portfolio.map((p) => p.genre).filter(Boolean);
      const portfolioPlatforms = profile.portfolio.map((p) => p.platform).filter(Boolean);

      // Engine (4 pts)
      if (!project.gameEngine) {
        contextScore += 4;
      } else if (
        candidateEngines.includes(project.gameEngine) ||
        portfolioEngines.includes(project.gameEngine)
      ) {
        contextScore += 4;
      }

      // Genre (3 pts)
      if (!project.genre) {
        contextScore += 3;
      } else if (
        candidateGenres.includes(project.genre) ||
        portfolioGenres.includes(project.genre)
      ) {
        contextScore += 3;
      }

      // Platform (3 pts)
      if (!project.platform) {
        contextScore += 3;
      } else if (
        candidatePlatforms.includes(project.platform) ||
        portfolioPlatforms.includes(project.platform)
      ) {
        contextScore += 3;
      }

      // Total Composite Score Calculation
      const totalScore = Math.min(
        100,
        Math.round(roleScore + skillScore + toolScore + experienceScore + availabilityScore + contextScore),
      );

      // Match Grade
      let matchGrade: RecommendedCandidateDto['matchGrade'] = 'POTENTIAL_MATCH';
      if (totalScore >= 85) matchGrade = 'EXCELLENT_MATCH';
      else if (totalScore >= 70) matchGrade = 'STRONG_MATCH';
      else if (totalScore >= 50) matchGrade = 'GOOD_MATCH';

      // Confidence Level Calculation
      let missingDataPoints = 0;
      if (candidateSkills.length === 0) missingDataPoints++;
      if (candidateTools.length === 0) missingDataPoints++;
      if (profile.experienceYears === null || profile.experienceYears === undefined) missingDataPoints++;
      if (profile.portfolio.length === 0) missingDataPoints++;
      if (!profile.resume) missingDataPoints++;

      let confidenceLevel: RecommendedCandidateDto['confidenceLevel'] = 'HIGH';
      if (missingDataPoints >= 3) confidenceLevel = 'LOW';
      else if (missingDataPoints >= 1) confidenceLevel = 'MEDIUM';

      // Explainable match summary
      const matchReasons: string[] = [];
      if (roleScore === MATCHING_WEIGHTS.ROLE) matchReasons.push(`Exact role match (${projectRole.role.name})`);
      if (requiredSkills.length > 0 && matchedSkillsList.length > 0) {
        matchReasons.push(`Matches ${matchedSkillsList.length}/${requiredSkills.length} required skills (${matchedSkillsList.slice(0, 3).join(', ')})`);
      }
      if (requiredTools.length > 0 && matchedToolsList.length > 0) {
        matchReasons.push(`Matches ${matchedToolsList.length}/${requiredTools.length} required tools (${matchedToolsList.slice(0, 2).join(', ')})`);
      }
      if (experienceScore >= 12 && !experienceUnspecified) {
        matchReasons.push(`${profile.experienceYears} yrs experience aligns with ${projectRole.experienceLevel} requirement`);
      }
      if (contextScore >= 7) matchReasons.push(`Game engine and genre match project requirements`);

      const explanation = matchReasons.length > 0
        ? matchReasons.join(' · ')
        : `Potential candidate matching ${projectRole.role.name} domain`;

      // Candidate Profile Summary (Privacy Safe)
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
        roles: candidateRoles.map((r) => r.name),
        skills: candidateSkillNames,
        tools: candidateToolNames,
        gameEngines: candidateEngines,
        portfolioHighlights: profile.portfolio.slice(0, 3).map((p) => ({
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

      scoredCandidates.push({
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
      });
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

    return {
      projectRoleId,
      projectRoleTitle: projectRole.title || projectRole.role.name,
      totalCandidatesScored,
      matchingCandidatesCount,
      page,
      limit,
      totalPages,
      candidates: paginatedCandidates,
    };
  }
}
