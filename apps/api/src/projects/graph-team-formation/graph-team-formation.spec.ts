import { HINGraph } from './hin-graph';
import { CooccurrenceService } from './cooccurrence.service';
import { GraphBuilderService, RawProjectGraphPayload } from './graph-builder';

describe('Graph Team Formation - Phase 1 (HIN Graph & Builder)', () => {
  describe('HINGraph Adjacency List Structure', () => {
    let graph: HINGraph;

    beforeEach(() => {
      graph = new HINGraph();
    });

    it('should successfully add and retrieve typed nodes', () => {
      graph.addNode({
        id: 'proj:p1',
        rawId: 'p1',
        type: 'PROJECT',
        label: 'CyberQuest',
      });
      graph.addNode({
        id: 'role:r1',
        rawId: 'r1',
        type: 'PROJECT_ROLE',
        label: 'Gameplay Programmer',
      });
      graph.addNode({
        id: 'cand:u1',
        rawId: 'u1',
        type: 'CANDIDATE',
        label: 'Alice Dev',
      });
      graph.addNode({
        id: 'skill:s1',
        rawId: 's1',
        type: 'SKILL',
        label: 'C#',
      });
      graph.addNode({
        id: 'tool:t1',
        rawId: 't1',
        type: 'TOOL',
        label: 'Unity',
      });

      expect(graph.nodeCount).toBe(5);
      expect(graph.hasNode('proj:p1')).toBe(true);
      expect(graph.getNode('skill:s1')?.label).toBe('C#');
      expect(graph.getNodesByType('SKILL').length).toBe(1);
      expect(graph.getNodesByType('CANDIDATE')[0].label).toBe('Alice Dev');
    });

    it('should add bidirectional edges by default and compute out-degree weights', () => {
      graph.addNode({ id: 'cand:u1', rawId: 'u1', type: 'CANDIDATE', label: 'Alice' });
      graph.addNode({ id: 'skill:s1', rawId: 's1', type: 'SKILL', label: 'C#' });

      graph.addEdge({
        source: 'cand:u1',
        target: 'skill:s1',
        type: 'HAS_SKILL',
        weight: 1.2,
      });

      expect(graph.edgeCount).toBe(2); // 1 forward + 1 reverse

      const outU1 = graph.getOutEdges('cand:u1');
      expect(outU1.length).toBe(1);
      expect(outU1[0].target).toBe('skill:s1');
      expect(outU1[0].type).toBe('HAS_SKILL');
      expect(outU1[0].weight).toBe(1.2);

      const outS1 = graph.getOutEdges('skill:s1');
      expect(outS1.length).toBe(1);
      expect(outS1[0].target).toBe('cand:u1');

      expect(graph.getOutDegreeWeight('cand:u1')).toBeCloseTo(1.2);
    });

    it('should prevent adding edges between non-existent nodes', () => {
      graph.addNode({ id: 'cand:u1', rawId: 'u1', type: 'CANDIDATE', label: 'Alice' });

      expect(() => {
        graph.addEdge({
          source: 'cand:u1',
          target: 'skill:non_existent',
          type: 'HAS_SKILL',
          weight: 1.0,
        });
      }).toThrow();
    });
  });

  describe('CooccurrenceService (Jaccard Statistics)', () => {
    it('should compute exact Jaccard similarity and filter below thresholds', () => {
      // Setup inverted index: Skill -> Set of User IDs
      // Skill A (C#): Users 1, 2, 3, 4 (size 4)
      // Skill B (Unity): Users 2, 3, 4, 5 (size 4)
      // Intersection = {2, 3, 4} (size 3)
      // Union = {1, 2, 3, 4, 5} (size 5)
      // Jaccard = 3/5 = 0.60
      //
      // Skill C (Photoshop): Users 4, 5 (size 2) -> Intersection with A is {4} (size 1 < 3) -> Filtered out!

      const indexMap = new Map<string, Set<string>>([
        ['skill_a', new Set(['u1', 'u2', 'u3', 'u4'])],
        ['skill_b', new Set(['u2', 'u3', 'u4', 'u5'])],
        ['skill_c', new Set(['u4', 'u5'])],
      ]);

      const cooccurrences = CooccurrenceService.computeJaccardFromIndex(
        indexMap,
        3, // minIntersection = 3
        0.15, // minJaccard = 0.15
      );

      expect(cooccurrences.length).toBe(1);
      expect(cooccurrences[0].itemAId).toBe('skill_a');
      expect(cooccurrences[0].itemBId).toBe('skill_b');
      expect(cooccurrences[0].intersectionCount).toBe(3);
      expect(cooccurrences[0].unionCount).toBe(5);
      expect(cooccurrences[0].jaccard).toBeCloseTo(0.6);
    });

    it('should reject pairs with Jaccard below minJaccard threshold', () => {
      // Skill A: 100 users
      // Skill B: 100 users
      // Intersection: 3 users
      // Union = 197 users
      // Jaccard = 3 / 197 = 0.0152 < 0.15 -> Must be rejected
      const setA = new Set<string>();
      const setB = new Set<string>();
      for (let i = 1; i <= 100; i++) setA.add(`u_a_${i}`);
      for (let i = 1; i <= 100; i++) setB.add(`u_b_${i}`);

      // Add 3 shared users
      setA.add('shared_1');
      setA.add('shared_2');
      setA.add('shared_3');
      setB.add('shared_1');
      setB.add('shared_2');
      setB.add('shared_3');

      const indexMap = new Map<string, Set<string>>([
        ['skill_a', setA],
        ['skill_b', setB],
      ]);

      const cooccurrences = CooccurrenceService.computeJaccardFromIndex(indexMap, 3, 0.15);
      expect(cooccurrences.length).toBe(0);
    });
  });

  describe('GraphBuilderService (HIN Assembly & Provenance)', () => {
    it('should assemble a complete HIN graph from raw data with all node and edge types', () => {
      const mockPayload: RawProjectGraphPayload = {
        project: {
          id: 'proj-100',
          name: 'Neon Odyssey',
          status: 'IN_DEVELOPMENT',
          founderId: 'founder-01',
          gameEngine: 'Unreal Engine',
          genre: 'Cyberpunk RPG',
          platform: 'PC',
          members: [{ userId: 'founder-01' }, { userId: 'existing-member-02' }],
          openRoles: [
            {
              id: 'role-01',
              roleId: 'tax-role-gameplay-prog',
              title: 'Lead Gameplay Engineer',
              experienceLevel: 'SENIOR',
              commitment: 'FULL_TIME',
              status: 'OPEN',
              role: { id: 'tax-role-gameplay-prog', name: 'Gameplay Programmer' },
              requiredSkills: [
                { skill: { id: 'skill-cpp', name: 'C++' } },
                { skill: { id: 'skill-gameplay', name: 'Gameplay Architecture' } },
              ],
              requiredTools: [{ tool: { id: 'tool-unreal', name: 'Unreal Engine 5' } }],
            },
          ],
        },
        candidates: [
          {
            id: 'cand-alice',
            username: 'alice_dev',
            profile: {
              firstName: 'Alice',
              lastName: 'Vance',
              displayName: 'Alice Vance',
              experienceYears: 7,
              availability: 'Full-time collaboration',
              identity: {
                roles: [{ role: { id: 'tax-role-gameplay-prog', name: 'Gameplay Programmer' } }],
                skills: [
                  { skill: { id: 'skill-cpp', name: 'C++' } },
                  { skill: { id: 'skill-hlsl', name: 'HLSL Shaders' } },
                ],
                tools: [{ tool: { id: 'tool-unreal', name: 'Unreal Engine 5' } }],
                gameEngines: [{ engine: { id: 'engine-unreal', name: 'Unreal Engine' } }],
                genres: [{ genre: { id: 'genre-rpg', name: 'RPG' } }],
                platforms: [{ platform: { id: 'plat-pc', name: 'PC' } }],
              },
              portfolio: [
                {
                  technologies: ['C++', 'DirectX'],
                  tools: ['Unreal Engine 5'],
                },
                {
                  technologies: ['C++'],
                  tools: ['Unreal Engine 5'],
                },
              ],
            },
          },
          {
            id: 'cand-bob',
            username: 'bob_artist',
            profile: {
              firstName: 'Bob',
              lastName: 'Ross',
              experienceYears: 4,
              identity: {
                roles: [{ role: { id: 'tax-role-3d-artist', name: '3D Artist' } }],
                skills: [{ skill: { id: 'skill-3d-modeling', name: '3D Modeling' } }],
                tools: [{ tool: { id: 'tool-blender', name: 'Blender' } }],
                gameEngines: [],
                genres: [],
                platforms: [],
              },
            },
          },
        ],
        historicalCollaborationMap: new Map([
          ['cand-alice', new Set(['past-project-alpha', 'past-project-beta'])],
          ['cand-bob', new Set(['past-project-alpha', 'past-project-beta'])],
        ]),
        skillCooccurrences: [
          {
            itemAId: 'skill-cpp',
            itemBId: 'skill-gameplay',
            jaccard: 0.45,
          },
        ],
      };

      const graph = GraphBuilderService.buildFromRawData(mockPayload);

      // 1. Verify Nodes
      expect(graph.hasNode('proj:proj-100')).toBe(true);
      expect(graph.hasNode('role:role-01')).toBe(true);
      expect(graph.hasNode('cand:cand-alice')).toBe(true);
      expect(graph.hasNode('cand:cand-bob')).toBe(true);
      expect(graph.hasNode('tax_role:tax-role-gameplay-prog')).toBe(true);
      expect(graph.hasNode('skill:skill-cpp')).toBe(true);
      expect(graph.hasNode('tool:tool-unreal')).toBe(true);
      expect(graph.hasNode('engine:unreal engine')).toBe(true);

      // 2. Verify Explicit Edge Types
      const roleOut = graph.getOutEdges('role:role-01');
      expect(roleOut.some((e) => e.type === 'REQUIRES_ROLE' && e.target === 'proj:proj-100')).toBe(true);
      expect(roleOut.some((e) => e.type === 'ROLE_TAXONOMY' && e.target === 'tax_role:tax-role-gameplay-prog')).toBe(true);
      expect(roleOut.some((e) => e.type === 'REQUIRES_SKILL' && e.target === 'skill:skill-cpp')).toBe(true);
      expect(roleOut.some((e) => e.type === 'REQUIRES_TOOL' && e.target === 'tool:tool-unreal')).toBe(true);

      // 3. Verify Candidate Skills with Depth Weighting
      // Alice has C++ mentioned in 2 portfolio items: weight = 1.0 + 0.1 * 2 = 1.2
      const aliceOut = graph.getOutEdges('cand:cand-alice');
      const cppEdge = aliceOut.find((e) => e.target === 'skill:skill-cpp');
      expect(cppEdge).toBeDefined();
      expect(cppEdge?.weight).toBeCloseTo(1.2);

      // 4. Verify Historical Collaboration Edge between Alice and Bob
      // 2 shared projects -> weight = 1.0 + 0.5 * 2 = 2.0
      const collabEdge = aliceOut.find((e) => e.target === 'cand:cand-bob');
      expect(collabEdge).toBeDefined();
      expect(collabEdge?.type).toBe('PAST_COLLABORATION');
      expect(collabEdge?.weight).toBeCloseTo(2.0);

      // 5. Verify Skill Co-occurrence Edge
      const cppOut = graph.getOutEdges('skill:skill-cpp');
      const cooccurEdge = cppOut.find((e) => e.target === 'skill:skill-gameplay');
      expect(cooccurEdge).toBeDefined();
      expect(cooccurEdge?.type).toBe('SKILL_COOCCURRENCE');
      expect(cooccurEdge?.weight).toBeCloseTo(0.45);

      // 6. Verify 2-hop path connectivity: Role -> Skill -> Candidate
      const reqSkills = graph.getOutEdgesByType('role:role-01', 'REQUIRES_SKILL');
      const targetSkill = reqSkills[0].target; // 'skill:skill-cpp'
      const skillNeighbors = graph.getAdjacentNodes(targetSkill);
      const connectedCandidate = skillNeighbors.find((n) => n.node.type === 'CANDIDATE' && n.node.id === 'cand:cand-alice');
      expect(connectedCandidate).toBeDefined();
    });
  });
});
