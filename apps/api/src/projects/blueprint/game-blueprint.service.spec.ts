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
  };

  const talentMatchingMock = {
    getRankedCandidatesForRoleSpec: jest.fn().mockResolvedValue([
      {
        userId: 'candidate-1',
        name: 'Alex Developer',
        matchScore: 92,
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
});
