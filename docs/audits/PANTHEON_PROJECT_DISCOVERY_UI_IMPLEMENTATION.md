# Pantheon Project Discovery UI Implementation

**Audit and Implementation Report**  
**Phase:** Project Discovery UI  
**Status:** Complete & Verified  

---

## 1. Executive Summary

This feature implements the complete **Pantheon Project Discovery UI**, delivering a production-grade catalog for game studios, indie developers, and talent to explore active game productions across the platform.

The implementation strictly reuses Pantheon's existing backend endpoints (`GET /projects/public` and `GET /taxonomy/*`), avoiding redundant controllers, services, or data models. The discovery interface conforms to the **Cinematic Artisan** design system (warm charcoal/matte graphite `#141312`, `#201f1e`, `#2b2a29`, aged silver `#ccc6bc`, and muted warm accents) without blue/purple saturation or cluttered layouts.

---

## 2. Existing APIs Reused & Enriched

Instead of creating duplicate endpoints, the existing public catalog route was leveraged and enriched with optional query filters:

### 1. `GET /projects/public`
- **Reused Endpoint:** `GET /projects/public` (Public route, no JWT required).
- **Security & Authorization:** Strictly enforces database-level condition `moderationStatus: ProjectModerationStatus.PUBLISHED`. Draft, rejected, and unmoderated projects are omitted at the database layer.
- **Query Parameters Added:**
  - `search?: string` — Case-insensitive multi-field search over project `name`, `description`, `genre`, and `gameEngine`.
  - `genre?: string` — Filter projects matching genre taxonomy (ignores `'ALL'`).
  - `platform?: string` — Filter projects matching platform taxonomy (ignores `'ALL'`).
- **Enriched Metadata:**
  - `founder`: Includes founder profile info (`id`, `username`, `displayName`, `avatarUrl`).
  - `openRoles`: Includes up to 4 open role previews (`role.name`, `experienceLevel`, `commitment`).
  - `openRoleCount`: Total number of open recruitment roles currently seeking talent.
  - `teamSize`: Count of active team members.

### 2. `GET /taxonomy/genres` & `GET /taxonomy/platforms`
- Reused existing taxonomy endpoints via `fetchTaxonomyCategory('genres')` and `fetchTaxonomyCategory('platforms')` to dynamically populate filter dropdowns with actual platform taxonomy choices, with safe fallbacks.

---

## 3. Frontend Architecture & Components

### 1. `DiscoverProjectsView` (`apps/web/src/features/projects/components/DiscoverProjectsView.tsx`)
- Central reusable discovery component.
- **Controls & Search Bar:**
  - Debounced-feel search input with an instant clear button.
  - Genre taxonomy dropdown with active filter counter.
  - Platform taxonomy dropdown.
  - Toggle pill for **"Actively Recruiting"** (filters productions seeking team members).
  - Clear all filters button with dynamic count indicators.
- **States:**
  - **Loading:** Six pulsing skeleton cards matching the exact layout of project cards.
  - **Empty:** Distinguishes between zero search/filter results (with a "Clear all filters" CTA) and platform-wide empty catalog (with a "Create a Project" CTA for founders).
  - **Error:** Graceful error banner with a "Try Again" retry action.
- **Responsive Grid:** 1-column on mobile, 2-column on tablet/laptop, 3-column on desktop (`max-w-7xl`).

### 2. `DiscoverProjectCard` (`apps/web/src/features/projects/components/DiscoverProjectCard.tsx`)
- Card component adhering to Cinematic Artisan aesthetics.
- Features:
  - Cover image with fallback studio gradient banner.
  - Project status badge (`ACTIVE`, `IN_DEVELOPMENT`, etc.).
  - Project title and 2-line truncated description.
  - Metadata chips: Genre, Platform, and Game Engine.
  - Open recruitment roles indicator displaying up to 2 specific role tags (e.g. "Concept Artist", "Gameplay Programmer") with "+X more" overflow.
  - Founder avatar + name and active team member count.
  - Direct link navigating to the canonical project detail page (`/projects/:id`).

### 3. Dedicated Route & Dual Layout (`apps/web/src/pages/DiscoverProjectsPage.tsx`)
- Route: `/discover` (registered in `apps/web/src/App.tsx`).
- Adapts to user authentication context:
  - If authenticated, renders seamlessly inside `<DashboardLayout>` with persistent sidebar and notifications.
  - If guest/unauthenticated, renders within public `<Navbar>` and `<Footer>`.

### 4. Navigation & Existing Action Integration
- **Sidebar (`apps/web/src/features/dashboard/components/Sidebar.tsx`):** Added `Discover` navigation item with `Compass` icon pointing to `/discover`.
- **Navbar (`apps/web/src/components/Navbar.tsx`):** Added `Discover` link to top desktop navigation and mobile drawer.
- **Dashboard Projects Section (`apps/web/src/features/dashboard/components/DashboardProjectsSection.tsx`):** Linked the previously unlinked "Explore Public Projects" button in empty dashboard states directly to `/discover`.
- **Projects Hub (`apps/web/src/pages/ProjectsPage.tsx`):** Integrated a dual-tab switcher between "Discover Studios" (`DiscoverProjectsView`) and "My Productions" (`DashboardProjectsSection`).

---

## 4. Design System Compliance (Cinematic Artisan)

- **Colors:**
  - Background & Surface: `#141312`, `#1c1b1a`, `#201f1e`, `#2b2a29`.
  - Borders: `#2b2a29`, `#363433`, `#48473f`.
  - Text: Ivory/Bone (`#e6e2df`), Muted Gray (`#cac6bc`), Bronze Accent (`#bdb8ae`, `#66645c`).
  - No saturated blue, purple, or neon tones.
- **Typography:**
  - Display & Headlines: `Manrope` with cinematic tracking.
  - Technical Labels & Chips: `JetBrains Mono` / monospace.
  - Body: `Hanken Grotesk` / sans.
- **Shapes & Depth:**
  - Rounded corners (`rounded-xl` for cards, `rounded-lg` for inputs).
  - Subtle edge borders, inner vignettes, and gentle hover micro-interactions.

---

## 5. Verification & Test Results

### 1. Backend Automated Tests (`apps/api/src/projects/projects.service.spec.ts`)
Added comprehensive unit test suite covering:
- Strict moderation status filtering (`moderationStatus = PUBLISHED`).
- Case-insensitive search across name, description, genre, and gameEngine.
- Genre filtering and ignoring `'ALL'`.
- Platform filtering and ignoring `'ALL'`.
- Founder and open roles preview inclusion.

```
PASS src/projects/projects.service.spec.ts
PASS src/projects/project-repository.service.spec.ts
PASS src/database/cascade-hardening.spec.ts
PASS src/tasks/tasks.service.spec.ts
PASS src/auth/auth.service.spec.ts
...
Test Suites: 25 passed, 25 total
Tests:       338 passed, 338 total
```

### 2. Builds
- **Backend (`nest build`):** Succeeded with exit code 0.
- **Frontend (`tsc -b && vite build`):** Succeeded with exit code 0.

### 3. Linting
- **Frontend (`eslint` on modified files):** 0 errors, 0 warnings.
- **Backend (`eslint` on modified controller/DTO/spec files):** 0 errors, 0 warnings.

---

## 6. Files Changed & Created

### Backend (`apps/api`)
- `src/projects/projects.dto.ts` — Added `PublicProjectRolePreviewDto`, extended `DashboardProjectDto`.
- `src/projects/projects.service.ts` — Updated `getPublicProjects` with query filtering and metadata enrichment.
- `src/projects/projects.controller.ts` — Extended `@Get('public')` with `@Query('genre')` and `@Query('platform')`.
- `src/projects/projects.service.spec.ts` — Added 6 test cases for public project catalog discovery.

### Frontend (`apps/web`)
- `src/features/projects/types.ts` — Added `PublicProjectRolePreview` and updated `DashboardProjectItem`.
- `src/features/projects/services/projectService.ts` — Updated `fetchPublicProjects` with query params and avatar handling.
- `src/features/projects/components/DiscoverProjectCard.tsx` — Created discovery project card component.
- `src/features/projects/components/DiscoverProjectsView.tsx` — Created complete filter, search, and catalog view.
- `src/pages/DiscoverProjectsPage.tsx` — Created dedicated page supporting both authenticated and guest layouts.
- `src/pages/ProjectsPage.tsx` — Added tabbed view between public discovery and user productions.
- `src/features/dashboard/components/Sidebar.tsx` — Added Discover navigation entry.
- `src/features/dashboard/components/DashboardProjectsSection.tsx` — Connected discovery CTA link.
- `src/components/Navbar.tsx` — Added Discover navigation link.
- `src/App.tsx` — Registered `/discover` route.

---

## 7. Limitations & Future Scope

1. **Server-Side Pagination:**
   - Currently `getPublicProjects` returns all published matching projects. If the platform scales past hundreds of public studios, standard cursor or offset pagination (`page`, `limit`) can be added to the query DTO.
2. **Bookmarking / Saved Studios:**
   - A future phase can allow users to star/bookmark public studios to track them directly from the discovery view.
