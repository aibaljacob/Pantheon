import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CooccurrenceService } from './cooccurrence.service';
import { HINGraph } from './hin-graph';
import { GraphBuildOptions, HINEdge, HINNode } from './graph-team-formation.types';
import { ProjectRoleStatus, Role } from '@prisma/client';

export interface RawProjectGraphPayload {
  project: {
    id: string;
    name: string;
    status: string;
    founderId: string;
    gameEngine?: string | null;
    genre?: string | null;
    platform?: string | null;
    members: { userId: string }[];
    openRoles: {
      id: string;
      roleId: string;
      title?: string | null;
      experienceLevel: string;
      commitment: string;
      status: string;
      role: { id: string; name: string };
      requiredSkills: { skill: { id: string; name: string } }[];
      requiredTools: { tool: { id: string; name: string } }[];
    }[];
  };
  candidates: {
    id: string;
    username: string;
    profile?: {
      firstName?: string;
      lastName?: string;
      displayName?: string | null;
      experienceYears?: number | null;
      availability?: string | null;
      identity?: {
        roles: { role: { id: string; name: string } }[];
        skills: { skill: { id: string; name: string } }[];
        tools: { tool: { id: string; name: string } }[];
        gameEngines: { engine: { id: string; name: string } }[];
        genres: { genre: { id: string; name: string } }[];
        platforms: { platform: { id: string; name: string } }[];
      } | null;
      portfolio?: {
        technologies?: string[];
        tools?: string[];
        gameEngine?: string | null;
        genre?: string | null;
        platform?: string | null;
      }[];
    } | null;
  }[];
  historicalCollaborationMap?: Map<string, Set<string>>; // userId -> Set<sharedProjectId>
  skillCooccurrences?: { itemAId: string; itemBId: string; jaccard: number }[];
  toolCooccurrences?: { itemAId: string; itemBId: string; jaccard: number }[];
}

@Injectable()
export class GraphBuilderService {
  private readonly logger = new Logger(GraphBuilderService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cooccurrenceService: CooccurrenceService,
  ) {}

  /**
   * Helper: Global Graph ID formatters
   */
  public static toProjId(id: string): string {
    return `proj:${id}`;
  }
  public static toRoleId(id: string): string {
    return `role:${id}`;
  }
  public static toCandId(id: string): string {
    return `cand:${id}`;
  }
  public static toTaxRoleId(id: string): string {
    return `tax_role:${id}`;
  }
  public static toSkillId(id: string): string {
    return `skill:${id}`;
  }
  public static toToolId(id: string): string {
    return `tool:${id}`;
  }
  public static toEngineId(name: string): string {
    return `engine:${name.toLowerCase().trim()}`;
  }
  public static toGenreId(name: string): string {
    return `genre:${name.toLowerCase().trim()}`;
  }
  public static toPlatformId(name: string): string {
    return `platform:${name.toLowerCase().trim()}`;
  }

  /**
   * Build the complete in-memory HIN graph for a specific target project.
   */
  public async buildGraphForProject(
    projectId: string,
    options: GraphBuildOptions = {},
  ): Promise<HINGraph> {
    const {
      includeCooccurrence = true,
      minCooccurrenceIntersection = CooccurrenceService.DEFAULT_MIN_INTERSECTION,
      minCooccurrenceJaccard = CooccurrenceService.DEFAULT_MIN_JACCARD,
      includePastCollaboration = true,
      candidateLimit = 100,
    } = options;

    // 1. Fetch target Project with active roles & team members
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: { select: { userId: true } },
        openRoles: {
          where: {
            status: {
              in: [ProjectRoleStatus.OPEN, ProjectRoleStatus.IN_REVIEW],
            },
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

    // Excluded users (founder + existing project members)
    const excludedUserIds = new Set<string>(project.members.map((m) => m.userId));
    excludedUserIds.add(project.founderId);

    // 2. Fetch eligible Candidate Users
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
      take: candidateLimit,
    });

    // 3. Fetch Historical Collaboration if requested
    let historicalCollabMap: Map<string, Set<string>> | undefined;
    if (includePastCollaboration && candidates.length > 0) {
      const candidateIds = candidates.map((c) => c.id);
      const pastMemberships = await this.prisma.projectMember.findMany({
        where: {
          userId: { in: candidateIds },
        },
        select: {
          userId: true,
          projectId: true,
        },
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

    // 4. Fetch Skill & Tool Co-occurrences if requested
    let skillCooccurrences: { itemAId: string; itemBId: string; jaccard: number }[] | undefined;
    let toolCooccurrences: { itemAId: string; itemBId: string; jaccard: number }[] | undefined;

    if (includeCooccurrence) {
      const [skillData, toolData] = await Promise.all([
        this.cooccurrenceService.getSkillCooccurrences(
          minCooccurrenceIntersection,
          minCooccurrenceJaccard,
        ),
        this.cooccurrenceService.getToolCooccurrences(
          minCooccurrenceIntersection,
          minCooccurrenceJaccard,
        ),
      ]);
      skillCooccurrences = skillData;
      toolCooccurrences = toolData;
    }

    // 5. Construct Graph via Pure Assembly Method
    return GraphBuilderService.buildFromRawData({
      project,
      candidates,
      historicalCollaborationMap: historicalCollabMap,
      skillCooccurrences,
      toolCooccurrences,
    });
  }

  /**
   * Pure deterministic assembly method (Decoupled from Prisma for direct unit-testability).
   */
  public static buildFromRawData(payload: RawProjectGraphPayload): HINGraph {
    const graph = new HINGraph();
    const { project, candidates, historicalCollaborationMap, skillCooccurrences, toolCooccurrences } = payload;

    // A. Add Project Node
    const projNodeId = GraphBuilderService.toProjId(project.id);
    graph.addNode({
      id: projNodeId,
      rawId: project.id,
      type: 'PROJECT',
      label: project.name,
      data: {
        status: project.status,
        founderId: project.founderId,
      },
    });

    // Project Context Nodes & Edges
    if (project.gameEngine?.trim()) {
      const engineNodeId = GraphBuilderService.toEngineId(project.gameEngine);
      if (!graph.hasNode(engineNodeId)) {
        graph.addNode({
          id: engineNodeId,
          rawId: project.gameEngine,
          type: 'GAME_ENGINE',
          label: project.gameEngine,
        });
      }
      graph.addEdge({
        source: projNodeId,
        target: engineNodeId,
        type: 'PROJECT_CONTEXT',
        weight: 1.0,
      });
    }

    if (project.genre?.trim()) {
      const genreNodeId = GraphBuilderService.toGenreId(project.genre);
      if (!graph.hasNode(genreNodeId)) {
        graph.addNode({
          id: genreNodeId,
          rawId: project.genre,
          type: 'GENRE',
          label: project.genre,
        });
      }
      graph.addEdge({
        source: projNodeId,
        target: genreNodeId,
        type: 'PROJECT_CONTEXT',
        weight: 1.0,
      });
    }

    if (project.platform?.trim()) {
      const platformNodeId = GraphBuilderService.toPlatformId(project.platform);
      if (!graph.hasNode(platformNodeId)) {
        graph.addNode({
          id: platformNodeId,
          rawId: project.platform,
          type: 'PLATFORM',
          label: project.platform,
        });
      }
      graph.addEdge({
        source: projNodeId,
        target: platformNodeId,
        type: 'PROJECT_CONTEXT',
        weight: 1.0,
      });
    }

    // B. Add Project Roles & Requirement Edges
    for (const openRole of project.openRoles) {
      const roleNodeId = GraphBuilderService.toRoleId(openRole.id);
      graph.addNode({
        id: roleNodeId,
        rawId: openRole.id,
        type: 'PROJECT_ROLE',
        label: openRole.title || openRole.role.name,
        data: {
          experienceLevel: openRole.experienceLevel,
          commitment: openRole.commitment,
          status: openRole.status,
        },
      });

      // Project -> REQUIRES_ROLE -> Role
      graph.addEdge({
        source: projNodeId,
        target: roleNodeId,
        type: 'REQUIRES_ROLE',
        weight: 1.0,
      });

      // Taxonomy Role Node
      const taxRoleNodeId = GraphBuilderService.toTaxRoleId(openRole.roleId);
      if (!graph.hasNode(taxRoleNodeId)) {
        graph.addNode({
          id: taxRoleNodeId,
          rawId: openRole.role.id,
          type: 'PROFESSIONAL_ROLE',
          label: openRole.role.name,
        });
      }

      // Role -> ROLE_TAXONOMY -> ProfessionalRole
      graph.addEdge({
        source: roleNodeId,
        target: taxRoleNodeId,
        type: 'ROLE_TAXONOMY',
        weight: 1.0,
      });

      // Required Skills
      for (const reqSkill of openRole.requiredSkills) {
        const skillNodeId = GraphBuilderService.toSkillId(reqSkill.skill.id);
        if (!graph.hasNode(skillNodeId)) {
          graph.addNode({
            id: skillNodeId,
            rawId: reqSkill.skill.id,
            type: 'SKILL',
            label: reqSkill.skill.name,
          });
        }
        graph.addEdge({
          source: roleNodeId,
          target: skillNodeId,
          type: 'REQUIRES_SKILL',
          weight: 1.0,
        });
      }

      // Required Tools
      for (const reqTool of openRole.requiredTools) {
        const toolNodeId = GraphBuilderService.toToolId(reqTool.tool.id);
        if (!graph.hasNode(toolNodeId)) {
          graph.addNode({
            id: toolNodeId,
            rawId: reqTool.tool.id,
            type: 'TOOL',
            label: reqTool.tool.name,
          });
        }
        graph.addEdge({
          source: roleNodeId,
          target: toolNodeId,
          type: 'REQUIRES_TOOL',
          weight: 1.0,
        });
      }
    }

    // C. Add Candidates & Capability Edges
    for (const cand of candidates) {
      const candNodeId = GraphBuilderService.toCandId(cand.id);
      const profile = cand.profile;
      const identity = profile?.identity;

      graph.addNode({
        id: candNodeId,
        rawId: cand.id,
        type: 'CANDIDATE',
        label: profile?.displayName || `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim() || cand.username,
        data: {
          username: cand.username,
          experienceYears: profile?.experienceYears ?? null,
          availability: profile?.availability ?? null,
        },
      });

      // 1. Candidate Primary Roles (HAS_ROLE)
      if (identity?.roles) {
        for (const userRole of identity.roles) {
          const taxRoleId = GraphBuilderService.toTaxRoleId(userRole.role.id);
          if (!graph.hasNode(taxRoleId)) {
            graph.addNode({
              id: taxRoleId,
              rawId: userRole.role.id,
              type: 'PROFESSIONAL_ROLE',
              label: userRole.role.name,
            });
          }
          graph.addEdge({
            source: candNodeId,
            target: taxRoleId,
            type: 'HAS_ROLE',
            weight: 1.0,
          });
        }
      }

      // Pre-calculate portfolio mentions for skill/tool depth weighting
      const portfolioItems = profile?.portfolio || [];
      const portfolioSkillsMap = new Map<string, number>();
      const portfolioToolsMap = new Map<string, number>();

      for (const p of portfolioItems) {
        for (const tech of p.technologies || []) {
          const key = tech.toLowerCase().trim();
          portfolioSkillsMap.set(key, (portfolioSkillsMap.get(key) || 0) + 1);
        }
        for (const toolName of p.tools || []) {
          const key = toolName.toLowerCase().trim();
          portfolioToolsMap.set(key, (portfolioToolsMap.get(key) || 0) + 1);
        }
      }

      // 2. Candidate Skills (HAS_SKILL)
      if (identity?.skills) {
        for (const userSkill of identity.skills) {
          const skillNodeId = GraphBuilderService.toSkillId(userSkill.skill.id);
          if (!graph.hasNode(skillNodeId)) {
            graph.addNode({
              id: skillNodeId,
              rawId: userSkill.skill.id,
              type: 'SKILL',
              label: userSkill.skill.name,
            });
          }

          const portCount = portfolioSkillsMap.get(userSkill.skill.name.toLowerCase().trim()) || 0;
          const skillWeight = Number((1.0 + 0.1 * Math.min(5, portCount)).toFixed(2));

          graph.addEdge({
            source: candNodeId,
            target: skillNodeId,
            type: 'HAS_SKILL',
            weight: skillWeight,
          });
        }
      }

      // 3. Candidate Tools (HAS_TOOL)
      if (identity?.tools) {
        for (const userTool of identity.tools) {
          const toolNodeId = GraphBuilderService.toToolId(userTool.tool.id);
          if (!graph.hasNode(toolNodeId)) {
            graph.addNode({
              id: toolNodeId,
              rawId: userTool.tool.id,
              type: 'TOOL',
              label: userTool.tool.name,
            });
          }

          const portCount = portfolioToolsMap.get(userTool.tool.name.toLowerCase().trim()) || 0;
          const toolWeight = Number((1.0 + 0.1 * Math.min(5, portCount)).toFixed(2));

          graph.addEdge({
            source: candNodeId,
            target: toolNodeId,
            type: 'HAS_TOOL',
            weight: toolWeight,
          });
        }
      }

      // 4. Candidate Domain Context (CANDIDATE_CONTEXT)
      if (identity?.gameEngines) {
        for (const ge of identity.gameEngines) {
          const engineNodeId = GraphBuilderService.toEngineId(ge.engine.name);
          if (!graph.hasNode(engineNodeId)) {
            graph.addNode({
              id: engineNodeId,
              rawId: ge.engine.id,
              type: 'GAME_ENGINE',
              label: ge.engine.name,
            });
          }
          graph.addEdge({
            source: candNodeId,
            target: engineNodeId,
            type: 'CANDIDATE_CONTEXT',
            weight: 1.0,
          });
        }
      }

      if (identity?.genres) {
        for (const gn of identity.genres) {
          const genreNodeId = GraphBuilderService.toGenreId(gn.genre.name);
          if (!graph.hasNode(genreNodeId)) {
            graph.addNode({
              id: genreNodeId,
              rawId: gn.genre.id,
              type: 'GENRE',
              label: gn.genre.name,
            });
          }
          graph.addEdge({
            source: candNodeId,
            target: genreNodeId,
            type: 'CANDIDATE_CONTEXT',
            weight: 1.0,
          });
        }
      }

      if (identity?.platforms) {
        for (const pl of identity.platforms) {
          const platformNodeId = GraphBuilderService.toPlatformId(pl.platform.name);
          if (!graph.hasNode(platformNodeId)) {
            graph.addNode({
              id: platformNodeId,
              rawId: pl.platform.id,
              type: 'PLATFORM',
              label: pl.platform.name,
            });
          }
          graph.addEdge({
            source: candNodeId,
            target: platformNodeId,
            type: 'CANDIDATE_CONTEXT',
            weight: 1.0,
          });
        }
      }
    }

    // D. Add Historical Candidate-Candidate Collaboration Edges
    if (historicalCollaborationMap && candidates.length > 1) {
      for (let i = 0; i < candidates.length; i++) {
        const candAId = candidates[i].id;
        const projectsA = historicalCollaborationMap.get(candAId);
        if (!projectsA || projectsA.size === 0) continue;

        for (let j = i + 1; j < candidates.length; j++) {
          const candBId = candidates[j].id;
          const projectsB = historicalCollaborationMap.get(candBId);
          if (!projectsB || projectsB.size === 0) continue;

          let sharedCount = 0;
          for (const pId of projectsA) {
            if (projectsB.has(pId)) sharedCount++;
          }

          if (sharedCount > 0) {
            const collabWeight = Number((1.0 + 0.5 * sharedCount).toFixed(2));
            graph.addEdge({
              source: GraphBuilderService.toCandId(candAId),
              target: GraphBuilderService.toCandId(candBId),
              type: 'PAST_COLLABORATION',
              weight: collabWeight,
            });
          }
        }
      }
    }

    // E. Add Skill & Tool Co-occurrence Edges (Filtered)
    if (skillCooccurrences) {
      for (const co of skillCooccurrences) {
        const nodeA = GraphBuilderService.toSkillId(co.itemAId);
        const nodeB = GraphBuilderService.toSkillId(co.itemBId);
        if (graph.hasNode(nodeA) && graph.hasNode(nodeB)) {
          graph.addEdge({
            source: nodeA,
            target: nodeB,
            type: 'SKILL_COOCCURRENCE',
            weight: co.jaccard,
          });
        }
      }
    }

    if (toolCooccurrences) {
      for (const co of toolCooccurrences) {
        const nodeA = GraphBuilderService.toToolId(co.itemAId);
        const nodeB = GraphBuilderService.toToolId(co.itemBId);
        if (graph.hasNode(nodeA) && graph.hasNode(nodeB)) {
          graph.addEdge({
            source: nodeA,
            target: nodeB,
            type: 'TOOL_COOCCURRENCE',
            weight: co.jaccard,
          });
        }
      }
    }

    return graph;
  }
}
