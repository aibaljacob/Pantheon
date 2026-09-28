# Pantheon Product Completeness & Real-World Workflow Audit

**Date:** September 28, 2026  
**Auditor:** Senior Product Architect, Game Production Workflow Designer, Backend & Security Auditor  
**Scope:** Complete Pantheon Codebase (`apps/api`, `apps/web`, `prisma/schema.prisma`)  
**Status:** Complete / Authoritative Audit Report  

---

## 1. Executive Summary

### 1.1 Overall Workflow Assessment
Pantheon has built an impressive foundation for collaborative game studio workflows. Unlike generic project management tools, it integrates genuine native game development primitives: Native Bare Git over Smart HTTP with Personal Access Tokens (PAT), an asynchronous Build Runner daemon for game compiling, a Playtest session and feedback collection mechanism, and a talent matching engine combining heuristic scoring, HIN graph Random Walk with Restart (RWR), and Gemini LLM role recommendations.

However, the platform currently suffers from **critical lifecycle gaps** and **broken closed loops**:
1. **Broken Game Lifecycle Loop:** The loop from Playtest Feedback → Bug Task → Git Commit → New Build → Retest → Verification is one-way. Feedback can spawn a Task, but task completion does not update the feedback, cannot trigger retesting, and has no linkage to fix commits or new builds.
2. **Missing Game Blueprint Layer:** There is virtually no game design, blueprint, or game architecture planning layer. A project is only defined by a short string description, genre, platform, and engine. Detailed game design documents (GDD), target specs, gameplay mechanics, and art direction do not exist.
3. **Severe Security Hole in Build Runner Registration:** The build runner registration endpoint is completely unauthenticated. Any anonymous actor on the internet can register a runner, claim build jobs for any project on the platform, access proprietary game source code, and upload arbitrary build artifacts.
4. **Public Exposure of Game Artifacts & Resumes:** The API statically serves `/uploads` publicly without authorization. Any private build ZIP or user resume can be downloaded by anyone if the filename is known or guessed.
5. **Cascading Destruction of Projects:** If a founder deletes their account, the database cascades and destroys the entire studio project, all member contributions, task histories, builds, and playtests.

### 1.2 Whether Pantheon is Logically Coherent
**Partially.** The core identity—an AI-assisted collaborative game production suite—is solid and respected by the team. The backend strictly follows `Controller → Service → Repository → Prisma`, the frontend implements a clean Zustand workspace cache with tab-level isolation, and the AI acts as an advisor without autonomous agent overreach. However, several modules exist in isolation:
- Public project discovery exists in the backend (`/projects/public`), but the frontend has zero UI to display it, trapping new users in an empty dashboard.
- Git Smart HTTP extracts commit messages and creates `TaskCommitLink` records, but neither the API nor the frontend ever exposes or displays these links on tasks.
- Notifications are defined for 12 lifecycle events in Prisma, but only 4 are ever generated in backend code, leaving founders blind to new applications and developers blind to build results.

### 1.3 Strongest Parts
- **Native Bare Git & Smart HTTP Architecture:** Autoritative on-disk bare Git repositories, streaming `git cat-file --batch`, batched tree lookups, and scoped PAT authentication (`repo:read`, `repo:write`).
- **Talent Matching & Team Formation:** Graph-based Random Walk with Restart (RWR) combined with deterministic taxonomy matching and Gemini AI role generation.
- **Frontend Workspace Caching:** Pass 1 Zustand architecture with strict tab-level caching, mutation invalidation, and project-scoped isolation.
- **Authorization Enforcement on Tasks and Git:** Strict role-based checks for active members, founders, and administrators; removed or former members are rigorously locked out of private Git reads and task updates.

### 1.4 Weakest Parts
- **QA & Bug Lifecycle:** No QA verification, severity-vs-priority distinction, retesting state machine, or commit/build verification linkage.
- **Task Scheduling & Dependencies:** Tasks have no due dates, no task types (Bug, Feature, Asset, Audio), no dependency tree (`blockedBy`), and no block reasons.
- **Project Discovery:** New users cannot browse or find projects to join.
- **Project Ownership & Lifecycle Management:** No project archiving, no ownership transfer, and no read-only state for completed/paused projects.

### 1.5 Biggest Missing Layer
**The Game Blueprint & Architecture Layer.** Game production starts with game design—core loop, mechanics, narrative, art bible, target framerate/hardware specs, and scope. Today, Pantheon jumps directly from a 200-character project description to AI role recommendations.

### 1.6 Biggest Security Concern
**Unauthenticated Build Runner Registration & Global Job Claiming (`POST /build-runners/register`).** Anyone on the internet can register as a build runner without credentials, claim private repository build jobs, steal source code, and upload malicious executables directly to the studio's playable build repository.

### 1.7 Biggest UX Concern
**The "Dead-End Dashboard" for Non-Founders.** When a new developer registers on Pantheon, they see "No active projects yet" and a button "Explore Projects" linking to `/dashboard#discover`—which is completely unhandled. The `/projects` page only shows their own projects. A developer has literally no way in the UI to discover open projects or apply to open roles unless given an out-of-band direct URL.

---

## 2. Current Implemented Workflow

```text
                        ┌──────────────────────────────────────────────┐
                        │              AUTHENTICATION                  │
                        │ Register (Local/Google) → Verify Email (SMTP)│
                        │        Login → JWT + AuthSession (Cache)     │
                        └──────────────────────┬───────────────────────┘
                                               │
                                               ▼
                        ┌──────────────────────────────────────────────┐
                        │             DEVELOPER PROFILE                │
                        │ Edit Bio, Social Links, Identity (Taxonomies)│
                        │ Upload Resume/Portfolio (Static Disk Files)  │
                        └──────────────────────┬───────────────────────┘
                                               │
               ┌───────────────────────────────┴───────────────────────────────┐
               ▼                                                               ▼
┌───────────────────────────────┐                             ┌───────────────────────────────┐
│     AS APPLICANT / TALENT     │                             │          AS FOUNDER           │
│ Browse Projects [DISCONNECTED]│                             │ Create Project (Name, Slug,   │
│ Direct Link: /projects/:id    │                             │  Description, Engine, Genre)  │
│ View Open Roles               │                             │ Moderation: PENDING_REVIEW    │
│ Submit Application (Message)  │                             └───────────────┬───────────────┘
└──────────────┬────────────────┘                                             │
               │                                                              ▼
               │                                              ┌───────────────────────────────┐
               │                                              │      AI ROLE RECOMMENDER      │
               │                                              │ Gemini 3.6 Flash analyzes     │
               │                                              │  context vs taxonomies        │
               │                                              │ Founder approves & edits roles│
               │                                              └───────────────┬───────────────┘
               │                                                              │
               │                                                              ▼
               │                                              ┌───────────────────────────────┐
               │                                              │       TALENT MATCHING         │
               │                                              │ RWR Graph + Taxonomies rank   │
               │                                              │  candidates                   │
               │                                              │ Founder sends Invitations     │
               │                                              └───────────────┬───────────────┘
               │                                                              │
               ▼                                                              ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       TEAM FORMATION                                        │
│  - Candidate accepts Invitation  ───► Becomes ACTIVE ProjectMember                          │
│  - Founder accepts Application   ───► Role status becomes FILLED                            │
│  (Founder can Remove Member / Member can Leave → status becomes LEFT/REMOVED, tasks wiped)  │
└──────────────────────────────────────────────┬──────────────────────────────────────────────┘
                                               │
                                               ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    PRODUCTION PLANNING                                      │
│  - Founder/Admin creates Milestones (with Due Dates)                                        │
│  - Founder/Admin creates Tasks (TODO, IN_PROGRESS, IN_REVIEW, BLOCKED, DONE)                │
│  - Member assigned to Task (Receives Notification)                                          │
│  (NO Task due dates, NO task types, NO dependency tree, NO block reason)                    │
└──────────────────────────────────────────────┬──────────────────────────────────────────────┘
                                               │
                                               ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                      GIT DEVELOPMENT                                        │
│  - Developer generates Personal Access Token (PAT with repo:read, repo:write)               │
│  - Clones from /repos/:slug.git via Git Smart HTTP Basic Auth                               │
│  - Pushes commit with message "[TASK-12] Added movement controller"                        │
│  - Git Smart HTTP ingests commit, extracts TASK-ID, writes TaskCommitLink in DB             │
│  (TaskCommitLink is NEVER displayed in UI or returned by Task API)                          │
└──────────────────────────────────────────────┬──────────────────────────────────────────────┘
                                               │
                                               ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       BUILD PIPELINE                                        │
│  - Founder or Member clicks "Trigger Build" in Web UI (Status: QUEUED)                      │
│  - Global Build Runner daemon polls /build-runners/jobs/claim                               │
│  - Runner clones repository, compiles game project on Windows/Mac/Linux                     │
│  - Runner uploads ZIP artifact to /build-runners/jobs/:id/artifacts                         │
│  - Backend saves ZIP to local disk /uploads/ and registers PlayableBuild                    │
│  (Runner registration is completely UNPROTECTED; builds served over public static HTTP)     │
└──────────────────────────────────────────────┬──────────────────────────────────────────────┘
                                               │
                                               ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                         PLAYTESTING                                         │
│  - Founder creates PlaytestSession tied to PlayableBuild (Instructions, Start/End Date)     │
│  - Team members download build from public static URL                                       │
│  - Member submits PlaytestFeedback (Title, Description, Severity, Specs, Commit)            │
│  (NO external tester invitations, NO tester approval, NO private playtest access control)   │
└──────────────────────────────────────────────┬──────────────────────────────────────────────┘
                                               │
                                               ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                      BUG / QA LIFECYCLE                                     │
│  - Founder clicks "Convert to Task" on PlaytestFeedback                                     │
│  - Backend creates new Task (Status: TODO, Priority from Severity)                          │
│  - Feedback status set to CONVERTED_TO_TASK                                                 │
│  ─────────────────────────────────── DEAD END ───────────────────────────────────────────── │
│  - Task completion DOES NOT resolve feedback                                                │
│  - No retesting state, no verification workflow, no link to fix commit or subsequent build  │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Core User Journeys Detailed Analysis

### Journey A — New User → Founder
| Step | Implementation State | Finding | Impact |
|:---|:---|:---|:---|
| **Register & Login** | Exists Completely | Verified email requirement via token, secure bcrypt password hashing, JWT sessions with 30s in-memory cache and Redis-free concurrency. | Robust |
| **Complete Profile** | Exists Completely | User profile supports basic bio, avatar, banner, professional identity (roles, specializations, skills, tools, engines, genres, platforms), work experience, education, and portfolio links. | Comprehensive |
| **Upload Resume / Portfolio** | Exists Partially | Uploads files to disk storage and saves metadata. | Functional storage |
| **AI Profile Extraction** | **Genuinely Missing** | Resume uploads are stored as raw static files. No OCR, text parsing, or LLM extraction is performed. The user must manually input all skills and experience. | High friction onboarding |
| **Discover Projects** | **Broken in Frontend** | Backend has `GET /projects/public?search=...`, but the frontend `fetchPublicProjects` is never rendered. The dashboard links to `/dashboard#discover` (dead end). | User cannot find projects |
| **Create Project** | Exists Completely | Founder inputs name, slug, description, genre, platform, engine. Project defaults to `PENDING_REVIEW` moderation status. | Works cleanly |
| **AI Project Analysis & Roles** | Exists Completely | Gemini 3.6 Flash analyzes title, description, stage, engine, and existing team roles against database taxonomy IDs. Returns 2–4 validated roles with rationale. Human founder explicitly approves or rejects roles. | High quality |
| **Talent Recommendations** | Exists Completely | Multi-objective scoring combining role alignment, skill overlap, tool overlap, and RWR graph co-occurrence across existing studio teams. | State-of-the-art |
| **Founder Review & Invite** | Exists Completely | Founder can filter candidates, inspect match breakdown, and send formal invitations with custom messages. Duplicate pending invitations for the same role are blocked. | Robust |
| **Candidate Accepts** | Exists Completely | Atomic transaction updates invitation to `ACCEPTED`, sets role to `FILLED`, assigns member, and creates `ProjectMember`. | Clean |

---

### Journey B — Project Planning (The "Game Blueprint" Layer)
*Question: What does this game actually contain?*

- **Current Implementation:** The `Project` model contains only: `name`, `slug`, `description` (plain text), `genre` (single string), `platform` (single string), `gameEngine` (single string), `status` (enum).
- **Audit Findings:**
  1. **No Game Blueprint Entity:** There is no concept of a Game Blueprint, Game Design Document (GDD), Art Bible, or Technical Architecture document.
  2. **No Production Scope:** There is no field or structure for Target Resolution/Framerate, Minimum PC Specs, Gameplay Mechanics List, Narrative Summary, or Budget/Timeline Scope.
  3. **No Project Goals / Key Pillars:** Game studios rely on 3–4 "Design Pillars" to guide development decisions. These cannot be recorded anywhere.
- **Classification:** **P1 (Necessary)** — A game production platform without a Game Blueprint forces indie studios to keep their actual design documents in Google Docs or Notion, undermining Pantheon as the production source of truth.

---

### Journey C — Team Formation
| Lifecycle Event | Backend Code | Database State | Authorization / Behavior |
|:---|:---|:---|:---|
| **Duplicate Membership** | Blocked | `@@unique([projectId, userId])` | Throws `BadRequestException` if user is already an active member. |
| **Duplicate Invitations** | Blocked | Checked in service query | Prevents multiple `PENDING` invitations to the same user for the same role. |
| **Invitation Rejection** | Complete | Updates status to `REJECTED` | Role remains `OPEN`. Candidate can be reinvited later. |
| **Invitation Expiration** | **Missing** | No `expiresAt` column | Invitations never expire. A 6-month-old invitation can be accepted at any time. |
| **Member Removal** | Complete | Updates status to `REMOVED` | Reopens role, clears assigned member, unassigns tasks, revokes Git write access. |
| **Member Leaving** | Complete | Updates status to `LEFT` | Handled identically to removal. |
| **Historical Attribution** | **Flawed** | Sets `task.assigneeId = null` | **Data Loss:** When a member leaves, all completed tasks lose their assignee. Studio loses track of who built what. |
| **Founder Leaving** | Blocked | Enforced in service | Founder cannot leave project. |
| **Ownership Transfer** | **Genuinely Missing** | No endpoint or logic | A founder cannot hand off leadership or transfer ownership to a co-founder or lead developer. |

---

### Journey D — Production Planning (Tasks & Milestones)
*Question: Can a real game producer understand what is blocking development?*

- **Current Implementation:**
  - `Milestone`: Title, description, due date (`dueDate`), `isCompleted`. Linked to tasks and builds.
  - `Task`: `taskNumber`, `title`, `description`, `status` (`BACKLOG`, `TODO`, `IN_PROGRESS`, `IN_REVIEW`, `BLOCKED`, `DONE`), `priority` (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), `assigneeId`, `milestoneId`.
- **Gaps Discovered:**
  1. **No Task Due Dates:** Tasks cannot have deadlines. Only the parent milestone has a due date.
  2. **No Task Types:** No way to differentiate a Bug, Feature, 3D Asset, Sound Effect, Animation, or Level Design task.
  3. **No Dependency Tracking:** A task can be marked `BLOCKED`, but there is no `blockedByTaskId` or dependency array. A producer cannot see *what* is blocking the task or *who* is responsible for unblocking it.
  4. **No Block Reason:** No field to describe why a task is blocked.
  5. **No Discussion / Comments:** Developers cannot leave notes, design clarifications, or asset attachments on tasks.
  6. **No Task History:** No audit trail of status changes or reassignments.
- **Classification:** **P1 (Necessary)** for Dependencies, Block Reason, and Task Types; **P2 (Strong Improvement)** for Comments and History.

---

### Journey E — Git Development
- **Authentication & Security:** Uses Personal Access Tokens (PAT) with `pht_` prefix, hashed with bcrypt, supporting `repo:read` and `repo:write` scopes. Scopes and active project membership are verified before allowing operations.
- **Native Bare Git Engine:** Repositories are stored as native bare Git repos on the server (`/repos/:slug.git`). Reads are performed via streaming `git ls-tree` and batched `git cat-file --batch`.
- **Push Pipeline & Task Linkage:**
  - Git Smart HTTP inspects pushed commits using `git log`.
  - Parses commit messages for `TASK-(\d+)` (e.g., `[TASK-4] Fix jump glitch`).
  - Matches author email to Pantheon user and creates `TaskCommitLink` records.
- **Critical Disconnect:**
  - `TaskCommitLink` is stored in the database, but **NEVER returned by any Task API** (`TaskResponseDto` omits it) and **NEVER rendered in the frontend**. The developer pushes a commit expecting it to link to their task card, but it remains invisible.
- **Branch Protection & Code Review:**
  - `RepoBranch.isProtected` exists in the schema, but is **completely ignored** by `git-receive-pack`. Any active member can force-push or commit directly to `main`.
  - Pull Requests, Code Reviews, and Web-based file editing throw `NotImplementedException('Repository mutation via API is disabled in Phase 3A.')`.
- **Scope Assessment:** Pull Requests and web editing are **P3/P4** (indie game devs push binary assets, scenes, and code via Git CLI / Git LFS directly). However, displaying `TaskCommitLink` on task cards is **P1**.

---

### Journey F — Build Pipeline
- **Runner Architecture:** Standalone daemon running on build machines (Windows, Mac, Linux). Heartbeats every 30s. Claims jobs via `POST /build-runners/jobs/claim`.
- **Critical Vulnerability (P0):**
  - `POST /build-runners/register` has **no authentication guard**. Anyone can register a runner.
  - Runners have no `projectId` or `tenantId`. A rogue runner will be handed build jobs for private, proprietary studio projects.
- **Storage & Memory Vulnerability (P0):**
  - Runner uploads ZIP artifacts via Multer `FileInterceptor('file')`.
  - Artifact is buffered entirely into memory (`file.buffer`) before writing to disk. A 10GB game build will cause an immediate Node.js process Out-Of-Memory (OOM) crash.
  - Artifacts are saved to `/uploads/build_*.zip` and served over unauthenticated static HTTP. Anyone can download proprietary builds.
- **Failure Path Trace:**
  - If a build fails, runner calls `PATCH /build-runners/jobs/:id/status` with `FAILED` and logs.
  - Status is updated in DB.
  - **Dead End:** No notification is sent to the developer who triggered the build (`BUILD_FAILED` is never triggered). There is no "Retry Build" button in the UI.

---

### Journey G — Playtesting
- **Current Flow:** Founder creates a `PlaytestSession` pointing to a `PlayableBuild`. Title, instructions, and dates are saved.
- **The "External Tester" Problem:**
  - There is **no Tester entity, relation, or invitation model**.
  - A playtest can only be accessed by existing active studio team members (or by anyone if the project is public).
  - An indie studio *cannot* invite 20 private external alpha/beta testers without making them full members of the game project (which gives them repository and task access!).
- **Playtest Instructions:** Supported in database (`instructions` column) and rendered in UI.
- **Build Download:** Download link points directly to the static `/uploads/` file.

---

### Journey H — Bug / QA Lifecycle
*Question: Does Pantheon support a realistic bug lifecycle?*

```text
Feedback Submitted ──► Converted to Task ──► Task Marked DONE ──► DEAD END
  (status: OPEN)     (status: CONVERTED)        (status: DONE)   (Feedback status never updates)
                                                                 (No retest verification)
                                                                 (No linked fix commit)
                                                                 (No linked verified build)
```

- **Step-by-step Trace:**
  1. Tester submits `PlaytestFeedback` (Title, Description, Severity, System Specs, Commit Hash).
  2. Founder clicks "Convert to Task".
  3. Backend creates a Task (`status: TODO`, mapped priority), links `convertedTaskId`, and marks feedback as `CONVERTED_TO_TASK`.
  4. Developer fixes the bug and marks Task as `DONE`.
  5. **Broken Loop:**
     - The feedback status remains permanently `CONVERTED_TO_TASK`.
     - The reporter is not notified that a fix was attempted.
     - There is no `READY_FOR_RETEST` or `VERIFIED` state.
     - The fix commit cannot be recorded on the bug.
     - The new build containing the fix cannot be associated with the feedback.
     - The tester cannot verify or reopen the bug.
- **Classification:** **P1 (Necessary)** — Closing the QA loop is essential for game production credibility.

---

### Journey I — Project Health & AI Insights
- **What Data AI Actually Receives:**
  Project title, description, status stage, genre, platform, engine, existing team role names, and active database taxonomies.
- **AI Stored State & Staleness:**
  AI recommendations are persisted to `Project.savedAiRecommendations` (JSON). When roles are added, they are filtered out. However, there is no timestamp (`generatedAt`) stored with the recommendations, making it impossible to tell how old the advice is.
- **Hallucination Protection:**
  Strong. Uses Gemini structured JSON output (`responseSchema`) requiring strict database taxonomy IDs. AI cannot invent invalid roles or skills.
- **Human Agency:**
  100% preserved. AI only drafts recommendations; founder must explicitly click "Create Role" or "Dismiss".
- **Missing Project Health Telemetry:**
  Pantheon has no project health analysis. It cannot compute sprint velocity, overdue tasks, blocked task counts, commit frequency, or build failure rates. `ProductionProgressCard` only calculates simple percentage: `completedTasks / totalTasks * 100`.

---

### Journey J — Project Completion / End of Life
- **Missing Project States:**
  No `ARCHIVED`, `CANCELLED`, or `ABANDONED` statuses exist in `ProjectStatus`.
- **No Enforcement of COMPLETED / PAUSED:**
  Setting status to `COMPLETED` or `PAUSED` has zero effect on permissions. Developers can continue pushing code, creating tasks, and triggering builds indefinitely.
- **Catastrophic Account Deletion Cascade (P0):**
  `User.foundedProjects` has `onDelete: Cascade`. If a founder deletes their account, the entire Project, Git repository metadata, Milestones, Tasks, Builds, and Playtests are deleted permanently.
- **No Ownership Transfer:**
  A founder who departs cannot transfer project ownership to a successor.

---

## 4. Cross-Cutting Systems Audit

### 4.1 Authentication & Session Management
- **Password & Token Security:** Secure bcrypt hashing, crypto-random tokens, SHA-256 token hashing for verification and reset.
- **Session Cache:** Bounded 30-second TTL LRU cache with in-flight request deduplication. Invalidation on logout and password reset works cleanly.
- **Account Disabling / Deletion:**
  There is no `isActive` or `isBanned` flag on the `User` model. An administrator cannot suspend a malicious user without direct database deletion.

### 4.2 Authorization / IDOR Matrix

| Resource | Operation | Founder | Active Member | Removed/Left | Anonymous | Administrator | Security Assessment |
|:---|:---|:---:|:---:|:---:|:---:|:---:|:---|
| **Project** | Read (Published) | Allowed | Allowed | Allowed | Allowed | Allowed | Safe |
| **Project** | Read (Unpublished)| Allowed | Allowed | **Blocked (404)**| **Blocked (404)**| Allowed | Safe |
| **Project** | Update Details | Allowed | Blocked (403)| Blocked (403) | Blocked (401) | Allowed | Safe |
| **Tasks** | View | Allowed | Allowed | **Blocked (403)**| **Blocked (401)**| Allowed | Safe |
| **Tasks** | Create / Delete | Allowed | Blocked (403)| Blocked (403) | Blocked (401) | Allowed | Safe |
| **Tasks** | Status Update | Allowed | Assignee only| Blocked (403) | Blocked (401) | Allowed | Safe |
| **Git Repo**| Smart HTTP Clone | Allowed | Allowed | **Blocked (403)**| **Blocked (401)**| Allowed | Safe |
| **Git Repo**| Smart HTTP Push | Allowed | Allowed | **Blocked (403)**| **Blocked (401)**| Allowed | Safe |
| **Builds** | Trigger | Allowed | Allowed | Blocked (403) | Blocked (401) | Allowed | Safe |
| **Build Runner**| Register | **ANYONE**| **ANYONE** | **ANYONE** | **ANYONE (NO AUTH)**| Allowed | **VULNERABLE (P0)** |
| **Build Artifacts**| Download ZIP| **ANYONE**| **ANYONE** | **ANYONE** | **ANYONE (PUBLIC HTTP)**| Allowed | **VULNERABLE (P0)** |
| **Feedback**| Convert to Task | Allowed | Blocked (403)| Blocked (403) | Blocked (401) | Allowed | Safe |

### 4.3 Notification System Matrix

| Event | In Schema Enum? | Generated in Code? | Frontend Display? | Action Link Navigation | Read State Handled? |
|:---|:---:|:---:|:---:|:---|:---:|
| **INVITATION_RECEIVED** | Yes | Yes (`project-invitations`) | Yes | Navigates to `/dashboard#invitations` | Yes |
| **APPLICATION_ACCEPTED**| Yes | Yes (`project-applications`) | Yes | Navigates to `/projects/:id` | Yes |
| **APPLICATION_REJECTED**| Yes | Yes (`project-applications`) | Yes | Informational toast | Yes |
| **APPLICATION_RECEIVED**| **NO** | **NO** (Founder not notified)| N/A | N/A | N/A |
| **TASK_ASSIGNED** | Yes | Yes (`tasks.service`) | Yes | **BROKEN URL** (`/projects/<taskId>`) | Yes |
| **ADDED_TO_PROJECT** | Yes | **NO** | N/A | N/A | N/A |
| **REMOVED_FROM_PROJECT**| Yes | **NO** | N/A | N/A | N/A |
| **PROJECT_ROLE_CHANGED**| Yes | **NO** | N/A | N/A | N/A |
| **BUILD_SUCCEEDED** | Yes | **NO** | N/A | N/A | N/A |
| **BUILD_FAILED** | Yes | **NO** | N/A | N/A | N/A |
| **PLAYABLE_BUILD_CREATED**| Yes | **NO** | N/A | N/A | N/A |
| **FEEDBACK_SUBMITTED** | Yes | **NO** | N/A | N/A | N/A |
| **FEEDBACK_CONVERTED_TO_TASK**| Yes | **NO** | N/A | N/A | N/A |

### 4.4 Global Search Audit
- **Current Coverage:** Searches projects (where user is founder or member), tasks in those projects, project roles in those projects, and user profiles.
- **Search Gaps:**
  1. Cannot search public projects to discover and join.
  2. Cannot search open roles across the platform for job seekers.
  3. Cannot search Git commits, branches, or code.
  4. Cannot search Playtests or QA feedback.

### 4.5 Empty, Error, and Edge State Handling
- **Workspace Tabs (Team, Tasks, Builds, Playtests, Repo):** Clean skeleton loaders, empty state graphics, and error boundaries.
- **Project Detail 404/403:** Clean "Project Unavailable" message with "Back to Projects" button.
- **Dead Link in Dashboard:** "Explore Projects" links to `/dashboard#discover` which renders standard dashboard instead of discoverable projects.

---

## 5. Data Consistency & Schema Integrity Audit

1. **Catastrophic Cascading Deletes:**
   - `Project.founderId` → `User` with `onDelete: Cascade`. Deleting a founder deletes the entire studio project and all child records.
   - `BuildJob.triggeredById` → `User` with `onDelete: Cascade`. Deleting a user deletes all builds they ever triggered.
   - `PlaytestFeedback.reporterId` → `User` with `onDelete: Cascade`. Deleting a tester deletes all their bug reports.
   *Remediation Required:* Change relations to `onDelete: Restrict` or `onDelete: SetNull` with a designated historical retention policy.
2. **Historical Task Attribution Wipe:**
   - In `project-members.service.ts`, when a member leaves, `task.updateMany` sets `assigneeId: null` for all tasks, including tasks marked `DONE`.
   *Remediation Required:* Only unassign tasks that are NOT `DONE`.
3. **Ghost Invitations after Role Fill:**
   - When one candidate accepts an invitation, the role status becomes `FILLED`. Other pending invitations sent to other candidates remain `PENDING` until those candidates attempt to accept and receive an error.
   *Remediation Required:* Automatically mark competing pending invitations as `CANCELLED` or `EXPIRED` upon role acceptance.
4. **Unconstrained Build Artifact Memory Buffer:**
   - Multer memory storage buffers entire game executables into RAM before saving.
   *Remediation Required:* Disk streaming via `multer.diskStorage`.

---

## 6. Real-World Indie Game Developer Expectations

| Developer Expectation | Pantheon Current Status | Assessment |
|:---|:---|:---|
| "I want to pitch my game concept with pillars, mechanics, and art direction." | Plain text description only. | **P1 Missing Layer** (Game Blueprint) |
| "I want AI to analyze my game concept and recommend my team needs." | Works cleanly via Gemini + taxonomies. | **Excellently Implemented** |
| "I want to recruit candidates matching my stack." | Multi-objective scoring + RWR Graph solver. | **Excellently Implemented** |
| "I want to link my Git commits to my tasks so my team knows it's fixed." | Ingests commits via Smart HTTP, but never displays them. | **P1 Broken Loop** |
| "I want my task board to show what's blocked and what it's waiting on." | Tasks have BLOCKED status, but no dependency link or reason. | **P1 Missing Feature** |
| "I want to invite 15 community playtesters to try our alpha build." | External testers cannot be invited without making them studio team members. | **P1 Missing Feature** |
| "When our tester finds a bug, I want to convert it to a task, fix it, and have them verify it." | Converts to task, but completion does not update bug or support retesting. | **P1 Broken Closed Loop** |
| "I want to see if our production is on track or if milestones are slipping." | Only shows raw percentage of completed tasks. No velocity or health telemetry. | **P2 Strong Improvement** |
| "Our project is finished; I want to archive it so it's read-only." | No archive status, no read-only lockdown. | **P2 Strong Improvement** |

---

## 7. Product Boundary & Anti-Scope Creep Analysis

To maintain Pantheon's unique identity as a high-focus game production platform, we must explicitly distinguish what belongs in Pantheon from what belongs in external tools:

| Feature / Concept | Recommendation | Rationale |
|:---|:---:|:---|
| **Game Blueprint & Design Pillars** | **BUILD (P1)** | Directly informs AI role recommendations, talent matching, and milestone scoping. |
| **Task Dependencies & Block Reasons** | **BUILD (P1)** | Game development is highly sequential (code needs animation, animation needs rig, rig needs 3D mesh). |
| **Playtest QA Closed Loop** | **BUILD (P1)** | Bug verification is the lifeblood of game testing before release. |
| **External Playtester Invitations** | **BUILD (P1)** | Studios need external playtesters who do not have access to source code or internal tasks. |
| **Real-Time Discord/Slack Chat Clone** | **DO NOT BUILD (P4)** | Scope creep. Teams already use Discord/Slack. Pantheon should provide webhook notifications, not a full chat app. |
| **Web-Based IDE / Code Editor** | **DO NOT BUILD (P4)** | Scope creep. Game developers work in Unreal Engine, Unity, Godot, Rider, and VS Code. |
| **Full GitHub/GitLab PR & Code Review Clone** | **DO NOT BUILD (P4)** | Large binary assets (scenes, textures) don't review via web diffs. Keep Native Bare Git authoritative. |
| **In-Browser Game Streaming Engine** | **DO NOT BUILD (P4)** | Massive infrastructure overhead. Playable builds should be downloaded ZIP executables or WebGL embeds. |
| **Generic Social Media Feed** | **DO NOT BUILD (P4)** | Pantheon is a production suite, not Twitter/ArtStation. |

---

## 8. Consolidated Priority Classification Table

### P0 — CRITICAL / BROKEN (Security & Data Integrity)
1. **Unauthenticated Build Runner Registration:** Secure `POST /build-runners/register` with project/organization API tokens or administrator JWT. Ensure runners can only claim jobs for authorized projects.
2. **Public Unauthenticated Game Artifact Downloads:** Eliminate public static `/uploads` serving for build artifacts and resumes. Implement signed, authenticated download endpoints.
3. **Memory Buffer Exhaustion on Build Uploads:** Replace Multer memory buffering with streaming disk storage or direct cloud storage uploads.
4. **Catastrophic Account Deletion Cascade:** Remove `onDelete: Cascade` on `Project.founderId`, `BuildJob.triggeredById`, and `PlaytestFeedback.reporterId`. Replace with `Restrict` or soft-delete.

### P1 — NECESSARY (Core Workflow Completeness)
5. **Game Blueprint Layer:** Introduce structured project fields/models for Game Pillars, Core Mechanics, Target Hardware/Specs, and Art Direction.
6. **Task Dependencies & Block Reasons:** Add `blockedByTaskId`, `blockReason`, task types (`BUG`, `FEATURE`, `ASSET`), and task due dates.
7. **Closed QA Bug Lifecycle:** Support feedback status progression (`CONVERTED_TO_TASK` → `READY_FOR_RETEST` → `VERIFIED` / `REOPENED`), with fix commit and verified build linkages.
8. **External Playtester Management:** Allow inviting external playtesters by email/link with restricted access strictly to the playtest session and build download.
9. **Display Git Commit Links on Tasks:** Expose `TaskCommitLink` in `TaskResponseDto` and render linked commits in the frontend Task modal/card.
10. **Public Project Discovery UI:** Wire `fetchPublicProjects` to a functional `/projects` discovery tab and resolve the dead-end `/dashboard#discover` link.
11. **Founder Application Notification:** Fire `APPLICATION_RECEIVED` notification to the project founder when a candidate submits an application.
12. **Historical Task Attribution Preservation:** Do not wipe `assigneeId` on completed (`DONE`) tasks when a member leaves or is removed.

### P2 — STRONG IMPROVEMENT (Workflow Polish & Telemetry)
13. **Project Archiving & Read-Only State:** Add `ARCHIVED` status that locks tasks, Git pushes, and builds into read-only mode.
14. **Project Ownership Transfer:** Allow founder to transfer ownership to another active member.
15. **Task Discussion & Comments:** Enable team comments and asset attachments on task cards.
16. **AI Analysis Freshness & Versioning:** Add timestamps (`generatedAt`) and versioning to saved AI recommendations.
17. **Project Health Metrics:** Derive project velocity, overdue task counts, and build stability metrics.
18. **Build Job Retry:** Add a "Retry Build" button for failed or timed-out build jobs.
19. **Invitation Expiration:** Add `expiresAt` (e.g., 14 days) to `ProjectInvitation`.

### P3 — NICE TO HAVE (Future Convenience)
20. **Discord / Slack Webhooks:** Post build results and playtest notifications to studio Discord channels.
21. **AI Resume Text Extraction:** Automatically extract skills from uploaded PDF/Word resumes into developer profile drafts.
22. **Global Search Extension:** Support searching public projects and open roles across the platform.

### P4 — DO NOT BUILD (Scope Creep)
23. **In-Browser IDE / Code Editor**
24. **Real-time Team Chat Application**
25. **Full Web-based Git Pull Request / Code Review Suite**
26. **Social Network Activity Feeds**

---

## 9. Architectural & Strategic Recommendations

### Recommendation 1: Fix Security & Safety Vulnerabilities First
Before introducing new features, close the runner registration vulnerability, stream build file uploads to disk to prevent OOM crashes, and protect `/uploads` behind authenticated streaming endpoints.

### Recommendation 2: Close the Three Broken Loops
1. **The Discovery Loop:** Connect `/projects/public` to the frontend so developers can find projects to apply to.
2. **The Commit Linkage Loop:** Expose existing `TaskCommitLink` data on task cards.
3. **The QA Bug Loop:** Allow tasks converted from feedback to update feedback status to `READY_FOR_RETEST` upon completion, and allow testers to verify or reopen.

### Recommendation 3: Add the Game Blueprint Layer
Extend the `Project` model with a structured `blueprint` JSON column or related model containing:
- High Concept & Target Audience
- 3 Core Design Pillars
- Key Gameplay Mechanics
- Visual / Audio Direction & Target Hardware Specs

This single addition will dramatically elevate Pantheon from a generic task manager with Git into an authentic, industry-standard game production suite.
