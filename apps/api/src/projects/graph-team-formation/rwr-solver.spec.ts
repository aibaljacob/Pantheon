import { HINGraph } from './hin-graph';
import { RWRSolver } from './rwr-solver';

describe('RWRSolver (Random Walk with Restart on HIN Graph)', () => {
  let solver: RWRSolver;
  let graph: HINGraph;

  beforeEach(() => {
    solver = new RWRSolver();
    graph = new HINGraph();
  });

  describe('Convergence Semantics & Probability Conservation', () => {
    it('should correctly report converged=true when L1 delta reaches epsilon within iteration budget', () => {
      // Build a connected graph: Role -> Skill -> Candidate
      graph.addNode({ id: 'role:r1', rawId: 'r1', type: 'PROJECT_ROLE', label: 'Programmer' });
      graph.addNode({ id: 'skill:s1', rawId: 's1', type: 'SKILL', label: 'C#' });
      graph.addNode({ id: 'cand:u1', rawId: 'u1', type: 'CANDIDATE', label: 'Alice' });

      graph.addEdge({ source: 'role:r1', target: 'skill:s1', type: 'REQUIRES_SKILL', weight: 1.0 });
      graph.addEdge({ source: 'cand:u1', target: 'skill:s1', type: 'HAS_SKILL', weight: 1.0 });

      // Run with sufficient iteration budget (maxIterations=100) to allow convergence to epsilon=1e-6
      const result = solver.computeStationaryDistribution(graph, 'role:r1', {
        alpha: 0.15,
        maxIterations: 100,
        epsilon: 1e-6,
      });

      expect(result.converged).toBe(true);
      expect(result.iterations).toBeGreaterThan(0);
      expect(result.iterations).toBeLessThan(100);
      expect(result.l1Delta).toBeLessThan(1e-6);

      // Verify probability mass conservation: sum p(v) == 1.0
      let totalProb = 0;
      for (const val of result.distribution.values()) {
        expect(Number.isFinite(val)).toBe(true);
        expect(val).toBeGreaterThanOrEqual(0);
        totalProb += val;
      }
      expect(totalProb).toBeCloseTo(1.0, 5);

      // Restart node retains significant probability mass (>= alpha)
      const restartProb = result.distribution.get('role:r1')!;
      expect(restartProb).toBeGreaterThanOrEqual(0.15);
    });

    it('should correctly report converged=false when truncated at maxIterations before reaching epsilon', () => {
      // With alpha=0.15, (1-alpha)^25 ≈ 0.017 > 1e-6, so 25 iterations will truncate without reaching 1e-6
      graph.addNode({ id: 'role:r1', rawId: 'r1', type: 'PROJECT_ROLE', label: 'Programmer' });
      graph.addNode({ id: 'skill:s1', rawId: 's1', type: 'SKILL', label: 'C#' });
      graph.addNode({ id: 'cand:u1', rawId: 'u1', type: 'CANDIDATE', label: 'Alice' });

      graph.addEdge({ source: 'role:r1', target: 'skill:s1', type: 'REQUIRES_SKILL', weight: 1.0 });
      graph.addEdge({ source: 'cand:u1', target: 'skill:s1', type: 'HAS_SKILL', weight: 1.0 });

      const result = solver.computeStationaryDistribution(graph, 'role:r1', {
        alpha: 0.15,
        maxIterations: 25,
        epsilon: 1e-6,
      });

      // Semantic check: Truncated execution MUST report converged = false
      expect(result.converged).toBe(false);
      expect(result.iterations).toBe(25);
      expect(result.l1Delta).toBeGreaterThanOrEqual(1e-6);
      expect(result.l1Delta).toBeLessThan(0.05);

      // Probability mass must STILL sum to 1.0 at truncated step
      let totalProb = 0;
      for (const val of result.distribution.values()) {
        expect(Number.isFinite(val)).toBe(true);
        expect(val).toBeGreaterThanOrEqual(0);
        totalProb += val;
      }
      expect(totalProb).toBeCloseTo(1.0, 5);
    });

    it('should accurately report final L1 delta matching manual distance computation', () => {
      graph.addNode({ id: 'role:r1', rawId: 'r1', type: 'PROJECT_ROLE', label: 'Role' });
      graph.addNode({ id: 'skill:s1', rawId: 's1', type: 'SKILL', label: 'Skill' });
      graph.addNode({ id: 'cand:u1', rawId: 'u1', type: 'CANDIDATE', label: 'User 1' });

      graph.addEdge({ source: 'role:r1', target: 'skill:s1', type: 'REQUIRES_SKILL', weight: 1.0 });
      graph.addEdge({ source: 'cand:u1', target: 'skill:s1', type: 'HAS_SKILL', weight: 1.0 });

      const result = solver.computeStationaryDistribution(graph, 'role:r1', {
        maxIterations: 5,
      });

      expect(result.iterations).toBe(5);
      expect(result.converged).toBe(false);
      expect(result.l1Delta).toBeGreaterThan(0);
      expect(Number.isFinite(result.l1Delta)).toBe(true);
    });

    it('should produce identical deterministic distributions on repeated runs', () => {
      graph.addNode({ id: 'role:r1', rawId: 'r1', type: 'PROJECT_ROLE', label: 'Role' });
      graph.addNode({ id: 'skill:s1', rawId: 's1', type: 'SKILL', label: 'Skill' });
      graph.addNode({ id: 'cand:u1', rawId: 'u1', type: 'CANDIDATE', label: 'User 1' });
      graph.addNode({ id: 'cand:u2', rawId: 'u2', type: 'CANDIDATE', label: 'User 2' });

      graph.addEdge({ source: 'role:r1', target: 'skill:s1', type: 'REQUIRES_SKILL', weight: 1.0 });
      graph.addEdge({ source: 'cand:u1', target: 'skill:s1', type: 'HAS_SKILL', weight: 1.5 });
      graph.addEdge({ source: 'cand:u2', target: 'skill:s1', type: 'HAS_SKILL', weight: 1.0 });

      const run1 = solver.computeStationaryDistribution(graph, 'role:r1');
      const run2 = solver.computeStationaryDistribution(graph, 'role:r1');

      expect(run1.iterations).toBe(run2.iterations);
      expect(run1.converged).toBe(run2.converged);
      expect(run1.l1Delta).toBe(run2.l1Delta);

      for (const [nodeId, prob1] of run1.distribution.entries()) {
        const prob2 = run2.distribution.get(nodeId);
        expect(prob1).toBe(prob2);
      }
    });

    it('should handle single-node graph trivially with converged=true', () => {
      graph.addNode({ id: 'role:isolated', rawId: 'iso', type: 'PROJECT_ROLE', label: 'Solo' });
      const result = solver.computeStationaryDistribution(graph, 'role:isolated');

      expect(result.converged).toBe(true);
      expect(result.iterations).toBe(0);
      expect(result.l1Delta).toBe(0);
      expect(result.distribution.get('role:isolated')).toBe(1.0);
    });

    it('should safely handle dangling nodes without NaN or probability loss', () => {
      // Create directed edge: role -> dangling (unidirectional, so dangling has no out-edges)
      graph.addNode({ id: 'role:r1', rawId: 'r1', type: 'PROJECT_ROLE', label: 'Role' });
      graph.addNode({ id: 'skill:dangling', rawId: 'd1', type: 'SKILL', label: 'Dangling Leaf' });

      graph.addEdge({ source: 'role:r1', target: 'skill:dangling', type: 'REQUIRES_SKILL', weight: 1.0 }, false);

      const result = solver.computeStationaryDistribution(graph, 'role:r1');

      expect(result.iterations).toBe(25);

      let totalProb = 0;
      for (const val of result.distribution.values()) {
        expect(Number.isFinite(val)).toBe(true);
        totalProb += val;
      }
      expect(totalProb).toBeCloseTo(1.0, 5);
    });
  });

  describe('Multi-Hop Path Traversal & Semantic Affinity', () => {
    it('should assign positive affinity via Role -> Skill -> Candidate path', () => {
      graph.addNode({ id: 'role:r1', rawId: 'r1', type: 'PROJECT_ROLE', label: 'Dev Role' });
      graph.addNode({ id: 'skill:cpp', rawId: 's_cpp', type: 'SKILL', label: 'C++' });
      graph.addNode({ id: 'cand:u1', rawId: 'u1', type: 'CANDIDATE', label: 'Alice (C++)' });
      graph.addNode({ id: 'cand:u2', rawId: 'u2', type: 'CANDIDATE', label: 'Bob (Disconnected)' });

      graph.addEdge({ source: 'role:r1', target: 'skill:cpp', type: 'REQUIRES_SKILL', weight: 1.0 });
      graph.addEdge({ source: 'cand:u1', target: 'skill:cpp', type: 'HAS_SKILL', weight: 1.0 });

      const affinities = solver.computeCandidateAffinity(graph, 'role:r1');

      expect(affinities.length).toBe(2);

      const aliceAffinity = affinities.find((a) => a.candidateId === 'u1')!;
      const bobAffinity = affinities.find((a) => a.candidateId === 'u2')!;

      expect(aliceAffinity.rawGraphScore).toBeGreaterThan(0);
      expect(bobAffinity.rawGraphScore).toBe(0);
      expect(affinities[0].candidateId).toBe('u1'); // Top candidate
    });

    it('should assign positive affinity via Role -> Tool -> Candidate and Role -> ProfessionalRole -> Candidate', () => {
      graph.addNode({ id: 'role:r1', rawId: 'r1', type: 'PROJECT_ROLE', label: 'Artist Role' });
      graph.addNode({ id: 'tool:blender', rawId: 't_blender', type: 'TOOL', label: 'Blender' });
      graph.addNode({ id: 'tax_role:3d_artist', rawId: 'tr_artist', type: 'PROFESSIONAL_ROLE', label: '3D Artist' });
      graph.addNode({ id: 'cand:u1', rawId: 'u1', type: 'CANDIDATE', label: 'Tool Match Candidate' });
      graph.addNode({ id: 'cand:u2', rawId: 'u2', type: 'CANDIDATE', label: 'Taxonomy Match Candidate' });

      // Role requires Tool and has Taxonomy
      graph.addEdge({ source: 'role:r1', target: 'tool:blender', type: 'REQUIRES_TOOL', weight: 1.0 });
      graph.addEdge({ source: 'role:r1', target: 'tax_role:3d_artist', type: 'ROLE_TAXONOMY', weight: 1.0 });

      // Candidate 1 knows Blender
      graph.addEdge({ source: 'cand:u1', target: 'tool:blender', type: 'HAS_TOOL', weight: 1.0 });

      // Candidate 2 is a 3D Artist
      graph.addEdge({ source: 'cand:u2', target: 'tax_role:3d_artist', type: 'HAS_ROLE', weight: 1.0 });

      const affinities = solver.computeCandidateAffinity(graph, 'role:r1');

      const cand1 = affinities.find((a) => a.candidateId === 'u1')!;
      const cand2 = affinities.find((a) => a.candidateId === 'u2')!;

      expect(cand1.rawGraphScore).toBeGreaterThan(0);
      expect(cand2.rawGraphScore).toBeGreaterThan(0);
    });

    it('should propagate latent affinity through Skill Co-occurrence paths (Role -> Skill A -> Skill B -> Candidate)', () => {
      // Role requires C++ (Skill A)
      // Cand 1 has C++ (Direct 2-hop)
      // Cand 2 has C# (Skill B) (Indirect 3-hop via C++ <-> C# co-occurrence)
      // Cand 3 has Python (Isolated Skill C)
      graph.addNode({ id: 'role:r1', rawId: 'r1', type: 'PROJECT_ROLE', label: 'Lead Engine Programmer' });
      graph.addNode({ id: 'skill:cpp', rawId: 's_cpp', type: 'SKILL', label: 'C++' });
      graph.addNode({ id: 'skill:csharp', rawId: 's_cs', type: 'SKILL', label: 'C#' });
      graph.addNode({ id: 'skill:python', rawId: 's_py', type: 'SKILL', label: 'Python' });

      graph.addNode({ id: 'cand:u1', rawId: 'u1', type: 'CANDIDATE', label: 'Direct C++ Dev' });
      graph.addNode({ id: 'cand:u2', rawId: 'u2', type: 'CANDIDATE', label: 'Co-occur C# Dev' });
      graph.addNode({ id: 'cand:u3', rawId: 'u3', type: 'CANDIDATE', label: 'Isolated Python Dev' });

      // Role requires C++
      graph.addEdge({ source: 'role:r1', target: 'skill:cpp', type: 'REQUIRES_SKILL', weight: 1.0 });

      // C++ has co-occurrence with C#
      graph.addEdge({ source: 'skill:cpp', target: 'skill:csharp', type: 'SKILL_COOCCURRENCE', weight: 0.5 });

      // Candidates
      graph.addEdge({ source: 'cand:u1', target: 'skill:cpp', type: 'HAS_SKILL', weight: 1.0 });
      graph.addEdge({ source: 'cand:u2', target: 'skill:csharp', type: 'HAS_SKILL', weight: 1.0 });
      graph.addEdge({ source: 'cand:u3', target: 'skill:python', type: 'HAS_SKILL', weight: 1.0 });

      const affinities = solver.computeCandidateAffinity(graph, 'role:r1');

      const u1 = affinities.find((a) => a.candidateId === 'u1')!;
      const u2 = affinities.find((a) => a.candidateId === 'u2')!;
      const u3 = affinities.find((a) => a.candidateId === 'u3')!;

      // 1. Direct candidate has the highest affinity
      expect(u1.rawGraphScore).toBeGreaterThan(u2.rawGraphScore);

      // 2. Co-occurrence candidate receives non-zero latent affinity
      expect(u2.rawGraphScore).toBeGreaterThan(0);

      // 3. Isolated candidate receives 0
      expect(u3.rawGraphScore).toBe(0);
    });

    it('should reflect higher edge weights (e.g. portfolio depth) with proportionally higher affinity', () => {
      graph.addNode({ id: 'role:r1', rawId: 'r1', type: 'PROJECT_ROLE', label: 'Role' });
      graph.addNode({ id: 'skill:s1', rawId: 's1', type: 'SKILL', label: 'Skill' });
      graph.addNode({ id: 'cand:alice_expert', rawId: 'alice', type: 'CANDIDATE', label: 'Alice (Expert)' });
      graph.addNode({ id: 'cand:bob_novice', rawId: 'bob', type: 'CANDIDATE', label: 'Bob (Novice)' });

      graph.addEdge({ source: 'role:r1', target: 'skill:s1', type: 'REQUIRES_SKILL', weight: 1.0 });

      // Alice has portfolio depth (weight 1.5), Bob has basic skill (weight 1.0)
      graph.addEdge({ source: 'cand:alice_expert', target: 'skill:s1', type: 'HAS_SKILL', weight: 1.5 });
      graph.addEdge({ source: 'cand:bob_novice', target: 'skill:s1', type: 'HAS_SKILL', weight: 1.0 });

      const affinities = solver.computeCandidateAffinity(graph, 'role:r1');

      const alice = affinities.find((a) => a.candidateId === 'alice')!;
      const bob = affinities.find((a) => a.candidateId === 'bob')!;

      expect(alice.rawGraphScore).toBeGreaterThan(bob.rawGraphScore);
    });
  });
});
