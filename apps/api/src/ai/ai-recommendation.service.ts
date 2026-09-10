import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { GoogleGenAI, Type } from '@google/genai';
import type { ProjectRoleCommitment, ProjectRoleExperienceLevel} from '@prisma/client';

export interface TaxonomyItemRef {
  id: string;
  name: string;
  description?: string | null;
}

export interface ProjectContextInput {
  name: string;
  description: string;
  genre?: string | null;
  platform?: string | null;
  gameEngine?: string | null;
  status: string;
  existingRoleNames: string[];
}

export interface RawAiRecommendationOutput {
  roleId: string;
  title?: string;
  description?: string;
  experienceLevel?: string;
  commitment?: string;
  skillIds?: string[];
  toolIds?: string[];
  reasoning?: string;
}

export interface ValidatedAiRecommendation {
  roleId: string;
  roleName: string;
  title?: string | null;
  description?: string | null;
  experienceLevel: ProjectRoleExperienceLevel;
  commitment: ProjectRoleCommitment;
  skillIds: string[];
  toolIds: string[];
  requiredSkills: { id: string; name: string }[];
  requiredTools: { id: string; name: string }[];
  reasoning: string;
}

@Injectable()
export class AiRecommendationService {
  private readonly logger = new Logger(AiRecommendationService.name);
  private aiClient: GoogleGenAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.aiClient = new GoogleGenAI({ apiKey });
    } else {
      this.logger.warn('GEMINI_API_KEY is not configured in environment variables.');
    }
  }

  async generateRoleRecommendations(
    project: ProjectContextInput,
    rolesTaxonomy: TaxonomyItemRef[],
    skillsTaxonomy: TaxonomyItemRef[],
    toolsTaxonomy: TaxonomyItemRef[],
  ): Promise<ValidatedAiRecommendation[]> {
    if (!this.aiClient) {
      this.logger.warn('Gemini client not configured. Using deterministic taxonomy recommendation engine.');
      return this.generateFallbackRecommendations(project, rolesTaxonomy, skillsTaxonomy, toolsTaxonomy);
    }

    const rolesListStr = rolesTaxonomy
      .map((r) => `- ID: "${r.id}" | Name: "${r.name}"`)
      .join('\n');
    const skillsListStr = skillsTaxonomy
      .slice(0, 100)
      .map((s) => `- ID: "${s.id}" | Name: "${s.name}"`)
      .join('\n');
    const toolsListStr = toolsTaxonomy
      .slice(0, 100)
      .map((t) => `- ID: "${t.id}" | Name: "${t.name}"`)
      .join('\n');

    const prompt = `
Analyze the following game production project and recommend 2-4 critical open roles needed for team formation.

=== GAME PROJECT METADATA ===
Title: ${project.name}
Description: ${project.description}
Stage: ${project.status}
Genre: ${project.genre || 'Unspecified'}
Platform: ${project.platform || 'Unspecified'}
Game Engine: ${project.gameEngine || 'Unspecified'}
Already Existing Roles on Team: ${
      project.existingRoleNames.length > 0
        ? project.existingRoleNames.join(', ')
        : 'None'
    }

=== MANDATORY TAXONOMY RULES ===
1. You MUST ONLY select roleId from the Recognized Professional Roles list below.
2. You MUST ONLY select skillIds from the Recognized Skills list below.
3. You MUST ONLY select toolIds from the Recognized Tools list below.
4. DO NOT invent fake UUIDs or raw text names for roleId, skillIds, or toolIds.

=== RECOGNIZED PROFESSIONAL ROLES ===
${rolesListStr}

=== RECOGNIZED SKILLS ===
${skillsListStr}

=== RECOGNIZED TOOLS ===
${toolsListStr}
`;

    const maxRetries = 2;
    let responseText: string | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.aiClient.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: prompt,
          config: {
            systemInstruction:
              'You are an expert game studio production lead and talent director. Recommend 2 to 4 distinct open roles required for the game project. Strictly reference provided database taxonomy IDs.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                recommendedRoles: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      roleId: { type: Type.STRING },
                      title: { type: Type.STRING },
                      description: { type: Type.STRING },
                      experienceLevel: {
                        type: Type.STRING,
                        enum: ['JUNIOR', 'MID', 'SENIOR', 'LEAD'],
                      },
                      commitment: {
                        type: Type.STRING,
                        enum: ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'REV_SHARE'],
                      },
                      skillIds: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                      },
                      toolIds: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                      },
                      reasoning: { type: Type.STRING },
                    },
                    required: [
                      'roleId',
                      'description',
                      'experienceLevel',
                      'commitment',
                      'reasoning',
                    ],
                  },
                },
              },
              required: ['recommendedRoles'],
            },
          },
        });

        responseText = response.text;
        break; // Success, exit retry loop
      } catch (err: any) {
        const isCapacityError =
          err.status === 503 ||
          err.status === 429 ||
          err.message?.includes('503') ||
          err.message?.includes('high demand') ||
          err.message?.includes('UNAVAILABLE') ||
          err.message?.includes('RESOURCE_EXHAUSTED');

        if (isCapacityError && attempt < maxRetries) {
          this.logger.warn(
            `Gemini API high demand (attempt ${attempt}/${maxRetries}). Retrying in 1.5s...`,
          );
          await new Promise((resolve) => setTimeout(resolve, 1500));
          continue;
        }

        this.logger.warn(
          `Gemini API unavailable or errored (${err.message}). Falling back to studio taxonomy recommendation heuristics.`,
        );
        return this.generateFallbackRecommendations(project, rolesTaxonomy, skillsTaxonomy, toolsTaxonomy);
      }
    }

    if (!responseText) {
      return this.generateFallbackRecommendations(project, rolesTaxonomy, skillsTaxonomy, toolsTaxonomy);
    }

    try {
      const parsed = JSON.parse(responseText);
      const rawRoles: RawAiRecommendationOutput[] =
        parsed.recommendedRoles || [];

      // STRICT BACKEND VALIDATION GUARD
      const validated: ValidatedAiRecommendation[] = [];

      const roleMap = new Map(rolesTaxonomy.map((r) => [r.id, r.name]));
      const skillMap = new Map(skillsTaxonomy.map((s) => [s.id, s.name]));
      const toolMap = new Map(toolsTaxonomy.map((t) => [t.id, t.name]));

      for (const item of rawRoles) {
        // Validate roleId exists in taxonomy
        const matchedRoleName = roleMap.get(item.roleId);
        if (!matchedRoleName) {
          this.logger.warn(
            `AI returned invalid roleId: "${item.roleId}". Skipping recommendation.`,
          );
          continue;
        }

        // Filter valid skillIds
        const validSkillIds = (item.skillIds || []).filter((id) =>
          skillMap.has(id),
        );
        const requiredSkills = validSkillIds.map((id) => ({
          id,
          name: skillMap.get(id)!,
        }));

        // Filter valid toolIds
        const validToolIds = (item.toolIds || []).filter((id) =>
          toolMap.has(id),
        );
        const requiredTools = validToolIds.map((id) => ({
          id,
          name: toolMap.get(id)!,
        }));

        // Validate enums
        const expLevel = (
          ['JUNIOR', 'MID', 'SENIOR', 'LEAD'].includes(
            item.experienceLevel || '',
          )
            ? item.experienceLevel
            : 'MID'
        ) as ProjectRoleExperienceLevel;

        const commitment = (
          ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'REV_SHARE'].includes(
            item.commitment || '',
          )
            ? item.commitment
            : 'PART_TIME'
        ) as ProjectRoleCommitment;

        validated.push({
          roleId: item.roleId,
          roleName: matchedRoleName,
          title: item.title || matchedRoleName,
          description: item.description || null,
          experienceLevel: expLevel,
          commitment,
          skillIds: validSkillIds,
          toolIds: validToolIds,
          requiredSkills,
          requiredTools,
          reasoning:
            item.reasoning ||
            `Recommended based on ${project.name} studio needs.`,
        });
      }

      return validated;
    } catch (parseErr: any) {
      this.logger.error('Failed to parse AI output:', parseErr);
      return this.generateFallbackRecommendations(project, rolesTaxonomy, skillsTaxonomy, toolsTaxonomy);
    }
  }

  generateFallbackRecommendations(
    project: ProjectContextInput,
    rolesTaxonomy: TaxonomyItemRef[],
    skillsTaxonomy: TaxonomyItemRef[],
    toolsTaxonomy: TaxonomyItemRef[],
  ): ValidatedAiRecommendation[] {
    const existingSet = new Set(project.existingRoleNames.map((n) => n.toLowerCase()));
    const availableRoles = rolesTaxonomy.filter((r) => !existingSet.has(r.name.toLowerCase()));

    const preferredKeywords = [
      'Programmer',
      'Designer',
      'Artist',
      'Technical',
      'Writer',
      'Audio',
    ];

    const selectedRoles: TaxonomyItemRef[] = [];
    for (const kw of preferredKeywords) {
      const matched = availableRoles.find((r) => r.name.toLowerCase().includes(kw.toLowerCase()));
      if (matched && !selectedRoles.some((s) => s.id === matched.id)) {
        selectedRoles.push(matched);
        if (selectedRoles.length >= 3) break;
      }
    }

    if (selectedRoles.length === 0) {
      selectedRoles.push(...availableRoles.slice(0, 3));
    }

    const fallbackRecommendations: ValidatedAiRecommendation[] = [];

    for (const r of selectedRoles) {
      const skills = skillsTaxonomy.slice(0, 2).map((s) => ({ id: s.id, name: s.name }));
      const tools = toolsTaxonomy.slice(0, 2).map((t) => ({ id: t.id, name: t.name }));

      let reasoning = `Recommended to establish core production foundations for ${project.name} during the ${project.status.toLowerCase().replace('_', ' ')} phase.`;
      if (r.name.toLowerCase().includes('prog')) {
        reasoning = `Given that ${project.name} is in ${project.status.toLowerCase().replace('_', ' ')} phase using ${project.gameEngine || 'standard game engine technology'}, this role is critical to engineer and test responsive gameplay mechanics.`;
      } else if (r.name.toLowerCase().includes('art')) {
        reasoning = `High-priority visual asset creation and art pipelines are needed to establish the visual world and visual benchmark.`;
      } else if (r.name.toLowerCase().includes('design')) {
        reasoning = `Essential to design levels, encounters, and core gameplay progression for ${project.genre || 'this title'}.`;
      }

      fallbackRecommendations.push({
        roleId: r.id,
        roleName: r.name,
        title: r.name,
        description: `Key contributor responsible for ${r.name.toLowerCase()} deliverables on ${project.name}.`,
        experienceLevel: 'MID' as ProjectRoleExperienceLevel,
        commitment: 'FULL_TIME' as ProjectRoleCommitment,
        skillIds: skills.map((s) => s.id),
        toolIds: tools.map((t) => t.id),
        requiredSkills: skills,
        requiredTools: tools,
        reasoning,
      });
    }

    return fallbackRecommendations;
  }
}
