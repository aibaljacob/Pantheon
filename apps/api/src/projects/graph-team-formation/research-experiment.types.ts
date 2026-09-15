import {
  BaselineVsGraphComparisonResult,
  ComparisonExecutionOptions,
} from './graph-team-formation.types';
import { RawProjectGraphPayload } from './graph-builder';

export type ExperimentScenarioId =
  | 'E1_BASIC_FORMATION'
  | 'E2_CANDIDATE_COMPETITION'
  | 'E3_MULTIHOP_SKILL'
  | 'E4_TOOL_ROLE_DIFF'
  | 'E5_COLLABORATION_HISTORY'
  | 'E6_LARGE_POOL';

export interface ExperimentScenarioDefinition {
  id: ExperimentScenarioId;
  name: string;
  description: string;
  hypothesis: string;
  payload: RawProjectGraphPayload;
  options?: ComparisonExecutionOptions;
}

export interface ScenarioExecutionTiming {
  baselineDurationMs: number;
  graphDurationMs: number;
  totalDurationMs: number;
}

export interface NativeUtilityScores {
  baselineMatcherUtilitySum: number; // Sum of TalentMatchingService match scores (0-100 scale)
  baselineMatcherUtilityAvg: number;
  graphRWRUtilitySum: number; // Sum of RWR rawGraphScore probability mass
  graphRWRUtilityAvg: number;
}

export interface ExperimentScenarioResult {
  scenarioId: ExperimentScenarioId;
  scenarioName: string;
  description: string;
  hypothesis: string;
  timing: ScenarioExecutionTiming;
  nativeUtilities: NativeUtilityScores;
  comparison: BaselineVsGraphComparisonResult;
}

export interface AggregateMetricSummary {
  metricName: string;
  meanBaseline: number;
  meanGraph: number;
  meanAbsoluteDifference: number;
  graphWinsCount: number; // Scenarios where graph > baseline
  tiesCount: number; // Scenarios where graph === baseline
  baselineWinsCount: number; // Scenarios where graph < baseline
}

export interface RedundancyAggregateSummary {
  metricName: string;
  meanBaselineTotal: number;
  meanGraphTotal: number;
  meanDifference: number;
  meanBaselineRatio: number;
  meanGraphRatio: number;
  interpretation: string;
}

export interface TimingAggregateSummary {
  totalSuiteDurationMs: number;
  meanBaselineDurationMs: number;
  meanGraphDurationMs: number;
}

export interface ExperimentSuiteResult {
  timestamp: string;
  scenarioCount: number;
  scenarios: ExperimentScenarioResult[];
  aggregateSummary: {
    roleCoverage: AggregateMetricSummary;
    skillCoverage: AggregateMetricSummary;
    toolCoverage: AggregateMetricSummary;
    skillRedundancy: RedundancyAggregateSummary;
    collaborationStrength: AggregateMetricSummary;
    teamCompleteness: AggregateMetricSummary;
    conflictFreeRate: AggregateMetricSummary;
  };
  timingSummary: TimingAggregateSummary;
  researchIntegrityStatement: string;
}
