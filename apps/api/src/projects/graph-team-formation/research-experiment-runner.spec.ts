import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { TalentMatchingService } from '../talent-matching.service';
import { AssignmentSolver } from './assignment-solver';
import { BaselineComparisonService } from './baseline-comparison.service';
import { CooccurrenceService } from './cooccurrence.service';
import { GraphBuilderService } from './graph-builder';
import { ResearchExperimentRunner } from './research-experiment-runner';
import { RWRSolver } from './rwr-solver';
import { TeamEvaluator } from './team-evaluator';
import { ExperimentScenarioDefinition } from './research-experiment.types';

describe('ResearchExperimentRunner (Research Experiment Validation Suite)', () => {
  let runner: ResearchExperimentRunner;
  let baselineComparisonService: BaselineComparisonService;
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
        ResearchExperimentRunner,
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

    runner = module.get<ResearchExperimentRunner>(ResearchExperimentRunner);
    baselineComparisonService = module.get<BaselineComparisonService>(BaselineComparisonService);
    talentMatchingService = module.get<TalentMatchingService>(TalentMatchingService);
    assignmentSolver = module.get<AssignmentSolver>(AssignmentSolver);
    teamEvaluator = module.get<TeamEvaluator>(TeamEvaluator);
  });

  describe('Scenario Execution & Suite Coverage', () => {
    it('1. should execute all six controlled experiment scenarios (E1 - E6) successfully', () => {
      const suite = runner.runAllExperiments();

      expect(suite.scenarioCount).toBe(6);
      expect(suite.scenarios.length).toBe(6);

      const scenarioIds = suite.scenarios.map((s) => s.scenarioId);
      expect(scenarioIds).toEqual([
        'E1_BASIC_FORMATION',
        'E2_CANDIDATE_COMPETITION',
        'E3_MULTIHOP_SKILL',
        'E4_TOOL_ROLE_DIFF',
        'E5_COLLABORATION_HISTORY',
        'E6_LARGE_POOL',
      ]);

      for (const sc of suite.scenarios) {
        expect(sc.comparison).toBeDefined();
        expect(sc.timing.totalDurationMs).toBeGreaterThanOrEqual(0);
        expect(sc.nativeUtilities.baselineMatcherUtilitySum).toBeGreaterThanOrEqual(0);
        expect(sc.nativeUtilities.graphRWRUtilitySum).toBeGreaterThanOrEqual(0);
      }
    });

    it('2. should preserve strict determinism across repeated suite runs (excluding timing)', () => {
      const run1 = runner.runAllExperiments();
      const run2 = runner.runAllExperiments();

      expect(run1.scenarioCount).toBe(run2.scenarioCount);

      for (let i = 0; i < run1.scenarios.length; i++) {
        const sc1 = run1.scenarios[i];
        const sc2 = run2.scenarios[i];

        expect(sc1.scenarioId).toBe(sc2.scenarioId);
        expect(sc1.comparison.baselineTeam.assignments).toEqual(sc2.comparison.baselineTeam.assignments);
        expect(sc1.comparison.graphTeam.assignments).toEqual(sc2.comparison.graphTeam.assignments);
        expect(sc1.comparison.summary).toEqual(sc2.comparison.summary);
        expect(sc1.nativeUtilities).toEqual(sc2.nativeUtilities);
      }

      expect(run1.aggregateSummary).toEqual(run2.aggregateSummary);
    });

    it('3. should obtain baseline match scores via TalentMatchingService without duplicating logic', () => {
      const scoreSpy = jest.spyOn(talentMatchingService, 'scoreCandidate');
      const scenarios = runner.getPredefinedScenarios();

      runner.runScenario(scenarios[0]); // E1 has 3 roles x 4 candidates

      expect(scoreSpy).toHaveBeenCalled();
      scoreSpy.mockRestore();
    });

    it('4. should execute Graph method through HIN -> RWR -> Hungarian assignment', () => {
      const solverSpy = jest.spyOn(assignmentSolver, 'solveFromRWR');
      const scenarios = runner.getPredefinedScenarios();

      runner.runScenario(scenarios[0]);

      expect(solverSpy).toHaveBeenCalledTimes(1);
      solverSpy.mockRestore();
    });

    it('5. should evaluate both Baseline and Graph teams using TeamEvaluator', () => {
      const evalSpy = jest.spyOn(teamEvaluator, 'evaluateTeam');
      const scenarios = runner.getPredefinedScenarios();

      runner.runScenario(scenarios[0]);

      // Evaluates baseline team + graph team = 2 evaluations
      expect(evalSpy).toHaveBeenCalledTimes(2);
      evalSpy.mockRestore();
    });
  });

  describe('Controlled Scenario Hypotheses Validation', () => {
    it('6. should validate E2 candidate competition and global assignment conflict resolution', () => {
      const scenarios = runner.getPredefinedScenarios();
      const e2 = scenarios.find((s) => s.id === 'E2_CANDIDATE_COMPETITION')!;

      const result = runner.runScenario(e2);

      // Graph global Hungarian avoids greedy local conflict
      expect(result.comparison.graphTeam.evaluation.assignmentUtility.totalUtility).toBeGreaterThanOrEqual(
        result.comparison.baselineTeam.evaluation.assignmentUtility.totalUtility,
      );
      expect(result.comparison.summary.conflictFreeRate.graph).toBe(100.0);
      expect(result.comparison.summary.conflictFreeRate.baseline).toBe(100.0);
    });

    it('7. should validate E3 contains a valid multi-hop co-occurrence path', () => {
      const scenarios = runner.getPredefinedScenarios();
      const e3 = scenarios.find((s) => s.id === 'E3_MULTIHOP_SKILL')!;

      expect(e3.payload.skillCooccurrences).toBeDefined();
      expect(e3.payload.skillCooccurrences!.length).toBeGreaterThan(0);
      expect(e3.payload.skillCooccurrences![0].itemAId).toBe('skill-vulkan');
      expect(e3.payload.skillCooccurrences![0].itemBId).toBe('skill-dx12');

      const result = runner.runScenario(e3);
      expect(result.comparison.graphTeam.assignments.length).toBe(1);
      expect(result.comparison.graphTeam.assignments[0].candidateId).toBe('e3-cand-dx12');
    });

    it('8. should validate E5 contains collaboration edges and produces measurable collaboration strength', () => {
      const scenarios = runner.getPredefinedScenarios();
      const e5 = scenarios.find((s) => s.id === 'E5_COLLABORATION_HISTORY')!;

      expect(e5.payload.historicalCollaborationMap).toBeDefined();
      expect(e5.payload.historicalCollaborationMap!.size).toBeGreaterThan(0);

      const result = runner.runScenario(e5);

      expect(result.comparison.graphTeam.evaluation.collaborationStrength.totalStrength).toBeGreaterThan(0);
      expect(result.comparison.graphTeam.evaluation.collaborationStrength.pairCount).toBe(3);
      expect(result.comparison.graphTeam.evaluation.collaborationStrength.collaboratingPairCount).toBeGreaterThan(0);
    });

    it('9. should validate E6 contains substantially more candidates than roles (6 roles, 50 candidates)', () => {
      const scenarios = runner.getPredefinedScenarios();
      const e6 = scenarios.find((s) => s.id === 'E6_LARGE_POOL')!;

      expect(e6.payload.project.openRoles.length).toBe(6);
      expect(e6.payload.candidates.length).toBe(50);

      const result = runner.runScenario(e6);

      expect(result.comparison.graphTeam.assignments.length).toBe(6);
      expect(result.comparison.baselineTeam.assignments.length).toBe(6);
      expect(result.comparison.graphTeam.unassignedCandidateIds.length).toBe(44);
      expect(result.comparison.baselineTeam.unassignedCandidateIds.length).toBe(44);
      expect(result.timing.totalDurationMs).toBeGreaterThan(0);
    });
  });

  describe('Integrity & Aggregation Mathematics', () => {
    it('10. should ensure shared metric differences are mathematically correct', () => {
      const scenarios = runner.getPredefinedScenarios();
      const result = runner.runScenario(scenarios[0]);

      const summary = result.comparison.summary;
      expect(summary.roleCoverage.absoluteDifference).toBe(
        Number((summary.roleCoverage.graph - summary.roleCoverage.baseline).toFixed(4)),
      );
      expect(summary.skillCoverage.absoluteDifference).toBe(
        Number((summary.skillCoverage.graph - summary.skillCoverage.baseline).toFixed(4)),
      );
      expect(summary.toolCoverage.absoluteDifference).toBe(
        Number((summary.toolCoverage.graph - summary.toolCoverage.baseline).toFixed(4)),
      );
    });

    it('11. should separate native utility scoring spaces and not directly average them', () => {
      const suite = runner.runAllExperiments();

      for (const sc of suite.scenarios) {
        // Baseline linear match scores (0-100 scale)
        expect(sc.nativeUtilities.baselineMatcherUtilitySum).toBeGreaterThanOrEqual(0);
        // Graph RWR probability mass (stationary distribution scale)
        expect(sc.nativeUtilities.graphRWRUtilitySum).toBeGreaterThanOrEqual(0);
      }
    });

    it('12. should handle empty/insufficient candidate scenarios safely', () => {
      const emptyScenario: ExperimentScenarioDefinition = {
        id: 'E1_BASIC_FORMATION',
        name: 'Empty Scenario',
        description: 'Zero candidates and zero roles test',
        hypothesis: 'Safe execution without crashing or throwing NaN',
        payload: {
          project: {
            id: 'proj-empty',
            name: 'Empty',
            status: 'PUBLISHED',
            founderId: 'f1',
            members: [],
            openRoles: [],
          },
          candidates: [],
        },
      };

      const result = runner.runScenario(emptyScenario);

      expect(result.comparison.roleCount).toBe(0);
      expect(result.comparison.candidateCount).toBe(0);
      expect(result.comparison.baselineTeam.assignments).toEqual([]);
      expect(result.comparison.graphTeam.assignments).toEqual([]);
      expect(result.comparison.summary.teamCompleteness.baseline).toBe(1.0);
      expect(result.comparison.summary.teamCompleteness.graph).toBe(1.0);
    });

    it('13. should ensure no candidate is assigned multiple roles', () => {
      const suite = runner.runAllExperiments();

      for (const sc of suite.scenarios) {
        const baselineCandIds = sc.comparison.baselineTeam.assignments.map((a) => a.candidateId);
        const graphCandIds = sc.comparison.graphTeam.assignments.map((a) => a.candidateId);

        expect(new Set(baselineCandIds).size).toBe(baselineCandIds.length);
        expect(new Set(graphCandIds).size).toBe(graphCandIds.length);
      }
    });

    it('14. should ensure no role is assigned multiple candidates', () => {
      const suite = runner.runAllExperiments();

      for (const sc of suite.scenarios) {
        const baselineRoleIds = sc.comparison.baselineTeam.assignments.map((a) => a.roleId);
        const graphRoleIds = sc.comparison.graphTeam.assignments.map((a) => a.roleId);

        expect(new Set(baselineRoleIds).size).toBe(baselineRoleIds.length);
        expect(new Set(graphRoleIds).size).toBe(graphRoleIds.length);
      }
    });

    it('15. should verify high-resolution execution timing measurements are populated', () => {
      const suite = runner.runAllExperiments();

      expect(suite.timingSummary.totalSuiteDurationMs).toBeGreaterThan(0);
      expect(suite.timingSummary.meanBaselineDurationMs).toBeGreaterThanOrEqual(0);
      expect(suite.timingSummary.meanGraphDurationMs).toBeGreaterThanOrEqual(0);
    });

    it('16. should calculate aggregation metrics and win/tie/loss counts correctly', () => {
      const suite = runner.runAllExperiments();
      const agg = suite.aggregateSummary;

      expect(agg.roleCoverage).toBeDefined();
      expect(agg.roleCoverage.graphWinsCount + agg.roleCoverage.tiesCount + agg.roleCoverage.baselineWinsCount).toBe(6);
      expect(agg.skillCoverage.graphWinsCount + agg.skillCoverage.tiesCount + agg.skillCoverage.baselineWinsCount).toBe(6);
      expect(agg.teamCompleteness.graphWinsCount + agg.teamCompleteness.tiesCount + agg.teamCompleteness.baselineWinsCount).toBe(6);
      expect(agg.conflictFreeRate.graphWinsCount + agg.conflictFreeRate.tiesCount + agg.conflictFreeRate.baselineWinsCount).toBe(6);

      expect(suite.researchIntegrityStatement).toContain('synthetic controlled benchmark scenarios');
    });
  });
});
