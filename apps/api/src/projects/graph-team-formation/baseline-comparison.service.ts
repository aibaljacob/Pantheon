import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ProjectRoleCommitment, ProjectRoleExperienceLevel, ProjectRoleStatus, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RoleMatchSpecification, TalentMatchingService } from '../talent-matching.service';
import { AssignmentSolver } from './assignment-solver';
import { GraphBuilderService, RawProjectGraphPayload } from './graph-builder';
import {
  BaselineVsGraphComparisonResult,
  CandidateGraphAffinity,
  ComparisonExecutionOptions,
  ComparisonSummary,
  EvaluationCandidate,
  EvaluationProjectRole,
  MetricComparison,
  RedundancyComparison,
  RoleCandidateAssignment,
  TeamSelectionResult,
} from './graph-team-formation.types';
import { RWRSolver } from './rwr-solver';
import { TeamEvaluator } from './team-evaluator';

interface BaselineOpportunity {
  roleId: string;
  candidateId: string;
  matcherScore: number;
  roleIndex: number;
  candidateIndex: number;
  displayName: string;
}

/**
 * ============================================================================
 * PHASE 4: BASELINE VS GRAPH RESEARCH COMPARISON SERVICE
 * ============================================================================
 *
 * Research Context & Experimental Design:
 *
 * 1. Experimental Comparison:
 *    Compares Pantheon's existing production TalentMatchingService (Baseline)
 *    against the proposed Heterogeneous Graph + RWR + Hungarian pipeline (Graph).
 *
 * 2. Unaltered Baseline:
 *    Reuses the existing TalentMatchingService without modifying its scoring formula.
 *    Baseline multi-role team is formed using a deterministic greedy conflict-resolution
 *    procedure over descending match scores.
 *
 * 3. Fair Evaluation:
 *    Both teams are evaluated under the exact same project requirements and candidate pool
 *    using the same standalone TeamEvaluator.
 *
 * 4. Research Scope:
 *    This component is strictly for experimental comparison. It reports observed metric
 *    differences without claiming statistical significance or real-world team superiority.
 * ============================================================================
 */
@Injectable()
export class BaselineComparisonService {
  private readonly logger = new Logger(BaselineComparisonService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly talentMatchingService: TalentMatchingService,
    private readonly graphBuilderService: GraphBuilderService,
    private readonly rwrSolver: RWRSolver,
    private readonly assignmentSolver: AssignmentSolver,
    private readonly teamEvaluator: TeamEvaluator,
  ) {}

  /**
   * Run comparison for a database-persisted project by ID.
   */
  public async compareForProject(
    projectId: string,
    options: ComparisonExecutionOptions = {},
  ): Promise<BaselineVsGraphComparisonResult> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: { select: { userId: true } },
        openRoles: {
          where: {
            status: { in: [ProjectRoleStatus.OPEN, ProjectRoleStatus.IN_REVIEW] },
          },
          include: {
            role: true,
            requiredSkills: { include: { skill: true } },
            requiredTools: { include: { tool: true } },
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found.`);
    }

    const excludedUserIds = new Set<string>(project.members.map((m) => m.userId));
    excludedUserIds.add(project.founderId);

    const candidates = await this.prisma.user.findMany({
      where: {
        role: Role.USER,
        id: { notIn: Array.from(excludedUserIds) },
        profile: { isNot: null },
      },
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
            portfolio: true,
          },
        },
      },
      take: options.candidateLimit ?? 100,
    });

    let historicalCollabMap: Map<string, Set<string>> | undefined;
    if (options.includePastCollaboration !== false && candidates.length > 0) {
      const candidateIds = candidates.map((c) => c.id);
      const pastMemberships = await this.prisma.projectMember.findMany({
        where: { userId: { in: candidateIds } },
        select: { userId: true, projectId: true },
      });

      historicalCollabMap = new Map();
      for (const m of pastMemberships) {
        let set = historicalCollabMap.get(m.userId);
        if (!set) {
          set = new Set();
          historicalCollabMap.set(m.userId, set);
        }
        set.add(m.projectId);
      }
    }

    return this.compareFromRawData(
      {
        project,
        candidates,
        historicalCollaborationMap: historicalCollabMap,
      },
      options,
    );
  }

  /**
   * Pure in-memory comparison method for unit testing and repeatable simulation.
   */
  public compareFromRawData(
    payload: RawProjectGraphPayload,
    options: ComparisonExecutionOptions = {},
  ): BaselineVsGraphComparisonResult {
    const { project, candidates } = payload;
    const roles = project.openRoles || [];

    // 1. Build Graph Pipeline (HIN -> RWR -> Hungarian)
    const graph = GraphBuilderService.buildFromRawData(payload);
    const affinitiesByRole = new Map<string, CandidateGraphAffinity[]>();
    const affinityLookup = new Map<string, number>(); // "roleId:candidateId" -> rawGraphScore

    for (const r of roles) {
      const roleNodeId = GraphBuilderService.toRoleId(r.id);
      if (graph.hasNode(roleNodeId)) {
        const affs = this.rwrSolver.computeCandidateAffinity(graph, roleNodeId, {
          alpha: options.rwrAlpha,
          maxIterations: options.rwrMaxIterations,
          epsilon: options.rwrEpsilon,
        });
        affinitiesByRole.set(r.id, affs);
        for (const aff of affs) {
          affinityLookup.set(`${r.id}:${aff.candidateId}`, aff.rawGraphScore);
        }
      }
    }

    const roleIds = roles.map((r) => r.id);
    const candidateIds = candidates.map((c) => c.id);

    const graphAssignmentResult = this.assignmentSolver.solveFromRWR(
      roleIds,
      candidateIds,
      affinitiesByRole,
    );

    // 2. Build Baseline Pipeline (TalentMatchingService -> Greedy 1-to-1 Selection)
    const baselineOpportunities: BaselineOpportunity[] = [];
    for (let rIdx = 0; rIdx < roles.length; rIdx++) {
      const role = roles[rIdx];
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

      for (let cIdx = 0; cIdx < candidates.length; cIdx++) {
        const cand = candidates[cIdx];
        const candidateUser = {
          id: cand.id,
          username: cand.username,
          profile: cand.profile,
        };
        const scoredDto = this.talentMatchingService.scoreCandidate(
          candidateUser,
          project,
          roleSpec,
          'NONE',
        );

        baselineOpportunities.push({
          roleId: role.id,
          candidateId: cand.id,
          matcherScore: scoredDto.totalScore,
          roleIndex: rIdx,
          candidateIndex: cIdx,
          displayName: scoredDto.candidate.displayName,
        });
      }
    }

    // Sort opportunities descending by matcher score with deterministic tie-breaking
    baselineOpportunities.sort((a, b) => {
      if (b.matcherScore !== a.matcherScore) {
        return b.matcherScore - a.matcherScore;
      }
      if (a.roleIndex !== b.roleIndex) {
        return a.roleIndex - b.roleIndex;
      }
      return a.displayName.localeCompare(b.displayName);
    });

    const baselineAssignedRoles = new Set<string>();
    const baselineAssignedCandidates = new Set<string>();
    const baselineAssignments: RoleCandidateAssignment[] = [];

    for (const opp of baselineOpportunities) {
      if (!baselineAssignedRoles.has(opp.roleId) && !baselineAssignedCandidates.has(opp.candidateId)) {
        baselineAssignedRoles.add(opp.roleId);
        baselineAssignedCandidates.add(opp.candidateId);
        const rwrScore = affinityLookup.get(`${opp.roleId}:${opp.candidateId}`) ?? 0;
        baselineAssignments.push({
          roleId: opp.roleId,
          candidateId: opp.candidateId,
          score: rwrScore,
          isDummy: false,
        });
      }
    }

    const baselineUnassignedRoleIds = roleIds.filter((id) => !baselineAssignedRoles.has(id));
    const baselineUnassignedCandidateIds = candidateIds.filter((id) => !baselineAssignedCandidates.has(id));

    // 3. Prepare Evaluation Structures for Same TeamEvaluator
    const evalRoles: EvaluationProjectRole[] = roles.map((r) => ({
      id: r.id,
      title: r.title || r.role.name,
      requiredSkillIds: (r.requiredSkills || []).map((rs) => rs.skill.id),
      requiredToolIds: (r.requiredTools || []).map((rt) => rt.tool.id),
    }));

    const evalCandidates: EvaluationCandidate[] = candidates.map((c) => ({
      id: c.id,
      displayName: c.profile?.displayName || c.username,
      skillIds: (c.profile?.identity?.skills || []).map((s) => s.skill.id),
      toolIds: (c.profile?.identity?.tools || []).map((t) => t.tool.id),
    }));

    const collabWeights = new Map<string, number>();
    if (payload.historicalCollaborationMap && candidates.length > 1) {
      for (let i = 0; i < candidates.length; i++) {
        const candAId = candidates[i].id;
        const projectsA = payload.historicalCollaborationMap.get(candAId);
        if (!projectsA || projectsA.size === 0) continue;

        for (let j = i + 1; j < candidates.length; j++) {
          const candBId = candidates[j].id;
          const projectsB = payload.historicalCollaborationMap.get(candBId);
          if (!projectsB || projectsB.size === 0) continue;

          let shared = 0;
          for (const pId of projectsA) {
            if (projectsB.has(pId)) shared++;
          }
          if (shared > 0) {
            const w = Number((1.0 + 0.5 * shared).toFixed(2));
            collabWeights.set(TeamEvaluator.makePairKey(candAId, candBId), w);
          }
        }
      }
    }

    // 4. Evaluate Both Teams Using the Same Evaluator
    const baselineEvaluation = this.teamEvaluator.evaluateTeam({
      projectId: project.id,
      roles: evalRoles,
      candidates: evalCandidates,
      assignments: baselineAssignments,
      collaborationWeights: collabWeights,
    });

    const graphEvaluation = this.teamEvaluator.evaluateTeam({
      projectId: project.id,
      roles: evalRoles,
      candidates: evalCandidates,
      assignments: graphAssignmentResult.assignments,
      collaborationWeights: collabWeights,
    });

    const baselineTeam: TeamSelectionResult = {
      method: 'BASELINE_GREEDY',
      assignments: baselineAssignments,
      evaluation: baselineEvaluation,
      unassignedRoleIds: baselineUnassignedRoleIds,
      unassignedCandidateIds: baselineUnassignedCandidateIds,
    };

    const graphTeam: TeamSelectionResult = {
      method: 'GRAPH_HUNGARIAN',
      assignments: graphAssignmentResult.assignments,
      evaluation: graphEvaluation,
      unassignedRoleIds: graphAssignmentResult.unassignedRoleIds,
      unassignedCandidateIds: graphAssignmentResult.unassignedCandidateIds,
    };

    // 5. Build Metric Comparison Summary
    const summary: ComparisonSummary = {
      roleCoverage: BaselineComparisonService.compareMetric(
        'Role Coverage',
        baselineEvaluation.roleCoverage.ratio,
        graphEvaluation.roleCoverage.ratio,
        true,
      ),
      skillCoverage: BaselineComparisonService.compareMetric(
        'Skill Coverage',
        baselineEvaluation.skillCoverage.ratio,
        graphEvaluation.skillCoverage.ratio,
        true,
      ),
      toolCoverage: BaselineComparisonService.compareMetric(
        'Tool Coverage',
        baselineEvaluation.toolCoverage.ratio,
        graphEvaluation.toolCoverage.ratio,
        true,
      ),
      assignmentUtility: BaselineComparisonService.compareMetric(
        'Assignment Utility',
        baselineEvaluation.assignmentUtility.totalUtility,
        graphEvaluation.assignmentUtility.totalUtility,
        true,
      ),
      skillRedundancy: BaselineComparisonService.compareRedundancy(
        baselineEvaluation.skillRedundancy.totalRedundancy,
        graphEvaluation.skillRedundancy.totalRedundancy,
        baselineEvaluation.skillRedundancy.redundancyRatio,
        graphEvaluation.skillRedundancy.redundancyRatio,
      ),
      collaborationStrength: BaselineComparisonService.compareMetric(
        'Collaboration Strength',
        baselineEvaluation.collaborationStrength.averageStrength,
        graphEvaluation.collaborationStrength.averageStrength,
        true,
      ),
      teamCompleteness: BaselineComparisonService.compareMetric(
        'Team Completeness',
        baselineEvaluation.teamCompleteness.compositeRatio,
        graphEvaluation.teamCompleteness.compositeRatio,
        true,
      ),
      conflictFreeRate: BaselineComparisonService.compareMetric(
        'Conflict-Free Rate',
        baselineEvaluation.conflictFreeRate.conflictFreeRate,
        graphEvaluation.conflictFreeRate.conflictFreeRate,
        true,
      ),
    };

    return {
      projectId: project.id,
      roleCount: roles.length,
      candidateCount: candidates.length,
      baselineTeam,
      graphTeam,
      summary,
      informationAsymmetry: {
        baselineFeatures: [
          'Weighted linear attribute matching (Role: 25, Skills: 25, Tools: 15, Experience: 15, Availability: 10, Context: 10)',
          'Independent candidate scoring per role with greedy sequential assignment',
        ],
        graphFeatures: [
          'Heterogeneous Information Network (HIN) with typed nodes and multi-hop paths',
          'Random Walk with Restart (RWR) capturing indirect domain connectivity and co-occurrences',
          'Kuhn-Munkres (Hungarian) global bipartite optimization over the full role-candidate matrix',
        ],
        notes: [
          'Both pipelines operate on identical input taxonomy IDs, role requirements, and candidate profiles.',
          'Both output teams are evaluated by the same standalone TeamEvaluator.',
        ],
      },
      researchNotes: {
        isStatisticallySignificant: false,
        disclaimer:
          'Observed metric differences are experimental evaluation indices for the supplied project and candidate pool. They do not constitute statistical significance, p-values, or proof of superior real-world game development performance.',
      },
    };
  }

  /**
   * Helper: Compares a standard numeric metric with safe division-by-zero handling.
   */
  public static compareMetric(
    metricName: string,
    baselineVal: number,
    graphVal: number,
    higherIsBetter: boolean = true,
  ): MetricComparison {
    const absoluteDifference = Number((graphVal - baselineVal).toFixed(4));
    let relativeImprovementPercentage: number | null = null;

    if (baselineVal > 0) {
      relativeImprovementPercentage = Number(
        (((graphVal - baselineVal) / baselineVal) * 100).toFixed(2),
      );
    } else if (baselineVal === 0 && graphVal === 0) {
      relativeImprovementPercentage = 0.0;
    } else {
      relativeImprovementPercentage = null;
    }

    return {
      metricName,
      baseline: Number(baselineVal.toFixed(4)),
      graph: Number(graphVal.toFixed(4)),
      absoluteDifference,
      relativeImprovementPercentage,
      higherIsBetter,
    };
  }

  /**
   * Helper: Compares skill redundancy with neutral research interpretation.
   */
  public static compareRedundancy(
    baselineTotal: number,
    graphTotal: number,
    baselineRatio: number,
    graphRatio: number,
  ): RedundancyComparison {
    return {
      metricName: 'Skill Redundancy',
      baselineTotalRedundancy: baselineTotal,
      graphTotalRedundancy: graphTotal,
      absoluteDifference: graphTotal - baselineTotal,
      baselineRedundancyRatio: Number(baselineRatio.toFixed(4)),
      graphRedundancyRatio: Number(graphRatio.toFixed(4)),
      ratioDifference: Number((graphRatio - baselineRatio).toFixed(4)),
      interpretation:
        'Neutral: Skill redundancy measures cross-member skill overlap. In production teams, overlap provides backup depth and peer review capability; neither higher nor lower is universally superior.',
    };
  }
}
