# Pantheon Phase 0.3 — Game Blueprint Implementation Report

**Status:** Complete  
**Date:** September 29, 2026  
**Scope:** Planning layer integration connecting Game Idea → Game Blueprint → AI Skill/Team Analysis → Talent Recommendations → Team Formation.

---

## 1. Database Schema Changes

A dedicated 1:1 `GameBlueprint` model was added to `apps/api/prisma/schema.prisma` related to `Project`.

### Prisma Model Definition
```prisma
model GameBlueprint {
  id                String   @id @default(uuid())
  projectId         String   @unique
  tagline           String?  @db.VarChar(280)
  targetAudience    String?  @db.VarChar(500)
  cameraPerspective String?  @db.VarChar(100)
  artStyle          String?  @db.VarChar(100)
  audioTone         String?  @db.VarChar(200)
  networkModel      String?  @db.VarChar(100)
  targetFps         Int?     @default(60)
  targetResolution  String?  @default("1080p") @db.VarChar(50)
  coreLoop          String?  @db.Text
  summary           String?  @db.Text
  pillars           Json?
  keyFeatures       Json?
  targetSpecs       Json?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([projectId])
}
```

### Cascade & Integrity Guarantees
- **1:1 Relation:** `projectId` is `@unique`.
- **Cascade Behavior:** `onDelete: Cascade` ensures project deletion removes its associated Game Blueprint.
- **Compatibility:** `blueprint GameBlueprint?` is optional on `Project`. Existing projects continue working with `blueprint = null`.

---

## 2. Prisma Migration

- **Migration Folder:** `apps/api/prisma/migrations/20260929030000_add_game_blueprint/`
- **Migration SQL:** `migration.sql`
- **Verification:**
  - `pnpm prisma validate`: Validated schema syntax and relations.
  - `pnpm prisma generate`: Updated Prisma Client (v6.19.3).
  - `pnpm prisma migrate diff`: Verified 0 schema drift (`No difference detected`).
  - Recorded in `_prisma_migrations` without resetting database.

---

## 3. Backend Architecture & Endpoints

Following the architecture rules (Controller → Service → Repository/Prisma), the blueprint subsystem was implemented in:
- `apps/api/src/projects/blueprint/game-blueprint.dto.ts`
- `apps/api/src/projects/blueprint/game-blueprint.service.ts`
- `apps/api/src/projects/blueprint/game-blueprint.controller.ts`
- Registered in `apps/api/src/projects/projects.module.ts`

### API Endpoints
1. `GET /projects/:projectId/blueprint`
   - Retrieves the blueprint for a project. Returns `null` if no blueprint has been created yet.
   - Public access permitted if the project is published (`PUBLISHED` or legacy active state).
   - Restricted to founder, team members, or platform admins if the project is unapproved/draft.
2. `PUT /projects/:projectId/blueprint`
   - Upserts the 1:1 blueprint record for the project.
   - Founder-only restriction enforced using `ProjectAuthorizationService.assertFounder(projectId, userId)`.

### Validation & Limits
- Standardized DTOs using `class-validator` and `class-transformer`:
  - `tagline`: Max 280 characters.
  - `targetAudience`: Max 500 characters.
  - `targetFps`: Integer between 15 and 360.
  - `pillars`: Array of structured objects (`{ title: string, description: string }`), max 4 design pillars.
  - `keyFeatures`: Array of structured objects (`{ name: string, description: string, category?: string }`), max 20 features.
  - `targetSpecs`: Key-value object for engine/platform specifications.

---

## 4. AI Recommendation Pipeline Integration

The AI team recommendation system was enriched with blueprint specifications without altering the deterministic talent matching engine:
- **Service Modified:** `apps/api/src/ai/ai-recommendation.service.ts`
- **Caller Modified:** `apps/api/src/projects/projects.service.ts` (`generateAiRoleRecommendations`)
- **Key Enhancements:**
  1. `ProjectContextInput` extended with optional `blueprint?: GameBlueprintContextInput | null`.
  2. Gemini prompt includes structured `=== GAME BLUEPRINT SPECIFICATIONS ===`:
     - Tagline & Target Audience
     - Camera Perspective & Art Style
     - Audio Tone & Network Model
     - Target Performance (FPS, Resolution)
     - Core Gameplay Loop
     - Design Pillars & Deliverable Key Features
  3. Domain-specific role heuristics:
     - Multiplayer / Dedicated server → Network Gameplay Programmer / Backend Systems.
     - Stylized 3D / Realistic 3D → 3D Environment Artist, Technical Artist, Shader Specialist.
     - Procedural generation / Physics features → Core Gameplay Engineer, Tools Engineer.
  4. Heuristic Fallback Engine: Updated to extract keywords from blueprint features/pillars when external AI is offline.
  5. Backward Compatibility: If blueprint is absent or null, existing recommendation prompt and fallback logic run unaltered.

---

## 5. Frontend Implementation

Integrated cleanly into the project workspace in accordance with the `Cinematic Artisan` design system:
- **Types:** `apps/web/src/features/projects/types.ts` (`GameBlueprint`, `GamePillar`, `GameFeature`, `UpsertGameBlueprintInput`).
- **Service:** `apps/web/src/features/projects/services/blueprintService.ts` (`fetchGameBlueprint`, `upsertGameBlueprint`).
- **Components:**
  - `BlueprintTab.tsx`: Displays tagline, creative & technical specs, core gameplay loop, design pillars, and key features. Includes founder edit button and empty state action.
  - `EditBlueprintModal.tsx`: Modal allowing founders to configure creative directions, technical target performance, pillars, and deliverables.
- **Routing & Tabs:**
  - `apps/web/src/pages/ProjectDetailPage.tsx`: Added `'blueprint'` tab (`Overview | Blueprint | Team | Tasks | Repo | Builds | Playtests | Applications`) with `Compass` icon.

---

## 6. Test Suite & Validation Results

### Backend Unit & Integration Tests
Created dedicated specification suite: `apps/api/src/projects/blueprint/game-blueprint.service.spec.ts` covering:
1. Blueprint creation and default values.
2. Blueprint retrieval for published projects.
3. Access control: unapproved projects restricted to authorized users.
4. Blueprint upsert (creation and update).
5. Non-founder rejection on PUT (403 Forbidden).
6. Unauthorized user rejection on GET (403 Forbidden).
7. Validation rejection on invalid inputs (FPS < 15, > 4 pillars, invalid types).
8. AI recommendation integration with blueprint context.
9. AI recommendation compatibility when blueprint is absent.
10. Fallback heuristic domain role extraction from blueprint pillars and specs.

### Full Test Suite
- `pnpm --filter api test`: **24 test suites passed, 321 tests passed (0 failures)**.

### Build & Lint Validation
- `pnpm --filter api exec eslint src/projects/blueprint/ src/projects/projects.module.ts`: Clean (0 errors, 0 warnings).
- `pnpm --filter web exec eslint src/features/projects/types.ts src/features/projects/services/blueprintService.ts src/features/projects/components/blueprint/BlueprintTab.tsx src/features/projects/components/blueprint/EditBlueprintModal.tsx src/pages/ProjectDetailPage.tsx`: Clean (0 errors, 0 warnings).
- `pnpm --filter api run build`: Clean (`nest build` completed with 0 errors).
- `pnpm --filter web build`: Clean (`tsc -b && vite build` completed with 0 errors).
- `pnpm prisma validate`: Clean (`The schema at prisma\schema.prisma is valid 🚀`).
- `pnpm prisma migrate diff`: Clean (`No difference detected`).

---

## 7. Deferred Items & Scope Boundary Adherence

In accordance with Phase 0.3 constraints:
- **No GDD Editor:** Blueprint remains a structured specification layer rather than a rich-text document authoring tool.
- **No Versioning:** Blueprint version history and branching deferred.
- **No Overview Card:** Overview tab remains untouched; blueprint is accessed via the dedicated Blueprint tab.
- **AI Advisory Boundary:** AI provides recommendations only; it does not automatically create roles or mutate projects.
