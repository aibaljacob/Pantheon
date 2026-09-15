import { RawProjectGraphPayload } from './graph-builder';
import { ExperimentScenarioDefinition } from './research-experiment.types';

/**
 * ============================================================================
 * CONTROLLED RESEARCH EXPERIMENT SCENARIOS (SYNTHETIC BENCHMARK SUITE)
 * ============================================================================
 *
 * Research Integrity Note:
 * All datasets in this file are synthetic benchmark fixtures designed to test
 * specific algorithmic hypotheses (such as greedy conflict resolution, multi-hop
 * co-occurrence propagation, and collaboration density). They are NOT real user data.
 * ============================================================================
 */

export function getScenarioE1Basic(): ExperimentScenarioDefinition {
  const role1 = {
    id: 'e1-role-dev',
    roleId: 'tax-role-programmer',
    title: 'Gameplay Programmer',
    experienceLevel: 'MID',
    commitment: 'FULL_TIME',
    status: 'OPEN',
    role: { id: 'tax-role-programmer', name: 'Software Engineer' },
    requiredSkills: [
      { skill: { id: 'skill-cpp', name: 'C++' } },
      { skill: { id: 'skill-gameplay', name: 'Gameplay Mechanics' } },
    ],
    requiredTools: [{ tool: { id: 'tool-unreal', name: 'Unreal Engine' } }],
  };

  const role2 = {
    id: 'e1-role-art',
    roleId: 'tax-role-artist',
    title: '3D Modeler',
    experienceLevel: 'MID',
    commitment: 'FULL_TIME',
    status: 'OPEN',
    role: { id: 'tax-role-artist', name: '3D Artist' },
    requiredSkills: [
      { skill: { id: 'skill-modeling', name: '3D Modeling' } },
      { skill: { id: 'skill-uv', name: 'UV Unwrapping' } },
    ],
    requiredTools: [{ tool: { id: 'tool-blender', name: 'Blender' } }],
  };

  const role3 = {
    id: 'e1-role-audio',
    roleId: 'tax-role-audio',
    title: 'Sound Designer',
    experienceLevel: 'MID',
    commitment: 'FULL_TIME',
    status: 'OPEN',
    role: { id: 'tax-role-audio', name: 'Audio Engineer' },
    requiredSkills: [
      { skill: { id: 'skill-foley', name: 'Foley Recording' } },
      { skill: { id: 'skill-audio-mixing', name: 'Audio Mixing' } },
    ],
    requiredTools: [{ tool: { id: 'tool-fmod', name: 'FMOD' } }],
  };

  const candAlice = {
    id: 'e1-cand-alice',
    username: 'alice_gameplay',
    profile: {
      firstName: 'Alice',
      lastName: 'Vance',
      displayName: 'Alice Vance',
      experienceYears: 4,
      availability: 'Available full-time collaboration',
      identity: {
        roles: [{ role: { id: 'tax-role-programmer', name: 'Software Engineer' } }],
        skills: [
          { skill: { id: 'skill-cpp', name: 'C++' } },
          { skill: { id: 'skill-gameplay', name: 'Gameplay Mechanics' } },
        ],
        tools: [{ tool: { id: 'tool-unreal', name: 'Unreal Engine' } }],
        gameEngines: [{ engine: { id: 'ge-unreal', name: 'Unreal Engine' } }],
        genres: [{ genre: { id: 'gn-action', name: 'Action' } }],
        platforms: [{ platform: { id: 'pl-pc', name: 'PC' } }],
      },
      portfolio: [],
    },
  };

  const candBob = {
    id: 'e1-cand-bob',
    username: 'bob_modeler',
    profile: {
      firstName: 'Bob',
      lastName: 'Ross',
      displayName: 'Bob Ross',
      experienceYears: 5,
      availability: 'Available full-time collaboration',
      identity: {
        roles: [{ role: { id: 'tax-role-artist', name: '3D Artist' } }],
        skills: [
          { skill: { id: 'skill-modeling', name: '3D Modeling' } },
          { skill: { id: 'skill-uv', name: 'UV Unwrapping' } },
        ],
        tools: [{ tool: { id: 'tool-blender', name: 'Blender' } }],
        gameEngines: [{ engine: { id: 'ge-unreal', name: 'Unreal Engine' } }],
        genres: [{ genre: { id: 'gn-action', name: 'Action' } }],
        platforms: [{ platform: { id: 'pl-pc', name: 'PC' } }],
      },
      portfolio: [],
    },
  };

  const candCarol = {
    id: 'e1-cand-carol',
    username: 'carol_audio',
    profile: {
      firstName: 'Carol',
      lastName: 'Danvers',
      displayName: 'Carol Danvers',
      experienceYears: 4,
      availability: 'Available full-time collaboration',
      identity: {
        roles: [{ role: { id: 'tax-role-audio', name: 'Audio Engineer' } }],
        skills: [
          { skill: { id: 'skill-foley', name: 'Foley Recording' } },
          { skill: { id: 'skill-audio-mixing', name: 'Audio Mixing' } },
        ],
        tools: [{ tool: { id: 'tool-fmod', name: 'FMOD' } }],
        gameEngines: [{ engine: { id: 'ge-unreal', name: 'Unreal Engine' } }],
        genres: [{ genre: { id: 'gn-action', name: 'Action' } }],
        platforms: [{ platform: { id: 'pl-pc', name: 'PC' } }],
      },
      portfolio: [],
    },
  };

  const candDave = {
    id: 'e1-cand-dave',
    username: 'dave_generalist',
    profile: {
      firstName: 'Dave',
      lastName: 'Miller',
      displayName: 'Dave Miller',
      experienceYears: 2,
      availability: 'Part-time',
      identity: {
        roles: [{ role: { id: 'tax-role-programmer', name: 'Software Engineer' } }],
        skills: [{ skill: { id: 'skill-cpp', name: 'C++' } }],
        tools: [],
        gameEngines: [{ engine: { id: 'ge-unreal', name: 'Unreal Engine' } }],
        genres: [{ genre: { id: 'gn-action', name: 'Action' } }],
        platforms: [{ platform: { id: 'pl-pc', name: 'PC' } }],
      },
      portfolio: [],
    },
  };

  return {
    id: 'E1_BASIC_FORMATION',
    name: 'E1 — Basic Team Formation',
    description: 'Standard 3-role project with distinct specialized candidate matches.',
    hypothesis:
      'Both Baseline and Graph methods should establish high baseline role and skill coverage when candidates have non-conflicting distinct specializations.',
    payload: {
      project: {
        id: 'proj-e1',
        name: 'Project Chronos',
        status: 'PUBLISHED',
        founderId: 'founder-1',
        gameEngine: 'Unreal Engine',
        genre: 'Action',
        platform: 'PC',
        members: [{ userId: 'founder-1' }],
        openRoles: [role1, role2, role3],
      },
      candidates: [candAlice, candBob, candCarol, candDave],
    },
  };
}

export function getScenarioE2Competition(): ExperimentScenarioDefinition {
  const role1 = {
    id: 'e2-role-engine',
    roleId: 'tax-role-programmer',
    title: 'Lead Engine Architect',
    experienceLevel: 'SENIOR',
    commitment: 'FULL_TIME',
    status: 'OPEN',
    role: { id: 'tax-role-programmer', name: 'Software Engineer' },
    requiredSkills: [
      { skill: { id: 'skill-cpp', name: 'C++' } },
      { skill: { id: 'skill-memory', name: 'Memory Architecture' } },
      { skill: { id: 'skill-multithreading', name: 'Multithreading' } },
    ],
    requiredTools: [{ tool: { id: 'tool-unreal', name: 'Unreal Engine' } }],
  };

  const role2 = {
    id: 'e2-role-ui',
    roleId: 'tax-role-programmer',
    title: 'UI Programmer',
    experienceLevel: 'MID',
    commitment: 'FULL_TIME',
    status: 'OPEN',
    role: { id: 'tax-role-programmer', name: 'Software Engineer' },
    requiredSkills: [
      { skill: { id: 'skill-cpp', name: 'C++' } },
      { skill: { id: 'skill-slate-ui', name: 'Slate UI' } },
    ],
    requiredTools: [{ tool: { id: 'tool-unreal', name: 'Unreal Engine' } }],
  };

  const candStar = {
    id: 'e2-cand-star',
    username: 'star_developer',
    profile: {
      firstName: 'Star',
      lastName: 'Engineer',
      displayName: 'Star Engineer',
      experienceYears: 9,
      availability: 'Available full-time collaboration',
      identity: {
        roles: [{ role: { id: 'tax-role-programmer', name: 'Software Engineer' } }],
        skills: [
          { skill: { id: 'skill-cpp', name: 'C++' } },
          { skill: { id: 'skill-memory', name: 'Memory Architecture' } },
          { skill: { id: 'skill-multithreading', name: 'Multithreading' } },
          { skill: { id: 'skill-slate-ui', name: 'Slate UI' } },
        ],
        tools: [{ tool: { id: 'tool-unreal', name: 'Unreal Engine' } }],
        gameEngines: [{ engine: { id: 'ge-unreal', name: 'Unreal Engine' } }],
        genres: [{ genre: { id: 'gn-action', name: 'Action' } }],
        platforms: [{ platform: { id: 'pl-pc', name: 'PC' } }],
      },
      portfolio: [],
    },
  };

  const candUi = {
    id: 'e2-cand-ui-specialist',
    username: 'ui_coder',
    profile: {
      firstName: 'Sam',
      lastName: 'Slate',
      displayName: 'Sam Slate',
      experienceYears: 4,
      availability: 'Available full-time collaboration',
      identity: {
        roles: [{ role: { id: 'tax-role-programmer', name: 'Software Engineer' } }],
        skills: [
          { skill: { id: 'skill-cpp', name: 'C++' } },
          { skill: { id: 'skill-slate-ui', name: 'Slate UI' } },
        ],
        tools: [{ tool: { id: 'tool-unreal', name: 'Unreal Engine' } }],
        gameEngines: [{ engine: { id: 'ge-unreal', name: 'Unreal Engine' } }],
        genres: [{ genre: { id: 'gn-action', name: 'Action' } }],
        platforms: [{ platform: { id: 'pl-pc', name: 'PC' } }],
      },
      portfolio: [],
    },
  };

  return {
    id: 'E2_CANDIDATE_COMPETITION',
    name: 'E2 — Candidate Competition & Global Assignment',
    description: 'Star candidate competes for both roles; global Hungarian matching avoids greedy suboptimal allocation.',
    hypothesis:
      'Global bipartite matching avoids local greedy assignment traps when a highly skilled candidate qualifies for multiple positions.',
    payload: {
      project: {
        id: 'proj-e2',
        name: 'Project Apex',
        status: 'PUBLISHED',
        founderId: 'founder-2',
        gameEngine: 'Unreal Engine',
        genre: 'Action',
        platform: 'PC',
        members: [{ userId: 'founder-2' }],
        openRoles: [role1, role2],
      },
      candidates: [candStar, candUi],
    },
  };
}

export function getScenarioE3MultiHop(): ExperimentScenarioDefinition {
  const role1 = {
    id: 'e3-role-vulkan',
    roleId: 'tax-role-graphics',
    title: 'Low-Level Graphics Engineer',
    experienceLevel: 'SENIOR',
    commitment: 'FULL_TIME',
    status: 'OPEN',
    role: { id: 'tax-role-graphics', name: 'Graphics Programmer' },
    requiredSkills: [
      { skill: { id: 'skill-vulkan', name: 'Vulkan API' } },
      { skill: { id: 'skill-shaders', name: 'Shader Architecture' } },
    ],
    requiredTools: [{ tool: { id: 'tool-renderdoc', name: 'RenderDoc' } }],
  };

  const candDirectX = {
    id: 'e3-cand-dx12',
    username: 'dx12_master',
    profile: {
      firstName: 'Elena',
      lastName: 'Rostova',
      displayName: 'Elena Rostova',
      experienceYears: 7,
      availability: 'Available full-time collaboration',
      identity: {
        roles: [{ role: { id: 'tax-role-graphics', name: 'Graphics Programmer' } }],
        skills: [
          { skill: { id: 'skill-dx12', name: 'DirectX 12' } },
          { skill: { id: 'skill-shaders', name: 'Shader Architecture' } },
        ],
        tools: [{ tool: { id: 'tool-renderdoc', name: 'RenderDoc' } }],
        gameEngines: [{ engine: { id: 'ge-unreal', name: 'Unreal Engine' } }],
        genres: [{ genre: { id: 'gn-action', name: 'Action' } }],
        platforms: [{ platform: { id: 'pl-pc', name: 'PC' } }],
      },
      portfolio: [],
    },
  };

  const candWriter = {
    id: 'e3-cand-writer',
    username: 'narrative_lead',
    profile: {
      firstName: 'Leo',
      lastName: 'Tolstoy',
      displayName: 'Leo Tolstoy',
      experienceYears: 6,
      availability: 'Available full-time collaboration',
      identity: {
        roles: [{ role: { id: 'tax-role-writer', name: 'Narrative Designer' } }],
        skills: [{ skill: { id: 'skill-dialogue', name: 'Dialogue Writing' } }],
        tools: [],
        gameEngines: [{ engine: { id: 'ge-unreal', name: 'Unreal Engine' } }],
        genres: [{ genre: { id: 'gn-action', name: 'Action' } }],
        platforms: [{ platform: { id: 'pl-pc', name: 'PC' } }],
      },
      portfolio: [],
    },
  };

  return {
    id: 'E3_MULTIHOP_SKILL',
    name: 'E3 — Multi-Hop Co-occurrence Propagation',
    description: 'Tests whether RWR over HIN co-occurrence edges (Vulkan <-> DX12) propagates affinity to candidate with related skills.',
    hypothesis:
      'Graph propagation routes affinity mass across empirically observed skill co-occurrences (Vulkan <-> DX12) even when exact string taxonomy match is missing on the candidate.',
    payload: {
      project: {
        id: 'proj-e3',
        name: 'Project Raytrace',
        status: 'PUBLISHED',
        founderId: 'founder-3',
        gameEngine: 'Unreal Engine',
        genre: 'Action',
        platform: 'PC',
        members: [{ userId: 'founder-3' }],
        openRoles: [role1],
      },
      candidates: [candDirectX, candWriter],
      skillCooccurrences: [
        {
          itemAId: 'skill-vulkan',
          itemBId: 'skill-dx12',
          jaccard: 0.85,
        },
      ],
    },
  };
}

export function getScenarioE4ToolRoleDiff(): ExperimentScenarioDefinition {
  const role1 = {
    id: 'e4-role-tech-artist',
    roleId: 'tax-role-tech-art',
    title: 'Technical Artist (Houdini)',
    experienceLevel: 'MID',
    commitment: 'FULL_TIME',
    status: 'OPEN',
    role: { id: 'tax-role-tech-art', name: 'Technical Artist' },
    requiredSkills: [
      { skill: { id: 'skill-python', name: 'Python Scripting' } },
      { skill: { id: 'skill-proc-gen', name: 'Procedural Generation' } },
    ],
    requiredTools: [{ tool: { id: 'tool-houdini', name: 'Houdini' } }],
  };

  const role2 = {
    id: 'e4-role-animator',
    roleId: 'tax-role-animator',
    title: 'Character Animator (Maya)',
    experienceLevel: 'MID',
    commitment: 'FULL_TIME',
    status: 'OPEN',
    role: { id: 'tax-role-animator', name: 'Animator' },
    requiredSkills: [
      { skill: { id: 'skill-rigging', name: 'Character Rigging' } },
      { skill: { id: 'skill-mocap', name: 'Motion Capture Cleanup' } },
    ],
    requiredTools: [{ tool: { id: 'tool-maya', name: 'Autodesk Maya' } }],
  };

  const candMayaAnim = {
    id: 'e4-cand-maya-anim',
    username: 'maya_animator',
    profile: {
      firstName: 'Mina',
      lastName: 'Park',
      displayName: 'Mina Park',
      experienceYears: 5,
      availability: 'Available full-time collaboration',
      identity: {
        roles: [{ role: { id: 'tax-role-animator', name: 'Animator' } }],
        skills: [
          { skill: { id: 'skill-rigging', name: 'Character Rigging' } },
          { skill: { id: 'skill-mocap', name: 'Motion Capture Cleanup' } },
        ],
        tools: [{ tool: { id: 'tool-maya', name: 'Autodesk Maya' } }],
        gameEngines: [{ engine: { id: 'ge-unreal', name: 'Unreal Engine' } }],
        genres: [{ genre: { id: 'gn-action', name: 'Action' } }],
        platforms: [{ platform: { id: 'pl-pc', name: 'PC' } }],
      },
      portfolio: [],
    },
  };

  const candHoudiniTech = {
    id: 'e4-cand-houdini-tech',
    username: 'houdini_wizard',
    profile: {
      firstName: 'Hugo',
      lastName: 'Weaving',
      displayName: 'Hugo Weaving',
      experienceYears: 6,
      availability: 'Available full-time collaboration',
      identity: {
        roles: [{ role: { id: 'tax-role-tech-art', name: 'Technical Artist' } }],
        skills: [
          { skill: { id: 'skill-python', name: 'Python Scripting' } },
          { skill: { id: 'skill-proc-gen', name: 'Procedural Generation' } },
        ],
        tools: [{ tool: { id: 'tool-houdini', name: 'Houdini' } }],
        gameEngines: [{ engine: { id: 'ge-unreal', name: 'Unreal Engine' } }],
        genres: [{ genre: { id: 'gn-action', name: 'Action' } }],
        platforms: [{ platform: { id: 'pl-pc', name: 'PC' } }],
      },
      portfolio: [],
    },
  };

  const candBlenderGeneralist = {
    id: 'e4-cand-blender-gen',
    username: 'blender_generalist',
    profile: {
      firstName: 'Ben',
      lastName: 'Dover',
      displayName: 'Ben Dover',
      experienceYears: 3,
      availability: 'Available full-time collaboration',
      identity: {
        roles: [{ role: { id: 'tax-role-artist', name: '3D Artist' } }],
        skills: [{ skill: { id: 'skill-python', name: 'Python Scripting' } }],
        tools: [{ tool: { id: 'tool-blender', name: 'Blender' } }],
        gameEngines: [{ engine: { id: 'ge-unreal', name: 'Unreal Engine' } }],
        genres: [{ genre: { id: 'gn-action', name: 'Action' } }],
        platforms: [{ platform: { id: 'pl-pc', name: 'PC' } }],
      },
      portfolio: [],
    },
  };

  return {
    id: 'E4_TOOL_ROLE_DIFF',
    name: 'E4 — Tool & Role Multi-Attribute Differentiation',
    description: 'Evaluates proper allocation of candidates when specialized tool suites differentiate similar disciplines.',
    hypothesis:
      'HIN preserves multi-attribute constraints (Tools + Skills + Roles) simultaneously for accurate role assignment.',
    payload: {
      project: {
        id: 'proj-e4',
        name: 'Project Visuals',
        status: 'PUBLISHED',
        founderId: 'founder-4',
        gameEngine: 'Unreal Engine',
        genre: 'Action',
        platform: 'PC',
        members: [{ userId: 'founder-4' }],
        openRoles: [role1, role2],
      },
      candidates: [candMayaAnim, candHoudiniTech, candBlenderGeneralist],
    },
  };
}

export function getScenarioE5Collaboration(): ExperimentScenarioDefinition {
  const role1 = {
    id: 'e5-role-lead',
    roleId: 'tax-role-programmer',
    title: 'Systems Lead',
    experienceLevel: 'SENIOR',
    commitment: 'FULL_TIME',
    status: 'OPEN',
    role: { id: 'tax-role-programmer', name: 'Software Engineer' },
    requiredSkills: [{ skill: { id: 'skill-systems', name: 'Systems Architecture' } }],
    requiredTools: [{ tool: { id: 'tool-unreal', name: 'Unreal Engine' } }],
  };

  const role2 = {
    id: 'e5-role-net',
    roleId: 'tax-role-programmer',
    title: 'Network Programmer',
    experienceLevel: 'MID',
    commitment: 'FULL_TIME',
    status: 'OPEN',
    role: { id: 'tax-role-programmer', name: 'Software Engineer' },
    requiredSkills: [{ skill: { id: 'skill-net', name: 'Multiplayer Replication' } }],
    requiredTools: [{ tool: { id: 'tool-unreal', name: 'Unreal Engine' } }],
  };

  const role3 = {
    id: 'e5-role-level',
    roleId: 'tax-role-designer',
    title: 'Level Designer',
    experienceLevel: 'MID',
    commitment: 'FULL_TIME',
    status: 'OPEN',
    role: { id: 'tax-role-designer', name: 'Game Designer' },
    requiredSkills: [{ skill: { id: 'skill-level-design', name: 'Level Design' } }],
    requiredTools: [{ tool: { id: 'tool-unreal', name: 'Unreal Engine' } }],
  };

  const candA = {
    id: 'e5-cand-a',
    username: 'lead_dev',
    profile: {
      firstName: 'Arthur',
      lastName: 'Pendelton',
      displayName: 'Arthur Pendelton',
      experienceYears: 7,
      availability: 'Available full-time collaboration',
      identity: {
        roles: [{ role: { id: 'tax-role-programmer', name: 'Software Engineer' } }],
        skills: [{ skill: { id: 'skill-systems', name: 'Systems Architecture' } }],
        tools: [{ tool: { id: 'tool-unreal', name: 'Unreal Engine' } }],
        gameEngines: [{ engine: { id: 'ge-unreal', name: 'Unreal Engine' } }],
        genres: [{ genre: { id: 'gn-action', name: 'Action' } }],
        platforms: [{ platform: { id: 'pl-pc', name: 'PC' } }],
      },
      portfolio: [],
    },
  };

  const candB = {
    id: 'e5-cand-b',
    username: 'net_dev',
    profile: {
      firstName: 'Beth',
      lastName: 'Harmon',
      displayName: 'Beth Harmon',
      experienceYears: 5,
      availability: 'Available full-time collaboration',
      identity: {
        roles: [{ role: { id: 'tax-role-programmer', name: 'Software Engineer' } }],
        skills: [{ skill: { id: 'skill-net', name: 'Multiplayer Replication' } }],
        tools: [{ tool: { id: 'tool-unreal', name: 'Unreal Engine' } }],
        gameEngines: [{ engine: { id: 'ge-unreal', name: 'Unreal Engine' } }],
        genres: [{ genre: { id: 'gn-action', name: 'Action' } }],
        platforms: [{ platform: { id: 'pl-pc', name: 'PC' } }],
      },
      portfolio: [],
    },
  };

  const candC = {
    id: 'e5-cand-c',
    username: 'level_des_collab',
    profile: {
      firstName: 'Cedric',
      lastName: 'Diggory',
      displayName: 'Cedric Diggory',
      experienceYears: 5,
      availability: 'Available full-time collaboration',
      identity: {
        roles: [{ role: { id: 'tax-role-designer', name: 'Game Designer' } }],
        skills: [{ skill: { id: 'skill-level-design', name: 'Level Design' } }],
        tools: [{ tool: { id: 'tool-unreal', name: 'Unreal Engine' } }],
        gameEngines: [{ engine: { id: 'ge-unreal', name: 'Unreal Engine' } }],
        genres: [{ genre: { id: 'gn-action', name: 'Action' } }],
        platforms: [{ platform: { id: 'pl-pc', name: 'PC' } }],
      },
      portfolio: [],
    },
  };

  const candD = {
    id: 'e5-cand-d',
    username: 'level_des_nocolab',
    profile: {
      firstName: 'Draco',
      lastName: 'Malfoy',
      displayName: 'Draco Malfoy',
      experienceYears: 5,
      availability: 'Available full-time collaboration',
      identity: {
        roles: [{ role: { id: 'tax-role-designer', name: 'Game Designer' } }],
        skills: [{ skill: { id: 'skill-level-design', name: 'Level Design' } }],
        tools: [{ tool: { id: 'tool-unreal', name: 'Unreal Engine' } }],
        gameEngines: [{ engine: { id: 'ge-unreal', name: 'Unreal Engine' } }],
        genres: [{ genre: { id: 'gn-action', name: 'Action' } }],
        platforms: [{ platform: { id: 'pl-pc', name: 'PC' } }],
      },
      portfolio: [],
    },
  };

  // Historical collaboration: A, B, and C collaborated on 3 past projects
  const historicalMap = new Map<string, Set<string>>([
    ['e5-cand-a', new Set(['past-proj-1', 'past-proj-2', 'past-proj-3'])],
    ['e5-cand-b', new Set(['past-proj-1', 'past-proj-2', 'past-proj-3'])],
    ['e5-cand-c', new Set(['past-proj-1', 'past-proj-2', 'past-proj-3'])],
    // D has no past collaboration with A, B, or C
  ]);

  return {
    id: 'E5_COLLABORATION_HISTORY',
    name: 'E5 — Historical Collaboration Density',
    description: 'Evaluates whether candidates with rich historical collaboration records produce measurable team collaboration strength.',
    hypothesis:
      'Teams composed of candidates with shared past production records exhibit higher collaboration strength index without compromising role coverage.',
    payload: {
      project: {
        id: 'proj-e5',
        name: 'Project Alliance',
        status: 'PUBLISHED',
        founderId: 'founder-5',
        gameEngine: 'Unreal Engine',
        genre: 'Action',
        platform: 'PC',
        members: [{ userId: 'founder-5' }],
        openRoles: [role1, role2, role3],
      },
      candidates: [candA, candB, candC, candD],
      historicalCollaborationMap: historicalMap,
    },
  };
}

export function getScenarioE6LargePool(candidateCount: number = 50): ExperimentScenarioDefinition {
  const roles = [
    {
      id: 'e6-role-architect',
      roleId: 'tax-role-programmer',
      title: 'Lead Architect',
      experienceLevel: 'SENIOR',
      commitment: 'FULL_TIME',
      status: 'OPEN',
      role: { id: 'tax-role-programmer', name: 'Software Engineer' },
      requiredSkills: [
        { skill: { id: 'e6-skill-cpp', name: 'C++' } },
        { skill: { id: 'e6-skill-arch', name: 'Engine Architecture' } },
      ],
      requiredTools: [{ tool: { id: 'e6-tool-unreal', name: 'Unreal Engine' } }],
    },
    {
      id: 'e6-role-gameplay',
      roleId: 'tax-role-programmer',
      title: 'Gameplay Engineer',
      experienceLevel: 'MID',
      commitment: 'FULL_TIME',
      status: 'OPEN',
      role: { id: 'tax-role-programmer', name: 'Software Engineer' },
      requiredSkills: [
        { skill: { id: 'e6-skill-cpp', name: 'C++' } },
        { skill: { id: 'e6-skill-physics', name: 'Physics' } },
      ],
      requiredTools: [{ tool: { id: 'e6-tool-unreal', name: 'Unreal Engine' } }],
    },
    {
      id: 'e6-role-ai',
      roleId: 'tax-role-programmer',
      title: 'AI Programmer',
      experienceLevel: 'MID',
      commitment: 'FULL_TIME',
      status: 'OPEN',
      role: { id: 'tax-role-programmer', name: 'Software Engineer' },
      requiredSkills: [
        { skill: { id: 'e6-skill-cpp', name: 'C++' } },
        { skill: { id: 'e6-skill-navmesh', name: 'Behavior Trees & Navmesh' } },
      ],
      requiredTools: [{ tool: { id: 'e6-tool-unreal', name: 'Unreal Engine' } }],
    },
    {
      id: 'e6-role-lead-art',
      roleId: 'tax-role-artist',
      title: 'Lead 3D Artist',
      experienceLevel: 'SENIOR',
      commitment: 'FULL_TIME',
      status: 'OPEN',
      role: { id: 'tax-role-artist', name: '3D Artist' },
      requiredSkills: [
        { skill: { id: 'e6-skill-modeling', name: '3D Modeling' } },
        { skill: { id: 'e6-skill-texturing', name: 'PBR Texturing' } },
      ],
      requiredTools: [{ tool: { id: 'e6-tool-blender', name: 'Blender' } }],
    },
    {
      id: 'e6-role-concept',
      roleId: 'tax-role-concept',
      title: 'Concept Artist',
      experienceLevel: 'MID',
      commitment: 'FULL_TIME',
      status: 'OPEN',
      role: { id: 'tax-role-concept', name: 'Concept Artist' },
      requiredSkills: [
        { skill: { id: 'e6-skill-concept', name: 'Environment Concept Art' } },
        { skill: { id: 'e6-skill-photoshop', name: 'Digital Painting' } },
      ],
      requiredTools: [{ tool: { id: 'e6-tool-photoshop', name: 'Photoshop' } }],
    },
    {
      id: 'e6-role-audio',
      roleId: 'tax-role-audio',
      title: 'Technical Sound Designer',
      experienceLevel: 'MID',
      commitment: 'FULL_TIME',
      status: 'OPEN',
      role: { id: 'tax-role-audio', name: 'Audio Engineer' },
      requiredSkills: [
        { skill: { id: 'e6-skill-fmod-int', name: 'FMOD Middleware Integration' } },
        { skill: { id: 'e6-skill-synthesis', name: 'Audio Synthesis' } },
      ],
      requiredTools: [{ tool: { id: 'e6-tool-fmod', name: 'FMOD' } }],
    },
  ];

  // Deterministically generate candidates across 5 disciplines
  const candidates: RawProjectGraphPayload['candidates'] = [];
  const disciplines = [
    {
      roleTaxId: 'tax-role-programmer',
      roleName: 'Software Engineer',
      skills: [
        { id: 'e6-skill-cpp', name: 'C++' },
        { id: 'e6-skill-arch', name: 'Engine Architecture' },
        { id: 'e6-skill-physics', name: 'Physics' },
        { id: 'e6-skill-navmesh', name: 'Behavior Trees & Navmesh' },
      ],
      tools: [{ id: 'e6-tool-unreal', name: 'Unreal Engine' }],
    },
    {
      roleTaxId: 'tax-role-artist',
      roleName: '3D Artist',
      skills: [
        { id: 'e6-skill-modeling', name: '3D Modeling' },
        { id: 'e6-skill-texturing', name: 'PBR Texturing' },
      ],
      tools: [{ id: 'e6-tool-blender', name: 'Blender' }],
    },
    {
      roleTaxId: 'tax-role-concept',
      roleName: 'Concept Artist',
      skills: [
        { id: 'e6-skill-concept', name: 'Environment Concept Art' },
        { id: 'e6-skill-photoshop', name: 'Digital Painting' },
      ],
      tools: [{ id: 'e6-tool-photoshop', name: 'Photoshop' }],
    },
    {
      roleTaxId: 'tax-role-audio',
      roleName: 'Audio Engineer',
      skills: [
        { id: 'e6-skill-fmod-int', name: 'FMOD Middleware Integration' },
        { id: 'e6-skill-synthesis', name: 'Audio Synthesis' },
      ],
      tools: [{ id: 'e6-tool-fmod', name: 'FMOD' }],
    },
    {
      roleTaxId: 'tax-role-qa',
      roleName: 'QA Tester',
      skills: [{ id: 'e6-skill-qa', name: 'Functional QA' }],
      tools: [{ id: 'e6-tool-jira', name: 'Jira' }],
    },
  ];

  for (let i = 0; i < candidateCount; i++) {
    const disc = disciplines[i % disciplines.length];
    const exp = 1 + (i % 10);
    candidates.push({
      id: `e6-cand-${i.toString().padStart(3, '0')}`,
      username: `candidate_${i.toString().padStart(3, '0')}`,
      profile: {
        firstName: `Candidate`,
        lastName: `${i}`,
        displayName: `Candidate ${i} (${disc.roleName})`,
        experienceYears: exp,
        availability: i % 2 === 0 ? 'Available full-time collaboration' : 'Part-time',
        identity: {
          roles: [{ role: { id: disc.roleTaxId, name: disc.roleName } }],
          skills: disc.skills.map((s) => ({ skill: s })),
          tools: disc.tools.map((t) => ({ tool: t })),
          gameEngines: [{ engine: { id: 'ge-unreal', name: 'Unreal Engine' } }],
          genres: [{ genre: { id: 'gn-action', name: 'Action' } }],
          platforms: [{ platform: { id: 'pl-pc', name: 'PC' } }],
        },
        portfolio: [],
      },
    });
  }

  return {
    id: 'E6_LARGE_POOL',
    name: 'E6 — Large Candidate Pool Scalability Benchmark',
    description: `6 project roles evaluated across ${candidateCount} candidates to benchmark execution timing, Hungarian assignment matrix scaling, and conflict-free rates.`,
    hypothesis:
      'Bipartite global assignment maintains strictly 100% conflict-free rates and sub-second execution times at candidate pool size N=50.',
    payload: {
      project: {
        id: 'proj-e6-large',
        name: 'Project Colossus',
        status: 'PUBLISHED',
        founderId: 'founder-6',
        gameEngine: 'Unreal Engine',
        genre: 'Action',
        platform: 'PC',
        members: [{ userId: 'founder-6' }],
        openRoles: roles,
      },
      candidates,
    },
  };
}
