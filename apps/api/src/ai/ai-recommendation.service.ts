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
      throw new ServiceUnavailableException(
        'Gemini AI service is not configured (missing GEMINI_API_KEY environment variable).',
      );
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

        this.logger.error('Error generating AI role recommendations:', err);

        if (isCapacityError) {
          throw new ServiceUnavailableException(
            'AI recommendation service is temporarily experiencing high demand. Please try again in a few moments.',
          );
        }

        throw new ServiceUnavailableException(
          `Failed to generate AI role recommendations: ${err.message || 'Unknown error'}`,
        );
      }
    }

    if (!responseText) {
      return [];
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
      return [];
    }
  }
}
