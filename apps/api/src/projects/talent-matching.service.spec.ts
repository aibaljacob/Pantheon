import { Test, TestingModule } from '@nestjs/testing';
import { TalentMatchingService, MATCHING_WEIGHTS } from './talent-matching.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Role, ProjectRoleStatus, ProjectRoleExperienceLevel, ProjectRoleCommitment } from '@prisma/client';

describe('TalentMatchingService', () => {
  let service: TalentMatchingService;
  let prisma: any;

  const mockFounderId = 'founder-uuid-1';
  const mockProjectId = 'project-uuid-1';
  const mockRoleId = 'role-uuid-gameplay-prog';
  const mockProjectRoleId = 'proj-role-uuid-1';

  const mockProject = {
    id: mockProjectId,
    name: 'Cyberpunk Odyssey',
    founderId: mockFounderId,
    gameEngine: 'Unreal Engine 5',
    genre: 'Action RPG',
    platform: 'PC',
    members: [{ userId: 'existing-member-uuid-1' }],
  };

  const mockProjectRole = {
    id: mockProjectRoleId,
    projectId: mockProjectId,
    roleId: mockRoleId,
    title: 'Senior Gameplay Developer',
    experienceLevel: ProjectRoleExperienceLevel.SENIOR,
    commitment: ProjectRoleCommitment.FULL_TIME,
    status: ProjectRoleStatus.OPEN,
    role: { id: mockRoleId, name: 'Gameplay Programmer' },
    requiredSkills: [
      { skillId: 'skill-cplusplus', skill: { id: 'skill-cplusplus', name: 'C++' } },
      { skillId: 'skill-ue5', skill: { id: 'skill-ue5', name: 'Unreal Engine 5' } },
    ],
    requiredTools: [
      { toolId: 'tool-vs', tool: { id: 'tool-vs', name: 'Visual Studio' } },
    ],
  };

  beforeEach(async () => {
    prisma = {
      project: {
        findUnique: jest.fn(),
      },
      projectRole: {
        findUnique: jest.fn(),
      },
      user: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TalentMatchingService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<TalentMatchingService>(TalentMatchingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('1. Exact role + all skills/tools match (Scoring 100%)', async () => {
    prisma.project.findUnique.mockResolvedValue(mockProject);
    prisma.projectRole.findUnique.mockResolvedValue(mockProjectRole);

    const perfectCandidate = {
      id: 'candidate-perfect',
      username: 'perfect_dev',
      role: Role.USER,
      profile: {
        firstName: 'John',
        lastName: 'Carmack',
        displayName: 'John Carmack',
        headline: 'Lead Developer',
        experienceYears: 8,
        availability: 'Available for collaboration full-time',
        identity: {
          roles: [{ role: { id: mockRoleId, name: 'Gameplay Programmer' } }],
          skills: [
            { skill: { id: 'skill-cplusplus', name: 'C++' } },
            { skill: { id: 'skill-ue5', name: 'Unreal Engine 5' } },
          ],
          tools: [{ tool: { id: 'tool-vs', name: 'Visual Studio' } }],
          gameEngines: [{ engine: { name: 'Unreal Engine 5' } }],
          genres: [{ genre: { name: 'Action RPG' } }],
          platforms: [{ platform: { name: 'PC' } }],
        },
        portfolio: [
          { id: 'p1', title: 'Doom 3D', role: 'Lead', gameEngine: 'Unreal Engine 5', genre: 'Action RPG', platform: 'PC', description: 'Engine' },
        ],
        resume: { visibility: 'Public', fileName: 'cv.pdf', fileSize: '1MB', downloadUrl: 'http://cv.pdf' },
      },
    };

    prisma.user.findMany.mockResolvedValue([perfectCandidate]);

    const result = await service.getRankedCandidates(
      mockProjectId,
      mockProjectRoleId,
      mockFounderId,
      'USER',
      { page: 1, limit: 10 },
    );

    expect(result.candidates.length).toBe(1);
    const cand = result.candidates[0];
    expect(cand.totalScore).toBe(100);
    expect(cand.matchGrade).toBe('EXCELLENT_MATCH');
    expect(cand.confidenceLevel).toBe('HIGH');
    expect(cand.matchedSkills).toEqual(['C++', 'Unreal Engine 5']);
    expect(cand.matchedTools).toEqual(['Visual Studio']);
  });

  it('2. Role mismatch', async () => {
    prisma.project.findUnique.mockResolvedValue(mockProject);
    prisma.projectRole.findUnique.mockResolvedValue(mockProjectRole);

    const audioCandidate = {
      id: 'candidate-audio',
      username: 'audio_guy',
      role: Role.USER,
      profile: {
        firstName: 'Sound',
        lastName: 'Engineer',
        experienceYears: 7,
        availability: 'Full-time',
        identity: {
          roles: [{ role: { id: 'different-role-id', name: 'Audio Designer' } }],
          skills: [{ skill: { id: 'skill-cplusplus', name: 'C++' } }],
          tools: [{ tool: { id: 'tool-vs', name: 'Visual Studio' } }],
          gameEngines: [],
          genres: [],
          platforms: [],
        },
        portfolio: [],
        resume: null,
      },
    };

    prisma.user.findMany.mockResolvedValue([audioCandidate]);

    const result = await service.getRankedCandidates(
      mockProjectId,
      mockProjectRoleId,
      mockFounderId,
      'USER',
      { page: 1, limit: 10 },
    );

    const cand = result.candidates[0];
    expect(cand.matchBreakdown.roleMatch).toBe(5); // Partial domain score instead of 25
    expect(cand.totalScore).toBeLessThan(80);
  });

  it('3. Partial skill match & missing required skills', async () => {
    prisma.project.findUnique.mockResolvedValue(mockProject);
    prisma.projectRole.findUnique.mockResolvedValue(mockProjectRole);

    const partialSkillCandidate = {
      id: 'candidate-partial',
      username: 'partial_dev',
      role: Role.USER,
      profile: {
        firstName: 'Partial',
        lastName: 'Dev',
        experienceYears: 6,
        availability: 'Full-time',
        identity: {
          roles: [{ role: { id: mockRoleId, name: 'Gameplay Programmer' } }],
          skills: [{ skill: { id: 'skill-cplusplus', name: 'C++' } }], // Has 1 of 2 skills
          tools: [{ tool: { id: 'tool-vs', name: 'Visual Studio' } }],
          gameEngines: [{ engine: { name: 'Unreal Engine 5' } }],
          genres: [{ genre: { name: 'Action RPG' } }],
          platforms: [{ platform: { name: 'PC' } }],
        },
        portfolio: [],
        resume: null,
      },
    };

    prisma.user.findMany.mockResolvedValue([partialSkillCandidate]);

    const result = await service.getRankedCandidates(
      mockProjectId,
      mockProjectRoleId,
      mockFounderId,
      'USER',
      { page: 1, limit: 10 },
    );

    const cand = result.candidates[0];
    expect(cand.matchBreakdown.skillMatch).toBe(13); // 1/2 of 25 = 12.5 rounded to 13
    expect(cand.matchedSkills).toEqual(['C++']);
    expect(cand.missingSkills).toEqual(['Unreal Engine 5']);
  });

  it('4. Missing tools', async () => {
    prisma.project.findUnique.mockResolvedValue(mockProject);
    prisma.projectRole.findUnique.mockResolvedValue(mockProjectRole);

    const noToolCandidate = {
      id: 'candidate-notool',
      username: 'no_tool',
      role: Role.USER,
      profile: {
        firstName: 'NoTool',
        lastName: 'Dev',
        experienceYears: 6,
        availability: 'Full-time',
        identity: {
          roles: [{ role: { id: mockRoleId, name: 'Gameplay Programmer' } }],
          skills: [
            { skill: { id: 'skill-cplusplus', name: 'C++' } },
            { skill: { id: 'skill-ue5', name: 'Unreal Engine 5' } },
          ],
          tools: [], // Missing Visual Studio
          gameEngines: [],
          genres: [],
          platforms: [],
        },
        portfolio: [],
        resume: null,
      },
    };

    prisma.user.findMany.mockResolvedValue([noToolCandidate]);

    const result = await service.getRankedCandidates(
      mockProjectId,
      mockProjectRoleId,
      mockFounderId,
      'USER',
      { page: 1, limit: 10 },
    );

    const cand = result.candidates[0];
    expect(cand.matchBreakdown.toolMatch).toBe(0);
    expect(cand.missingTools).toEqual(['Visual Studio']);
  });

  it('5. Null experienceYears handling (neutral 7.5 pts)', async () => {
    prisma.project.findUnique.mockResolvedValue(mockProject);
    prisma.projectRole.findUnique.mockResolvedValue(mockProjectRole);

    const nullExpCandidate = {
      id: 'candidate-nullexp',
      username: 'nullexp_dev',
      role: Role.USER,
      profile: {
        firstName: 'NullExp',
        lastName: 'Dev',
        experienceYears: null, // Null experience
        availability: 'Full-time',
        identity: {
          roles: [{ role: { id: mockRoleId, name: 'Gameplay Programmer' } }],
          skills: [],
          tools: [],
          gameEngines: [],
          genres: [],
          platforms: [],
        },
        portfolio: [],
        resume: null,
      },
    };

    prisma.user.findMany.mockResolvedValue([nullExpCandidate]);

    const result = await service.getRankedCandidates(
      mockProjectId,
      mockProjectRoleId,
      mockFounderId,
      'USER',
      { page: 1, limit: 10 },
    );

    const cand = result.candidates[0];
    expect(cand.matchBreakdown.experienceMatch).toBe(8); // 7.5 rounded to 8
    expect(cand.matchBreakdown.experienceUnspecified).toBe(true);
  });

  it('6. Unknown availability handling (neutral score)', async () => {
    prisma.project.findUnique.mockResolvedValue(mockProject);
    prisma.projectRole.findUnique.mockResolvedValue(mockProjectRole);

    const unknownAvailCandidate = {
      id: 'candidate-avail',
      username: 'avail_dev',
      role: Role.USER,
      profile: {
        firstName: 'Avail',
        lastName: 'Dev',
        availability: null, // Unknown/null availability
        identity: {
          roles: [{ role: { id: mockRoleId, name: 'Gameplay Programmer' } }],
          skills: [],
          tools: [],
          gameEngines: [],
          genres: [],
          platforms: [],
        },
        portfolio: [],
        resume: null,
      },
    };

    prisma.user.findMany.mockResolvedValue([unknownAvailCandidate]);

    const result = await service.getRankedCandidates(
      mockProjectId,
      mockProjectRoleId,
      mockFounderId,
      'USER',
      { page: 1, limit: 10 },
    );

    const cand = result.candidates[0];
    expect(cand.matchBreakdown.availabilityMatch).toBe(6); // Neutral 6 pts
  });

  it('7. Project Context match', async () => {
    prisma.project.findUnique.mockResolvedValue(mockProject);
    prisma.projectRole.findUnique.mockResolvedValue(mockProjectRole);

    const contextCandidate = {
      id: 'candidate-context',
      username: 'context_dev',
      role: Role.USER,
      profile: {
        firstName: 'Context',
        lastName: 'Dev',
        identity: {
          roles: [{ role: { id: mockRoleId, name: 'Gameplay Programmer' } }],
          skills: [],
          tools: [],
          gameEngines: [{ engine: { name: 'Unreal Engine 5' } }],
          genres: [{ genre: { name: 'Action RPG' } }],
          platforms: [{ platform: { name: 'PC' } }],
        },
        portfolio: [],
        resume: null,
      },
    };

    prisma.user.findMany.mockResolvedValue([contextCandidate]);

    const result = await service.getRankedCandidates(
      mockProjectId,
      mockProjectRoleId,
      mockFounderId,
      'USER',
      { page: 1, limit: 10 },
    );

    const cand = result.candidates[0];
    expect(cand.matchBreakdown.projectContextMatch).toBe(10); // Engine 4 + Genre 3 + Platform 3
  });

  it('8. Excludes founder and existing team members from candidate queries', async () => {
    prisma.project.findUnique.mockResolvedValue(mockProject);
    prisma.projectRole.findUnique.mockResolvedValue(mockProjectRole);
    prisma.user.findMany.mockResolvedValue([]);

    await service.getRankedCandidates(
      mockProjectId,
      mockProjectRoleId,
      mockFounderId,
      'USER',
      { page: 1, limit: 10 },
    );

    expect(prisma.user.findMany).toHaveBeenCalledWith({
      where: {
        role: Role.USER,
        id: { notIn: expect.arrayContaining([mockFounderId, 'existing-member-uuid-1']) },
        profile: { isNot: null },
      },
      include: expect.any(Object),
    });
  });

  it('9. Non-founder unauthorized access rejection', async () => {
    prisma.project.findUnique.mockResolvedValue(mockProject);
    prisma.projectRole.findUnique.mockResolvedValue(mockProjectRole);

    await expect(
      service.getRankedCandidates(
        mockProjectId,
        mockProjectRoleId,
        'unauthorized-user-uuid',
        'USER',
        { page: 1, limit: 10 },
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('10. Closed / Filled role rejection', async () => {
    prisma.project.findUnique.mockResolvedValue(mockProject);
    prisma.projectRole.findUnique.mockResolvedValue({
      ...mockProjectRole,
      status: ProjectRoleStatus.FILLED,
    });

    await expect(
      service.getRankedCandidates(
        mockProjectId,
        mockProjectRoleId,
        mockFounderId,
        'USER',
        { page: 1, limit: 10 },
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('11. Deterministic ordering tie-breaking', async () => {
    prisma.project.findUnique.mockResolvedValue(mockProject);
    prisma.projectRole.findUnique.mockResolvedValue(mockProjectRole);

    const candB = {
      id: 'cand-b',
      username: 'b_dev',
      role: Role.USER,
      profile: {
        firstName: 'Bob',
        lastName: 'Zelda',
        experienceYears: 6,
        identity: {
          roles: [{ role: { id: mockRoleId, name: 'Gameplay Programmer' } }],
          skills: [{ skill: { id: 'skill-cplusplus', name: 'C++' } }],
          tools: [],
          gameEngines: [],
          genres: [],
          platforms: [],
        },
        portfolio: [],
        resume: null,
      },
    };

    const candA = {
      id: 'cand-a',
      username: 'a_dev',
      role: Role.USER,
      profile: {
        firstName: 'Alice',
        lastName: 'Alpha',
        experienceYears: 6,
        identity: {
          roles: [{ role: { id: mockRoleId, name: 'Gameplay Programmer' } }],
          skills: [{ skill: { id: 'skill-cplusplus', name: 'C++' } }],
          tools: [],
          gameEngines: [],
          genres: [],
          platforms: [],
        },
        portfolio: [],
        resume: null,
      },
    };

    prisma.user.findMany.mockResolvedValue([candB, candA]);

    const result = await service.getRankedCandidates(
      mockProjectId,
      mockProjectRoleId,
      mockFounderId,
      'USER',
      { page: 1, limit: 10 },
    );

    expect(result.candidates[0].candidate.displayName).toBe('Alice Alpha');
    expect(result.candidates[1].candidate.displayName).toBe('Bob Zelda');
  });
});
