import { Injectable, Logger } from '@nestjs/common';
import { BaselineComparisonService } from './baseline-comparison.service';
import {
  getScenarioE1Basic,
  getScenarioE2Competition,
  getScenarioE3MultiHop,
  getScenarioE4ToolRoleDiff,
  getScenarioE5Collaboration,
  getScenarioE6LargePool,
} from './experiment-scenarios.data';
import {
  AggregateMetricSummary,
  ExperimentScenarioDefinition,
  ExperimentScenarioResult,
  ExperimentSuiteResult,
  NativeUtilityScores,
  RedundancyAggregateSummary,
  ScenarioExecutionTiming,
  TimingAggregateSummary,
} from './research-experiment.types';
import { TalentMatchingService, RoleMatchSpecification } from '../talent-matching.service';
import { ProjectRoleCommitment, ProjectRoleExperienceLevel } from '@prisma/client';

/**
 * ============================================================================
 * RESEARCH EXPERIMENT RUNNER FOR GRAPH-BASED TEAM FORMATION
 * ============================================================================
 *
 * Research Principles & Constraints:
 *
 * 1. Deterministic & Reproducible:
 *    Every experiment runs on deterministic in-memory fixtures. No random seeds
 *    or non-deterministic iterations are allowed.
 *
 * 2. Unaltered Baseline:
 *    Reuses production TalentMatchingService directly without modifying its weights
 *    or scoring logic.
 *
 * 3. Separation of Native Objectives:
 *    TalentMatchingService utility (0-100 linear score) and Graph utility (RWR probability
 *    mass) inhabit different scoring spaces and are never directly averaged or compared.
 *
 * 4. Research Scope:
 *    Reports observational benchmark metrics without manufacturing claims of statistical
 *    significance or real-world team superiority.
 * ============================================================================
 */
@Injectable()
export class ResearchExperimentRunner {
  private readonly logger = new Logger(ResearchExperimentRunner.name);

  constructor(
    private readonly baselineComparisonService: BaselineComparisonService,
    private readonly talentMatchingService: TalentMatchingService,
  ) {}

  /**
   * Return the standard suite of 6 controlled experiment scenarios (E1 - E6).
   */
  public getPredefinedScenarios(): ExperimentScenarioDefinition[] {
    return [
      getScenarioE1Basic(),
      getScenarioE2Competition(),
      getScenarioE3MultiHop(),
      getScenarioE4ToolRoleDiff(),
      getScenarioE5Collaboration(),
      getScenarioE6LargePool(50),
    ];
  }

  /**
   * Run a single controlled experiment scenario with high-resolution benchmarking.
   */
  public runScenario(scenario: ExperimentScenarioDefinition): ExperimentScenarioResult {
    const { payload, options } = scenario;

    // 1. Measure Baseline execution duration
    const t0 = process.hrtime.bigint();
    const baselineMatcherScores: number[] = [];
    const roles = payload.project.openRoles || [];
    const candidates = payload.candidates || [];

    for (const role of roles) {
      const roleSpec: RoleMatchSpecification = {
        roleId: role.roleId,
        roleName: role.title || role.role.name,
        experienceLevel: role.experienceLevel as ProjectRoleExperienceLevel,
        commitment: role.commitment as ProjectRoleCommitment,
        requiredSkills: (role.requiredSkills || []).map((rs) => ({
          id: rs.skill.id,
          name: rs.skill.name,
        })),
        requiredTools: (role.requiredTools || []).map((rt) => ({
          id: rt.tool.id,
          name: rt.tool.name,
        })),
      };

      for (const cand of candidates) {
        const scoredDto = this.talentMatchingService.scoreCandidate(
          { id: cand.id, username: cand.username, profile: cand.profile },
          payload.project,
          roleSpec,
          'NONE',
        );
        baselineMatcherScores.push(scoredDto.totalScore);
      }
    }
    const t1 = process.hrtime.bigint();
    const baselineDurationMs = Number(t1 - t0) / 1_000_000;

    // 2. Measure Graph pipeline execution duration (compareFromRawData executes both & evaluates)
    const t2 = process.hrtime.bigint();
    const comparison = this.baselineComparisonService.compareFromRawData(payload, options);
    const t3 = process.hrtime.bigint();
    const graphDurationMs = Number(t3 - t2) / 1_000_000;

    const timing: ScenarioExecutionTiming = {
      baselineDurationMs: Number(baselineDurationMs.toFixed(3)),
      graphDurationMs: Number(graphDurationMs.toFixed(3)),
      totalDurationMs: Number((baselineDurationMs + graphDurationMs).toFixed(3)),
    };

    // 3. Extract native objective scores separately (do not mix scoring spaces)
    let baselineMatcherUtilitySum = 0;
    for (const assignment of comparison.baselineTeam.assignments) {
      const targetRole = roles.find((r) => r.id === assignment.roleId);
      const targetCand = candidates.find((c) => c.id === assignment.candidateId);
      if (targetRole && targetCand) {
        const spec: RoleMatchSpecification = {
          roleId: targetRole.roleId,
          roleName: targetRole.title || targetRole.role.name,
          experienceLevel: targetRole.experienceLevel as ProjectRoleExperienceLevel,
          commitment: targetRole.commitment as ProjectRoleCommitment,
          requiredSkills: (targetRole.requiredSkills || []).map((rs) => ({
            id: rs.skill.id,
            name: rs.skill.name,
          })),
          requiredTools: (targetRole.requiredTools || []).map((rt) => ({
            id: rt.tool.id,
            name: rt.tool.name,
          })),
        };
        const scored = this.talentMatchingService.scoreCandidate(
          { id: targetCand.id, username: targetCand.username, profile: targetCand.profile },
          payload.project,
          spec,
          'NONE',
        );
        baselineMatcherUtilitySum += scored.totalScore;
      }
    }

    const baselineCount = Math.max(1, comparison.baselineTeam.assignments.length);
    const graphCount = Math.max(1, comparison.graphTeam.assignments.length);
    const graphRWRUtilitySum = comparison.graphTeam.evaluation.assignmentUtility.totalUtility;

    const nativeUtilities: NativeUtilityScores = {
      baselineMatcherUtilitySum: Number(baselineMatcherUtilitySum.toFixed(2)),
      baselineMatcherUtilityAvg: Number((baselineMatcherUtilitySum / baselineCount).toFixed(2)),
      graphRWRUtilitySum: Number(graphRWRUtilitySum.toFixed(6)),
      graphRWRUtilityAvg: Number((graphRWRUtilitySum / graphCount).toFixed(6)),
    };

    return {
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      description: scenario.description,
      hypothesis: scenario.hypothesis,
      timing,
      nativeUtilities,
      comparison,
    };
  }

  /**
   * Run the full experimental suite and generate aggregated benchmark statistics.
   */
  public runAllExperiments(customScenarios?: ExperimentScenarioDefinition[]): ExperimentSuiteResult {
    const scenariosToRun = customScenarios || this.getPredefinedScenarios();
    const scenarioResults: ExperimentScenarioResult[] = [];

    let totalSuiteDurationMs = 0;
    let sumBaselineDurationMs = 0;
    let sumGraphDurationMs = 0;

    for (const scenario of scenariosToRun) {
      const res = this.runScenario(scenario);
      scenarioResults.push(res);
      totalSuiteDurationMs += res.timing.totalDurationMs;
      sumBaselineDurationMs += res.timing.baselineDurationMs;
      sumGraphDurationMs += res.timing.graphDurationMs;
    }

    const count = scenarioResults.length;
    const safeCount = Math.max(1, count);

    // Aggregate Shared Metrics
    const aggregateSummary = {
      roleCoverage: this.aggregateMetric('Role Coverage', scenarioResults, (s) => s.comparison.summary.roleCoverage),
      skillCoverage: this.aggregateMetric('Skill Coverage', scenarioResults, (s) => s.comparison.summary.skillCoverage),
      toolCoverage: this.aggregateMetric('Tool Coverage', scenarioResults, (s) => s.comparison.summary.toolCoverage),
      skillRedundancy: this.aggregateRedundancy(scenarioResults),
      collaborationStrength: this.aggregateMetric('Collaboration Strength', scenarioResults, (s) => s.comparison.summary.collaborationStrength),
      teamCompleteness: this.aggregateMetric('Team Completeness', scenarioResults, (s) => s.comparison.summary.teamCompleteness),
      conflictFreeRate: this.aggregateMetric('Conflict-Free Rate', scenarioResults, (s) => s.comparison.summary.conflictFreeRate),
    };

    const timingSummary: TimingAggregateSummary = {
      totalSuiteDurationMs: Number(totalSuiteDurationMs.toFixed(3)),
      meanBaselineDurationMs: Number((sumBaselineDurationMs / safeCount).toFixed(3)),
      meanGraphDurationMs: Number((sumGraphDurationMs / safeCount).toFixed(3)),
    };

    return {
      timestamp: new Date().toISOString(),
      scenarioCount: count,
      scenarios: scenarioResults,
      aggregateSummary,
      timingSummary,
      researchIntegrityStatement:
        'This experiment suite utilizes synthetic controlled benchmark scenarios. Observed differences represent empirical benchmark metrics under controlled assumptions and do not constitute statistical significance, causal superiority, or generalizability to real-world game production studios.',
    };
  }

  /**
   * Helper: Aggregates a standard comparison metric across all scenarios.
   */
  private aggregateMetric(
    metricName: string,
    results: ExperimentScenarioResult[],
    extractor: (s: ExperimentScenarioResult) => { baseline: number; graph: number; absoluteDifference: number },
  ): AggregateMetricSummary {
    let sumBaseline = 0;
    let sumGraph = 0;
    let sumDiff = 0;
    let graphWinsCount = 0;
    let tiesCount = 0;
    let baselineWinsCount = 0;

    for (const r of results) {
      const metric = extractor(r);
      sumBaseline += metric.baseline;
      sumGraph += metric.graph;
      sumDiff += metric.absoluteDifference;

      if (metric.absoluteDifference > 0.0001) {
        graphWinsCount++;
      } else if (metric.absoluteDifference < -0.0001) {
        baselineWinsCount++;
      } else {
        tiesCount++;
      }
    }

    const count = Math.max(1, results.length);
    return {
      metricName,
      meanBaseline: Number((sumBaseline / count).toFixed(4)),
      meanGraph: Number((sumGraph / count).toFixed(4)),
      meanAbsoluteDifference: Number((sumDiff / count).toFixed(4)),
      graphWinsCount,
      tiesCount,
      baselineWinsCount,
    };
  }

  /**
   * Helper: Aggregates skill redundancy neutrally without declaring superiority.
   */
  private aggregateRedundancy(results: ExperimentScenarioResult[]): RedundancyAggregateSummary {
    let sumBaselineTotal = 0;
    let sumGraphTotal = 0;
    let sumDiff = 0;
    let sumBaselineRatio = 0;
    let sumGraphRatio = 0;

    for (const r of results) {
      const red = r.comparison.summary.skillRedundancy;
      sumBaselineTotal += red.baselineTotalRedundancy;
      sumGraphTotal += red.graphTotalRedundancy;
      sumDiff += red.absoluteDifference;
      sumBaselineRatio += red.baselineRedundancyRatio;
      sumGraphRatio += red.graphRedundancyRatio;
    }

    const count = Math.max(1, results.length);
    return {
      metricName: 'Skill Redundancy',
      meanBaselineTotal: Number((sumBaselineTotal / count).toFixed(2)),
      meanGraphTotal: Number((sumGraphTotal / count).toFixed(2)),
      meanDifference: Number((sumDiff / count).toFixed(2)),
      meanBaselineRatio: Number((sumBaselineRatio / count).toFixed(4)),
      meanGraphRatio: Number((sumGraphRatio / count).toFixed(4)),
      interpretation:
        'Neutral: Skill redundancy indicates cross-member overlap. Higher redundancy provides peer review and backup depth; lower redundancy reflects specialization. Neither is universally optimal.',
    };
  }
}
