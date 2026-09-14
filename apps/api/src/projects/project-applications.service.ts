import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ProjectApplicationStatus,
  ProjectModerationStatus,
  ProjectRoleStatus,
  Role,
} from '@prisma/client';
import { TalentMatchingService } from './talent-matching.service';
import {
  CandidateApplicationDetailDto,
  CreateProjectApplicationDto,
  FounderApplicationDetailDto,
  ProjectApplicationResponseDto,
  RespondProjectApplicationAction,
  RespondProjectApplicationDto,
} from './project-applications.dto';

@Injectable()
export class ProjectApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly talentMatchingService: TalentMatchingService,
  ) {}

  private mapToResponseDto(app: {
    id: string;
    projectId: string;
    projectRoleId: string;
    applicantId: string;
    status: ProjectApplicationStatus;
    message: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): ProjectApplicationResponseDto {
    return {
      id: app.id,
      projectId: app.projectId,
      projectRoleId: app.projectRoleId,
      applicantId: app.applicantId,
      status: app.status,
      message: app.message,
      createdAt: app.createdAt.toISOString(),
      updatedAt: app.updatedAt.toISOString(),
    };
  }

  async applyToRole(
    projectId: string,
    projectRoleId: string,
    applicantId: string,
    applicantRole: string,
    dto: CreateProjectApplicationDto,
  ): Promise<ProjectApplicationResponseDto> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, founderId: true, moderationStatus: true },
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    if (
      applicantRole !== Role.ADMINISTRATOR &&
      project.founderId !== applicantId &&
      project.moderationStatus !== ProjectModerationStatus.PUBLISHED
    ) {
      throw new ForbiddenException('Cannot apply to a project that is not published.');
    }

    if (project.founderId === applicantId) {
      throw new BadRequestException('Project founder cannot apply to their own project.');
    }

    const projectRole = await this.prisma.projectRole.findUnique({
      where: { id: projectRoleId },
      select: { id: true, projectId: true, status: true },
    });

    if (!projectRole || projectRole.projectId !== projectId) {
      throw new NotFoundException('Project role not found for this project.');
    }

    if (projectRole.status !== ProjectRoleStatus.OPEN) {
      throw new BadRequestException('Cannot apply to a role that is not open.');
    }

    const existingMembership = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId: applicantId },
      },
    });

    if (existingMembership) {
      throw new BadRequestException('You are already a team member of this project.');
    }

    const existingPending = await this.prisma.projectApplication.findFirst({
      where: {
        projectId,
        projectRoleId,
        applicantId,
        status: ProjectApplicationStatus.PENDING,
      },
    });

    if (existingPending) {
      throw new BadRequestException(
        'You already have an active pending application for this project role.',
      );
    }

    const application = await this.prisma.projectApplication.create({
      data: {
        projectId,
        projectRoleId,
        applicantId,
        message: dto.message?.trim() || null,
        status: ProjectApplicationStatus.PENDING,
      },
    });

    return this.mapToResponseDto(application);
  }

  async getCandidateApplications(userId: string): Promise<CandidateApplicationDetailDto[]> {
    const applications = await this.prisma.projectApplication.findMany({
      where: { applicantId: userId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            slug: true,
            coverUrl: true,
            genre: true,
            platform: true,
            gameEngine: true,
            founder: {
              select: {
                username: true,
                profile: {
                  select: { displayName: true, avatarUrl: true },
                },
              },
            },
          },
        },
        projectRole: {
          select: {
            id: true,
            title: true,
            experienceLevel: true,
            commitment: true,
            status: true,
            role: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return applications.map((app) => ({
      id: app.id,
      projectId: app.projectId,
      projectRoleId: app.projectRoleId,
      status: app.status,
      message: app.message,
      createdAt: app.createdAt.toISOString(),
      updatedAt: app.updatedAt.toISOString(),
      project: {
        id: app.project.id,
        name: app.project.name,
        slug: app.project.slug,
        coverUrl: app.project.coverUrl,
        genre: app.project.genre,
        platform: app.project.platform,
        gameEngine: app.project.gameEngine,
        founder: {
          username: app.project.founder.username,
          displayName: app.project.founder.profile?.displayName || app.project.founder.username,
          avatarUrl: app.project.founder.profile?.avatarUrl,
        },
      },
      projectRole: {
        id: app.projectRole.id,
        title: app.projectRole.title,
        roleName: app.projectRole.role.name,
        experienceLevel: app.projectRole.experienceLevel,
        commitment: app.projectRole.commitment,
        status: app.projectRole.status,
      },
    }));
  }

  async withdrawApplication(
    applicationId: string,
    userId: string,
  ): Promise<ProjectApplicationResponseDto> {
    const application = await this.prisma.projectApplication.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      throw new NotFoundException('Application not found.');
    }

    if (application.applicantId !== userId) {
      throw new ForbiddenException('You can only withdraw your own applications.');
    }

    if (application.status !== ProjectApplicationStatus.PENDING) {
      throw new BadRequestException('Only pending applications can be withdrawn.');
    }

    const updated = await this.prisma.projectApplication.update({
      where: { id: applicationId },
      data: { status: ProjectApplicationStatus.WITHDRAWN },
    });

    return this.mapToResponseDto(updated);
  }

  async getProjectApplications(
    projectId: string,
    userId: string,
    userRole: string,
  ): Promise<FounderApplicationDetailDto[]> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        founderId: true,
        gameEngine: true,
        genre: true,
        platform: true,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    const isFounder = project.founderId === userId;
    const isAdmin = userRole === Role.ADMINISTRATOR;
    if (!isFounder && !isAdmin) {
      throw new ForbiddenException('Only the project founder or administrator can view applications.');
    }

    const applications = await this.prisma.projectApplication.findMany({
      where: { projectId },
      include: {
        projectRole: {
          include: {
            role: true,
            requiredSkills: { include: { skill: true } },
            requiredTools: { include: { tool: true } },
          },
        },
        applicant: {
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
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return applications.map((app) => {
      const applicantUser = app.applicant;
      const profile = applicantUser.profile;
      const identity = profile?.identity;

      const userSkills = (identity?.skills || []).map((s) => s.skill.name);
      const userTools = (identity?.tools || []).map((t) => t.tool.name);

      let matchScore: number | undefined;
      let matchGrade: string | undefined;
      let matchBreakdown: any | undefined;

      try {
        const scored = this.talentMatchingService.scoreCandidate(
          applicantUser,
          project,
          {
            roleId: app.projectRole.roleId,
            roleName: app.projectRole.role.name,
            experienceLevel: app.projectRole.experienceLevel,
            commitment: app.projectRole.commitment,
            requiredSkills: (app.projectRole.requiredSkills || []).map((rs) => ({
              id: rs.skill.id,
              name: rs.skill.name,
            })),
            requiredTools: (app.projectRole.requiredTools || []).map((rt) => ({
              id: rt.tool.id,
              name: rt.tool.name,
            })),
          },
          'NONE',
        );
        matchScore = scored.totalScore;
        matchGrade = scored.matchGrade;
        matchBreakdown = scored.matchBreakdown;
      } catch {
        // Fallback gracefully if profile is minimal
      }

      return {
        id: app.id,
        projectId: app.projectId,
        projectRoleId: app.projectRoleId,
        status: app.status,
        message: app.message,
        createdAt: app.createdAt.toISOString(),
        updatedAt: app.updatedAt.toISOString(),
        applicant: {
          id: applicantUser.id,
          username: applicantUser.username,
          displayName: profile?.displayName || applicantUser.username,
          avatarUrl: profile?.avatarUrl,
          headline: profile?.headline,
          location: profile?.location,
          experienceYears: profile?.experienceYears,
          availability: profile?.availability,
          skills: userSkills,
          tools: userTools,
        },
        projectRole: {
          id: app.projectRole.id,
          title: app.projectRole.title,
          roleName: app.projectRole.role.name,
          experienceLevel: app.projectRole.experienceLevel,
          commitment: app.projectRole.commitment,
          status: app.projectRole.status,
        },
        matchScore,
        matchGrade,
        matchBreakdown,
      };
    });
  }

  async respondToApplication(
    applicationId: string,
    userId: string,
    userRole: string,
    dto: RespondProjectApplicationDto,
  ): Promise<ProjectApplicationResponseDto> {
    const application = await this.prisma.projectApplication.findUnique({
      where: { id: applicationId },
      include: {
        project: { select: { id: true, founderId: true } },
        projectRole: { include: { role: true } },
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found.');
    }

    const isFounder = application.project.founderId === userId;
    const isAdmin = userRole === Role.ADMINISTRATOR;
    if (!isFounder && !isAdmin) {
      throw new ForbiddenException(
        'Only the project founder or administrator can respond to applications.',
      );
    }

    if (application.status !== ProjectApplicationStatus.PENDING) {
      throw new BadRequestException('Application is no longer pending.');
    }

    if (dto.action === RespondProjectApplicationAction.REJECT) {
      const rejected = await this.prisma.projectApplication.update({
        where: { id: applicationId },
        data: { status: ProjectApplicationStatus.REJECTED },
      });
      return this.mapToResponseDto(rejected);
    }

    // Atomic acceptance transaction
    return this.prisma.$transaction(async (tx) => {
      const currentApp = await tx.projectApplication.findUnique({
        where: { id: applicationId },
      });

      if (!currentApp || currentApp.status !== ProjectApplicationStatus.PENDING) {
        throw new BadRequestException('Application is no longer pending.');
      }

      const currentRole = await tx.projectRole.findUnique({
        where: { id: currentApp.projectRoleId },
        include: { role: true },
      });

      if (!currentRole || currentRole.status !== ProjectRoleStatus.OPEN) {
        throw new BadRequestException('Project role is no longer open.');
      }

      const existingMember = await tx.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: currentApp.projectId,
            userId: currentApp.applicantId,
          },
        },
      });

      if (existingMember) {
        throw new BadRequestException('Applicant is already a team member of this project.');
      }

      await tx.projectMember.create({
        data: {
          projectId: currentApp.projectId,
          userId: currentApp.applicantId,
          role: currentRole.title || currentRole.role.name || 'Member',
        },
      });

      const accepted = await tx.projectApplication.update({
        where: { id: applicationId },
        data: { status: ProjectApplicationStatus.ACCEPTED },
      });

      await tx.projectRole.update({
        where: { id: currentRole.id },
        data: { status: ProjectRoleStatus.FILLED },
      });

      return this.mapToResponseDto(accepted);
    });
  }
}
