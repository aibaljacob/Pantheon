export type HINNodeType =
  | 'PROJECT'
  | 'PROJECT_ROLE'
  | 'CANDIDATE'
  | 'PROFESSIONAL_ROLE'
  | 'SKILL'
  | 'TOOL'
  | 'GAME_ENGINE'
  | 'GENRE'
  | 'PLATFORM';

export type HINEdgeType =
  | 'REQUIRES_ROLE'
  | 'ROLE_TAXONOMY'
  | 'REQUIRES_SKILL'
  | 'REQUIRES_TOOL'
  | 'HAS_ROLE'
  | 'HAS_SKILL'
  | 'HAS_TOOL'
  | 'PROJECT_CONTEXT'
  | 'CANDIDATE_CONTEXT'
  | 'PAST_COLLABORATION'
  | 'SKILL_COOCCURRENCE'
  | 'TOOL_COOCCURRENCE';

export interface HINNode<TData = Record<string, any>> {
  id: string; // Globally unique graph ID, e.g. "proj:uuid", "cand:uuid", "skill:uuid"
  rawId: string; // Database entity UUID
  type: HINNodeType;
  label: string;
  data?: TData;
}

export interface HINEdge<TData = Record<string, any>> {
  source: string; // Source global node ID
  target: string; // Target global node ID
  type: HINEdgeType;
  weight: number;
  data?: TData;
}

export interface CooccurrenceEdgeData {
  itemAId: string;
  itemBId: string;
  intersectionCount: number;
  unionCount: number;
  jaccard: number;
}

export interface GraphBuildOptions {
  includeCooccurrence?: boolean;
  minCooccurrenceIntersection?: number;
  minCooccurrenceJaccard?: number;
  includePastCollaboration?: boolean;
  candidateLimit?: number;
}

export interface CandidateGraphAffinity {
  roleId: string; // Database UUID of the ProjectRole
  candidateId: string; // Database UUID of the User/Candidate
  candidateNodeId: string; // Graph node ID e.g. "cand:uuid"
  rawGraphScore: number; // RWR probability mass (stationary approximation if converged, or truncated at maxIterations)
}

export interface RWRDistributionResult {
  restartNodeId: string; // Graph node ID e.g. "role:uuid"
  roleId: string; // Database UUID of the ProjectRole
  distribution: Map<string, number>; // Full graph probability distribution (converged stationary approximation or truncated RWR distribution)
  candidateAffinities: CandidateGraphAffinity[]; // Filtered, sorted candidate affinities
  iterations: number; // Total power-iteration steps executed
  converged: boolean; // True if L1 delta reached epsilon within maxIterations, false if truncated by maxIterations
  l1Delta: number; // Final L1 step difference ||p^(t) - p^(t-1)||_1
}

export interface RWROptions {
  alpha?: number; // Restart probability, default = 0.15
  maxIterations?: number; // Max power-iteration steps, default = 25
  epsilon?: number; // L1 convergence tolerance, default = 1e-6
}

export interface RoleCandidateAssignment {
  roleId: string; // Database UUID of the ProjectRole
  candidateId: string; // Database UUID of the Candidate
  score: number; // Assignment score (e.g. rawGraphScore from RWR)
  isDummy?: boolean; // True if assigned to a dummy row/col during square matrix padding
}

export interface GlobalAssignmentResult {
  assignments: RoleCandidateAssignment[]; // Real assignments only (dummy assignments filtered out)
  unassignedRoleIds: string[]; // Roles that could not be staffed (e.g. when m > n)
  unassignedCandidateIds: string[]; // Candidates not assigned to any role (e.g. when n > m)
  totalAssignmentScore: number; // Sum of scores for all real assignments
  assignedRoleCount: number; // Number of real assignments
  unassignedRoleCount: number; // Number of unassigned real roles
  roleCount: number; // Total input roles (m)
  candidateCount: number; // Total input candidates (n)
  matrixDimension: number; // Padded square dimension N = max(m, n)
}

export interface AssignmentInputMatrix {
  roleIds: string[];
  candidateIds: string[];
  scoreMatrix: number[][]; // [roleIndex][candidateIndex]
}

// ============================================================================
// STAGE C: TEAM-LEVEL EVALUATION TYPES
// ============================================================================

export interface EvaluationProjectRole {
  id: string;
  title?: string | null;
  requiredSkillIds: string[];
  requiredToolIds: string[];
}

export interface EvaluationCandidate {
  id: string;
  displayName?: string | null;
  skillIds: string[];
  toolIds: string[];
}

export interface TeamEvaluationInput {
  projectId?: string;
  roles: EvaluationProjectRole[];
  candidates: EvaluationCandidate[];
  assignments: RoleCandidateAssignment[];
  collaborationWeights?: Map<string, number>; // Pair key "candIdA:candIdB" (sorted IDs) -> weight
}

export interface TeamRoleCoverage {
  coveredRoles: number;
  totalRoles: number;
  ratio: number; // coveredRoles / totalRoles
  percentage: number; // ratio * 100
  unassignedRoleIds: string[];
}

export interface TeamSkillCoverage {
  coveredSkills: number;
  totalRequiredSkills: number;
  ratio: number; // coveredSkills / totalRequiredSkills (1.0 if total is 0)
  percentage: number; // ratio * 100
  coveredSkillIds: string[];
  missingSkillIds: string[];
}

export interface TeamToolCoverage {
  coveredTools: number;
  totalRequiredTools: number;
  ratio: number; // coveredTools / totalRequiredTools (1.0 if total is 0)
  percentage: number; // ratio * 100
  coveredToolIds: string[];
  missingToolIds: string[];
}

export interface TeamAssignmentUtility {
  totalUtility: number; // Sum of RWR rawGraphScore values for real assignments
  assignmentCount: number; // Real assigned role count
  averageUtility: number; // totalUtility / max(1, assignmentCount)
}

export interface TeamSkillRedundancy {
  totalRedundancy: number; // sum_s max(0, teamMembersWithSkill(s) - 1)
  uniqueSkillsCount: number; // Total distinct skills in team
  totalSkillInstances: number; // Total skill claims across all members
  redundancyRatio: number; // totalSkillInstances / max(1, uniqueSkillsCount)
  redundantSkills: { skillId: string; memberCount: number; redundancy: number }[];
}

export interface TeamCollaborationStrength {
  totalStrength: number; // Sum of historical collaboration weights across all pairs
  pairCount: number; // Total unordered candidate pairs (K * (K - 1) / 2)
  averageStrength: number; // totalStrength / max(1, pairCount) (0 if K < 2)
  collaboratingPairCount: number; // Count of candidate pairs with recorded historical collaboration
}

export interface TeamCompleteness {
  roleCoverageRatio: number;
  skillCoverageRatio: number;
  toolCoverageRatio: number;
  compositeRatio: number; // Equal-weighted arithmetic mean: (Role + Skill + Tool) / 3
  compositePercentage: number; // compositeRatio * 100
}

export interface TeamConflictFreeRate {
  conflictFree: boolean; // True iff no candidate is assigned to >1 role and no role >1 candidate
  assignedRoleCount: number;
  uniqueCandidateCount: number;
  conflictCount: number; // Number of duplicated role or candidate allocations
  conflictFreeRate: number; // Percentage of conflict-free assignments (100% for valid Hungarian)
}

export interface TeamEvaluationResult {
  roleCoverage: TeamRoleCoverage;
  skillCoverage: TeamSkillCoverage;
  toolCoverage: TeamToolCoverage;
  assignmentUtility: TeamAssignmentUtility;
  skillRedundancy: TeamSkillRedundancy;
  collaborationStrength: TeamCollaborationStrength;
  teamCompleteness: TeamCompleteness;
  conflictFreeRate: TeamConflictFreeRate;
}

// ============================================================================
// PHASE 4: BASELINE VS GRAPH RESEARCH COMPARISON TYPES
// ============================================================================

export interface MetricComparison {
  metricName: string;
  baseline: number;
  graph: number;
  absoluteDifference: number; // graph - baseline
  relativeImprovementPercentage: number | null; // ((graph - baseline) / baseline) * 100 if baseline > 0, else null (or 0 if both 0)
  higherIsBetter: boolean;
}

export interface RedundancyComparison {
  metricName: string;
  baselineTotalRedundancy: number;
  graphTotalRedundancy: number;
  absoluteDifference: number; // graph - baseline
  baselineRedundancyRatio: number;
  graphRedundancyRatio: number;
  ratioDifference: number;
  interpretation: string; // Neutral research note
}

export interface ComparisonSummary {
  roleCoverage: MetricComparison;
  skillCoverage: MetricComparison;
  toolCoverage: MetricComparison;
  assignmentUtility: MetricComparison;
  skillRedundancy: RedundancyComparison;
  collaborationStrength: MetricComparison;
  teamCompleteness: MetricComparison;
  conflictFreeRate: MetricComparison;
}

export interface TeamSelectionResult {
  method: 'BASELINE_GREEDY' | 'GRAPH_HUNGARIAN';
  assignments: RoleCandidateAssignment[];
  evaluation: TeamEvaluationResult;
  unassignedRoleIds: string[];
  unassignedCandidateIds: string[];
}

export interface BaselineVsGraphComparisonResult {
  projectId?: string;
  roleCount: number;
  candidateCount: number;
  baselineTeam: TeamSelectionResult;
  graphTeam: TeamSelectionResult;
  summary: ComparisonSummary;
  informationAsymmetry: {
    baselineFeatures: string[];
    graphFeatures: string[];
    notes: string[];
  };
  researchNotes: {
    isStatisticallySignificant: boolean;
    disclaimer: string;
  };
}

export interface ComparisonExecutionOptions {
  includeCooccurrence?: boolean;
  minCooccurrenceIntersection?: number;
  minCooccurrenceJaccard?: number;
  includePastCollaboration?: boolean;
  candidateLimit?: number;
  rwrAlpha?: number;
  rwrMaxIterations?: number;
  rwrEpsilon?: number;
}
