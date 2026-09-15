import { AssignmentSolver } from './assignment-solver';
import { CandidateGraphAffinity } from './graph-team-formation.types';

describe('AssignmentSolver (Kuhn-Munkres Maximum Weight Bipartite Matching)', () => {
  let solver: AssignmentSolver;

  beforeEach(() => {
    solver = new AssignmentSolver();
  });

  describe('Basic Assignment & Optimization Superiority over Greedy', () => {
    it('should solve a basic 1-role and 1-candidate assignment', () => {
      const result = solver.solve({
        roleIds: ['role-01'],
        candidateIds: ['cand-01'],
        scoreMatrix: [[0.75]],
      });

      expect(result.assignedRoleCount).toBe(1);
      expect(result.unassignedRoleCount).toBe(0);
      expect(result.assignments.length).toBe(1);
      expect(result.assignments[0]).toEqual({
        roleId: 'role-01',
        candidateId: 'cand-01',
        score: 0.75,
        isDummy: false,
      });
      expect(result.totalAssignmentScore).toBeCloseTo(0.75);
    });

    it('should find the globally optimal assignment where greedy independent matching fails', () => {
      // Benchmark Case:
      // Role A: Candidate X = 0.90, Candidate Y = 0.80
      // Role B: Candidate X = 0.89, Candidate Y = 0.10
      //
      // Greedy independent selection assigns:
      //   Role A -> Candidate X (0.90)
      //   Role B -> Candidate Y (0.10) [since X is already taken]
      //   Greedy Total = 0.90 + 0.10 = 1.00
      //
      // Hungarian Global Assignment maximizes sum:
      //   Role A -> Candidate Y (0.80)
      //   Role B -> Candidate X (0.89)
      //   Global Optimal Total = 0.80 + 0.89 = 1.69

      const result = solver.solve({
        roleIds: ['role-A', 'role-B'],
        candidateIds: ['cand-X', 'cand-Y'],
        scoreMatrix: [
          [0.90, 0.80], // Role A
          [0.89, 0.10], // Role B
        ],
      });

      expect(result.assignedRoleCount).toBe(2);
      expect(result.totalAssignmentScore).toBeCloseTo(1.69, 5);

      const assignA = result.assignments.find((a) => a.roleId === 'role-A')!;
      const assignB = result.assignments.find((a) => a.roleId === 'role-B')!;

      expect(assignA.candidateId).toBe('cand-Y');
      expect(assignA.score).toBeCloseTo(0.80);

      expect(assignB.candidateId).toBe('cand-X');
      expect(assignB.score).toBeCloseTo(0.89);
    });
  });

  describe('Rectangular Matrices & Candidate Scarcity / Surplus', () => {
    it('should handle more roles than candidates (m > n) and report unassigned roles without dummy leaks', () => {
      // 3 roles, 2 candidates -> matrixDimension = 3
      const result = solver.solve({
        roleIds: ['role-1', 'role-2', 'role-3'],
        candidateIds: ['cand-1', 'cand-2'],
        scoreMatrix: [
          [0.9, 0.2], // Role 1
          [0.3, 0.8], // Role 2
          [0.1, 0.1], // Role 3
        ],
      });

      expect(result.matrixDimension).toBe(3);
      expect(result.assignedRoleCount).toBe(2);
      expect(result.unassignedRoleCount).toBe(1);
      expect(result.assignments.length).toBe(2);

      // Verify dummy assignments are never exposed
      expect(result.assignments.some((a) => a.isDummy)).toBe(false);

      // Verify unassigned role is role-3
      expect(result.unassignedRoleIds).toEqual(['role-3']);
      expect(result.unassignedCandidateIds.length).toBe(0);
      expect(result.totalAssignmentScore).toBeCloseTo(0.9 + 0.8, 5);
    });

    it('should handle more candidates than roles (m < n) and report unassigned candidates', () => {
      // 2 roles, 4 candidates -> matrixDimension = 4
      const result = solver.solve({
        roleIds: ['role-1', 'role-2'],
        candidateIds: ['cand-1', 'cand-2', 'cand-3', 'cand-4'],
        scoreMatrix: [
          [0.9, 0.8, 0.1, 0.0], // Role 1
          [0.2, 0.7, 0.85, 0.0], // Role 2
        ],
      });

      expect(result.matrixDimension).toBe(4);
      expect(result.assignedRoleCount).toBe(2);
      expect(result.unassignedRoleCount).toBe(0);
      expect(result.unassignedCandidateIds.length).toBe(2);

      // Optimal: Role 1 -> cand-1 (0.9), Role 2 -> cand-3 (0.85) -> Total = 1.75
      expect(result.totalAssignmentScore).toBeCloseTo(1.75, 5);

      const assignedCandIds = new Set(result.assignments.map((a) => a.candidateId));
      expect(assignedCandIds.has('cand-1')).toBe(true);
      expect(assignedCandIds.has('cand-3')).toBe(true);

      expect(result.unassignedCandidateIds).toContain('cand-2');
      expect(result.unassignedCandidateIds).toContain('cand-4');
    });

    it('should handle a single candidate competing for multiple roles', () => {
      // 3 roles, 1 candidate
      const result = solver.solve({
        roleIds: ['role-1', 'role-2', 'role-3'],
        candidateIds: ['cand-solo'],
        scoreMatrix: [
          [0.4], // Role 1
          [0.95], // Role 2 (best match)
          [0.6], // Role 3
        ],
      });

      expect(result.assignedRoleCount).toBe(1);
      expect(result.assignments[0].roleId).toBe('role-2');
      expect(result.assignments[0].candidateId).toBe('cand-solo');
      expect(result.assignments[0].score).toBeCloseTo(0.95);

      expect(result.unassignedRoleIds).toEqual(['role-1', 'role-3']);
      expect(result.unassignedCandidateIds.length).toBe(0);
    });
  });

  describe('Edge Cases, Ties & Invariants', () => {
    it('should handle empty role or candidate inputs gracefully', () => {
      const emptyRoles = solver.solve({
        roleIds: [],
        candidateIds: ['cand-1'],
        scoreMatrix: [],
      });
      expect(emptyRoles.assignedRoleCount).toBe(0);
      expect(emptyRoles.unassignedCandidateIds).toEqual(['cand-1']);

      const emptyCands = solver.solve({
        roleIds: ['role-1'],
        candidateIds: [],
        scoreMatrix: [],
      });
      expect(emptyCands.assignedRoleCount).toBe(0);
      expect(emptyCands.unassignedRoleIds).toEqual(['role-1']);
    });

    it('should handle all-zero score matrix deterministically without failure', () => {
      const result = solver.solve({
        roleIds: ['role-1', 'role-2'],
        candidateIds: ['cand-1', 'cand-2'],
        scoreMatrix: [
          [0, 0],
          [0, 0],
        ],
      });

      expect(result.assignedRoleCount).toBe(2);
      expect(result.totalAssignmentScore).toBe(0);
      // Valid permutation assigned
      const assignedCandSet = new Set(result.assignments.map((a) => a.candidateId));
      expect(assignedCandSet.size).toBe(2);
    });

    it('should perform deterministic tie-breaking for equal scores', () => {
      const input = {
        roleIds: ['role-1', 'role-2'],
        candidateIds: ['cand-1', 'cand-2'],
        scoreMatrix: [
          [0.5, 0.5],
          [0.5, 0.5],
        ],
      };

      const run1 = solver.solve(input);
      const run2 = solver.solve(input);

      expect(run1.assignments).toEqual(run2.assignments);
      expect(run1.totalAssignmentScore).toBe(run2.totalAssignmentScore);
    });

    it('should strictly enforce 1-to-1 matching constraints (no duplicate roles or candidates)', () => {
      // 5 roles, 5 candidates with complex floating point affinities
      const roleIds = ['r1', 'r2', 'r3', 'r4', 'r5'];
      const candidateIds = ['c1', 'c2', 'c3', 'c4', 'c5'];
      const scoreMatrix = [
        [0.01234567, 0.08765432, 0.05432109, 0.00123456, 0.09876543],
        [0.03456789, 0.01234567, 0.07654321, 0.04321098, 0.02109876],
        [0.09876543, 0.06543210, 0.03210987, 0.08765432, 0.01234567],
        [0.04321098, 0.09876543, 0.01234567, 0.05432109, 0.07654321],
        [0.07654321, 0.03210987, 0.09876543, 0.02109876, 0.04321098],
      ];

      const result = solver.solve({ roleIds, candidateIds, scoreMatrix });

      expect(result.assignedRoleCount).toBe(5);

      // Invariant 1: No candidate assigned to >1 role
      const assignedCandidates = result.assignments.map((a) => a.candidateId);
      const uniqueCandidates = new Set(assignedCandidates);
      expect(uniqueCandidates.size).toBe(5);

      // Invariant 2: No role assigned to >1 candidate
      const assignedRoles = result.assignments.map((a) => a.roleId);
      const uniqueRoles = new Set(assignedRoles);
      expect(uniqueRoles.size).toBe(5);

      // Invariant 3: Total score == sum of individual assignment scores
      const sumIndividual = result.assignments.reduce((sum, a) => sum + a.score, 0);
      expect(result.totalAssignmentScore).toBeCloseTo(sumIndividual, 7);
    });
  });

  describe('Integration with RWR Affinities (solveFromRWR)', () => {
    it('should construct input matrix from RWR candidate affinity map and solve correctly', () => {
      const roleIds = ['role-engine', 'role-artist'];
      const candidateIds = ['cand-alice', 'cand-bob', 'cand-charlie'];

      const affinitiesByRole = new Map<string, CandidateGraphAffinity[]>([
        [
          'role-engine',
          [
            { roleId: 'role-engine', candidateId: 'cand-alice', candidateNodeId: 'cand:alice', rawGraphScore: 0.125 },
            { roleId: 'role-engine', candidateId: 'cand-bob', candidateNodeId: 'cand:bob', rawGraphScore: 0.045 },
            { roleId: 'role-engine', candidateId: 'cand-charlie', candidateNodeId: 'cand:charlie', rawGraphScore: 0.010 },
          ],
        ],
        [
          'role-artist',
          [
            { roleId: 'role-artist', candidateId: 'cand-bob', candidateNodeId: 'cand:bob', rawGraphScore: 0.180 },
            { roleId: 'role-artist', candidateId: 'cand-charlie', candidateNodeId: 'cand:charlie', rawGraphScore: 0.085 },
            { roleId: 'role-artist', candidateId: 'cand-alice', candidateNodeId: 'cand:alice', rawGraphScore: 0.020 },
          ],
        ],
      ]);

      const result = solver.solveFromRWR(roleIds, candidateIds, affinitiesByRole);

      expect(result.assignedRoleCount).toBe(2);
      expect(result.unassignedCandidateIds).toEqual(['cand-charlie']);

      const engineAssign = result.assignments.find((a) => a.roleId === 'role-engine')!;
      const artistAssign = result.assignments.find((a) => a.roleId === 'role-artist')!;

      expect(engineAssign.candidateId).toBe('cand-alice');
      expect(engineAssign.score).toBeCloseTo(0.125);

      expect(artistAssign.candidateId).toBe('cand-bob');
      expect(artistAssign.score).toBeCloseTo(0.180);

      expect(result.totalAssignmentScore).toBeCloseTo(0.125 + 0.180, 5);
    });
  });
});
