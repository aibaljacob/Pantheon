import { Injectable, Logger } from '@nestjs/common';
import {
  AssignmentInputMatrix,
  CandidateGraphAffinity,
  GlobalAssignmentResult,
  RoleCandidateAssignment,
} from './graph-team-formation.types';

/**
 * ============================================================================
 * GLOBAL BIPARTITE ROLE-CANDIDATE ASSIGNMENT SOLVER (HUNGARIAN / KUHN-MUNKRES)
 * ============================================================================
 *
 * Research Context & Problem Formulation:
 *
 * 1. Purpose:
 *    Converts role -> candidate affinity scores (such as RWR stationary probabilities)
 *    into a conflict-free GLOBAL 1-to-1 assignment across an entire set of open project
 *    roles, rather than independently selecting the greedy top candidate for each role.
 *
 * 2. Optimization Objective:
 *    Solves the Linear Sum Assignment Problem (LSAP) on a bipartite graph:
 *
 *      maximize:   \sum_{i=1}^m \sum_{j=1}^n X_{i, j} * S_{i, j}
 *      subject to: \sum_{j=1}^n X_{i, j} <= 1   for all roles i in {1, ..., m}
 *                  \sum_{i=1}^m X_{i, j} <= 1   for all candidates j in {1, ..., n}
 *                  X_{i, j} in {0, 1}
 *
 * 3. Handling Rectangular Matrices (m != n):
 *    When the number of roles m != number of candidates n, the m x n score matrix S
 *    is explicitly padded with dummy rows (if m < n) or dummy columns (if m > n) to
 *    form a square N x N matrix where N = max(m, n).
 *
 * 4. Conversion to Minimization:
 *    Standard Hungarian minimizes total cost. Maximization is mapped to minimization via:
 *      Cost[i][j] = MaxScore - S[i][j]
 *    Dummy entries have a score of 0.0, so their cost is MaxScore. Dummy assignments
 *    are cleanly filtered out and never exposed as real team assignments.
 *
 * 5. Computational Complexity:
 *    O(N^3) time and O(N^2) space using the standard dual-potential augmenting path
 *    implementation, where N = max(m, n).
 *
 * 6. Determinism & Tie-Breaking:
 *    When multiple assignment configurations produce identical optimal sums, the solver
 *    deterministically selects the matching according to initial row/column index order.
 *
 * 7. Crucial Research Limitation:
 *    The Hungarian algorithm optimizes the global linear sum of individual role-candidate
 *    compatibilities. It does NOT optimize pairwise non-linear team synergy (which is
 *    an NP-hard Quadratic Assignment Problem). Team-level collective metrics (synergy,
 *    redundancy, skill coverage) are evaluated post-hoc on the resulting assignment.
 * ============================================================================
 */
@Injectable()
export class AssignmentSolver {
  private readonly logger = new Logger(AssignmentSolver.name);

  /**
   * Solve the global maximum-weight bipartite assignment for an explicit score matrix.
   */
  public solve(input: AssignmentInputMatrix): GlobalAssignmentResult {
    const { roleIds, candidateIds, scoreMatrix } = input;
    const m = roleIds.length;
    const n = candidateIds.length;

    // Base case: 0 roles or 0 candidates
    if (m === 0 || n === 0) {
      return {
        assignments: [],
        unassignedRoleIds: [...roleIds],
        unassignedCandidateIds: [...candidateIds],
        totalAssignmentScore: 0,
        assignedRoleCount: 0,
        unassignedRoleCount: m,
        roleCount: m,
        candidateCount: n,
        matrixDimension: 0,
      };
    }

    const N = Math.max(m, n);

    // 1. Find max score for minimization mapping: Cost[i][j] = maxScore - Score[i][j]
    let maxScore = 0;
    for (let i = 0; i < m; i++) {
      for (let j = 0; j < n; j++) {
        const val = scoreMatrix[i]?.[j] ?? 0;
        if (val > maxScore) maxScore = val;
      }
    }
    // Ensure maxScore is strictly positive to prevent zero cost matrix degeneracy
    if (maxScore <= 0) {
      maxScore = 1.0;
    }

    // 2. Build padded N x N square cost matrix
    const costMatrix: number[][] = [];
    for (let i = 0; i < N; i++) {
      costMatrix[i] = new Array(N);
      for (let j = 0; j < N; j++) {
        if (i < m && j < n) {
          const score = scoreMatrix[i]?.[j] ?? 0;
          costMatrix[i][j] = Number((maxScore - score).toFixed(10));
        } else {
          // Dummy row or dummy column: score = 0 -> cost = maxScore
          costMatrix[i][j] = maxScore;
        }
      }
    }

    // 3. Solve Hungarian Algorithm (1-indexed potentials O(N^3))
    const rowToCol = AssignmentSolver.kuhnMunkres(costMatrix, N);

    // 4. Extract Real Assignments and Track Unassigned Entities
    const realAssignments: RoleCandidateAssignment[] = [];
    const assignedRoleIndices = new Set<number>();
    const assignedCandidateIndices = new Set<number>();
    let totalScore = 0;

    for (let i = 0; i < m; i++) {
      const j = rowToCol[i];
      if (j !== -1 && j < n) {
        // Real role assigned to real candidate
        const realScore = scoreMatrix[i]?.[j] ?? 0;
        realAssignments.push({
          roleId: roleIds[i],
          candidateId: candidateIds[j],
          score: Number(realScore.toFixed(8)),
          isDummy: false,
        });
        assignedRoleIndices.add(i);
        assignedCandidateIndices.add(j);
        totalScore += realScore;
      }
    }

    // Identify unassigned roles
    const unassignedRoleIds: string[] = [];
    for (let i = 0; i < m; i++) {
      if (!assignedRoleIndices.has(i)) {
        unassignedRoleIds.push(roleIds[i]);
      }
    }

    // Identify unassigned candidates
    const unassignedCandidateIds: string[] = [];
    for (let j = 0; j < n; j++) {
      if (!assignedCandidateIndices.has(j)) {
        unassignedCandidateIds.push(candidateIds[j]);
      }
    }

    return {
      assignments: realAssignments,
      unassignedRoleIds,
      unassignedCandidateIds,
      totalAssignmentScore: Number(totalScore.toFixed(8)),
      assignedRoleCount: realAssignments.length,
      unassignedRoleCount: unassignedRoleIds.length,
      roleCount: m,
      candidateCount: n,
      matrixDimension: N,
    };
  }

  /**
   * Convenience method: Build score matrix from RWR candidate affinities and solve.
   */
  public solveFromRWR(
    roleIds: string[],
    candidateIds: string[],
    affinitiesByRole: Map<string, CandidateGraphAffinity[]>,
  ): GlobalAssignmentResult {
    const inputMatrix = AssignmentSolver.buildMatrixFromRWR(
      roleIds,
      candidateIds,
      affinitiesByRole,
    );
    return this.solve(inputMatrix);
  }

  /**
   * Helper: Transforms a Map of RWR role affinities into a structured AssignmentInputMatrix.
   */
  public static buildMatrixFromRWR(
    roleIds: string[],
    candidateIds: string[],
    affinitiesByRole: Map<string, CandidateGraphAffinity[]>,
  ): AssignmentInputMatrix {
    const scoreMatrix: number[][] = [];

    const candidateIndexMap = new Map<string, number>();
    candidateIds.forEach((id, idx) => candidateIndexMap.set(id, idx));

    for (let i = 0; i < roleIds.length; i++) {
      scoreMatrix[i] = new Array(candidateIds.length).fill(0);
      const roleId = roleIds[i];
      const affinities = affinitiesByRole.get(roleId) || [];

      for (const aff of affinities) {
        const candIdx = candidateIndexMap.get(aff.candidateId);
        if (candIdx !== undefined) {
          scoreMatrix[i][candIdx] = aff.rawGraphScore;
        }
      }
    }

    return {
      roleIds: [...roleIds],
      candidateIds: [...candidateIds],
      scoreMatrix,
    };
  }

  /**
   * Pure Kuhn-Munkres (Hungarian) algorithm implementation for N x N cost matrix.
   *
   * Dual Potential Augmenting Path formulation:
   *   u[i] + v[j] <= cost[i][j]
   *
   * Solves min \sum cost[i][rowToCol[i]] in strictly O(N^3) time.
   * Returns array rowToCol where rowToCol[i] is the matched column (0-indexed) for row i.
   */
  public static kuhnMunkres(cost: number[][], N: number): number[] {
    if (N <= 0) return [];
    if (N === 1) return [0];

    // 1-indexed internal structures for standard potential updates
    const u = new Array(N + 1).fill(0);
    const v = new Array(N + 1).fill(0);
    const p = new Array(N + 1).fill(0); // p[j] = matched row for column j
    const way = new Array(N + 1).fill(0); // predecessor path

    for (let i = 1; i <= N; ++i) {
      p[0] = i;
      let j0 = 0;
      const minv = new Array(N + 1).fill(Infinity);
      const used = new Array(N + 1).fill(false);

      do {
        used[j0] = true;
        const i0 = p[j0];
        let delta = Infinity;
        let j1 = 0;

        for (let j = 1; j <= N; ++j) {
          if (!used[j]) {
            const cur = cost[i0 - 1][j - 1] - u[i0] - v[j];
            if (cur < minv[j]) {
              minv[j] = cur;
              way[j] = j0;
            }
            if (minv[j] < delta) {
              delta = minv[j];
              j1 = j;
            }
          }
        }

        for (let j = 0; j <= N; ++j) {
          if (used[j]) {
            u[p[j]] += delta;
            v[j] -= delta;
          } else {
            minv[j] -= delta;
          }
        }

        j0 = j1;
      } while (p[j0] !== 0);

      do {
        const j1 = way[j0];
        p[j0] = p[j1];
        j0 = j1;
      } while (j0 !== 0);
    }

    // Convert column matching p[j] (where column j is matched to row p[j])
    // into row-to-column mapping (0-indexed)
    const rowToCol = new Array(N).fill(-1);
    for (let j = 1; j <= N; ++j) {
      if (p[j] > 0) {
        rowToCol[p[j] - 1] = j - 1;
      }
    }

    return rowToCol;
  }
}
