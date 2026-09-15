import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { MATCHING_WEIGHTS, TalentMatchingService } from '../talent-matching.service';
import { AssignmentSolver } from './assignment-solver';
import { BaselineComparisonService } from './baseline-comparison.service';
import { CooccurrenceService } from './cooccurrence.service';
import { GraphBuilderService, RawProjectGraphPayload } from './graph-builder';
import { RWRSolver } from './rwr-solver';
import { TeamEvaluator } from './team-evaluator';

describe('BaselineComparisonService (Phase 4: Research Comparison)', () => {
  let service: BaselineComparisonService;
  let talentMatchingService: TalentMatchingService;
  let assignmentSolver: AssignmentSolver;
  let teamEvaluator: TeamEvaluator;

  const mockPrismaService = {
    project: { findUnique: jest.fn() },
    user: { findMany: jest.fn() },
    projectMember: { findMany: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BaselineComparisonService,
        TalentMatchingService,
        GraphBuilderService,
        CooccurrenceService,
        RWRSolver,
        AssignmentSolver,
        TeamEvaluator,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<BaselineComparisonService>(BaselineComparisonService);
    talentMatchingService = module.get<TalentMatchingService>(TalentMatchingService);
    assignmentSolver = module.get<AssignmentSolver>(AssignmentSolver);
    teamEvaluator = module.get<TeamEvaluator>(TeamEvaluator);
  });

  const createTestPayload = (): RawProjectGraphPayload => {
    const role1 = {
      id: 'role-dev',
      roleId: 'tax-role-engineer',
      title: 'Senior Gameplay Engineer',
      experienceLevel: 'SENIOR',
      commitment: 'FULL_TIME',
      status: 'OPEN',
      role: { id: 'tax-role-engineer', name: 'Software Engineer' },
      requiredSkills: [
        { skill: { id: 'skill-cpp', name: 'C++' } },
        { skill: { id: 'skill-physics', name: 'Physics Simulation' } },
      ],
      requiredTools: [{ tool: { id: 'tool-unreal', name: 'Unreal Engine' } }],
    };

    const role2 = {
      id: 'role-art',
      roleId: 'tax-role-artist',
      title: 'Lead 3D Artist',
      experienceLevel: 'LEAD',
      commitment: 'FULL_TIME',
      status: 'OPEN',
      role: { id: 'tax-role-artist', name: '3D Artist' },
      requiredSkills: [
        { skill: { id: 'skill-modeling', name: '3D Modeling' } },
        { skill: { id: 'skill-texturing', name: 'Texturing' } },
      ],
      requiredTools: [{ tool: { id: 'tool-blender', name: 'Blender' } }],
    };

    const candA = {
      id: 'cand-alice',
      username: 'alice_dev',
      profile: {
        firstName: 'Alice',
        lastName: 'Smith',
        displayName: 'Alice Smith',
        experienceYears: 7,
        availability: 'Available full-time collaboration',
        identity: {
          roles: [{ role: { id: 'tax-role-engineer', name: 'Software Engineer' } }],
          skills: [
            { skill: { id: 'skill-cpp', name: 'C++' } },
            { skill: { id: 'skill-physics', name: 'Physics Simulation' } },
          ],
          tools: [{ tool: { id: 'tool-unreal', name: 'Unreal Engine' } }],
          gameEngines: [{ engine: { id: 'ge-unreal', name: 'Unreal Engine' } }],
          genres: [{ genre: { id: 'gn-action', name: 'Action' } }],
          platforms: [{ platform: { id: 'pl-pc', name: 'PC' } }],
        },
        portfolio: [],
      },
    };

    const candB = {
      id: 'cand-bob',
      username: 'bob_art',
      profile: {
        firstName: 'Bob',
        lastName: 'Jones',
        displayName: 'Bob Jones',
        experienceYears: 8,
        availability: 'Available full-time collaboration',
        identity: {
          roles: [{ role: { id: 'tax-role-artist', name: '3D Artist' } }],
          skills: [
            { skill: { id: 'skill-modeling', name: '3D Modeling' } },
            { skill: { id: 'skill-texturing', name: 'Texturing' } },
          ],
          tools: [{ tool: { id: 'tool-blender', name: 'Blender' } }],
          gameEngines: [{ engine: { id: 'ge-unreal', name: 'Unreal Engine' } }],
          genres: [{ genre: { id: 'gn-action', name: 'Action' } }],
          platforms: [{ platform: { id: 'pl-pc', name: 'PC' } }],
        },
        portfolio: [],
      },
    };

    const candC = {
      id: 'cand-charlie',
      username: 'charlie_junior',
      profile: {
        firstName: 'Charlie',
        lastName: 'Brown',
        displayName: 'Charlie Brown',
        experienceYears: 1,
        availability: 'Part-time',
        identity: {
          roles: [{ role: { id: 'tax-role-engineer', name: 'Software Engineer' } }],
          skills: [{ skill: { id: 'skill-cpp', name: 'C++' } }],
          tools: [],
          gameEngines: [],
          genres: [],
          platforms: [],
        },
        portfolio: [],
      },
    };

    return {
      project: {
        id: 'proj-cyberpunk',
        name: 'Cyberpunk Odyssey',
        status: 'PUBLISHED',
        founderId: 'user-founder',
        gameEngine: 'Unreal Engine',
        genre: 'Action',
        platform: 'PC',
        members: [{ userId: 'user-founder' }],
        openRoles: [role1, role2],
      },
      candidates: [candA, candB, candC],
      historicalCollaborationMap: new Map([
        ['cand-alice', new Set(['proj-old-1'])],
        ['cand-bob', new Set(['proj-old-1'])],
      ]),
    };
  };

  describe('Core Pipeline & Baseline Reuse', () => {
    it('1. should obtain baseline candidate scores directly from TalentMatchingService', () => {
      const payload = createTestPayload();
      const scoreSpy = jest.spyOn(talentMatchingService, 'scoreCandidate');

      const result = service.compareFromRawData(payload);

      expect(scoreSpy).toHaveBeenCalled();
      // 2 roles x 3 candidates = 6 calls
      expect(scoreSpy).toHaveBeenCalledTimes(6);
      expect(result.baselineTeam.assignments.length).toBe(2);
      expect(result.baselineTeam.method).toBe('BASELINE_GREEDY');
      expect(result.graphTeam.method).toBe('GRAPH_HUNGARIAN');

      scoreSpy.mockRestore();
    });

    it('2. should prevent duplicate candidate assignments in the greedy baseline team', () => {
      const payload = createTestPayload();
      const result = service.compareFromRawData(payload);

      const baselineCandidateIds = result.baselineTeam.assignments.map((a) => a.candidateId);
      const uniqueCandidateIds = new Set(baselineCandidateIds);

      expect(uniqueCandidateIds.size).toBe(baselineCandidateIds.length);
      expect(result.baselineTeam.evaluation.conflictFreeRate.conflictFree).toBe(true);
    });

    it('3. should handle more roles than candidates (m > n)', () => {
      const payload = createTestPayload();
      // Keep 2 roles but only 1 candidate
      payload.candidates = [payload.candidates[0]];

      const result = service.compareFromRawData(payload);

      expect(result.roleCount).toBe(2);
      expect(result.candidateCount).toBe(1);
      expect(result.baselineTeam.assignments.length).toBe(1);
      expect(result.baselineTeam.unassignedRoleIds.length).toBe(1);
      expect(result.graphTeam.assignments.length).toBe(1);
      expect(result.graphTeam.unassignedRoleIds.length).toBe(1);
      expect(result.summary.roleCoverage.baseline).toBe(0.5);
      expect(result.summary.roleCoverage.graph).toBe(0.5);
    });

    it('4. should handle more candidates than roles (n > m)', () => {
      const payload = createTestPayload();
      // 2 roles, 3 candidates
      const result = service.compareFromRawData(payload);

      expect(result.roleCount).toBe(2);
      expect(result.candidateCount).toBe(3);
      expect(result.baselineTeam.assignments.length).toBe(2);
      expect(result.baselineTeam.unassignedCandidateIds.length).toBe(1);
      expect(result.graphTeam.assignments.length).toBe(2);
      expect(result.graphTeam.unassignedCandidateIds.length).toBe(1);
    });

    it('5. should execute Graph method using AssignmentSolver Hungarian assignment', () => {
      const payload = createTestPayload();
      const solverSpy = jest.spyOn(assignmentSolver, 'solveFromRWR');

      const result = service.compareFromRawData(payload);

      expect(solverSpy).toHaveBeenCalledTimes(1);
      expect(result.graphTeam.assignments.length).toBe(2);
      expect(result.graphTeam.method).toBe('GRAPH_HUNGARIAN');

      solverSpy.mockRestore();
    });

    it('6. should evaluate both teams using the same TeamEvaluator instance', () => {
      const payload = createTestPayload();
      const evaluateSpy = jest.spyOn(teamEvaluator, 'evaluateTeam');

      const result = service.compareFromRawData(payload);

      expect(evaluateSpy).toHaveBeenCalledTimes(2);
      expect(result.baselineTeam.evaluation).toBeDefined();
      expect(result.graphTeam.evaluation).toBeDefined();

      evaluateSpy.mockRestore();
    });
  });

  describe('Metric Comparison Mathematics & Edge Cases', () => {
    it('7. should calculate absolute differences correctly (graph - baseline)', () => {
      const comparison = BaselineComparisonService.compareMetric('Skill Coverage', 0.5, 0.75, true);

      expect(comparison.baseline).toBe(0.5);
      expect(comparison.graph).toBe(0.75);
      expect(comparison.absoluteDifference).toBe(0.25);
    });

    it('8. should calculate higher-is-better relative improvements correctly', () => {
      const comparison = BaselineComparisonService.compareMetric('Tool Coverage', 0.4, 0.8, true);

      expect(comparison.relativeImprovementPercentage).toBe(100.0);
      expect(comparison.higherIsBetter).toBe(true);

      const dropComparison = BaselineComparisonService.compareMetric('Tool Coverage', 0.8, 0.4, true);
      expect(dropComparison.relativeImprovementPercentage).toBe(-50.0);
    });

    it('9. should handle zero baseline values safely without division by zero or NaN', () => {
      // Both zero
      const bothZero = BaselineComparisonService.compareMetric('Zero Metric', 0, 0, true);
      expect(bothZero.absoluteDifference).toBe(0);
      expect(bothZero.relativeImprovementPercentage).toBe(0);

      // Baseline zero, graph positive
      const baselineZero = BaselineComparisonService.compareMetric('Growth Metric', 0, 0.8, true);
      expect(baselineZero.absoluteDifference).toBe(0.8);
      expect(baselineZero.relativeImprovementPercentage).toBeNull();
      expect(Number.isNaN(baselineZero.relativeImprovementPercentage)).toBe(false);
    });

    it('10. should report skill redundancy without declaring superior/inferior quality', () => {
      const redundancyComp = BaselineComparisonService.compareRedundancy(2, 4, 1.5, 2.0);

      expect(redundancyComp.metricName).toBe('Skill Redundancy');
      expect(redundancyComp.baselineTotalRedundancy).toBe(2);
      expect(redundancyComp.graphTotalRedundancy).toBe(4);
      expect(redundancyComp.absoluteDifference).toBe(2);
      expect(redundancyComp.baselineRedundancyRatio).toBe(1.5);
      expect(redundancyComp.graphRedundancyRatio).toBe(2.0);
      expect(redundancyComp.ratioDifference).toBe(0.5);
      expect(redundancyComp.interpretation).toContain('Neutral:');
    });

    it('11. should preserve strict determinism across repeated executions', () => {
      const payload = createTestPayload();

      const run1 = service.compareFromRawData(payload);
      const run2 = service.compareFromRawData(payload);

      expect(run1).toEqual(run2);
    });
  });

  describe('Controlled Scenarios & Production Integrity', () => {
    it('12. should demonstrate a controlled scenario where Hungarian global matching avoids greedy trap', () => {
      // Create a scenario where Candidate A matches Role 1 well and Role 2 slightly better,
      // while Candidate B is only capable of Role 2.
      const role1 = {
        id: 'role-lead-cpp',
        roleId: 'tax-role-engineer',
        title: 'Lead C++ Engine Programmer',
        experienceLevel: 'SENIOR',
        commitment: 'FULL_TIME',
        status: 'OPEN',
        role: { id: 'tax-role-engineer', name: 'Software Engineer' },
        requiredSkills: [
          { skill: { id: 'skill-cpp', name: 'C++' } },
          { skill: { id: 'skill-memory', name: 'Memory Optimization' } },
        ],
        requiredTools: [{ tool: { id: 'tool-unreal', name: 'Unreal Engine' } }],
      };

      const role2 = {
        id: 'role-ui-dev',
        roleId: 'tax-role-engineer',
        title: 'UI Programmer',
        experienceLevel: 'MID',
        commitment: 'FULL_TIME',
        status: 'OPEN',
        role: { id: 'tax-role-engineer', name: 'Software Engineer' },
        requiredSkills: [
          { skill: { id: 'skill-cpp', name: 'C++' } },
          { skill: { id: 'skill-ui', name: 'Slate UI' } },
        ],
        requiredTools: [{ tool: { id: 'tool-unreal', name: 'Unreal Engine' } }],
      };

      // Candidate A: Perfect match for Role 1, but also matches Role 2 with high score
      const candA = {
        id: 'cand-star',
        username: 'star_dev',
        profile: {
          firstName: 'Star',
          lastName: 'Dev',
          displayName: 'Star Developer',
          experienceYears: 8,
          availability: 'Available full-time collaboration',
          identity: {
            roles: [{ role: { id: 'tax-role-engineer', name: 'Software Engineer' } }],
            skills: [
              { skill: { id: 'skill-cpp', name: 'C++' } },
              { skill: { id: 'skill-memory', name: 'Memory Optimization' } },
              { skill: { id: 'skill-ui', name: 'Slate UI' } },
            ],
            tools: [{ tool: { id: 'tool-unreal', name: 'Unreal Engine' } }],
            gameEngines: [{ engine: { id: 'ge-unreal', name: 'Unreal Engine' } }],
            genres: [{ genre: { id: 'gn-action', name: 'Action' } }],
            platforms: [{ platform: { id: 'pl-pc', name: 'PC' } }],
          },
          portfolio: [],
        },
      };

      // Candidate B: UI specialist only (no memory optimization, lower experience)
      const candB = {
        id: 'cand-ui-specialist',
        username: 'ui_specialist',
        profile: {
          firstName: 'UI',
          lastName: 'Specialist',
          displayName: 'UI Specialist',
          experienceYears: 4,
          availability: 'Available full-time collaboration',
          identity: {
            roles: [{ role: { id: 'tax-role-engineer', name: 'Software Engineer' } }],
            skills: [
              { skill: { id: 'skill-cpp', name: 'C++' } },
              { skill: { id: 'skill-ui', name: 'Slate UI' } },
            ],
            tools: [{ tool: { id: 'tool-unreal', name: 'Unreal Engine' } }],
            gameEngines: [{ engine: { id: 'ge-unreal', name: 'Unreal Engine' } }],
            genres: [{ genre: { id: 'gn-action', name: 'Action' } }],
            platforms: [{ platform: { id: 'pl-pc', name: 'PC' } }],
          },
          portfolio: [],
        },
      };

      const payload: RawProjectGraphPayload = {
        project: {
          id: 'proj-demo',
          name: 'Demo Project',
          status: 'PUBLISHED',
          founderId: 'user-founder',
          gameEngine: 'Unreal Engine',
          genre: 'Action',
          platform: 'PC',
          members: [{ userId: 'user-founder' }],
          openRoles: [role1, role2],
        },
        candidates: [candA, candB],
      };

      const result = service.compareFromRawData(payload);

      expect(result.baselineTeam.assignments.length).toBe(2);
      expect(result.graphTeam.assignments.length).toBe(2);

      // Graph global Hungarian assignment finds global maximum utility
      expect(result.graphTeam.evaluation.assignmentUtility.totalUtility).toBeGreaterThanOrEqual(
        result.baselineTeam.evaluation.assignmentUtility.totalUtility,
      );
      expect(result.summary.teamCompleteness.graph).toBeGreaterThanOrEqual(
        result.summary.teamCompleteness.baseline,
      );
    });

    it('13. should handle empty candidates or zero roles gracefully', () => {
      const payload: RawProjectGraphPayload = {
        project: {
          id: 'proj-empty',
          name: 'Empty Project',
          status: 'PUBLISHED',
          founderId: 'user-founder',
          members: [],
          openRoles: [],
        },
        candidates: [],
      };

      const result = service.compareFromRawData(payload);

      expect(result.roleCount).toBe(0);
      expect(result.candidateCount).toBe(0);
      expect(result.baselineTeam.assignments).toEqual([]);
      expect(result.graphTeam.assignments).toEqual([]);
      expect(result.summary.roleCoverage.baseline).toBe(1.0);
      expect(result.summary.roleCoverage.graph).toBe(1.0);
      expect(result.summary.teamCompleteness.baseline).toBe(1.0);
    });

    it('14. should ensure TalentMatchingService production weights and scoring remain untouched', () => {
      expect(MATCHING_WEIGHTS).toEqual({
        ROLE: 25,
        SKILLS: 25,
        TOOLS: 15,
        EXPERIENCE: 15,
        AVAILABILITY: 10,
        PROJECT_CONTEXT: 10,
      });

      const cand = {
        id: 'user-1',
        profile: {
          experienceYears: 5,
          availability: 'Full-Time',
          identity: {
            roles: [{ role: { id: 'r1', name: 'Dev' } }],
            skills: [{ skill: { id: 's1', name: 'TypeScript' } }],
            tools: [{ tool: { id: 't1', name: 'Node' } }],
            gameEngines: [],
            genres: [],
            platforms: [],
          },
        },
      };

      const roleSpec = {
        roleId: 'r1',
        experienceLevel: 'MID' as any,
        commitment: 'FULL_TIME' as any,
        requiredSkills: [{ id: 's1', name: 'TypeScript' }],
        requiredTools: [{ id: 't1', name: 'Node' }],
      };

      const scored = talentMatchingService.scoreCandidate(cand, {}, roleSpec);
      expect(scored.totalScore).toBeGreaterThan(0);
      expect(scored.matchBreakdown.roleMatch).toBe(25);
      expect(scored.matchBreakdown.skillMatch).toBe(25);
      expect(scored.matchBreakdown.toolMatch).toBe(15);
    });
  });
});
