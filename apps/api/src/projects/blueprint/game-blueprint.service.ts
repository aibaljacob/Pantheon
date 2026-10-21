import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectAuthorizationService } from '../../tasks/project-authorization.service';
import {
  GameBlueprint,
  Prisma,
  ProjectMemberStatus,
  ProjectModerationStatus,
  ProjectRoleCommitment,
  ProjectRoleExperienceLevel,
  ProjectRoleStatus,
  Role,
  TaskPriority,
  TaskStatus,
  TaskType,
} from '@prisma/client';
import {
  ApproveProductionPlanDto,
  GameBlueprintResponseDto,
  GameFeatureDto,
  GamePillarDto,
  SkillCoverageCandidateRecommendationDto,
  SkillCoverageDisciplineDto,
  SkillCoverageMemberDto,
  SkillCoverageOpenRoleDto,
  SkillCoverageResponseDto,
  UpsertGameBlueprintDto,
  AiProposeNarrativeDto,
} from './game-blueprint.dto';
import {
  BlueprintAiContext,
  GameVisionAiService,
  ProposedGameplayLoopOutput,
  VisualDirectionOutput,
  ProductionPlanDraftOutput,
  NarrativeAiContext,
  NarrativeAiOutput,
} from '../../ai/game-vision-ai.service';
import {
  RoleMatchSpecification,
  TalentMatchingService,
} from '../talent-matching.service';

const DISCIPLINE_SKILL_MAP: Record<string, string[]> = {
  ENGINEERING: [
    'Gameplay Programming',
    'Engine Architecture',
    'Physics',
    'AI Programming',
    'Network / Multiplayer',
    'C++ / GDScript',
    'Shader Programming',
  ],
  ART: [
    '3D Modeling',
    'Concept Art',
    'Texturing / PBR',
    'Animation',
    'Rigging',
    'Environment Art',
    'VFX',
  ],
  DESIGN: [
    'Game Design',
    'Level Design',
    'Systems Design',
    'Combat Design',
    'Economy & Balance',
    'UI / UX Design',
  ],
  AUDIO: [
    'Sound Design',
    'Music Composition',
    'Audio Implementation',
    'Foley & SFX',
    'Voice Direction',
  ],
};

@Injectable()
export class GameBlueprintService {
  private readonly logger = new Logger(GameBlueprintService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAuthService: ProjectAuthorizationService,
    private readonly gameVisionAiService: GameVisionAiService,
    private readonly talentMatchingService: TalentMatchingService,
  ) {}

  async getBlueprint(
    projectIdOrSlug: string,
    currentUserId?: string,
    currentUserRole?: string,
  ): Promise<GameBlueprintResponseDto | null> {
    const context = await this.projectAuthService.getProjectAccess(
      projectIdOrSlug,
      currentUserId,
      currentUserRole,
    );

    if (
      context.project.moderationStatus !== ProjectModerationStatus.PUBLISHED
    ) {
      if (!context.isFounder && !context.isMember && !context.isAdmin) {
        throw new NotFoundException('Project not found.');
      }
    }

    const blueprint = await this.prisma.gameBlueprint.findUnique({
      where: { projectId: context.project.id },
    });

    if (!blueprint) {
      return null;
    }

    return this.mapToResponse(blueprint);
  }

  async upsertBlueprint(
    projectIdOrSlug: string,
    currentUserId: string,
    currentUserRole: string | undefined,
    dto: UpsertGameBlueprintDto,
  ): Promise<GameBlueprintResponseDto> {
    const context = await this.projectAuthService.getProjectAccess(
      projectIdOrSlug,
      currentUserId,
      currentUserRole,
    );

    if (!context.isFounder) {
      throw new ForbiddenException(
        'Only the project founder can modify the game blueprint.',
      );
    }

    // If gameplayLoop is updated without an explicit coreLoop, derive a backwards-compatible coreLoop string
    let derivedCoreLoop = dto.coreLoop?.trim();
    if (
      !derivedCoreLoop &&
      dto.gameplayLoop &&
      Array.isArray((dto.gameplayLoop as any).steps)
    ) {
      const stepTitles = (dto.gameplayLoop as any).steps
        .map((s: any) => s.title?.trim())
        .filter(Boolean);
      if (stepTitles.length > 0) {
        derivedCoreLoop = stepTitles.join(' → ');
      }
    }

    const payload: Prisma.GameBlueprintUpdateInput = {
      tagline:
        dto.tagline !== undefined ? dto.tagline?.trim() || null : undefined,
      targetAudience:
        dto.targetAudience !== undefined
          ? dto.targetAudience?.trim() || null
          : undefined,
      cameraPerspective:
        dto.cameraPerspective !== undefined
          ? dto.cameraPerspective?.trim() || null
          : undefined,
      artStyle:
        dto.artStyle !== undefined ? dto.artStyle?.trim() || null : undefined,
      audioTone:
        dto.audioTone !== undefined ? dto.audioTone?.trim() || null : undefined,
      networkModel:
        dto.networkModel !== undefined
          ? dto.networkModel?.trim() || null
          : undefined,
      targetFps: dto.targetFps !== undefined ? dto.targetFps : undefined,
      targetResolution:
        dto.targetResolution !== undefined
          ? dto.targetResolution?.trim() || null
          : undefined,
      coreLoop:
        derivedCoreLoop !== undefined
          ? derivedCoreLoop || null
          : dto.coreLoop !== undefined
            ? dto.coreLoop?.trim() || null
            : undefined,
      summary:
        dto.summary !== undefined ? dto.summary?.trim() || null : undefined,
      pillars:
        dto.pillars !== undefined
          ? (dto.pillars as unknown as Prisma.InputJsonValue)
          : undefined,
      keyFeatures:
        dto.keyFeatures !== undefined
          ? (dto.keyFeatures as unknown as Prisma.InputJsonValue)
          : undefined,
      targetSpecs: dto.targetSpecs !== undefined ? dto.targetSpecs : undefined,
      visualDirection:
        dto.visualDirection !== undefined
          ? (dto.visualDirection as unknown as Prisma.InputJsonValue)
          : undefined,
      gameplayLoop:
        dto.gameplayLoop !== undefined
          ? (dto.gameplayLoop as unknown as Prisma.InputJsonValue)
          : undefined,
      narrative:
        dto.narrative !== undefined
          ? (dto.narrative as unknown as Prisma.InputJsonValue)
          : undefined,
    };

    const saved = await this.prisma.gameBlueprint.upsert({
      where: { projectId: context.project.id },
      create: {
        projectId: context.project.id,
        tagline: dto.tagline?.trim() || null,
        targetAudience: dto.targetAudience?.trim() || null,
        cameraPerspective: dto.cameraPerspective?.trim() || null,
        artStyle: dto.artStyle?.trim() || null,
        audioTone: dto.audioTone?.trim() || null,
        networkModel: dto.networkModel?.trim() || null,
        targetFps: dto.targetFps ?? 60,
        targetResolution: dto.targetResolution?.trim() || null,
        coreLoop: derivedCoreLoop || dto.coreLoop?.trim() || null,
        summary: dto.summary?.trim() || null,
        pillars: dto.pillars
          ? (dto.pillars as unknown as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        keyFeatures: dto.keyFeatures
          ? (dto.keyFeatures as unknown as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        targetSpecs: dto.targetSpecs
          ? (dto.targetSpecs as unknown as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        visualDirection: dto.visualDirection
          ? (dto.visualDirection as unknown as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        gameplayLoop: dto.gameplayLoop
          ? (dto.gameplayLoop as unknown as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        narrative: dto.narrative
          ? (dto.narrative as unknown as Prisma.InputJsonValue)
          : Prisma.JsonNull,
      },
      update: payload,
    });

    this.logger.log(
      `[BLUEPRINT] Upserted blueprint for project=${context.project.id} by user=${currentUserId}`,
    );

    return this.mapToResponse(saved);
  }

  // ==========================================
  // GAME VISION ENGINE: AI ASSISTED GENERATORS
  // ==========================================

  async generateVisualDirection(
    projectIdOrSlug: string,
    currentUserId: string,
    currentUserRole?: string,
  ): Promise<VisualDirectionOutput> {
    const context = await this.projectAuthService.getProjectAccess(
      projectIdOrSlug,
      currentUserId,
      currentUserRole,
    );

    if (!context.isFounder) {
      throw new ForbiddenException(
        'Only the project founder can generate visual directions.',
      );
    }

    const project = await this.prisma.project.findUnique({
      where: { id: context.project.id },
      include: { blueprint: true },
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    const aiCtx: BlueprintAiContext = {
      projectName: project.name,
      genre: project.genre,
      platform: project.platform,
      gameEngine: project.gameEngine,
      tagline: project.blueprint?.tagline || null,
      summary: project.blueprint?.summary || project.description || null,
      artStyle: project.blueprint?.artStyle,
      cameraPerspective: project.blueprint?.cameraPerspective,
      audioTone: project.blueprint?.audioTone,
      networkModel: project.blueprint?.networkModel,
      targetFps: project.blueprint?.targetFps,
      targetResolution: project.blueprint?.targetResolution,
      coreLoop: project.blueprint?.coreLoop,
      pillars: Array.isArray(project.blueprint?.pillars)
        ? (project.blueprint?.pillars as any)
        : null,
      keyFeatures: Array.isArray(project.blueprint?.keyFeatures)
        ? (project.blueprint?.keyFeatures as any)
        : null,
    };

    const visualDirection =
      await this.gameVisionAiService.generateVisualDirection(aiCtx);

    // Persist visual direction to blueprint
    await this.prisma.gameBlueprint.upsert({
      where: { projectId: project.id },
      create: {
        projectId: project.id,
        artStyle: visualDirection.artStyle,
        cameraPerspective: visualDirection.cameraPerspective,
        visualDirection: visualDirection as unknown as Prisma.InputJsonValue,
      },
      update: {
        visualDirection: visualDirection as unknown as Prisma.InputJsonValue,
        artStyle: project.blueprint?.artStyle || visualDirection.artStyle,
        cameraPerspective:
          project.blueprint?.cameraPerspective ||
          visualDirection.cameraPerspective,
      },
    });

    return visualDirection;
  }

  async proposeGameplayLoop(
    projectIdOrSlug: string,
    currentUserId: string,
    currentUserRole?: string,
  ): Promise<ProposedGameplayLoopOutput> {
    const context = await this.projectAuthService.getProjectAccess(
      projectIdOrSlug,
      currentUserId,
      currentUserRole,
    );

    if (!context.isFounder) {
      throw new ForbiddenException(
        'Only the project founder can request gameplay loop proposals.',
      );
    }

    const project = await this.prisma.project.findUnique({
      where: { id: context.project.id },
      include: { blueprint: true },
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    const aiCtx: BlueprintAiContext = {
      projectName: project.name,
      genre: project.genre,
      platform: project.platform,
      gameEngine: project.gameEngine,
      tagline: project.blueprint?.tagline || null,
      summary: project.blueprint?.summary || project.description || null,
      artStyle: project.blueprint?.artStyle,
      cameraPerspective: project.blueprint?.cameraPerspective,
      coreLoop: project.blueprint?.coreLoop,
      pillars: Array.isArray(project.blueprint?.pillars)
        ? (project.blueprint?.pillars as any)
        : null,
      keyFeatures: Array.isArray(project.blueprint?.keyFeatures)
        ? (project.blueprint?.keyFeatures as any)
        : null,
    };

    // Returns proposal for founder review without overwriting DB
    return this.gameVisionAiService.proposeGameplayLoop(aiCtx);
  }

  async generateProductionPlan(
    projectIdOrSlug: string,
    currentUserId: string,
    currentUserRole?: string,
  ): Promise<ProductionPlanDraftOutput> {
    const context = await this.projectAuthService.getProjectAccess(
      projectIdOrSlug,
      currentUserId,
      currentUserRole,
    );

    if (!context.isFounder) {
      throw new ForbiddenException(
        'Only the project founder can generate production plans.',
      );
    }

    const project = await this.prisma.project.findUnique({
      where: { id: context.project.id },
      include: { blueprint: true },
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    const aiCtx: BlueprintAiContext = {
      projectName: project.name,
      genre: project.genre,
      platform: project.platform,
      gameEngine: project.gameEngine,
      tagline: project.blueprint?.tagline || null,
      summary: project.blueprint?.summary || project.description || null,
      artStyle: project.blueprint?.artStyle,
      cameraPerspective: project.blueprint?.cameraPerspective,
      coreLoop: project.blueprint?.coreLoop,
      pillars: Array.isArray(project.blueprint?.pillars)
        ? (project.blueprint?.pillars as any)
        : null,
      keyFeatures: Array.isArray(project.blueprint?.keyFeatures)
        ? (project.blueprint?.keyFeatures as any)
        : null,
    };

    // Returns draft proposal for review. Does NOT create tasks.
    return this.gameVisionAiService.generateProductionPlan(aiCtx);
  }


  async approveProductionPlan(
    projectIdOrSlug: string,
    currentUserId: string,
    currentUserRole: string | undefined,
    dto: ApproveProductionPlanDto,
  ): Promise<{
    milestoneId: string;
    milestoneTitle: string;
    taskCount: number;
    tasks: Array<{
      id: string;
      taskNumber: number;
      taskCode: string;
      title: string;
    }>;
  }> {
    const context = await this.projectAuthService.getProjectAccess(
      projectIdOrSlug,
      currentUserId,
      currentUserRole,
    );

    if (!context.isFounder) {
      throw new ForbiddenException(
        'Only the project founder can approve and create production records.',
      );
    }

    if (!dto.tasks || dto.tasks.length === 0) {
      throw new BadRequestException(
        'Cannot approve an empty production plan. At least one task is required.',
      );
    }

    const projectId = context.project.id;

    return this.prisma.$transaction(async (tx) => {
      // 1. Find or create the target milestone idempotently
      let milestone = await tx.milestone.findFirst({
        where: { projectId, title: dto.milestoneTitle.trim() },
      });

      if (!milestone) {
        milestone = await tx.milestone.create({
          data: {
            projectId,
            title: dto.milestoneTitle.trim(),
            description: dto.milestoneDescription?.trim() || null,
          },
        });
      }

      // 2. Fetch all existing tasks in project to prevent duplicate creation on retry
      const existingTasks = await tx.task.findMany({
        where: { projectId },
        select: { id: true, title: true, taskNumber: true },
      });

      const existingTaskByTitle = new Map<string, { id: string; taskNumber: number }>();
      for (const t of existingTasks) {
        existingTaskByTitle.set(t.title.toLowerCase().trim(), {
          id: t.id,
          taskNumber: t.taskNumber,
        });
      }

      let currentMaxTaskNumber = existingTasks.reduce(
        (max, t) => Math.max(max, t.taskNumber),
        0,
      );

      const tempIdToTaskId = new Map<string, string>();
      const processedTasks: Array<{
        id: string;
        taskNumber: number;
        taskCode: string;
        title: string;
      }> = [];

      // 3. Create or reuse tasks
      for (const item of dto.tasks) {
        const titleKey = item.title.toLowerCase().trim();
        const existing = existingTaskByTitle.get(titleKey);

        if (existing) {
          tempIdToTaskId.set(item.tempId, existing.id);
          processedTasks.push({
            id: existing.id,
            taskNumber: existing.taskNumber,
            taskCode: `TASK-${existing.taskNumber}`,
            title: item.title,
          });
          continue;
        }

        currentMaxTaskNumber += 1;

        // Parse TaskType
        let taskType: TaskType = TaskType.FEATURE;
        if (item.type && Object.values(TaskType).includes(item.type as TaskType)) {
          taskType = item.type as TaskType;
        }

        // Parse TaskPriority
        let taskPriority: TaskPriority = TaskPriority.MEDIUM;
        if (
          item.priority &&
          Object.values(TaskPriority).includes(item.priority as TaskPriority)
        ) {
          taskPriority = item.priority as TaskPriority;
        }

        const created = await tx.task.create({
          data: {
            projectId,
            milestoneId: milestone.id,
            taskNumber: currentMaxTaskNumber,
            title: item.title.trim(),
            description: item.description?.trim() || null,
            type: taskType,
            priority: taskPriority,
            status: TaskStatus.TODO,
          },
        });

        existingTaskByTitle.set(titleKey, {
          id: created.id,
          taskNumber: created.taskNumber,
        });
        tempIdToTaskId.set(item.tempId, created.id);

        processedTasks.push({
          id: created.id,
          taskNumber: created.taskNumber,
          taskCode: `TASK-${created.taskNumber}`,
          title: created.title,
        });
      }

      // 4. Wire dependencies if specified
      for (const item of dto.tasks) {
        if (!item.dependsOnTempIds || item.dependsOnTempIds.length === 0) {
          continue;
        }

        const realTaskId = tempIdToTaskId.get(item.tempId);
        if (!realTaskId) continue;

        for (const depTempId of item.dependsOnTempIds) {
          const upstreamRealId = tempIdToTaskId.get(depTempId);
          if (!upstreamRealId || upstreamRealId === realTaskId) continue;

          // Upsert or safely create dependency relationship
          const existingDep = await tx.taskDependency.findUnique({
            where: {
              taskId_dependsOnTaskId: {
                taskId: realTaskId,
                dependsOnTaskId: upstreamRealId,
              },
            },
          });

          if (!existingDep) {
            await tx.taskDependency.create({
              data: {
                taskId: realTaskId,
                dependsOnTaskId: upstreamRealId,
              },
            });
          }
        }
      }

      this.logger.log(
        `[PRODUCTION_PLAN] Approved production plan for project=${projectId}. Milestone=${milestone.id}, Tasks=${processedTasks.length}`,
      );

      return {
        milestoneId: milestone.id,
        milestoneTitle: milestone.title,
        taskCount: processedTasks.length,
        tasks: processedTasks,
      };
    });
  }

  // ==========================================
  // NARRATIVE STUDIO
  // ==========================================

  async getNarrative(
    projectIdOrSlug: string,
    currentUserId?: string,
    currentUserRole?: string,
  ): Promise<Record<string, any> | null> {
    const context = await this.projectAuthService.getProjectAccess(
      projectIdOrSlug,
      currentUserId,
      currentUserRole,
    );

    if (
      context.project.moderationStatus !== ProjectModerationStatus.PUBLISHED
    ) {
      if (!context.isFounder && !context.isMember && !context.isAdmin) {
        throw new NotFoundException('Project not found.');
      }
    }

    const blueprint = await this.prisma.gameBlueprint.findUnique({
      where: { projectId: context.project.id },
    });

    if (!blueprint) {
      return null;
    }

    return ((blueprint as any).narrative as Record<string, any>) ?? null;
  }

  async updateNarrative(
    projectIdOrSlug: string,
    currentUserId: string,
    currentUserRole: string | undefined,
    narrative: Record<string, any>,
  ): Promise<Record<string, any>> {
    const context = await this.projectAuthService.getProjectAccess(
      projectIdOrSlug,
      currentUserId,
      currentUserRole,
    );

    if (!context.isFounder && !context.isMember && !context.isAdmin) {
      throw new ForbiddenException(
        'Only project members or founders can modify the narrative studio.',
      );
    }

    const saved = await this.prisma.gameBlueprint.upsert({
      where: { projectId: context.project.id },
      create: {
        projectId: context.project.id,
        narrative: narrative as unknown as Prisma.InputJsonValue,
      },
      update: {
        narrative: narrative as unknown as Prisma.InputJsonValue,
      },
    });

    this.logger.log(
      `[NARRATIVE] Updated narrative for project=${context.project.id} by user=${currentUserId}`,
    );

    return ((saved as any).narrative as Record<string, any>) ?? {};
  }

  async aiProposeNarrative(
    projectIdOrSlug: string,
    currentUserId: string,
    currentUserRole: string | undefined,
    dto: AiProposeNarrativeDto,
  ): Promise<NarrativeAiOutput> {
    const context = await this.projectAuthService.getProjectAccess(
      projectIdOrSlug,
      currentUserId,
      currentUserRole,
    );

    if (!context.isFounder && !context.isMember && !context.isAdmin) {
      throw new ForbiddenException(
        'Only project members or founders can request narrative proposals.',
      );
    }

    const project = await this.prisma.project.findUnique({
      where: { id: context.project.id },
      include: { blueprint: true },
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    const bp = project.blueprint as any;
    const existingNarrative = bp?.narrative || {};

    const aiCtx: NarrativeAiContext = {
      projectName: project.name,
      genre: project.genre,
      platform: project.platform,
      gameEngine: project.gameEngine,
      tagline: bp?.tagline || null,
      summary: bp?.summary || project.description || null,
      artStyle: bp?.artStyle || null,
      cameraPerspective: bp?.cameraPerspective || null,
      audioTone: bp?.audioTone || null,
      coreLoop: bp?.coreLoop || null,
      pillars: Array.isArray(bp?.pillars) ? bp.pillars : null,
      keyFeatures: Array.isArray(bp?.keyFeatures) ? bp.keyFeatures : null,
      section: dto.section,
      prompt: dto.prompt,
      storyBible: existingNarrative.storyBible || dto.context?.storyBible || null,
      characters: existingNarrative.characters || dto.context?.characters || null,
      existingScenes: existingNarrative.scenes || dto.context?.scenes || null,
      existingQuests: existingNarrative.quests || dto.context?.quests || null,
    };

    return this.gameVisionAiService.proposeNarrativeContent(aiCtx);
  }

  // ==========================================
  // VISUAL TEAM SKILL COVERAGE
  // ==========================================

  async getSkillCoverage(
    projectIdOrSlug: string,
    currentUserId?: string,
    currentUserRole?: string,
  ): Promise<SkillCoverageResponseDto> {
    const { project } = await this.projectAuthService.assertCanView(
      projectIdOrSlug,
      currentUserId,
      currentUserRole,
    );

    // Fetch project with founder, active members, and open roles
    const fullProject = await this.prisma.project.findUnique({
      where: { id: project.id },
      include: {
        founder: {
          select: {
            id: true,
            username: true,
            profile: {
              select: {
                displayName: true,
                avatarUrl: true,
                headline: true,
                identity: {
                  include: {
                    skills: { include: { skill: true } },
                    roles: { include: { role: true } },
                  },
                },
              },
            },
          },
        },
        members: {
          where: { status: ProjectMemberStatus.ACTIVE },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                profile: {
                  select: {
                    displayName: true,
                    avatarUrl: true,
                    headline: true,
                    identity: {
                      include: {
                        skills: { include: { skill: true } },
                        roles: { include: { role: true } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        openRoles: {
          where: { status: ProjectRoleStatus.OPEN },
          include: {
            role: true,
            requiredSkills: { include: { skill: true } },
          },
        },
      },
    });

    if (!fullProject) {
      throw new NotFoundException('Project not found.');
    }

    // Collect all active contributors: founder + active members
    const teamMembers: Array<{
      id: string;
      username: string;
      displayName: string;
      avatarUrl: string | null;
      skillNames: string[];
      roleNames: string[];
    }> = [];

    if (fullProject.founder) {
      const p = fullProject.founder.profile;
      const skills =
        p?.identity?.skills?.map((s) => s.skill.name.toLowerCase().trim()) || [];
      const roles =
        p?.identity?.roles?.map((r) => r.role.name.toLowerCase().trim()) || [];
      teamMembers.push({
        id: fullProject.founder.id,
        username: fullProject.founder.username,
        displayName: p?.displayName || fullProject.founder.username,
        avatarUrl: p?.avatarUrl || null,
        skillNames: skills,
        roleNames: roles,
      });
    }

    for (const m of fullProject.members) {
      if (!m.user) continue;
      const p = m.user.profile;
      const skills =
        p?.identity?.skills?.map((s) => s.skill.name.toLowerCase().trim()) || [];
      const roles =
        p?.identity?.roles?.map((r) => r.role.name.toLowerCase().trim()) || [];
      teamMembers.push({
        id: m.user.id,
        username: m.user.username,
        displayName: p?.displayName || m.user.username,
        avatarUrl: p?.avatarUrl || null,
        skillNames: skills,
        roleNames: roles,
      });
    }

    const disciplines: SkillCoverageDisciplineDto[] = [];
    let coveredCount = 0;
    let recruitingCount = 0;
    let gapCount = 0;

    for (const [disciplineKey, standardSkills] of Object.entries(
      DISCIPLINE_SKILL_MAP,
    )) {
      const disciplineSkillsLower = standardSkills.map((s) =>
        s.toLowerCase().trim(),
      );

      // 1. Identify members with matching skills or roles in this discipline
      const matchedMembers: SkillCoverageMemberDto[] = [];

      for (const tm of teamMembers) {
        const matchingSkills = standardSkills.filter((req) =>
          tm.skillNames.includes(req.toLowerCase().trim()),
        );

        const hasDisciplineRole = tm.roleNames.some((r) =>
          r.includes(disciplineKey.toLowerCase()),
        );

        if (matchingSkills.length > 0 || hasDisciplineRole) {
          matchedMembers.push({
            id: tm.id,
            username: tm.username,
            displayName: tm.displayName,
            avatarUrl: tm.avatarUrl,
            matchedSkills:
              matchingSkills.length > 0
                ? matchingSkills
                : [standardSkills[0]], // Role coverage guarantee
          });
        }
      }

      // 2. Identify open roles recruiting for this discipline
      const openRolesForDiscipline: SkillCoverageOpenRoleDto[] = [];
      for (const r of fullProject.openRoles) {
        const roleTitle = r.title || r.role.name;
        const roleNameLower = roleTitle.toLowerCase();
        const roleCategoryMatch =
          roleNameLower.includes(disciplineKey.toLowerCase()) ||
          r.requiredSkills.some((rs) =>
            disciplineSkillsLower.includes(rs.skill.name.toLowerCase().trim()),
          );

        if (roleCategoryMatch) {
          openRolesForDiscipline.push({
            id: r.id,
            title: roleTitle,
            openPositions: 1,
            skills: r.requiredSkills.map((rs) => rs.skill.name),
          });
        }
      }

      // 3. Determine status: COVERED, RECRUITING, or GAP
      let status: 'COVERED' | 'RECRUITING' | 'GAP' = 'GAP';
      if (matchedMembers.length > 0) {
        status = 'COVERED';
        coveredCount++;
      } else if (openRolesForDiscipline.length > 0) {
        status = 'RECRUITING';
        recruitingCount++;
      } else {
        status = 'GAP';
        gapCount++;
      }

      // 4. Fetch candidate recommendation for this discipline if GAP or RECRUITING
      let sampleCandidate: SkillCoverageCandidateRecommendationDto | null =
        null;
      let candidateCount = 0;

      try {
        const roleSpec: RoleMatchSpecification = {
          roleId: '',
          roleName: `${disciplineKey} Specialist`,
          experienceLevel: ProjectRoleExperienceLevel.MID,
          commitment: ProjectRoleCommitment.PART_TIME,
          requiredSkills: standardSkills.slice(0, 3).map((name) => ({
            id: name,
            name,
          })),
          requiredTools: [],
        };

        const candidates =
          await this.talentMatchingService.getRankedCandidatesForRoleSpec(
            project.id,
            roleSpec,
            2,
          );

        if (candidates && candidates.length > 0) {
          candidateCount = candidates.length;
          const top = candidates[0];
          sampleCandidate = {
            id: top.candidate.id,
            username: top.candidate.username,
            displayName: top.candidate.displayName,
            avatarUrl: top.candidate.avatarUrl || null,
            headline: top.candidate.headline || null,
            matchScore: top.totalScore,
          };
        }
      } catch (err: any) {
        this.logger.debug(
          `Could not fetch candidate recommendation for ${disciplineKey}: ${err.message}`,
        );
      }

      disciplines.push({
        discipline: disciplineKey,
        status,
        requiredSkills: standardSkills,
        coveredByMembers: matchedMembers,
        openRoles: openRolesForDiscipline,
        recommendedCandidatesCount: candidateCount,
        sampleCandidate,
      });

    }

    const totalDisciplines = disciplines.length;
    const coveragePercentage =
      totalDisciplines > 0
        ? Math.round((coveredCount / totalDisciplines) * 100)
        : 0;

    return {
      totalRequiredSkills: Object.values(DISCIPLINE_SKILL_MAP).flat().length,
      coveredCount,
      recruitingCount,
      gapCount,
      coveragePercentage,
      disciplines,
    };
  }

  // ==========================================
  // RESPONSE MAPPER
  // ==========================================

  private mapToResponse(blueprint: GameBlueprint): GameBlueprintResponseDto {
    let gameplayLoop =
      blueprint.gameplayLoop && typeof blueprint.gameplayLoop === 'object'
        ? (blueprint.gameplayLoop as Record<string, any>)
        : null;

    // Fallback parser if gameplayLoop is not saved as structured JSON but coreLoop contains arrow steps
    if (
      !gameplayLoop &&
      blueprint.coreLoop &&
      blueprint.coreLoop.includes('→')
    ) {
      const stepTitles = blueprint.coreLoop
        .split('→')
        .map((s) => s.trim())
        .filter(Boolean);

      if (stepTitles.length > 0) {
        const phases = [
          'EXPLORATION',
          'COMBAT',
          'SCAVENGING',
          'UPGRADE',
          'PROGRESSION',
          'RETURN',
        ];
        gameplayLoop = {
          summary: 'Configured gameplay loop cycle',
          steps: stepTitles.map((title, idx) => ({
            stepNumber: idx + 1,
            phase: phases[idx % phases.length],
            title,
            description: `Engage with ${title.toLowerCase()} in the world.`,
            pacing: 'Core repeatable cycle',
          })),
        };
      }
    }

    return {
      id: blueprint.id,
      projectId: blueprint.projectId,
      tagline: blueprint.tagline,
      targetAudience: blueprint.targetAudience,
      cameraPerspective: blueprint.cameraPerspective,
      artStyle: blueprint.artStyle,
      audioTone: blueprint.audioTone,
      networkModel: blueprint.networkModel,
      targetFps: blueprint.targetFps,
      targetResolution: blueprint.targetResolution,
      coreLoop: blueprint.coreLoop,
      summary: blueprint.summary,
      pillars: Array.isArray(blueprint.pillars)
        ? (blueprint.pillars as unknown as GamePillarDto[])
        : null,
      keyFeatures: Array.isArray(blueprint.keyFeatures)
        ? (blueprint.keyFeatures as unknown as GameFeatureDto[])
        : null,
      targetSpecs:
        blueprint.targetSpecs && typeof blueprint.targetSpecs === 'object'
          ? (blueprint.targetSpecs as Record<string, any>)
          : null,
      visualDirection:
        blueprint.visualDirection &&
        typeof blueprint.visualDirection === 'object'
          ? (blueprint.visualDirection as Record<string, any>)
          : null,
      gameplayLoop,
      narrative:
        (blueprint as any).narrative &&
        typeof (blueprint as any).narrative === 'object'
          ? ((blueprint as any).narrative as Record<string, any>)
          : null,
      createdAt: blueprint.createdAt.toISOString(),
      updatedAt: blueprint.updatedAt.toISOString(),
    };
  }
}
