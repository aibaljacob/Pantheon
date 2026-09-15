import { TeamEvaluator } from './team-evaluator';
import {
  EvaluationCandidate,
  EvaluationProjectRole,
  RoleCandidateAssignment,
  TeamEvaluationInput,
} from './graph-team-formation.types';

describe('TeamEvaluator (Stage C: Holistic Team-Level Evaluation)', () => {
  let evaluator: TeamEvaluator;

  beforeEach(() => {
    evaluator = new TeamEvaluator();
  });

  describe('Role Coverage Metric', () => {
    it('should evaluate 100% role coverage when all roles are staffed', () => {
      const roles: EvaluationProjectRole[] = [
        { id: 'r1', requiredSkillIds: [], requiredToolIds: [] },
        { id: 'r2', requiredSkillIds: [], requiredToolIds: [] },
      ];
      const candidates: EvaluationCandidate[] = [
        { id: 'c1', skillIds: [], toolIds: [] },
        { id: 'c2', skillIds: [], toolIds: [] },
      ];
      const assignments: RoleCandidateAssignment[] = [
        { roleId: 'r1', candidateId: 'c1', score: 0.8 },
        { roleId: 'r2', candidateId: 'c2', score: 0.7 },
      ];

      const result = evaluator.evaluateTeam({ roles, candidates, assignments });

      expect(result.roleCoverage.coveredRoles).toBe(2);
      expect(result.roleCoverage.totalRoles).toBe(2);
      expect(result.roleCoverage.ratio).toBe(1.0);
      expect(result.roleCoverage.percentage).toBe(100.0);
      expect(result.roleCoverage.unassignedRoleIds).toEqual([]);
    });

    it('should evaluate partial role coverage and ignore dummy assignments', () => {
      const roles: EvaluationProjectRole[] = [
        { id: 'r1', requiredSkillIds: [], requiredToolIds: [] },
        { id: 'r2', requiredSkillIds: [], requiredToolIds: [] },
        { id: 'r3', requiredSkillIds: [], requiredToolIds: [] },
      ];
      const candidates: EvaluationCandidate[] = [
        { id: 'c1', skillIds: [], toolIds: [] },
      ];
      const assignments: RoleCandidateAssignment[] = [
        { roleId: 'r1', candidateId: 'c1', score: 0.8 },
        { roleId: 'r2', candidateId: 'dummy-col', score: 0.0, isDummy: true }, // dummy assignment
      ];

      const result = evaluator.evaluateTeam({ roles, candidates, assignments });

      expect(result.roleCoverage.coveredRoles).toBe(1);
      expect(result.roleCoverage.totalRoles).toBe(3);
      expect(result.roleCoverage.ratio).toBeCloseTo(1 / 3, 4);
      expect(result.roleCoverage.percentage).toBeCloseTo(33.33, 2);
      expect(result.roleCoverage.unassignedRoleIds).toEqual(['r2', 'r3']);
    });
  });

  describe('Skill & Tool Coverage Metrics', () => {
    it('should evaluate 100% skill coverage and 100% tool coverage via collective team union', () => {
      // Role 1 requires: C++, Unreal
      // Role 2 requires: Shaders, Blender
      // Cand 1 has: C++, Shaders, Unreal
      // Cand 2 has: 3D Modeling, Blender
      const roles: EvaluationProjectRole[] = [
        { id: 'r1', requiredSkillIds: ['skill-cpp'], requiredToolIds: ['tool-unreal'] },
        { id: 'r2', requiredSkillIds: ['skill-shaders'], requiredToolIds: ['tool-blender'] },
      ];
      const candidates: EvaluationCandidate[] = [
        { id: 'c1', skillIds: ['skill-cpp', 'skill-shaders'], toolIds: ['tool-unreal'] },
        { id: 'c2', skillIds: ['skill-3d-model'], toolIds: ['tool-blender'] },
      ];
      const assignments: RoleCandidateAssignment[] = [
        { roleId: 'r1', candidateId: 'c1', score: 0.9 },
        { roleId: 'r2', candidateId: 'c2', score: 0.8 },
      ];

      const result = evaluator.evaluateTeam({ roles, candidates, assignments });

      expect(result.skillCoverage.coveredSkills).toBe(2);
      expect(result.skillCoverage.totalRequiredSkills).toBe(2);
      expect(result.skillCoverage.ratio).toBe(1.0);
      expect(result.skillCoverage.percentage).toBe(100.0);
      expect(result.skillCoverage.missingSkillIds).toEqual([]);

      expect(result.toolCoverage.coveredTools).toBe(2);
      expect(result.toolCoverage.totalRequiredTools).toBe(2);
      expect(result.toolCoverage.ratio).toBe(1.0);
      expect(result.toolCoverage.percentage).toBe(100.0);
      expect(result.toolCoverage.missingToolIds).toEqual([]);
    });

    it('should evaluate partial skill and tool coverage and identify missing exact taxonomy IDs', () => {
      const roles: EvaluationProjectRole[] = [
        { id: 'r1', requiredSkillIds: ['skill-cpp', 'skill-ai'], requiredToolIds: ['tool-unreal'] },
        { id: 'r2', requiredSkillIds: ['skill-networking'], requiredToolIds: ['tool-photon', 'tool-docker'] },
      ];
      const candidates: EvaluationCandidate[] = [
        { id: 'c1', skillIds: ['skill-cpp'], toolIds: ['tool-unreal'] },
        { id: 'c2', skillIds: ['skill-ui'], toolIds: ['tool-docker'] },
      ];
      const assignments: RoleCandidateAssignment[] = [
        { roleId: 'r1', candidateId: 'c1', score: 0.8 },
        { roleId: 'r2', candidateId: 'c2', score: 0.6 },
      ];

      const result = evaluator.evaluateTeam({ roles, candidates, assignments });

      // Skills: required = ['skill-cpp', 'skill-ai', 'skill-networking'] (3)
      // Team has = ['skill-cpp', 'skill-ui']
      // Covered = ['skill-cpp'] (1)
      expect(result.skillCoverage.coveredSkills).toBe(1);
      expect(result.skillCoverage.totalRequiredSkills).toBe(3);
      expect(result.skillCoverage.ratio).toBeCloseTo(1 / 3, 4);
      expect(result.skillCoverage.coveredSkillIds).toEqual(['skill-cpp']);
      expect(result.skillCoverage.missingSkillIds).toEqual(['skill-ai', 'skill-networking']);

      // Tools: required = ['tool-unreal', 'tool-photon', 'tool-docker'] (3)
      // Team has = ['tool-unreal', 'tool-docker'] (2)
      expect(result.toolCoverage.coveredTools).toBe(2);
      expect(result.toolCoverage.totalRequiredTools).toBe(3);
      expect(result.toolCoverage.ratio).toBeCloseTo(2 / 3, 4);
      expect(result.toolCoverage.missingToolIds).toEqual(['tool-photon']);
    });

    it('should handle zero required skills or tools explicitly with 100% coverage', () => {
      const roles: EvaluationProjectRole[] = [
        { id: 'r1', requiredSkillIds: [], requiredToolIds: [] },
      ];
      const candidates: EvaluationCandidate[] = [
        { id: 'c1', skillIds: ['s1'], toolIds: ['t1'] },
      ];
      const assignments: RoleCandidateAssignment[] = [
        { roleId: 'r1', candidateId: 'c1', score: 0.5 },
      ];

      const result = evaluator.evaluateTeam({ roles, candidates, assignments });

      expect(result.skillCoverage.coveredSkills).toBe(0);
      expect(result.skillCoverage.totalRequiredSkills).toBe(0);
      expect(result.skillCoverage.ratio).toBe(1.0);
      expect(result.skillCoverage.percentage).toBe(100.0);

      expect(result.toolCoverage.coveredTools).toBe(0);
      expect(result.toolCoverage.totalRequiredTools).toBe(0);
      expect(result.toolCoverage.ratio).toBe(1.0);
      expect(result.toolCoverage.percentage).toBe(100.0);
    });
  });

  describe('Assignment Utility Metric', () => {
    it('should compute sum and average of RWR assignment scores', () => {
      const roles: EvaluationProjectRole[] = [
        { id: 'r1', requiredSkillIds: [], requiredToolIds: [] },
        { id: 'r2', requiredSkillIds: [], requiredToolIds: [] },
      ];
      const candidates: EvaluationCandidate[] = [
        { id: 'c1', skillIds: [], toolIds: [] },
        { id: 'c2', skillIds: [], toolIds: [] },
      ];
      const assignments: RoleCandidateAssignment[] = [
        { roleId: 'r1', candidateId: 'c1', score: 0.1254 },
        { roleId: 'r2', candidateId: 'c2', score: 0.0846 },
      ];

      const result = evaluator.evaluateTeam({ roles, candidates, assignments });

      expect(result.assignmentUtility.totalUtility).toBeCloseTo(0.21, 5);
      expect(result.assignmentUtility.assignmentCount).toBe(2);
      expect(result.assignmentUtility.averageUtility).toBeCloseTo(0.105, 5);
    });

    it('should return 0 utility for empty team', () => {
      const result = evaluator.evaluateTeam({ roles: [], candidates: [], assignments: [] });
      expect(result.assignmentUtility.totalUtility).toBe(0);
      expect(result.assignmentUtility.assignmentCount).toBe(0);
      expect(result.assignmentUtility.averageUtility).toBe(0);
    });
  });

  describe('Skill Redundancy Metric', () => {
    it('should compute zero redundancy when all team skills are distinct', () => {
      const candidates: EvaluationCandidate[] = [
        { id: 'c1', skillIds: ['s1', 's2'], toolIds: [] },
        { id: 'c2', skillIds: ['s3', 's4'], toolIds: [] },
      ];
      const assignments: RoleCandidateAssignment[] = [
        { roleId: 'r1', candidateId: 'c1', score: 0.5 },
        { roleId: 'r2', candidateId: 'c2', score: 0.5 },
      ];

      const result = evaluator.evaluateTeam({
        roles: [{ id: 'r1', requiredSkillIds: [], requiredToolIds: [] }, { id: 'r2', requiredSkillIds: [], requiredToolIds: [] }],
        candidates,
        assignments,
      });

      expect(result.skillRedundancy.totalRedundancy).toBe(0);
      expect(result.skillRedundancy.uniqueSkillsCount).toBe(4);
      expect(result.skillRedundancy.totalSkillInstances).toBe(4);
      expect(result.skillRedundancy.redundancyRatio).toBe(1.0);
      expect(result.skillRedundancy.redundantSkills).toEqual([]);
    });

    it('should compute multi-skill redundancy across overlapping team members', () => {
      // Cand 1 has: C++, Python, Git
      // Cand 2 has: C++, Python, Unity
      // Cand 3 has: C++, Blender
      //
      // Total instances = 3 (C++) + 2 (Python) + 1 (Git) + 1 (Unity) + 1 (Blender) = 8
      // Unique skills = 5
      // Redundancy(C++) = 3 - 1 = 2
      // Redundancy(Python) = 2 - 1 = 1
      // Total redundancy = 2 + 1 = 3
      const candidates: EvaluationCandidate[] = [
        { id: 'c1', skillIds: ['skill-cpp', 'skill-py', 'skill-git'], toolIds: [] },
        { id: 'c2', skillIds: ['skill-cpp', 'skill-py', 'skill-unity'], toolIds: [] },
        { id: 'c3', skillIds: ['skill-cpp', 'skill-blender'], toolIds: [] },
      ];
      const assignments: RoleCandidateAssignment[] = [
        { roleId: 'r1', candidateId: 'c1', score: 0.5 },
        { roleId: 'r2', candidateId: 'c2', score: 0.5 },
        { roleId: 'r3', candidateId: 'c3', score: 0.5 },
      ];

      const result = evaluator.evaluateTeam({
        roles: [
          { id: 'r1', requiredSkillIds: [], requiredToolIds: [] },
          { id: 'r2', requiredSkillIds: [], requiredToolIds: [] },
          { id: 'r3', requiredSkillIds: [], requiredToolIds: [] },
        ],
        candidates,
        assignments,
      });

      expect(result.skillRedundancy.totalRedundancy).toBe(3);
      expect(result.skillRedundancy.uniqueSkillsCount).toBe(5);
      expect(result.skillRedundancy.totalSkillInstances).toBe(8);
      expect(result.skillRedundancy.redundancyRatio).toBeCloseTo(8 / 5, 4);

      expect(result.skillRedundancy.redundantSkills.length).toBe(2);
      expect(result.skillRedundancy.redundantSkills[0]).toEqual({
        skillId: 'skill-cpp',
        memberCount: 3,
        redundancy: 2,
      });
      expect(result.skillRedundancy.redundantSkills[1]).toEqual({
        skillId: 'skill-py',
        memberCount: 2,
        redundancy: 1,
      });
    });
  });

  describe('Collaboration Strength Metric', () => {
    it('should compute complete historical collaboration for a 3-member team', () => {
      // 3 candidates: pairs = {c1, c2}, {c1, c3}, {c2, c3} (3 pairs)
      // Weights: c1:c2 = 1.5, c1:c3 = 2.0, c2:c3 = 1.0 -> Total = 4.5
      // Average = 4.5 / 3 = 1.5
      const collabWeights = new Map<string, number>([
        [TeamEvaluator.makePairKey('c1', 'c2'), 1.5],
        [TeamEvaluator.makePairKey('c1', 'c3'), 2.0],
        [TeamEvaluator.makePairKey('c2', 'c3'), 1.0],
      ]);

      const candidates: EvaluationCandidate[] = [
        { id: 'c1', skillIds: [], toolIds: [] },
        { id: 'c2', skillIds: [], toolIds: [] },
        { id: 'c3', skillIds: [], toolIds: [] },
      ];
      const assignments: RoleCandidateAssignment[] = [
        { roleId: 'r1', candidateId: 'c1', score: 0.5 },
        { roleId: 'r2', candidateId: 'c2', score: 0.5 },
        { roleId: 'r3', candidateId: 'c3', score: 0.5 },
      ];

      const result = evaluator.evaluateTeam({
        roles: [
          { id: 'r1', requiredSkillIds: [], requiredToolIds: [] },
          { id: 'r2', requiredSkillIds: [], requiredToolIds: [] },
          { id: 'r3', requiredSkillIds: [], requiredToolIds: [] },
        ],
        candidates,
        assignments,
        collaborationWeights: collabWeights,
      });

      expect(result.collaborationStrength.totalStrength).toBeCloseTo(4.5, 4);
      expect(result.collaborationStrength.pairCount).toBe(3);
      expect(result.collaborationStrength.averageStrength).toBeCloseTo(1.5, 4);
      expect(result.collaborationStrength.collaboratingPairCount).toBe(3);
    });

    it('should treat missing collaboration history as 0 rather than incompatibility', () => {
      // 3 candidates, but only {c1, c2} have past history
      const collabWeights = new Map<string, number>([
        [TeamEvaluator.makePairKey('c1', 'c2'), 2.0],
      ]);

      const candidates: EvaluationCandidate[] = [
        { id: 'c1', skillIds: [], toolIds: [] },
        { id: 'c2', skillIds: [], toolIds: [] },
        { id: 'c3', skillIds: [], toolIds: [] },
      ];
      const assignments: RoleCandidateAssignment[] = [
        { roleId: 'r1', candidateId: 'c1', score: 0.5 },
        { roleId: 'r2', candidateId: 'c2', score: 0.5 },
        { roleId: 'r3', candidateId: 'c3', score: 0.5 },
      ];

      const result = evaluator.evaluateTeam({
        roles: [
          { id: 'r1', requiredSkillIds: [], requiredToolIds: [] },
          { id: 'r2', requiredSkillIds: [], requiredToolIds: [] },
          { id: 'r3', requiredSkillIds: [], requiredToolIds: [] },
        ],
        candidates,
        assignments,
        collaborationWeights: collabWeights,
      });

      expect(result.collaborationStrength.totalStrength).toBeCloseTo(2.0, 4);
      expect(result.collaborationStrength.pairCount).toBe(3);
      expect(result.collaborationStrength.averageStrength).toBeCloseTo(2.0 / 3, 4);
      expect(result.collaborationStrength.collaboratingPairCount).toBe(1);
    });

    it('should handle single-member team or empty team gracefully', () => {
      const singleMember = evaluator.evaluateTeam({
        roles: [{ id: 'r1', requiredSkillIds: [], requiredToolIds: [] }],
        candidates: [{ id: 'c1', skillIds: [], toolIds: [] }],
        assignments: [{ roleId: 'r1', candidateId: 'c1', score: 0.5 }],
      });

      expect(singleMember.collaborationStrength.pairCount).toBe(0);
      expect(singleMember.collaborationStrength.averageStrength).toBe(0);
      expect(singleMember.collaborationStrength.totalStrength).toBe(0);
    });
  });

  describe('Team Completeness Composite Metric', () => {
    it('should calculate unweighted equal-weight arithmetic mean: (Role + Skill + Tool) / 3', () => {
      // Role Coverage = 1.0 (100%)
      // Skill Coverage = 0.5 (50%)
      // Tool Coverage = 0.8 (80%)
      // Composite = (1.0 + 0.5 + 0.8) / 3 = 2.3 / 3 = 0.7667 (76.67%)
      const roles: EvaluationProjectRole[] = [
        { id: 'r1', requiredSkillIds: ['s1', 's2'], requiredToolIds: ['t1', 't2', 't3', 't4', 't5'] },
      ];
      const candidates: EvaluationCandidate[] = [
        { id: 'c1', skillIds: ['s1'], toolIds: ['t1', 't2', 't3', 't4'] },
      ];
      const assignments: RoleCandidateAssignment[] = [
        { roleId: 'r1', candidateId: 'c1', score: 0.9 },
      ];

      const result = evaluator.evaluateTeam({ roles, candidates, assignments });

      expect(result.teamCompleteness.roleCoverageRatio).toBe(1.0);
      expect(result.teamCompleteness.skillCoverageRatio).toBe(0.5);
      expect(result.teamCompleteness.toolCoverageRatio).toBe(0.8);

      expect(result.teamCompleteness.compositeRatio).toBeCloseTo(0.7667, 4);
      expect(result.teamCompleteness.compositePercentage).toBeCloseTo(76.67, 2);
    });
  });

  describe('Conflict-Free Rate & Constraint Integrity', () => {
    it('should verify conflictFree=true and 100% rate for a valid Hungarian assignment', () => {
      const roles: EvaluationProjectRole[] = [
        { id: 'r1', requiredSkillIds: [], requiredToolIds: [] },
        { id: 'r2', requiredSkillIds: [], requiredToolIds: [] },
      ];
      const candidates: EvaluationCandidate[] = [
        { id: 'c1', skillIds: [], toolIds: [] },
        { id: 'c2', skillIds: [], toolIds: [] },
      ];
      const assignments: RoleCandidateAssignment[] = [
        { roleId: 'r1', candidateId: 'c1', score: 0.8 },
        { roleId: 'r2', candidateId: 'c2', score: 0.7 },
      ];

      const result = evaluator.evaluateTeam({ roles, candidates, assignments });

      expect(result.conflictFreeRate.conflictFree).toBe(true);
      expect(result.conflictFreeRate.conflictCount).toBe(0);
      expect(result.conflictFreeRate.conflictFreeRate).toBe(100.0);
      expect(result.conflictFreeRate.assignedRoleCount).toBe(2);
      expect(result.conflictFreeRate.uniqueCandidateCount).toBe(2);
    });

    it('should detect candidate conflict if a candidate is assigned to multiple roles (e.g. greedy baseline case)', () => {
      // Candidate c1 is assigned to both r1 and r2!
      const roles: EvaluationProjectRole[] = [
        { id: 'r1', requiredSkillIds: [], requiredToolIds: [] },
        { id: 'r2', requiredSkillIds: [], requiredToolIds: [] },
      ];
      const candidates: EvaluationCandidate[] = [
        { id: 'c1', skillIds: [], toolIds: [] },
      ];
      const assignments: RoleCandidateAssignment[] = [
        { roleId: 'r1', candidateId: 'c1', score: 0.9 },
        { roleId: 'r2', candidateId: 'c1', score: 0.85 }, // Conflict!
      ];

      const result = evaluator.evaluateTeam({ roles, candidates, assignments });

      expect(result.conflictFreeRate.conflictFree).toBe(false);
      expect(result.conflictFreeRate.conflictCount).toBe(1);
      expect(result.conflictFreeRate.uniqueCandidateCount).toBe(1);
      expect(result.conflictFreeRate.conflictFreeRate).toBeLessThan(100.0);
    });

    it('should detect role conflict if a role is assigned multiple candidates', () => {
      const roles: EvaluationProjectRole[] = [
        { id: 'r1', requiredSkillIds: [], requiredToolIds: [] },
      ];
      const candidates: EvaluationCandidate[] = [
        { id: 'c1', skillIds: [], toolIds: [] },
        { id: 'c2', skillIds: [], toolIds: [] },
      ];
      const assignments: RoleCandidateAssignment[] = [
        { roleId: 'r1', candidateId: 'c1', score: 0.9 },
        { roleId: 'r1', candidateId: 'c2', score: 0.8 }, // Conflict on role r1!
      ];

      const result = evaluator.evaluateTeam({ roles, candidates, assignments });

      expect(result.conflictFreeRate.conflictFree).toBe(false);
      expect(result.conflictFreeRate.conflictCount).toBe(1);
      expect(result.conflictFreeRate.assignedRoleCount).toBe(2);
    });
  });

  describe('Determinism & Repeated Evaluation', () => {
    it('should produce strictly identical evaluation results across repeated runs', () => {
      const roles: EvaluationProjectRole[] = [
        { id: 'r1', requiredSkillIds: ['s1', 's2'], requiredToolIds: ['t1'] },
        { id: 'r2', requiredSkillIds: ['s2', 's3'], requiredToolIds: ['t2'] },
      ];
      const candidates: EvaluationCandidate[] = [
        { id: 'c1', skillIds: ['s1', 's2'], toolIds: ['t1'] },
        { id: 'c2', skillIds: ['s2', 's3'], toolIds: ['t2'] },
      ];
      const assignments: RoleCandidateAssignment[] = [
        { roleId: 'r1', candidateId: 'c1', score: 0.875 },
        { roleId: 'r2', candidateId: 'c2', score: 0.650 },
      ];
      const collaborationWeights = new Map<string, number>([
        [TeamEvaluator.makePairKey('c1', 'c2'), 1.5],
      ]);

      const input: TeamEvaluationInput = {
        roles,
        candidates,
        assignments,
        collaborationWeights,
      };

      const run1 = evaluator.evaluateTeam(input);
      const run2 = evaluator.evaluateTeam(input);

      expect(run1).toEqual(run2);
    });
  });
});
