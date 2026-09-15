import { Injectable, Logger } from '@nestjs/common';
import {
  EvaluationCandidate,
  EvaluationProjectRole,
  RoleCandidateAssignment,
  TeamAssignmentUtility,
  TeamCollaborationStrength,
  TeamCompleteness,
  TeamConflictFreeRate,
  TeamEvaluationInput,
  TeamEvaluationResult,
  TeamRoleCoverage,
  TeamSkillCoverage,
  TeamSkillRedundancy,
  TeamToolCoverage,
} from './graph-team-formation.types';

/**
 * ============================================================================
 * STAGE C: TEAM-LEVEL EVALUATOR FOR GRAPH-BASED TEAM FORMATION
 * ============================================================================
 *
 * Research Context & Evaluation Principles:
 *
 * 1. Post-Assignment Evaluation:
 *    This evaluator assesses a completed team assignment (such as the output from
 *    Kuhn-Munkres bipartite matching) across holistic, multi-dimensional criteria.
 *    The evaluation is performed AFTER assignment; the linear Hungarian solver does
 *    not directly optimize non-linear team synergy.
 *
 * 2. Team Completeness as an Evaluation Index:
 *    The Team Completeness metric is an unweighted, equal-weight arithmetic mean of
 *    Role Coverage, Skill Coverage, and Tool Coverage. It serves as a transparent
 *    benchmark index, NOT a learned empirical predictor of real-world game studio success.
 *
 * 3. Interpretation of Skill Redundancy:
 *    Skill redundancy measures the degree to which multiple team members possess the
 *    same skill. Overlap is NOT inherently negative: in real production teams, skill
 *    overlap provides backup depth and peer review capability.
 *
 * 4. Interpretation of Collaboration Strength:
 *    Absence of recorded historical collaboration between two developers means there
 *    is no recorded historical co-membership evidence in the database. It MUST NOT be
 *    interpreted as interpersonal incompatibility.
 *
 * 5. Deterministic & Pure:
 *    The evaluator is 100% pure in-memory, deterministic, and free of database/LLM dependencies.
 *    Exact taxonomy IDs are used for all set intersection matching.
 * ============================================================================
 */
@Injectable()
export class TeamEvaluator {
  private readonly logger = new Logger(TeamEvaluator.name);

  /**
   * Evaluate a team assignment across all research metrics.
   */
  public evaluateTeam(input: TeamEvaluationInput): TeamEvaluationResult {
    const { roles, candidates, assignments, collaborationWeights } = input;

    // Filter real assignments (ignore dummy rows/cols)
    const realAssignments = (assignments || []).filter((a) => !a.isDummy);

    // Build candidate lookup map
    const candidateMap = new Map<string, EvaluationCandidate>();
    for (const c of candidates || []) {
      candidateMap.set(c.id, c);
    }

    // Identify assigned candidate IDs
    const assignedCandidateIds = new Set<string>();
    const assignedRoleIds = new Set<string>();
    for (const a of realAssignments) {
      assignedCandidateIds.add(a.candidateId);
      assignedRoleIds.add(a.roleId);
    }

    // A. Role Coverage
    const roleCoverage = this.calculateRoleCoverage(roles, assignedRoleIds);

    // B. Skill Coverage
    const skillCoverage = this.calculateSkillCoverage(roles, assignedCandidateIds, candidateMap);

    // C. Tool Coverage
    const toolCoverage = this.calculateToolCoverage(roles, assignedCandidateIds, candidateMap);

    // D. Assignment Utility
    const assignmentUtility = this.calculateAssignmentUtility(realAssignments);

    // E. Skill Redundancy
    const skillRedundancy = this.calculateSkillRedundancy(assignedCandidateIds, candidateMap);

    // F. Collaboration Strength
    const collaborationStrength = this.calculateCollaborationStrength(
      assignedCandidateIds,
      collaborationWeights,
    );

    // G. Team Completeness
    const teamCompleteness = this.calculateTeamCompleteness(
      roleCoverage.ratio,
      skillCoverage.ratio,
      toolCoverage.ratio,
    );

    // H. Conflict-Free Rate
    const conflictFreeRate = this.calculateConflictFreeRate(realAssignments, roles.length);

    return {
      roleCoverage,
      skillCoverage,
      toolCoverage,
      assignmentUtility,
      skillRedundancy,
      collaborationStrength,
      teamCompleteness,
      conflictFreeRate,
    };
  }

  /**
   * Helper to format unordered candidate pair keys: "candA:candB" where candA < candB
   */
  public static makePairKey(idA: string, idB: string): string {
    return idA < idB ? `${idA}:${idB}` : `${idB}:${idA}`;
  }

  /**
   * A. Role Coverage Calculation
   */
  private calculateRoleCoverage(
    roles: EvaluationProjectRole[],
    assignedRoleIds: Set<string>,
  ): TeamRoleCoverage {
    const totalRoles = roles.length;
    if (totalRoles === 0) {
      return {
        coveredRoles: 0,
        totalRoles: 0,
        ratio: 1.0,
        percentage: 100.0,
        unassignedRoleIds: [],
      };
    }

    let coveredRoles = 0;
    const unassignedRoleIds: string[] = [];

    for (const role of roles) {
      if (assignedRoleIds.has(role.id)) {
        coveredRoles++;
      } else {
        unassignedRoleIds.push(role.id);
      }
    }

    const ratio = coveredRoles / totalRoles;
    const percentage = Number((ratio * 100).toFixed(2));

    return {
      coveredRoles,
      totalRoles,
      ratio: Number(ratio.toFixed(4)),
      percentage,
      unassignedRoleIds,
    };
  }

  /**
   * B. Skill Coverage Calculation (Exact taxonomy ID set matching)
   */
  private calculateSkillCoverage(
    roles: EvaluationProjectRole[],
    assignedCandidateIds: Set<string>,
    candidateMap: Map<string, EvaluationCandidate>,
  ): TeamSkillCoverage {
    // 1. Construct required skill set
    const requiredSkillSet = new Set<string>();
    for (const r of roles) {
      for (const sId of r.requiredSkillIds || []) {
        requiredSkillSet.add(sId);
      }
    }

    const totalRequiredSkills = requiredSkillSet.size;
    if (totalRequiredSkills === 0) {
      return {
        coveredSkills: 0,
        totalRequiredSkills: 0,
        ratio: 1.0,
        percentage: 100.0,
        coveredSkillIds: [],
        missingSkillIds: [],
      };
    }

    // 2. Construct team skill union
    const teamSkillUnion = new Set<string>();
    for (const cId of assignedCandidateIds) {
      const candidate = candidateMap.get(cId);
      if (candidate) {
        for (const sId of candidate.skillIds || []) {
          teamSkillUnion.add(sId);
        }
      }
    }

    // 3. Evaluate intersection
    const coveredSkillIds: string[] = [];
    const missingSkillIds: string[] = [];

    for (const reqSkillId of requiredSkillSet) {
      if (teamSkillUnion.has(reqSkillId)) {
        coveredSkillIds.push(reqSkillId);
      } else {
        missingSkillIds.push(reqSkillId);
      }
    }

    const coveredSkills = coveredSkillIds.length;
    const ratio = coveredSkills / totalRequiredSkills;
    const percentage = Number((ratio * 100).toFixed(2));

    return {
      coveredSkills,
      totalRequiredSkills,
      ratio: Number(ratio.toFixed(4)),
      percentage,
      coveredSkillIds,
      missingSkillIds,
    };
  }

  /**
   * C. Tool Coverage Calculation (Exact taxonomy ID set matching)
   */
  private calculateToolCoverage(
    roles: EvaluationProjectRole[],
    assignedCandidateIds: Set<string>,
    candidateMap: Map<string, EvaluationCandidate>,
  ): TeamToolCoverage {
    const requiredToolSet = new Set<string>();
    for (const r of roles) {
      for (const tId of r.requiredToolIds || []) {
        requiredToolSet.add(tId);
      }
    }

    const totalRequiredTools = requiredToolSet.size;
    if (totalRequiredTools === 0) {
      return {
        coveredTools: 0,
        totalRequiredTools: 0,
        ratio: 1.0,
        percentage: 100.0,
        coveredToolIds: [],
        missingToolIds: [],
      };
    }

    const teamToolUnion = new Set<string>();
    for (const cId of assignedCandidateIds) {
      const candidate = candidateMap.get(cId);
      if (candidate) {
        for (const tId of candidate.toolIds || []) {
          teamToolUnion.add(tId);
        }
      }
    }

    const coveredToolIds: string[] = [];
    const missingToolIds: string[] = [];

    for (const reqToolId of requiredToolSet) {
      if (teamToolUnion.has(reqToolId)) {
        coveredToolIds.push(reqToolId);
      } else {
        missingToolIds.push(reqToolId);
      }
    }

    const coveredTools = coveredToolIds.length;
    const ratio = coveredTools / totalRequiredTools;
    const percentage = Number((ratio * 100).toFixed(2));

    return {
      coveredTools,
      totalRequiredTools,
      ratio: Number(ratio.toFixed(4)),
      percentage,
      coveredToolIds,
      missingToolIds,
    };
  }

  /**
   * D. Assignment Utility Calculation
   */
  private calculateAssignmentUtility(
    realAssignments: RoleCandidateAssignment[],
  ): TeamAssignmentUtility {
    const assignmentCount = realAssignments.length;
    if (assignmentCount === 0) {
      return {
        totalUtility: 0,
        assignmentCount: 0,
        averageUtility: 0,
      };
    }

    let totalUtility = 0;
    for (const a of realAssignments) {
      totalUtility += a.score;
    }

    const averageUtility = totalUtility / assignmentCount;

    return {
      totalUtility: Number(totalUtility.toFixed(6)),
      assignmentCount,
      averageUtility: Number(averageUtility.toFixed(6)),
    };
  }

  /**
   * E. Skill Redundancy Calculation
   * Formula: For each skill s possessed by team, redundancy(s) = max(0, count(s) - 1).
   * Total Redundancy = sum_s redundancy(s).
   */
  private calculateSkillRedundancy(
    assignedCandidateIds: Set<string>,
    candidateMap: Map<string, EvaluationCandidate>,
  ): TeamSkillRedundancy {
    const skillCounts = new Map<string, number>();
    let totalSkillInstances = 0;

    for (const cId of assignedCandidateIds) {
      const candidate = candidateMap.get(cId);
      if (candidate) {
        for (const sId of candidate.skillIds || []) {
          skillCounts.set(sId, (skillCounts.get(sId) || 0) + 1);
          totalSkillInstances++;
        }
      }
    }

    const uniqueSkillsCount = skillCounts.size;
    let totalRedundancy = 0;
    const redundantSkills: { skillId: string; memberCount: number; redundancy: number }[] = [];

    for (const [skillId, count] of skillCounts.entries()) {
      if (count > 1) {
        const redundancy = count - 1;
        totalRedundancy += redundancy;
        redundantSkills.push({ skillId, memberCount: count, redundancy });
      }
    }

    // Sort redundant skills descending by redundancy
    redundantSkills.sort((a, b) => b.redundancy - a.redundancy);

    const redundancyRatio =
      uniqueSkillsCount === 0 ? 1.0 : Number((totalSkillInstances / uniqueSkillsCount).toFixed(4));

    return {
      totalRedundancy,
      uniqueSkillsCount,
      totalSkillInstances,
      redundancyRatio,
      redundantSkills,
    };
  }

  /**
   * F. Collaboration Strength Calculation
   * Evaluates pairwise historical collaboration over unordered pairs of assigned candidates.
   */
  private calculateCollaborationStrength(
    assignedCandidateIds: Set<string>,
    collaborationWeights?: Map<string, number>,
  ): TeamCollaborationStrength {
    const candidateList = Array.from(assignedCandidateIds);
    const K = candidateList.length;

    if (K < 2) {
      return {
        totalStrength: 0,
        pairCount: 0,
        averageStrength: 0,
        collaboratingPairCount: 0,
      };
    }

    const pairCount = (K * (K - 1)) / 2;
    let totalStrength = 0;
    let collaboratingPairCount = 0;

    for (let i = 0; i < K; i++) {
      for (let j = i + 1; j < K; j++) {
        const pairKey = TeamEvaluator.makePairKey(candidateList[i], candidateList[j]);
        const weight = collaborationWeights?.get(pairKey) ?? 0;

        if (weight > 0) {
          totalStrength += weight;
          collaboratingPairCount++;
        }
      }
    }

    const averageStrength = totalStrength / pairCount;

    return {
      totalStrength: Number(totalStrength.toFixed(4)),
      pairCount,
      averageStrength: Number(averageStrength.toFixed(4)),
      collaboratingPairCount,
    };
  }

  /**
   * G. Team Completeness Calculation
   * Unweighted equal-weight arithmetic mean: (RoleCoverage + SkillCoverage + ToolCoverage) / 3
   */
  private calculateTeamCompleteness(
    roleRatio: number,
    skillRatio: number,
    toolRatio: number,
  ): TeamCompleteness {
    const compositeRatio = (roleRatio + skillRatio + toolRatio) / 3;
    const compositePercentage = Number((compositeRatio * 100).toFixed(2));

    return {
      roleCoverageRatio: Number(roleRatio.toFixed(4)),
      skillCoverageRatio: Number(skillRatio.toFixed(4)),
      toolCoverageRatio: Number(toolRatio.toFixed(4)),
      compositeRatio: Number(compositeRatio.toFixed(4)),
      compositePercentage,
    };
  }

  /**
   * H. Conflict-Free Rate Calculation
   * Verifies that each real role has at most one candidate and each candidate has at most one role.
   */
  private calculateConflictFreeRate(
    realAssignments: RoleCandidateAssignment[],
    totalInputRoles: number,
  ): TeamConflictFreeRate {
    const assignedRoleCounts = new Map<string, number>();
    const assignedCandidateCounts = new Map<string, number>();

    for (const a of realAssignments) {
      assignedRoleCounts.set(a.roleId, (assignedRoleCounts.get(a.roleId) || 0) + 1);
      assignedCandidateCounts.set(a.candidateId, (assignedCandidateCounts.get(a.candidateId) || 0) + 1);
    }

    let roleConflicts = 0;
    for (const count of assignedRoleCounts.values()) {
      if (count > 1) {
        roleConflicts += count - 1;
      }
    }

    let candidateConflicts = 0;
    for (const count of assignedCandidateCounts.values()) {
      if (count > 1) {
        candidateConflicts += count - 1;
      }
    }

    const conflictCount = roleConflicts + candidateConflicts;
    const conflictFree = conflictCount === 0;
    const assignedRoleCount = realAssignments.length;
    const uniqueCandidateCount = assignedCandidateCounts.size;

    let conflictFreeRate = 100.0;
    if (conflictCount > 0 && assignedRoleCount > 0) {
      conflictFreeRate = Number(
        (Math.max(0, 1 - conflictCount / assignedRoleCount) * 100).toFixed(2),
      );
    }

    return {
      conflictFree,
      assignedRoleCount,
      uniqueCandidateCount,
      conflictCount,
      conflictFreeRate,
    };
  }
}
