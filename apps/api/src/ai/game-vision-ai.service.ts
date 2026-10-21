import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenAI, Type } from '@google/genai';

export interface ColorSwatch {
  hex: string;
  name: string;
  role: 'DOMINANT' | 'SECONDARY' | 'ACCENT' | 'HIGHLIGHT' | 'SHADOW';
}

export interface VisualDirectionOutput {
  artStyle: string;
  atmosphere: string;
  lighting: string;
  cameraPerspective: string;
  palette: ColorSwatch[];
  visualKeyElements: string[];
  conceptArtPrompt: string;
  conceptArtUrl?: string | null;
  imageGenerationSupported: boolean;
  generatedAt: string;
}

export interface ProposedLoopStep {
  stepNumber: number;
  phase: string;
  title: string;
  description: string;
  pacing?: string;
}

export interface ProposedGameplayLoopOutput {
  summary: string;
  steps: ProposedLoopStep[];
  generatedAt: string;
}

export interface ProductionPlanTaskDraft {
  tempId: string;
  title: string;
  description: string;
  type: 'FEATURE' | 'SYSTEM' | 'BUG' | 'REFACTOR' | 'DOCS';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  discipline: string;
  dependsOnTempIds?: string[];
}

export interface ProductionPlanFeatureDraft {
  tempId: string;
  name: string;
  description: string;
  discipline: string;
  requiredSkills: string[];
  tasks: ProductionPlanTaskDraft[];
}

export interface ProductionPlanSystemDraft {
  tempId: string;
  name: string;
  description: string;
  discipline: string;
  features: ProductionPlanFeatureDraft[];
}

export interface ProductionPlanDraftOutput {
  summary: string;
  targetMilestoneTitle: string;
  estimatedWeeks: number;
  systems: ProductionPlanSystemDraft[];
  generatedAt: string;
}

export interface BlueprintAiContext {
  projectName: string;
  genre?: string | null;
  platform?: string | null;
  gameEngine?: string | null;
  tagline?: string | null;
  summary?: string | null;
  artStyle?: string | null;
  cameraPerspective?: string | null;
  audioTone?: string | null;
  networkModel?: string | null;
  targetFps?: number | null;
  targetResolution?: string | null;
  coreLoop?: string | null;
  pillars?: Array<{ title: string; description: string }> | null;
  keyFeatures?: Array<{ title: string; description: string; category?: string }> | null;
}

export interface NarrativeAiContext extends BlueprintAiContext {
  section: 'STORY_BIBLE' | 'CHARACTERS' | 'SCENE' | 'QUEST';
  prompt?: string;
  storyBible?: Record<string, any> | null;
  characters?: Array<Record<string, any>> | null;
  existingScenes?: Array<Record<string, any>> | null;
  existingQuests?: Array<Record<string, any>> | null;
}

export interface NarrativeAiOutput {
  section: 'STORY_BIBLE' | 'CHARACTERS' | 'SCENE' | 'QUEST';
  draft: Record<string, any>;
  continuityNotes: string[];
  generatedAt: string;
}

@Injectable()
export class GameVisionAiService {
  private readonly logger = new Logger(GameVisionAiService.name);
  private aiClient: GoogleGenAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.aiClient = new GoogleGenAI({ apiKey });
    } else {
      this.logger.warn(
        'GEMINI_API_KEY is not configured. GameVisionAiService running in deterministic mode.',
      );
    }
  }

  // ==========================================
  // 1. CINEMATIC VISUAL DIRECTION
  // ==========================================

  async generateVisualDirection(
    ctx: BlueprintAiContext,
  ): Promise<VisualDirectionOutput> {
    if (!this.aiClient) {
      return this.fallbackVisualDirection(ctx);
    }

    const prompt = `
Synthesize a cohesive, cinematic visual direction for this game production:
Game Name: ${ctx.projectName}
Genre: ${ctx.genre || 'Action/Adventure'}
Platform: ${ctx.platform || 'PC/Console'}
Engine: ${ctx.gameEngine || 'Unreal Engine / Godot'}
Tagline: ${ctx.tagline || 'Unspecified'}
Summary: ${ctx.summary || 'Unspecified'}
Current Art Style: ${ctx.artStyle || 'Stylized Cinematic'}
Camera Perspective: ${ctx.cameraPerspective || 'Third-Person'}
Design Pillars: ${JSON.stringify(ctx.pillars || [])}
Key Features: ${JSON.stringify(ctx.keyFeatures || [])}

Create a mature, high-end "Filmic Noir & Tactile Minimalist" visual identity with:
1. Detailed Art Style direction (materials, texture feel, fidelity)
2. Atmospheric mood (weather, particle haze, volumetric depth)
3. Cinematic lighting scheme (contrast, key light, fill, rim lighting)
4. Framing & Camera Perspective
5. 5-color aesthetic palette tailored to the world (hex codes, descriptive names, and color roles: DOMINANT, SECONDARY, ACCENT, HIGHLIGHT, SHADOW)
6. 3 to 5 visual focal motifs or elements
7. A prompt for an 8k cinematic concept art render.
`;

    try {
      const response = await this.aiClient.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          systemInstruction:
            'You are an art director for cinematic game productions. Synthesize a visually compelling aesthetic identity.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              artStyle: { type: Type.STRING },
              atmosphere: { type: Type.STRING },
              lighting: { type: Type.STRING },
              cameraPerspective: { type: Type.STRING },
              palette: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    hex: { type: Type.STRING },
                    name: { type: Type.STRING },
                    role: {
                      type: Type.STRING,
                      enum: [
                        'DOMINANT',
                        'SECONDARY',
                        'ACCENT',
                        'HIGHLIGHT',
                        'SHADOW',
                      ],
                    },
                  },
                  required: ['hex', 'name', 'role'],
                },
              },
              visualKeyElements: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              conceptArtPrompt: { type: Type.STRING },
            },
            required: [
              'artStyle',
              'atmosphere',
              'lighting',
              'cameraPerspective',
              'palette',
              'visualKeyElements',
              'conceptArtPrompt',
            ],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');

      // Attempt image generation if supported by provider
      let conceptArtUrl: string | null = null;
      let imageGenerationSupported = false;

      try {
        if (
          this.aiClient.models &&
          typeof (this.aiClient.models as any).generateImages === 'function'
        ) {
          const imgResult = await (this.aiClient.models as any).generateImages({
            model: 'imagen-3.0-generate-002',
            prompt: parsed.conceptArtPrompt,
            config: {
              numberOfImages: 1,
              aspectRatio: '16:9',
            },
          });

          if (imgResult?.generatedImages?.[0]?.image?.imageBytes) {
            conceptArtUrl = `data:image/jpeg;base64,${imgResult.generatedImages[0].image.imageBytes}`;
            imageGenerationSupported = true;
          }
        }
      } catch (imgErr: any) {
        this.logger.log(
          `Image generation provider unavailable (${imgErr.message || 'not supported on tier'}). Returning visual direction with prompt preview.`,
        );
      }

      return {
        artStyle: parsed.artStyle,
        atmosphere: parsed.atmosphere,
        lighting: parsed.lighting,
        cameraPerspective: parsed.cameraPerspective,
        palette: parsed.palette || [],
        visualKeyElements: parsed.visualKeyElements || [],
        conceptArtPrompt: parsed.conceptArtPrompt,
        conceptArtUrl,
        imageGenerationSupported,
        generatedAt: new Date().toISOString(),
      };
    } catch (err: any) {
      this.logger.warn(
        `Gemini error generating visual direction (${err.message}). Using deterministic direction.`,
      );
      return this.fallbackVisualDirection(ctx);
    }
  }

  // ==========================================
  // 2. INTERACTIVE GAMEPLAY LOOP PROPOSAL
  // ==========================================

  async proposeGameplayLoop(
    ctx: BlueprintAiContext,
  ): Promise<ProposedGameplayLoopOutput> {
    if (!this.aiClient) {
      return this.fallbackGameplayLoop(ctx);
    }

    const prompt = `
Analyze this game blueprint and propose a structured 4 to 6 step core gameplay loop:
Game: ${ctx.projectName}
Genre: ${ctx.genre || 'Action'}
Tagline: ${ctx.tagline || 'Unspecified'}
Summary: ${ctx.summary || 'Unspecified'}
Current Loop: ${ctx.coreLoop || 'Unspecified'}
Design Pillars: ${JSON.stringify(ctx.pillars || [])}
Key Features: ${JSON.stringify(ctx.keyFeatures || [])}

Create a tight, repeatable cycle of player agency, challenge, reward, and reinvestment.
Provide a high-level summary and 4 to 6 distinct connected steps in order.
`;

    try {
      const response = await this.aiClient.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          systemInstruction:
            'You are a systems game designer. Propose a compelling, rhythmic core gameplay loop.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              steps: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    stepNumber: { type: Type.INTEGER },
                    phase: { type: Type.STRING },
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    pacing: { type: Type.STRING },
                  },
                  required: ['stepNumber', 'phase', 'title', 'description'],
                },
              },
            },
            required: ['summary', 'steps'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return {
        summary: parsed.summary || 'Core gameplay repeatable cycle',
        steps: (parsed.steps || []).map((s: any, idx: number) => ({
          stepNumber: s.stepNumber || idx + 1,
          phase: (s.phase || 'GAMEPLAY').toUpperCase(),
          title: s.title,
          description: s.description,
          pacing: s.pacing || 'Core repeatable',
        })),
        generatedAt: new Date().toISOString(),
      };
    } catch (err: any) {
      this.logger.warn(
        `Gemini error proposing gameplay loop (${err.message}). Using deterministic loop.`,
      );
      return this.fallbackGameplayLoop(ctx);
    }
  }

  // ==========================================
  // 3. AI PRODUCTION MAP BREAKDOWN
  // ==========================================

  async generateProductionPlan(
    ctx: BlueprintAiContext,
  ): Promise<ProductionPlanDraftOutput> {
    if (!this.aiClient) {
      return this.fallbackProductionPlan(ctx);
    }

    const prompt = `
Analyze this game blueprint and produce a structured production plan breakdown:
Game: ${ctx.projectName}
Engine: ${ctx.gameEngine || 'Godot / Unreal'}
Genre: ${ctx.genre || 'Action'}
Summary: ${ctx.summary || ''}
Pillars: ${JSON.stringify(ctx.pillars || [])}
Features: ${JSON.stringify(ctx.keyFeatures || [])}
Gameplay Loop: ${ctx.coreLoop || ''}

Generate a clear 3-level production plan hierarchy:
1. 3 to 4 Game Systems (e.g. Combat & Encounter Engine, World Traversal, Economy & Inventory)
2. 2 to 3 Features per System (e.g. Character Locomotion, Weapon Recoil, Sector Greyboxing)
3. 2 to 3 Actionable Deliverables/Tasks per Feature (concrete tasks with type, priority, discipline, and optional prerequisite dependsOnTempIds referencing upstream task tempIds).
`;

    try {
      const response = await this.aiClient.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          systemInstruction:
            'You are a technical director and executive game producer. Break game blueprints into clean systems, features, and actionable tasks.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              targetMilestoneTitle: { type: Type.STRING },
              estimatedWeeks: { type: Type.INTEGER },
              systems: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    tempId: { type: Type.STRING },
                    name: { type: Type.STRING },
                    description: { type: Type.STRING },
                    discipline: {
                      type: Type.STRING,
                      enum: ['ENGINEERING', 'ART', 'DESIGN', 'AUDIO'],
                    },
                    features: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          tempId: { type: Type.STRING },
                          name: { type: Type.STRING },
                          description: { type: Type.STRING },
                          discipline: { type: Type.STRING },
                          requiredSkills: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                          },
                          tasks: {
                            type: Type.ARRAY,
                            items: {
                              type: Type.OBJECT,
                              properties: {
                                tempId: { type: Type.STRING },
                                title: { type: Type.STRING },
                                description: { type: Type.STRING },
                                type: {
                                  type: Type.STRING,
                                  enum: [
                                    'FEATURE',
                                    'SYSTEM',
                                    'BUG',
                                    'REFACTOR',
                                    'DOCS',
                                  ],
                                },
                                priority: {
                                  type: Type.STRING,
                                  enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
                                },
                                discipline: { type: Type.STRING },
                                dependsOnTempIds: {
                                  type: Type.ARRAY,
                                  items: { type: Type.STRING },
                                },
                              },
                              required: [
                                'tempId',
                                'title',
                                'description',
                                'type',
                                'priority',
                                'discipline',
                              ],
                            },
                          },
                        },
                        required: [
                          'tempId',
                          'name',
                          'description',
                          'discipline',
                          'requiredSkills',
                          'tasks',
                        ],
                      },
                    },
                  },
                  required: [
                    'tempId',
                    'name',
                    'description',
                    'discipline',
                    'features',
                  ],
                },
              },
            },
            required: [
              'summary',
              'targetMilestoneTitle',
              'estimatedWeeks',
              'systems',
            ],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return {
        summary: parsed.summary || 'Production architecture breakdown',
        targetMilestoneTitle:
          parsed.targetMilestoneTitle || 'Milestone: Alpha Architecture',
        estimatedWeeks: parsed.estimatedWeeks || 8,
        systems: parsed.systems || [],
        generatedAt: new Date().toISOString(),
      };
    } catch (err: any) {
      this.logger.warn(
        `Gemini error generating production plan (${err.message}). Using deterministic fallback.`,
      );
      return this.fallbackProductionPlan(ctx);
    }
  }

  // ==========================================
  // 4. NARRATIVE STUDIO AI ASSISTANT
  // ==========================================

  async proposeNarrativeContent(
    ctx: NarrativeAiContext,
  ): Promise<NarrativeAiOutput> {
    if (!this.aiClient) {
      return this.fallbackNarrativeContent(ctx);
    }

    const continuityContext = {
      project: ctx.projectName,
      genre: ctx.genre || 'Action/Dark Fantasy',
      overview: ctx.summary || ctx.tagline || 'Unspecified',
      storyBible: ctx.storyBible || null,
      knownCharacters: (ctx.characters || []).map((c: any) => ({
        name: c.name,
        role: c.role,
        archetype: c.archetype,
        goal: c.goal,
      })),
      recentScenes: (ctx.existingScenes || []).slice(-2).map((s: any) => ({
        title: s.title,
        slugline: s.slugline,
        summary: s.summary,
      })),
    };

    let structureRequirement = '';
    if (ctx.section === 'CHARACTERS') {
      structureRequirement = `
Return a JSON object conforming strictly to:
{
  "draft": [
    {
      "id": "char-\${Date.now()}",
      "name": "Character Name",
      "archetype": "Archetype (e.g., The Disillusioned Inquisitor)",
      "role": "PROTAGONIST" | "ANTAGONIST" | "SUPPORTING" | "FACTION_LEADER" | "NPC",
      "backstory": "Origin and formative history...",
      "motivation": "Core driving force...",
      "goal": "Immediate objective in the story...",
      "conflict": "Internal or external dilemma...",
      "arc": "Emotional and dramatic trajectory...",
      "relationships": [
        {
          "targetCharacterId": "char-target-id",
          "targetCharacterName": "Target Character Name",
          "relationshipType": "Relationship description",
          "details": "Dramatic tension between them"
        }
      ]
    }
  ],
  "continuityNotes": [
    "Note explaining how this connects to existing factions, themes, or setting rules"
  ]
}`;
    } else if (ctx.section === 'STORY_BIBLE') {
      structureRequirement = `
Return a JSON object conforming strictly to:
{
  "draft": {
    "summary": "High concept world summary...",
    "themes": ["Theme 1", "Theme 2", "Theme 3"],
    "worldLore": "Deep history and cosmic rules...",
    "settingRules": "1. Rule one\\n2. Rule two...",
    "factions": [
      {
        "id": "fac-\${Date.now()}",
        "name": "Faction Name",
        "description": "Faction purpose...",
        "alignment": "Alignment",
        "leader": "Leader Name",
        "ideals": "Core ideology..."
      }
    ],
    "timeline": [
      {
        "id": "era-\${Date.now()}",
        "era": "Era Name",
        "title": "Major Historical Event",
        "description": "What occurred...",
        "impact": "Enduring consequence..."
      }
    ]
  },
  "continuityNotes": ["Continuity connection note 1", "Continuity connection note 2"]
}`;
    } else if (ctx.section === 'SCENE') {
      structureRequirement = `
Return a JSON object conforming strictly to:
{
  "draft": {
    "title": "Scene Title",
    "slugline": {
      "intExt": "INT" | "EXT",
      "location": "LOCATION NAME",
      "timeOfDay": "DAY" | "NIGHT" | "DUSK" | "DAWN"
    },
    "summary": "Brief scene summary...",
    "actionDirections": "Cinematic screenplay prose describing atmosphere and character actions...",
    "dialogueLines": [
      {
        "id": "line-1",
        "characterName": "CHARACTER NAME",
        "parenthetical": "optional direction",
        "dialogue": "Spoken dialogue line..."
      }
    ],
    "notes": "Directorial notes for performance or pacing...",
    "isDraft": true
  },
  "continuityNotes": ["Continuity connection note 1", "Continuity connection note 2"]
}`;
    } else {
      structureRequirement = `
Return a JSON object conforming strictly to:
{
  "draft": [
    {
      "id": "q-node-\${Date.now()}",
      "title": "Quest Stage Title",
      "act": "ACT I / II / III",
      "type": "START" | "CHOICE" | "OBJECTIVE" | "ENDING",
      "description": "Narrative beat description...",
      "choices": [
        {
          "id": "c-1",
          "text": "Player decision text...",
          "consequence": "World or narrative consequence...",
          "targetNodeId": "q-node-next"
        }
      ],
      "objectives": ["Objective 1", "Objective 2"],
      "isDraft": true
    }
  ],
  "continuityNotes": ["Continuity connection note 1", "Continuity connection note 2"]
}`;
    }

    const prompt = `
You are the Lead Narrative Designer and Screenplay Author for the game "${ctx.projectName}".
Target Section to Draft: ${ctx.section}
User Prompt / Goal: ${ctx.prompt || 'Draft compelling, mature narrative material adhering to the established world.'}

CONTINUITY CONTEXT:
${JSON.stringify(continuityContext, null, 2)}

Strictly adhere to the continuity of the established factions, lore rules, character motivations, and prior events.
Do NOT repeat existing character names or existing scene titles verbatim. Invent fresh, dynamic characters, conflicts, or scenes tailored to this specific world and genre.

${structureRequirement}
`;

    try {
      const response = await this.aiClient.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          systemInstruction:
            'You are an award-winning game writer and narrative director. Write cinematic, high-tension game screenplay and lore content.',
          responseMimeType: 'application/json',
        },
      });

      const text = response.text;
      if (!text) {
        return this.fallbackNarrativeContent(ctx);
      }

      const parsed = JSON.parse(text);
      return {
        section: ctx.section,
        draft: parsed.draft || parsed,
        continuityNotes: parsed.continuityNotes || [
          `Derived from ${ctx.projectName} lore and established world factions.`,
          'Maintains character voice and thematic tension.',
        ],
        generatedAt: new Date().toISOString(),
      };
    } catch (err: any) {
      this.logger.warn(
        `Gemini error generating narrative content (${err.message}). Using deterministic fallback.`,
      );
      return this.fallbackNarrativeContent(ctx);
    }
  }

  // ==========================================
  // DETERMINISTIC FALLBACK IMPLEMENTATIONS
  // ==========================================

  private fallbackVisualDirection(
    ctx: BlueprintAiContext,
  ): VisualDirectionOutput {
    return {
      artStyle:
        ctx.artStyle || 'Gritty Cinematic Noir with Industrial Weathering',
      atmosphere:
        'Volumetric dust, cold shadows, low-key lighting with warm amber warning beacons',
      lighting:
        'Chiaroscuro high-contrast, rim-lighting along metallic surfaces, subdued ambient illumination',
      cameraPerspective: ctx.cameraPerspective || 'Third-Person Over-the-Shoulder',
      palette: [
        { hex: '#141312', name: 'Matte Graphite', role: 'DOMINANT' },
        { hex: '#201f1e', name: 'Charcoal Shadow', role: 'SECONDARY' },
        { hex: '#d97706', name: 'Volumetric Amber', role: 'ACCENT' },
        { hex: '#e6e2df', name: 'Aged Bone', role: 'HIGHLIGHT' },
        { hex: '#48473f', name: 'Weathered Bronze', role: 'SHADOW' },
      ],
      visualKeyElements: [
        'Exposed structural bulkheads and hydraulic conduits',
        'Atmospheric amber warning beacons cutting through steam',
        'Distressed tactical armor with modular equipment holsters',
        'Flickering amber CRT terminal screens',
      ],
      conceptArtPrompt: `Cinematic wide-angle establishing shot of ${ctx.projectName}, ${ctx.genre || 'sci-fi action'}, ${ctx.artStyle || 'gritty industrial aesthetic'}, volumetric amber haze, cold graphite surfaces, chiaroscuro lighting, filmic noir, 8k, Unreal Engine 5 render style`,
      conceptArtUrl: null,
      imageGenerationSupported: false,
      generatedAt: new Date().toISOString(),
    };
  }

  private fallbackGameplayLoop(
    ctx: BlueprintAiContext,
  ): ProposedGameplayLoopOutput {
    // If existing coreLoop has arrow steps, parse them!
    if (ctx.coreLoop && ctx.coreLoop.includes('→')) {
      const rawSteps = ctx.coreLoop
        .split('→')
        .map((s) => s.trim())
        .filter(Boolean);
      return {
        summary:
          'Parsed from current game blueprint core gameplay loop specification.',
        steps: rawSteps.map((title, idx) => ({
          stepNumber: idx + 1,
          phase: ['EXPLORATION', 'COMBAT', 'SCAVENGING', 'UPGRADE', 'PROGRESSION'][
            idx % 5
          ],
          title,
          description: `Engage with ${title.toLowerCase()} within the active game world.`,
          pacing: 'Core repeatable',
        })),
        generatedAt: new Date().toISOString(),
      };
    }

    return {
      summary:
        'A balanced loop of sector traversal, tactical machine combat, resource recovery, and modular progression.',
      steps: [
        {
          stepNumber: 1,
          phase: 'EXPLORATION',
          title: 'Navigate & Scout Sectors',
          description:
            'Traverse hazardous environments, analyze environmental clues, and locate resource caches.',
          pacing: '3-5 minutes',
        },
        {
          stepNumber: 2,
          phase: 'ENGAGEMENT',
          title: 'Tactical Combat Encounters',
          description:
            'Engage hostile mechanical adversaries utilizing cover, movement, and weapon abilities.',
          pacing: '2-4 minutes',
        },
        {
          stepNumber: 3,
          phase: 'SCAVENGING',
          title: 'Salvage Critical Components',
          description:
            'Extract power cores, blueprints, and rare crafting alloys from defeated units.',
          pacing: '1-2 minutes',
        },
        {
          stepNumber: 4,
          phase: 'PROGRESSION',
          title: 'Fabricate & Upgrade Arsenal',
          description:
            'Reinvest recovered salvage into tactical mods, shield enhancers, and new capabilities.',
          pacing: 'At Safe Haven',
        },
      ],
      generatedAt: new Date().toISOString(),
    };
  }

  private fallbackProductionPlan(
    ctx: BlueprintAiContext,
  ): ProductionPlanDraftOutput {
    return {
      summary:
        'Comprehensive production breakdown covering core player traversal, tactical combat, environment art, and inventory persistence.',
      targetMilestoneTitle: 'Milestone 1: Core Architecture & Combat Alpha',
      estimatedWeeks: 8,
      systems: [
        {
          tempId: 'sys-1',
          name: 'Player Locomotion & Controller',
          description:
            'Third-person kinematic character movement, camera rig, and responsive collision handling.',
          discipline: 'ENGINEERING',
          features: [
            {
              tempId: 'feat-1-1',
              name: 'Kinematic Movement State Machine',
              description: 'Sprint, crouch, vault, and directional roll.',
              discipline: 'ENGINEERING',
              requiredSkills: ['Gameplay Programming', 'C++ / GDScript'],
              tasks: [
                {
                  tempId: 'task-1-1-1',
                  title: 'Implement 8-way directional locomotion controller',
                  description:
                    'Handle acceleration, braking friction, and slope traversal limits.',
                  type: 'FEATURE',
                  priority: 'CRITICAL',
                  discipline: 'Engineering',
                },
                {
                  tempId: 'task-1-1-2',
                  title: 'Add sprint and stamina depletion curve',
                  description:
                    'Integrate stamina meter with audio cues when exhausted.',
                  type: 'FEATURE',
                  priority: 'HIGH',
                  discipline: 'Engineering',
                  dependsOnTempIds: ['task-1-1-1'],
                },
              ],
            },
          ],
        },
        {
          tempId: 'sys-2',
          name: 'Combat & Adversary Systems',
          description:
            'Hostile unit AI behavior trees, damage calculations, and hit reactions.',
          discipline: 'ENGINEERING',
          features: [
            {
              tempId: 'feat-2-1',
              name: 'Patrol & Aggro AI Behavior Tree',
              description:
                'Vision cone perception, alert states, and combat positioning.',
              discipline: 'ENGINEERING',
              requiredSkills: ['AI Programming', 'Gameplay Programming'],
              tasks: [
                {
                  tempId: 'task-2-1-1',
                  title: 'Build perception manager with sight and sound detection',
                  description:
                    'Units transition from PATROL to SUSPICIOUS upon hearing footfalls.',
                  type: 'SYSTEM',
                  priority: 'HIGH',
                  discipline: 'Engineering',
                },
                {
                  tempId: 'task-2-1-2',
                  title: 'Implement ranged attack telegraph and burst firing',
                  description:
                    'Enemy telegraphs attack with laser aim line before discharging.',
                  type: 'FEATURE',
                  priority: 'HIGH',
                  discipline: 'Engineering',
                  dependsOnTempIds: ['task-2-1-1'],
                },
              ],
            },
          ],
        },
        {
          tempId: 'sys-3',
          name: 'Environment & Atmosphere',
          description:
            'Modular sector greyboxing, trim sheets, and volumetric lighting setup.',
          discipline: 'ART',
          features: [
            {
              tempId: 'feat-3-1',
              name: 'Modular Sector Corridor Kit',
              description:
                'PBR modular wall, ceiling, and bulkhead assets with collision meshes.',
              discipline: 'ART',
              requiredSkills: ['3D Modeling', 'Environment Art', 'Level Design'],
              tasks: [
                {
                  tempId: 'task-3-1-1',
                  title: 'Model modular corridor greybox kit with grid snapping',
                  description:
                    'Create 4m x 4m snapped wall, corner, and doorway meshes.',
                  type: 'FEATURE',
                  priority: 'HIGH',
                  discipline: 'Art',
                },
                {
                  tempId: 'task-3-1-2',
                  title: 'Author industrial PBR trim sheet and weathering masks',
                  description:
                    'Normal maps, roughness, and metalness for steel bulkheads.',
                  type: 'FEATURE',
                  priority: 'MEDIUM',
                  discipline: 'Art',
                  dependsOnTempIds: ['task-3-1-1'],
                },
              ],
            },
          ],
        },
      ],
      generatedAt: new Date().toISOString(),
    };
  }

  private fallbackNarrativeContent(
    ctx: NarrativeAiContext,
  ): NarrativeAiOutput {
    if (ctx.section === 'STORY_BIBLE') {
      return {
        section: 'STORY_BIBLE',
        draft: {
          summary: `Set in the ruined realm of ${ctx.projectName}, where ancient vows bound humanity to elemental embers before the great cataclysm.`,
          themes: [
            'The Burdens of Inherited Vows',
            'Corruption of Sacred Institutions',
            'Sacrifice in the Shadow of Inevitable Ruin',
          ],
          worldLore: `Long before the ash blighted the valleys, the High Citadel reigned under the Oath of Embers. Now, ancient ward-stones crumble, releasing primordial horrors from the abyssal rift beneath the cathedral foundation.`,
          settingRules: `The Rule of the Ember: Divine magic requires physical blood sacrifice and ritual silver vessels. Ash-Rot: Extended exposure to the blighted mist corrupts living flesh into brittle petrified stone.`,
          factions: [
            {
              id: 'fac-1',
              name: 'The Ashen Concord',
              description: 'Fanatical paladins and scholars guarding the dying central flame.',
              alignment: 'Lawful Neutral',
              leader: 'Lord Commander Vaelin',
              ideals: 'Duty above survival; preserving the ancient covenant at any mortal cost.',
            },
            {
              id: 'fac-2',
              name: 'The Eclipse Vanguard',
              description: 'Outcast knights and mercenaries seeking to extinguish the ember to free humanity from the eternal curse.',
              alignment: 'Chaotic Neutral',
              leader: 'Lyra the Heretic',
              ideals: 'Freedom through final collapse; breaking the cycle of sacrifice.',
            },
            {
              id: 'fac-3',
              name: 'The Hollowed Coven',
              description: 'Sorcerers harvesting crystallized ash from fallen demigods.',
              alignment: 'Neutral Evil',
              leader: 'Arch-Seer Morvath',
              ideals: 'Ascension through consumption of divine relic cores.',
            },
          ],
          timeline: [
            {
              id: 'era-1',
              era: 'The Dawn of Embers',
              title: 'The Great Binding Treaty',
              description: 'The seven warring kingdoms swear blood fealty to the Prime Warden.',
              impact: 'Formed the central cathedral and established the Holy Citadel.',
            },
            {
              id: 'era-2',
              era: 'The Shattered Bell',
              title: 'The Heresy of the Eclipse',
              description: 'The second son of the Prime Warden detonates the sacred bell-tower, releasing the petrifying ash veil.',
              impact: 'Plunged the valleys into eternal twilight; extinguished 5 of the 6 sacred braziers.',
            },
            {
              id: 'era-3',
              era: 'The Present Dying Age',
              title: 'The Gathering of the Ashen Oath',
              description: 'Factions clash over the final dying flame as the rift widens.',
              impact: 'Sets the stage for the player’s awakening at the chasm precipice.',
            },
          ],
        },
        continuityNotes: [
          'Anchored to the dark fantasy tone and design pillars of the game.',
          'Establishes explicit moral conflict between the Concord and the Vanguard.',
        ],
        generatedAt: new Date().toISOString(),
      };
    }

    if (ctx.section === 'CHARACTERS') {
      return {
        section: 'CHARACTERS',
        draft: [
          {
            id: 'char-1',
            name: 'Lord Commander Vaelin',
            archetype: 'The Tragic Zealot',
            role: 'FACTION_LEADER',
            backstory: 'Former hero of the Bell Tower siege, now carrying the petrifying ash in his left arm.',
            motivation: 'Uphold the oath made to his dying sovereign, even if it burns the realm to ash.',
            goal: 'Secure the last consecrated flame crucible before the eclipse.',
            conflict: 'His loyalty demands the execution of his daughter, Lyra, who leads the rebellion.',
            arc: 'From rigid religious dogma to agonizing reckoning with the cost of fanaticism.',
            relationships: [
              {
                targetCharacterId: 'char-2',
                targetCharacterName: 'Lyra the Heretic',
                relationshipType: 'Estranged Daughter & Arch-Nemesis',
                details: 'Loves her deeply, but is bound by sacred oath to execute her on sight.',
              },
            ],
          },
          {
            id: 'char-2',
            name: 'Lyra the Heretic',
            archetype: 'The Rebellious Visionary',
            role: 'PROTAGONIST',
            backstory: 'Discovered the hidden truth in the catacombs: the flame does not protect the people, it feeds on their souls.',
            motivation: 'Dismantle the sacrificial apparatus and liberate the survivors from divine servitude.',
            goal: 'Infiltrate the sanctum sanctorum and shatter the sacred kiln.',
            conflict: 'To destroy the flame, she must slay the father who raised her.',
            arc: 'From bitter outcast seeking revenge to compassionate leader bearing the burden of tomorrow.',
            relationships: [
              {
                targetCharacterId: 'char-1',
                targetCharacterName: 'Lord Commander Vaelin',
                relationshipType: 'Father & Adversary',
                details: 'Seeks to make him see the truth before the final blade is drawn.',
              },
            ],
          },
          {
            id: 'char-3',
            name: 'The Cinder Herald',
            archetype: 'The Enigmatic Broker',
            role: 'SUPPORTING',
            backstory: 'A wandering blind scholar bearing a chest of silver mirrors that reflect the dead.',
            motivation: 'Preserve the memories of the fallen before all truth turns to ash.',
            goal: 'Guide the player through the labyrinthine ruins.',
            conflict: 'Refuses to pick a side in the civil war, making both factions distrust him.',
            arc: 'Reveals himself to be the original author of the oath that doomed the kingdom.',
            relationships: [],
          },
        ],
        continuityNotes: [
          'Interlocks with the Ashen Concord vs Eclipse Vanguard faction conflict.',
          'Establishes direct familial dramatic stakes between Vaelin and Lyra.',
        ],
        generatedAt: new Date().toISOString(),
      };
    }

    if (ctx.section === 'SCENE') {
      return {
        section: 'SCENE',
        draft: {
          id: `scene-${Date.now()}`,
          sceneNumber: (ctx.existingScenes?.length || 0) + 1,
          title: 'Confrontation at the Sunken Gate',
          slugline: {
            intExt: 'EXT',
            location: 'SUNKEN GATE - CATHEDRAL PERIPHERY',
            timeOfDay: 'DUSK',
          },
          summary: 'Vaelin intercepts Lyra as she prepares to breach the outer sanctum.',
          actionDirections: 'Volumetric ash falls like gray snow over the shattered stone ramparts. In the courtyard below, dead knights lie encased in dark crystalline stone. LORD COMMANDER VAELIN stands alone atop the frozen archway, his greatsword planted into the mortar. Wind tears at his tattered white tabard.',
          dialogueLines: [
            {
              id: 'line-1',
              characterName: 'LORD COMMANDER VAELIN',
              parenthetical: 'voice heavy with exhaustion, gaze fixed on the abyss',
              dialogue: 'Three bells toll for the lost, Lyra. You count among them today.',
            },
            {
              id: 'line-2',
              characterName: 'LYRA',
              parenthetical: 'stepping from the shadow of the collapsed buttress, hand on her hilt',
              dialogue: 'The bells were cast from lies, Father. The flame you starve for is an engine of slaughter.',
            },
            {
              id: 'line-3',
              characterName: 'LORD COMMANDER VAELIN',
              parenthetical: 'drawing the greatsword; sparks shower across the stone',
              dialogue: 'Then let it consume us both. For the Oath.',
            },
          ],
          notes: 'Cinematic establishing scene introducing the personal stakes between protagonist and antagonist.',
          isDraft: true,
        },
        continuityNotes: [
          'Maintains dialogue formatting conforming to screenplay standards.',
          'Directly reflects the relationship and conflict defined in Character Codex.',
        ],
        generatedAt: new Date().toISOString(),
      };
    }

    // Default: QUEST
    return {
      section: 'QUEST',
      draft: [
        {
          id: 'q-node-1',
          title: 'The Awakening at the Chasm',
          act: 'ACT I: THE DYING COALS',
          type: 'START',
          description: 'The protagonist regains consciousness on the edge of the Sunken Chasm as ash falls from the shattered bell-tower.',
          choices: [
            {
              id: 'c-1',
              text: 'Investigate the sounds of battle at the Sunken Gate',
              consequence: 'Aligns player immediately with Lyra’s vanguard forces; triggers early combat with Concord sentries.',
              targetNodeId: 'q-node-2',
            },
            {
              id: 'c-2',
              text: 'Seek shelter in the catacombs of the Cinder Herald',
              consequence: 'Unlocks forbidden lore regarding the origin of the flame; avoids early bloodshed.',
              targetNodeId: 'q-node-3',
            },
          ],
          objectives: [
            'Recover the fractured silver dagger from the stone altar',
            'Survive the ash-rot squall',
          ],
          isDraft: true,
        },
        {
          id: 'q-node-2',
          title: 'The Gate Breach',
          act: 'ACT I: THE DYING COALS',
          type: 'CHOICE',
          description: 'Vaelin’s forces have barricaded the iron doors. Lyra requests explosive alchemical brimstone to breach the portcullis.',
          choices: [
            {
              id: 'c-3',
              text: 'Detonate the gate charges and force entry',
              consequence: 'Breaches sanctum quickly, but collapses ancient reliquary containing civilian refugees.',
              targetNodeId: 'q-node-4',
            },
            {
              id: 'c-4',
              text: 'Scale the ruined aqueduct to open the gate from within',
              consequence: 'Stealth approach preserves refugee shelter; grants rare Concord tactical armor.',
              targetNodeId: 'q-node-5',
            },
          ],
          objectives: [
            'Secure the perimeter around the battering ram',
            'Defeat Concord Justiciar Brant',
          ],
          isDraft: true,
        },
        {
          id: 'q-node-3',
          title: 'The Catacomb Revelations',
          act: 'ACT I: THE DYING COALS',
          type: 'OBJECTIVE',
          description: 'The Cinder Herald reveals ancient mirrors containing memories of the Sovereign’s final sacrifice.',
          choices: [
            {
              id: 'c-5',
              text: 'Confront Lord Commander Vaelin with the truth',
              consequence: 'Opens diplomatic resolution path for Act II.',
              targetNodeId: 'q-node-5',
            },
          ],
          objectives: [
            'Decipher the inscriptions on the 3 silver mirrors',
            'Synthesize the antitoxin draught',
          ],
          isDraft: true,
        },
        {
          id: 'q-node-4',
          title: 'Ashen Ruin Ending: The Ash Ascendant',
          act: 'ACT III: THE ECLIPSE',
          type: 'ENDING',
          description: 'The flame is extinguished, leaving humanity in terrifying freedom beneath an indifferent universe.',
          choices: [],
          objectives: ['Survive the long winter of the realm'],
          isDraft: true,
        },
        {
          id: 'q-node-5',
          title: 'Concord Ending: The Perpetual Crucible',
          act: 'ACT III: THE ECLIPSE',
          type: 'ENDING',
          description: 'The protagonist ascends the throne, taking the sovereign’s place as the living fuel for the embers.',
          choices: [],
          objectives: ['Offer mortal blood to rekindle the sun'],
          isDraft: true,
        },
      ],
      continuityNotes: [
        'Directly reflects the player choice dilemma between the two warring factions.',
        'Provides distinct narrative branching leading to divergent endgame resolutions.',
      ],
      generatedAt: new Date().toISOString(),
    };
  }
}
