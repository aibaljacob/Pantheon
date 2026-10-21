import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { ProjectModerationStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectAuthorizationService } from '../../tasks/project-authorization.service';
import { GameBlueprintService } from './game-blueprint.service';
import { GamePillarDto, UpsertGameBlueprintDto } from './game-blueprint.dto';
import {
  AiRecommendationService,
  TaxonomyItemRef,
} from '../../ai/ai-recommendation.service';
import { ProjectsService } from '../projects.service';
import { TalentMatchingService } from '../talent-matching.service';
import { GameVisionAiService } from '../../ai/game-vision-ai.service';

describe('GameBlueprint Specification & Integration Suite', () => {
  let blueprintService: GameBlueprintService;
  let aiService: AiRecommendationService;
  let projectsService: ProjectsService;

  const mockFounderId = 'founder-uuid-1';
  const mockMemberId = 'member-uuid-2';
  const mockStrangerId = 'stranger-uuid-3';
  const mockProjectId = 'project-uuid-100';

  const mockProject = {
    id: mockProjectId,
    name: 'Abyssal Depths',
    slug: 'abyssal-depths',
    description: 'A co-op tactical diving extraction shooter.',
    status: 'IN_DEVELOPMENT',
    moderationStatus: ProjectModerationStatus.PUBLISHED,
    founderId: mockFounderId,
    genre: 'Shooter',
    platform: 'PC',
    gameEngine: 'Unreal Engine 5',
    savedAiRecommendations: null,
    savedTalentRecommendations: null,
    members: [
      { userId: mockFounderId, status: 'ACTIVE' },
      { userId: mockMemberId, status: 'ACTIVE' },
    ],
  };

  const sampleBlueprintData = {
    id: 'blueprint-uuid-1',
    projectId: mockProjectId,
    tagline: 'Tactical extraction in a sunken metropolis.',
    targetAudience: 'Core tactical shooter players 18-35',
    cameraPerspective: 'Third-Person Over-the-Shoulder',
    artStyle: 'Stylized Cel-shaded Noir',
    audioTone: 'Dark Industrial Ambient',
    networkModel: 'Dedicated Server 4-Player Co-op',
    targetFps: 60,
    targetResolution: '1440p',
    coreLoop: 'Dive -> Scavenge -> Extract -> Upgrade',
    summary: 'Submerged deep-sea city narrative.',
    pillars: [
      {
        title: 'Unforgiving Ballistics',
        description:
          'Physical recoil, water resistance, and armor penetration.',
      },
      {
        title: 'Submerged Physics',
        description: 'Buoyancy and hull pressure dynamics.',
      },
    ],
    keyFeatures: [
      {
        category: 'TECHNICAL',
        title: 'Water Buoyancy Replication',
        description:
          'Server authoritative water wave and player buoyancy physics.',
      },
      {
        category: 'ART',
        title: 'Modular Diver Suits',
        description: '4 high-detail customizable diver character models.',
      },
    ],
    targetSpecs: { minGpu: 'RTX 2060', minRam: '16GB' },
    visualDirection: null,
    gameplayLoop: null,
    createdAt: new Date('2026-09-29T00:00:00.000Z'),
    updatedAt: new Date('2026-09-29T01:00:00.000Z'),
  };

  const prismaMock: any = {
    project: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    gameBlueprint: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    projectMember: {
      findFirst: jest.fn(),
    },
    professionalRole: {
      findMany: jest.fn(),
    },
    skill: {
      findMany: jest.fn(),
    },
    tool: {
      findMany: jest.fn(),
    },
    milestone: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    task: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    taskDependency: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn().mockImplementation((cb) => cb(prismaMock)),
  };


  const gameVisionAiMock = {
    generateVisualDirection: jest.fn().mockResolvedValue({
      artStyle: 'Gritty Cinematic Noir',
      atmosphere: 'Volumetric dust and chiaroscuro',
      lighting: 'Chiaroscuro high-contrast',
      cameraPerspective: 'Third-Person',
      palette: [{ hex: '#141312', name: 'Matte Graphite', role: 'DOMINANT' }],
      visualKeyElements: ['Hydraulic conduits'],
      conceptArtPrompt: 'Cinematic render prompt',
      conceptArtUrl: null,
      imageGenerationSupported: false,
      generatedAt: '2026-10-17T09:00:00.000Z',
    }),
    proposeGameplayLoop: jest.fn().mockResolvedValue({
      summary: 'Repeatable core loop',
      steps: [
        {
          stepNumber: 1,
          phase: 'EXPLORATION',
          title: 'Navigate Sectors',
          description: 'Traverse environment',
        },
        {
          stepNumber: 2,
          phase: 'COMBAT',
          title: 'Tactical Combat',
          description: 'Fight machines',
        },
        {
          stepNumber: 3,
          phase: 'SCAVENGING',
          title: 'Salvage Alloys',
          description: 'Recover tech',
        },
        {
          stepNumber: 4,
          phase: 'UPGRADE',
          title: 'Fabricate Upgrades',
          description: 'Mod weapons',
        },
      ],
      generatedAt: '2026-10-17T09:00:00.000Z',
    }),
    generateProductionPlan: jest.fn().mockResolvedValue({
      summary: 'Production plan breakdown',
      targetMilestoneTitle: 'Milestone 1: Alpha',
      estimatedWeeks: 8,
      systems: [
        {
          tempId: 'sys-1',
          name: 'Combat Engine',
          discipline: 'ENGINEERING',
          description: 'Hostile AI',
          features: [
            {
              tempId: 'feat-1',
              name: 'AI State Machine',
              discipline: 'ENGINEERING',
              requiredSkills: ['AI Programming'],
              tasks: [
                {
                  tempId: 'task-1',
                  title: 'Perception Manager',
                  type: 'FEATURE',
                  priority: 'HIGH',
                  discipline: 'Engineering',
                },
              ],
            },
          ],
        },
      ],
      generatedAt: '2026-10-17T09:00:00.000Z',
    }),
    proposeNarrativeContent: jest.fn().mockResolvedValue({
      section: 'SCENE',
      draft: {
        id: 'scene-1',
        title: 'Draft scene',
      },
      continuityNotes: ['Matches dark fantasy tone'],
      generatedAt: '2026-10-17T09:00:00.000Z',
    }),
  };

  const talentMatchingMock = {
    getRankedCandidatesForRoleSpec: jest.fn().mockResolvedValue([
      {
        candidate: {
          id: 'candidate-1',
          username: 'alex_dev',
          displayName: 'Alex Developer',
          avatarUrl: null,
          headline: 'Gameplay Engineer',
        },
        totalScore: 92,
      },
    ]),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameBlueprintService,
        ProjectAuthorizationService,
        AiRecommendationService,
        ProjectsService,
        { provide: GameVisionAiService, useValue: gameVisionAiMock },
        { provide: PrismaService, useValue: prismaMock },
        { provide: TalentMatchingService, useValue: talentMatchingMock },
      ],
    }).compile();



    blueprintService = module.get<GameBlueprintService>(GameBlueprintService);
    aiService = module.get<AiRecommendationService>(AiRecommendationService);
    projectsService = module.get<ProjectsService>(ProjectsService);
  });

  describe('1. Blueprint Creation', () => {
    it('should allow project founder to create a blueprint via upsert', async () => {
      prismaMock.project.findFirst.mockResolvedValue(mockProject);
      prismaMock.gameBlueprint.upsert.mockResolvedValue(sampleBlueprintData);

      const dto: UpsertGameBlueprintDto = {
        tagline: sampleBlueprintData.tagline,
        targetAudience: sampleBlueprintData.targetAudience,
        cameraPerspective: sampleBlueprintData.cameraPerspective,
        artStyle: sampleBlueprintData.artStyle,
        audioTone: sampleBlueprintData.audioTone,
        networkModel: sampleBlueprintData.networkModel,
        targetFps: 60,
        targetResolution: '1440p',
        coreLoop: sampleBlueprintData.coreLoop,
        summary: sampleBlueprintData.summary,
        pillars: sampleBlueprintData.pillars,
        keyFeatures: sampleBlueprintData.keyFeatures,
      };

      const result = await blueprintService.upsertBlueprint(
        mockProjectId,
        mockFounderId,
        'Member',
        dto,
      );

      expect(result).toBeDefined();
      expect(result.tagline).toBe(sampleBlueprintData.tagline);
      expect(result.networkModel).toBe('Dedicated Server 4-Player Co-op');
      expect(prismaMock.gameBlueprint.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { projectId: mockProjectId },
        }),
      );
    });
  });

  describe('2. Blueprint Retrieval', () => {
    it('should retrieve existing blueprint and map structured fields', async () => {
      prismaMock.project.findFirst.mockResolvedValue(mockProject);
      prismaMock.gameBlueprint.findUnique.mockResolvedValue(
        sampleBlueprintData,
      );

      const result = await blueprintService.getBlueprint(
        mockProjectId,
        mockMemberId,
        'Member',
      );

      expect(result).toBeDefined();
      expect(result?.id).toBe(sampleBlueprintData.id);
      expect(result?.pillars?.length).toBe(2);
      expect(result?.pillars?.[0].title).toBe('Unforgiving Ballistics');
      expect(result?.keyFeatures?.[0].category).toBe('TECHNICAL');
      expect(result?.createdAt).toBe('2026-09-29T00:00:00.000Z');
    });

    it('should return null when no blueprint exists for project', async () => {
      prismaMock.project.findFirst.mockResolvedValue(mockProject);
      prismaMock.gameBlueprint.findUnique.mockResolvedValue(null);

      const result = await blueprintService.getBlueprint(
        mockProjectId,
        mockMemberId,
        'Member',
      );

      expect(result).toBeNull();
    });
  });

  describe('3. Blueprint Update', () => {
    it('should update blueprint fields on subsequent upsert', async () => {
      const updatedData = {
        ...sampleBlueprintData,
        targetFps: 120,
        targetResolution: '4K',
      };

      prismaMock.project.findFirst.mockResolvedValue(mockProject);
      prismaMock.gameBlueprint.upsert.mockResolvedValue(updatedData);

      const updateDto: UpsertGameBlueprintDto = {
        targetFps: 120,
        targetResolution: '4K',
      };

      const result = await blueprintService.upsertBlueprint(
        mockProjectId,
        mockFounderId,
        'Member',
        updateDto,
      );

      expect(result.targetFps).toBe(120);
      expect(result.targetResolution).toBe('4K');
    });
  });

  describe('4. Founder Authorization Enforcement', () => {
    it('should reject non-founder member modification with ForbiddenException', async () => {
      prismaMock.project.findFirst.mockResolvedValue(mockProject);

      await expect(
        blueprintService.upsertBlueprint(
          mockProjectId,
          mockMemberId,
          'Member',
          { tagline: 'Unauthorized edit' },
        ),
      ).rejects.toThrow(ForbiddenException);

      expect(prismaMock.gameBlueprint.upsert).not.toHaveBeenCalled();
    });

    it('should reject anonymous stranger modification with ForbiddenException', async () => {
      prismaMock.project.findFirst.mockResolvedValue(mockProject);

      await expect(
        blueprintService.upsertBlueprint(
          mockProjectId,
          mockStrangerId,
          'Member',
          { tagline: 'Unauthorized stranger edit' },
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('5. Project Visibility Access Rules', () => {
    it('should reject access to unapproved project blueprint for non-members', async () => {
      const unapprovedProject = {
        ...mockProject,
        moderationStatus: ProjectModerationStatus.PENDING_REVIEW,
      };

      prismaMock.project.findFirst.mockResolvedValue(unapprovedProject);

      await expect(
        blueprintService.getBlueprint(mockProjectId, mockStrangerId, 'Member'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should allow founder to access unapproved project blueprint', async () => {
      const unapprovedProject = {
        ...mockProject,
        moderationStatus: ProjectModerationStatus.PENDING_REVIEW,
      };

      prismaMock.project.findFirst.mockResolvedValue(unapprovedProject);
      prismaMock.gameBlueprint.findUnique.mockResolvedValue(
        sampleBlueprintData,
      );

      const result = await blueprintService.getBlueprint(
        mockProjectId,
        mockFounderId,
        'Member',
      );

      expect(result).toBeDefined();
      expect(result?.id).toBe(sampleBlueprintData.id);
    });
  });

  describe('6. Blueprint DTO Validation', () => {
    it('should validate valid blueprint DTO without errors', async () => {
      const dto = plainToInstance(UpsertGameBlueprintDto, {
        tagline: 'A valid elevator pitch.',
        targetFps: 60,
        targetResolution: '1080p',
        pillars: [{ title: 'Pillar 1', description: 'Pillar 1 description' }],
        keyFeatures: [
          {
            category: 'GAMEPLAY',
            title: 'Feature 1',
            description: 'Feature 1 description',
          },
        ],
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should reject invalid targetFps below 15 or above 360', async () => {
      const dtoLow = plainToInstance(UpsertGameBlueprintDto, { targetFps: 10 });
      const errorsLow = await validate(dtoLow);
      expect(errorsLow.some((e) => e.property === 'targetFps')).toBe(true);

      const dtoHigh = plainToInstance(UpsertGameBlueprintDto, {
        targetFps: 500,
      });
      const errorsHigh = await validate(dtoHigh);
      expect(errorsHigh.some((e) => e.property === 'targetFps')).toBe(true);
    });

    it('should reject invalid nested pillar DTO missing required fields', async () => {
      const pillar = plainToInstance(GamePillarDto, { title: '' });
      const errors = await validate(pillar);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('7. AI Receives Blueprint Context', () => {
    it('should tailor fallback recommendation reasoning and keywords when blueprint exists', () => {
      const rolesTaxonomy: TaxonomyItemRef[] = [
        { id: 'role-1', name: 'Network Programmer' },
        { id: 'role-2', name: '3D Technical Artist' },
        { id: 'role-3', name: 'Game Designer' },
        { id: 'role-4', name: 'Audio Designer' },
      ];
      const skillsTaxonomy: TaxonomyItemRef[] = [
        { id: 's-1', name: 'C++' },
        { id: 's-2', name: 'Replication' },
      ];
      const toolsTaxonomy: TaxonomyItemRef[] = [
        { id: 't-1', name: 'Unreal Engine 5' },
        { id: 't-2', name: 'Wwise' },
      ];

      const recommendations = aiService.generateFallbackRecommendations(
        {
          name: 'Abyssal Depths',
          description: 'A co-op game',
          status: 'IN_DEVELOPMENT',
          existingRoleNames: [],
          blueprint: {
            tagline: sampleBlueprintData.tagline,
            networkModel: sampleBlueprintData.networkModel,
            artStyle: sampleBlueprintData.artStyle,
            audioTone: sampleBlueprintData.audioTone,
            pillars: sampleBlueprintData.pillars,
            keyFeatures: sampleBlueprintData.keyFeatures,
          },
        },
        rolesTaxonomy,
        skillsTaxonomy,
        toolsTaxonomy,
      );

      expect(recommendations.length).toBeGreaterThan(0);
      // Confirms Network or 3D Technical roles are prioritized due to dedicated server & stylized 3D specs
      const roleNames = recommendations.map((r) => r.roleName);
      expect(roleNames).toContain('Network Programmer');
      // Confirms reasoning cites blueprint pillars
      const hasPillarAttribution = recommendations.some((r) =>
        r.reasoning.includes('Game Blueprint Pillar: "Unforgiving Ballistics"'),
      );
      expect(hasPillarAttribution).toBe(true);
    });
  });

  describe('8. AI Backward Compatibility (Blueprint Absent)', () => {
    it('should generate standard fallback recommendations when blueprint is absent', () => {
      const rolesTaxonomy: TaxonomyItemRef[] = [
        { id: 'role-1', name: 'Gameplay Programmer' },
        { id: 'role-2', name: 'Concept Artist' },
        { id: 'role-3', name: 'Game Designer' },
      ];
      const skillsTaxonomy: TaxonomyItemRef[] = [
        { id: 's-1', name: 'C#' },
        { id: 's-2', name: 'Unity' },
      ];
      const toolsTaxonomy: TaxonomyItemRef[] = [
        { id: 't-1', name: 'Git' },
        { id: 't-2', name: 'Photoshop' },
      ];

      const recommendations = aiService.generateFallbackRecommendations(
        {
          name: 'Classic Platformer',
          description: 'A retro 2D platformer',
          status: 'PLANNING',
          existingRoleNames: [],
          blueprint: null,
        },
        rolesTaxonomy,
        skillsTaxonomy,
        toolsTaxonomy,
      );

      expect(recommendations.length).toBe(3);
      expect(recommendations[0].reasoning).not.toContain('Game Blueprint');
    });
  });

  describe('9. Existing Project AI Recommendation Flow', () => {
    it('should query blueprint, forward to aiService, match talent, and persist to project', async () => {
      const projectWithBlueprint = {
        ...mockProject,
        openRoles: [],
        blueprint: sampleBlueprintData,
      };

      prismaMock.project.findUnique.mockResolvedValue(projectWithBlueprint);
      prismaMock.professionalRole.findMany.mockResolvedValue([
        { id: 'role-1', name: 'Network Programmer' },
      ]);
      prismaMock.skill.findMany.mockResolvedValue([{ id: 's-1', name: 'C++' }]);
      prismaMock.tool.findMany.mockResolvedValue([{ id: 't-1', name: 'UE5' }]);
      prismaMock.project.update.mockResolvedValue(projectWithBlueprint);

      const aiSpy = jest
        .spyOn(aiService, 'generateRoleRecommendations')
        .mockResolvedValue([
          {
            roleId: 'role-1',
            roleName: 'Network Programmer',
            title: 'Network Programmer',
            description: 'Responsible for network replication',
            experienceLevel: 'MID',
            commitment: 'FULL_TIME',
            skillIds: ['s-1'],
            toolIds: ['t-1'],
            requiredSkills: [{ id: 's-1', name: 'C++' }],
            requiredTools: [{ id: 't-1', name: 'UE5' }],
            reasoning: 'Recommended based on dedicated server blueprint',
          },
        ]);

      const response = await projectsService.generateAiRoleRecommendations(
        mockProjectId,
        mockFounderId,
      );

      expect(response).toBeDefined();
      expect(response.recommendedRoles.length).toBeGreaterThan(0);
      expect(aiSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          blueprint: expect.objectContaining({
            tagline: sampleBlueprintData.tagline,
            networkModel: sampleBlueprintData.networkModel,
          }),
        }),
        expect.any(Array),
        expect.any(Array),
        expect.any(Array),
      );
      expect(prismaMock.project.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockProjectId },
          data: expect.objectContaining({
            savedAiRecommendations: expect.any(Array),
          }),
        }),
      );
    });
  });

  describe('10. Game Vision Engine: Visual Direction Synthesis', () => {
    it('should allow founder to generate visual direction and persist to blueprint', async () => {
      prismaMock.project.findFirst.mockResolvedValue(mockProject);
      prismaMock.project.findUnique.mockResolvedValue({
        ...mockProject,
        blueprint: sampleBlueprintData,
      });
      prismaMock.gameBlueprint.upsert.mockResolvedValue({
        ...sampleBlueprintData,
        visualDirection: {
          artStyle: 'Gritty Cinematic Noir',
          atmosphere: 'Volumetric dust and chiaroscuro',
        },
      });

      const direction = await blueprintService.generateVisualDirection(
        mockProjectId,
        mockFounderId,
      );

      expect(direction).toBeDefined();
      expect(direction.artStyle).toBeDefined();
      expect(direction.palette).toBeInstanceOf(Array);
      expect(prismaMock.gameBlueprint.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { projectId: mockProjectId },
          update: expect.objectContaining({
            visualDirection: expect.any(Object),
          }),
        }),
      );
    });

    it('should reject non-founder from generating visual direction', async () => {
      prismaMock.project.findFirst.mockResolvedValue({
        ...mockProject,
        members: [{ id: 'member-1' }],
      });

      await expect(
        blueprintService.generateVisualDirection(mockProjectId, mockMemberId),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('11. Game Vision Engine: Interactive Gameplay Loop Proposal', () => {
    it('should propose a gameplay loop without mutating the database', async () => {
      prismaMock.project.findFirst.mockResolvedValue(mockProject);
      prismaMock.project.findUnique.mockResolvedValue({
        ...mockProject,
        blueprint: sampleBlueprintData,
      });

      const proposal = await blueprintService.proposeGameplayLoop(
        mockProjectId,
        mockFounderId,
      );

      expect(proposal).toBeDefined();
      expect(proposal.steps.length).toBeGreaterThanOrEqual(4);
      // Crucial: proposing must not persist or mutate DB
      expect(prismaMock.gameBlueprint.upsert).not.toHaveBeenCalled();
    });
  });

  describe('12. Game Vision Engine: Production Plan Approval & Idempotency', () => {
    it('should generate draft production plan without creating real tasks in database', async () => {
      prismaMock.project.findFirst.mockResolvedValue(mockProject);
      prismaMock.project.findUnique.mockResolvedValue({
        ...mockProject,
        blueprint: sampleBlueprintData,
      });

      const draft = await blueprintService.generateProductionPlan(
        mockProjectId,
        mockFounderId,
      );

      expect(draft).toBeDefined();
      expect(draft.systems.length).toBeGreaterThan(0);
      expect(prismaMock.task.create).not.toHaveBeenCalled();
      expect(prismaMock.milestone.create).not.toHaveBeenCalled();
    });

    it('should create milestone, tasks and dependencies atomically upon founder approval', async () => {
      prismaMock.project.findFirst.mockResolvedValue(mockProject);
      prismaMock.milestone.findFirst.mockResolvedValue(null);
      prismaMock.milestone.create.mockResolvedValue({
        id: 'ms-1',
        title: 'Milestone 1: Core Combat',
      });
      prismaMock.task.findMany.mockResolvedValue([]);
      prismaMock.task.create
        .mockResolvedValueOnce({
          id: 'task-real-1',
          taskNumber: 1,
          title: 'Player Controller',
        })
        .mockResolvedValueOnce({
          id: 'task-real-2',
          taskNumber: 2,
          title: 'Sprint Mechanic',
        });
      prismaMock.taskDependency.findUnique.mockResolvedValue(null);
      prismaMock.taskDependency.create.mockResolvedValue({});

      const approvalDto = {
        milestoneTitle: 'Milestone 1: Core Combat',
        tasks: [
          {
            tempId: 'temp-1',
            title: 'Player Controller',
            description: 'Locomotion state machine',
            type: 'FEATURE',
            priority: 'HIGH',
          },
          {
            tempId: 'temp-2',
            title: 'Sprint Mechanic',
            description: 'Stamina curve',
            type: 'FEATURE',
            priority: 'MEDIUM',
            dependsOnTempIds: ['temp-1'],
          },
        ],
      };

      const result = await blueprintService.approveProductionPlan(
        mockProjectId,
        mockFounderId,
        'USER',
        approvalDto,
      );

      expect(result.milestoneId).toBe('ms-1');
      expect(result.taskCount).toBe(2);
      expect(prismaMock.task.create).toHaveBeenCalledTimes(2);
      expect(prismaMock.taskDependency.create).toHaveBeenCalledWith({
        data: {
          taskId: 'task-real-2',
          dependsOnTaskId: 'task-real-1',
        },
      });
    });

    it('should reuse existing tasks on retry to prevent duplicates', async () => {
      prismaMock.project.findFirst.mockResolvedValue(mockProject);
      prismaMock.milestone.findFirst.mockResolvedValue({
        id: 'ms-1',
        title: 'Milestone 1: Core Combat',
      });
      prismaMock.task.findMany.mockResolvedValue([
        {
          id: 'task-real-1',
          title: 'Player Controller',
          taskNumber: 1,
        },
      ]);

      const approvalDto = {
        milestoneTitle: 'Milestone 1: Core Combat',
        tasks: [
          {
            tempId: 'temp-1',
            title: 'Player Controller',
            description: 'Already exists',
          },
        ],
      };

      const result = await blueprintService.approveProductionPlan(
        mockProjectId,
        mockFounderId,
        'USER',
        approvalDto,
      );

      // Reused existing task, no duplicate task created
      expect(result.tasks[0].id).toBe('task-real-1');
      expect(prismaMock.task.create).not.toHaveBeenCalled();
    });
  });

  describe('13. Game Vision Engine: Visual Team Skill Coverage', () => {
    it('should compute discipline coverage and flag covered vs gap disciplines', async () => {
      prismaMock.project.findFirst.mockResolvedValue(mockProject);
      prismaMock.project.findUnique.mockResolvedValue({
        ...mockProject,
        founder: {
          id: mockFounderId,
          username: 'founder_helios',
          profile: {
            displayName: 'Helios Founder',
            avatarUrl: null,
            identity: {
              skills: [
                { skill: { name: 'Gameplay Programming' } },
                { skill: { name: 'Engine Architecture' } },
              ],
              roles: [{ role: { name: 'Engineering Lead' } }],
            },
          },
        },
        members: [],
        openRoles: [
          {
            id: 'role-open-1',
            title: 'Environment Artist',
            role: { name: 'Environment Artist' },
            requiredSkills: [{ skill: { name: '3D Modeling' } }],
          },
        ],
      });

      const coverage = await blueprintService.getSkillCoverage(
        mockProjectId,
        mockFounderId,
      );

      expect(coverage).toBeDefined();
      expect(coverage.disciplines.length).toBe(4);

      const engineering = coverage.disciplines.find(
        (d) => d.discipline === 'ENGINEERING',
      );
      expect(engineering?.status).toBe('COVERED');
      expect(engineering?.coveredByMembers.length).toBe(1);

      const art = coverage.disciplines.find((d) => d.discipline === 'ART');
      expect(art?.status).toBe('RECRUITING');
      expect(art?.openRoles.length).toBe(1);
    });
  });

  describe('14. Game Vision Engine: Narrative Studio', () => {
    const mockNarrativeData = {
      storyBible: {
        summary: 'A dark fantasy saga of ash and vows.',
        themes: ['Inherited Vows', 'Divine Corruption'],
        worldLore: 'Deep beneath the cathedral lies the abyssal kiln.',
        settingRules: 'Rule of the Ember',
        factions: [
          { id: 'fac-1', name: 'The Ashen Concord', description: 'Paladins' },
        ],
        timeline: [
          { id: 'era-1', era: 'Dawn of Embers', title: 'The Great Treaty', description: 'Binding fealty' },
        ],
      },
      characters: [
        {
          id: 'char-1',
          name: 'Lord Commander Vaelin',
          archetype: 'The Tragic Zealot',
          role: 'FACTION_LEADER',
          backstory: 'Siege hero',
          motivation: 'Uphold the oath',
          goal: 'Secure the kiln',
          conflict: 'Must execute daughter',
          arc: 'Reckoning with dogma',
          relationships: [],
        },
      ],
      scenes: [
        {
          id: 'scene-1',
          sceneNumber: 1,
          title: 'Confrontation at the Gate',
          slugline: { intExt: 'EXT', location: 'SUNKEN GATE', timeOfDay: 'DUSK' },
          summary: 'Vaelin confronts Lyra',
          actionDirections: 'Volumetric ash falls like snow.',
          dialogueLines: [
            { id: 'l-1', characterName: 'VAELIN', dialogue: 'Three bells toll.' },
          ],
        },
      ],
      quests: [
        {
          id: 'q-1',
          title: 'Awakening at the Chasm',
          act: 'ACT I',
          type: 'START',
          description: 'Awaken as ash falls.',
          choices: [
            { id: 'c-1', text: 'Investigate sounds', consequence: 'Align with Vanguard' },
          ],
          objectives: ['Recover silver dagger'],
        },
      ],
    };

    it('should retrieve narrative data for project', async () => {
      prismaMock.project.findFirst.mockResolvedValue(mockProject);
      prismaMock.gameBlueprint.findUnique.mockResolvedValue({
        ...sampleBlueprintData,
        narrative: mockNarrativeData,
      } as any);

      const result = await blueprintService.getNarrative(mockProjectId, mockFounderId);

      expect(result).toBeDefined();
      expect((result as any).storyBible.themes.length).toBe(2);
      expect((result as any).characters.length).toBe(1);
      expect((result as any).scenes.length).toBe(1);
    });

    it('should allow founder and active members to update narrative', async () => {
      prismaMock.project.findFirst.mockResolvedValue(mockProject);
      prismaMock.gameBlueprint.upsert.mockResolvedValue({
        ...sampleBlueprintData,
        narrative: mockNarrativeData,
      } as any);

      const updated = await blueprintService.updateNarrative(
        mockProjectId,
        mockFounderId,
        'USER',
        mockNarrativeData,
      );

      expect(updated).toBeDefined();
      expect(prismaMock.gameBlueprint.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { projectId: mockProjectId },
          create: expect.objectContaining({
            narrative: mockNarrativeData,
          }),
          update: expect.objectContaining({
            narrative: mockNarrativeData,
          }),
        }),
      );
    });

    it('should reject unauthorized stranger from updating narrative', async () => {
      prismaMock.project.findFirst.mockResolvedValue({
        ...mockProject,
        members: [], // stranger is not a member
      });

      await expect(
        blueprintService.updateNarrative(
          mockProjectId,
          'stranger-id',
          'USER',
          mockNarrativeData,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should invoke AI narrative proposal with continuity context', async () => {
      prismaMock.project.findFirst.mockResolvedValue(mockProject);
      prismaMock.project.findUnique.mockResolvedValue({
        ...mockProject,
        blueprint: {
          ...sampleBlueprintData,
          narrative: mockNarrativeData,
        },
      });

      const result = await blueprintService.aiProposeNarrative(
        mockProjectId,
        mockFounderId,
        'USER',
        {
          section: 'SCENE',
          prompt: 'Author dialogue confrontation',
        },
      );

      expect(result).toBeDefined();
      expect(result.section).toBe('SCENE');
      expect(result.draft).toBeDefined();
      expect(result.continuityNotes.length).toBeGreaterThan(0);
    });
  });
});
