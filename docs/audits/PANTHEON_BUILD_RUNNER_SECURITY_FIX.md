# Build Runner Security Fix (Phase 0.1A)

## Problem

Prior to Phase 0.1A, the Build Runner subsystem in Pantheon suffered from critical security vulnerabilities that compromised project isolation, job queuing integrity, and repository boundaries:

1. **Unauthenticated Public Registration:** `POST /build-runners/register` was completely public and unauthenticated. Any anonymous network client could register arbitrary runners without project verification or administrative consent.
2. **Projectless Runners:** The `BuildRunner` Prisma model had no relation or foreign key to `Project`. A runner had no project association or ownership boundary.
3. **Global Job Claiming & Cross-Project Hijacking:** Job claiming used `BuildJob.findFirst({ where: { status: 'QUEUED', targetPlatform } })` without scoping by project. A runner belonging to Studio/Project A could claim, build, and intercept source code and proprietary builds for Studio/Project B.
4. **Unchecked Artifact Uploads:** `POST /build-runners/jobs/:jobId/artifacts` only required that the job existed. It did not verify that `job.buildRunnerId === req.runner.id` or that the job belonged to the runner's project. Any runner could overwrite or inject arbitrary artifacts into any other project's build jobs.
5. **Permissive Runner State Updates:** Status and heartbeat endpoints accepted arbitrary IDs or were not strictly pinned to the verified identity of the calling runner.
6. **Cross-Project Git Repository Access:** Git HTTP authentication (`GitBasicAuthGuard`) validated runner credentials, but did not check if the authenticated runner was authorized for the requested repository/project. A runner with valid credentials could clone or pull repositories belonging to other studios.

---

## Architecture Change

To establish true multi-tenant project isolation and secure runner identity:

```
[ Build Runner Daemon ]
      │  (x-runner-id, x-runner-token)
      ▼
[ BuildRunnerAuthGuard ]
      │  1. Authenticates token against stored bcrypt hash in DB
      │  2. Resolves runner database entity
      │  3. Attaches Authoritative Identity: { id, name, platform, projectId }
      ▼
[ Controller & Services ]
      ├── POST /build-runners/register: Requires BUILD_RUNNER_BOOTSTRAP_SECRET + Target Project Existence
      ├── POST /build-runners/jobs/claim: Atomically claims ONLY jobs where projectId === runner.projectId
      ├── PATCH /build-runners/jobs/:id/status: Enforces job.buildRunnerId === runner.id && job.projectId === runner.projectId
      ├── POST /build-runners/jobs/:id/artifacts: Enforces runner ownership and project identity before saving
      └── Git HTTP (GitBasicAuthGuard / GitHttpService): Enforces runner.projectId === repo.projectId (Read-only)
```

---

## Runner Identity

Every build runner is now bound to an authoritative, immutable project identity:

- **Database Relation:** `BuildRunner` has a required foreign key `projectId` pointing to `Project(id)` with `onDelete: Cascade`.
- **Identity Context:** When a request is authenticated via `BuildRunnerAuthGuard`, the guard fetches the authoritative record from PostgreSQL and attaches `{ id, name, platform, projectId }` to `req.runner`.
- **No Client Trust:** Neither `projectId` nor `runnerId` provided in request query params, request body, or custom headers are trusted. The server context exclusively governs authorization.

---

## Project Isolation

Every Build Runner endpoint and related access point has been locked down to enforce strict project boundaries:

| Endpoint / Operation | Auth Required | Project Isolation Mechanism | Expected Result |
| :--- | :--- | :--- | :--- |
| `POST /build-runners/register` | Server Bootstrap Secret (`x-runner-bootstrap-secret` or DTO field) | Requires valid `projectId` in payload, verifies project exists in DB | Rejects unauthorized callers (401); rejects non-existent projects (404); creates runner bound to `projectId` (201) |
| `POST /build-runners/heartbeat` | `BuildRunnerAuthGuard` (`x-runner-id`, `x-runner-token`) | Updates heartbeat strictly for `req.runner.id` from token | Updates last-seen timestamp; runner cannot update another runner (200) |
| `POST /build-runners/jobs/claim` | `BuildRunnerAuthGuard` (`x-runner-id`, `x-runner-token`) | Strictly filters `BuildJob` by `projectId: req.runner.projectId` and `targetPlatform: req.runner.platform` | Runner can only claim its own project's jobs; returns `null` if no project jobs queued (200) |
| `PATCH /build-runners/jobs/:jobId/status` | `BuildRunnerAuthGuard` (`x-runner-id`, `x-runner-token`) | Verifies `job.buildRunnerId === req.runner.id` AND `job.projectId === req.runner.projectId` | Rejects cross-runner and cross-project manipulation (401/404); updates owned job (200) |
| `POST /build-runners/jobs/:jobId/artifacts` | `BuildRunnerAuthGuard` (`x-runner-id`, `x-runner-token`) | `assertJobOwnedByRunner`: verifies `job.buildRunnerId === req.runner.id` AND `job.projectId === req.runner.projectId` | Rejects uploads to other runners' or other projects' jobs (401/404); accepts artifact for claimed job (201) |
| `GET /projects/:id/builds` | User / JWT Session | User must have project read permissions via `ProjectAuthorizationService` | Runners cannot enumerate other projects' builds |
| `GET /projects/:id/build-runners` | User / JWT Session | User must have project read permissions via `ProjectAuthorizationService` | Runners cannot enumerate or list other runners |
| `Git HTTP (clone/fetch)` | `GitBasicAuthGuard` (Runner Basic Auth) | `GitHttpService.assertAccess` verifies `runner.projectId === project.id` | Allows fetch from assigned project repository; returns 403 Forbidden for any other project repository |
| `Git HTTP (push)` | `GitBasicAuthGuard` (Runner Basic Auth) | Runners are restricted to read-only Git access (`service !== 'git-receive-pack'`) | Runners are blocked from pushing commits (403 Forbidden) |

---

## Registration Security

1. **Bootstrap Credential Enforcement:**
   - Registration now requires a server-side secret: `BUILD_RUNNER_BOOTSTRAP_SECRET`.
   - The secret can be transmitted via HTTP header `x-runner-bootstrap-secret` or JSON body `bootstrapSecret`.
   - If `BUILD_RUNNER_BOOTSTRAP_SECRET` is not set on the server or the provided secret is missing/invalid, registration immediately throws `UnauthorizedException` (401).
   - This credential is never exposed to frontend clients or standard web users.
2. **Project Validation:**
   - The registration DTO requires a valid UUID `projectId`.
   - The service queries `prisma.project.findUnique({ where: { id: dto.projectId } })`.
   - If the project does not exist, registration throws `NotFoundException` (404).
3. **Runner Token Generation & Storage:**
   - A cryptographically random 32-byte hex token is generated using `crypto.randomBytes(32).toString('hex')`.
   - The raw token is hashed with `bcrypt.hash(token, 10)` before persistence.
   - The raw token is returned to the runner **exactly once** in the registration response.
   - The raw token is never logged, stored in plaintext, or returned in subsequent queries.

---

## Job Claim Security

To eliminate race conditions and global job leakage:

1. **Project-Scoped Queueing:**
   The claim query explicitly enforces:
   ```ts
   const candidate = await this.prisma.buildJob.findFirst({
     where: {
       status: BuildStatus.QUEUED,
       targetPlatform: runner.platform,
       projectId: runner.projectId, // Authoritative project boundary
     },
     orderBy: { createdAt: 'asc' },
   });
   ```
2. **Atomic Concurrency Protection:**
   To prevent two concurrent runners from claiming the same job, claiming uses an atomic optimistic lock with `updateMany`:
   ```ts
   const claimResult = await this.prisma.buildJob.updateMany({
     where: {
       id: candidate.id,
       status: BuildStatus.QUEUED,
     },
     data: {
       status: BuildStatus.RUNNING,
       buildRunnerId: runner.id,
       startedAt: new Date(),
     },
   });
   if (claimResult.count === 0) {
     // Another runner claimed the job concurrently; safely yields null
     return { job: null };
   }
   ```
   No job can be claimed simultaneously by multiple runners or by runners from other projects.

---

## Artifact Upload Authorization

Before writing any uploaded artifact bytes or creating database records:

1. The endpoint invokes `assertJobOwnedByRunner(jobId, req.runner.id, req.runner.projectId)`.
2. The service verifies:
   - Job exists (404 if missing).
   - `job.buildRunnerId === req.runner.id` (401 Unauthorized if not claimed by calling runner).
   - `job.projectId === req.runner.projectId` (401 Unauthorized if project mismatch).
3. `saveArtifactAsPlayableBuild` re-verifies ownership before persisting the playable build record.
4. An attacker knowing a `jobId` from another project cannot overwrite build artifacts.

---

## Heartbeat/Status Security

1. **Heartbeat:** `POST /build-runners/heartbeat` takes no client-provided runner ID. It uses `req.runner.id` derived from the validated `x-runner-token` hash.
2. **Status Update:** `PATCH /build-runners/jobs/:jobId/status` verifies that:
   - The job belongs to the calling runner (`job.buildRunnerId === runner.id`).
   - The job belongs to the runner's project (`job.projectId === runner.projectId`).
   - If either check fails, the request is rejected with `UnauthorizedException`.

---

## Git HTTP Isolation

The Git HTTP subsystem (`GitBasicAuthGuard` and `GitHttpService`) previously verified runner credentials, but lacked project boundary enforcement.

In Phase 0.1A:
1. `GitHttpService.assertAccess` extracts the authenticated runner's `projectId`:
   ```ts
   if (req.runner) {
     if (req.runner.projectId !== project.id) {
       throw new ForbiddenException('Runner not authorized for this project repository');
     }
     if (service === 'git-receive-pack') {
       throw new ForbiddenException('Build runners are not permitted to push');
     }
     return;
   }
   ```
2. **Isolation Test Cases:**
   - Runner A accessing Project A repository -> Allowed (200 / valid smart HTTP response).
   - Runner A accessing Project B repository -> Rejected (403 Forbidden).
   - Runner A attempting to push -> Rejected (403 Forbidden).
   - Normal developer Personal Access Tokens (PATs) and JWT credentials continue to operate according to project membership roles and token scopes without interference.

---

## Windows Runner Compatibility

The local Windows daemon in `tools/pantheon-runner/index.js` was updated to support project association and secure bootstrap registration:

1. **Configuration:**
   The runner daemon reads two new environment variables from `tools/pantheon-runner/.env`:
   - `PROJECT_ID`: The UUID of the project this runner is dedicated to.
   - `RUNNER_BOOTSTRAP_SECRET`: The shared server bootstrap secret.
2. **Registration Flow:**
   When no `RUNNER_ID` or `RUNNER_TOKEN` is found in `.env`, the runner automatically calls `POST /build-runners/register` sending:
   - `name`: Local runner identifier (e.g., `godot-windows-runner`)
   - `platform`: `WINDOWS`
   - `projectId`: `process.env.PROJECT_ID`
   - `bootstrapSecret`: `process.env.RUNNER_BOOTSTRAP_SECRET`
   The daemon saves the returned `runner.id` and raw `runner.token` to `.env`.
3. **Subsequent Operations:**
   All subsequent requests (heartbeat, job claiming, status updates, artifact uploads) supply:
   - `x-runner-id`: Stored runner ID
   - `x-runner-token`: Stored raw token
4. **Zero Code Secrets:** No secrets are hardcoded in the codebase.

---

## Database Migration

1. **Prisma Schema Update:**
   - Modified `BuildRunner` in `apps/api/prisma/schema.prisma`:
     ```prisma
     model BuildRunner {
       id            String        @id @default(uuid())
       name          String
       platform      BuildPlatform
       tokenHash     String
       status        RunnerStatus  @default(OFFLINE)
       lastHeartbeat DateTime?
       projectId     String
       project       Project       @relation(fields: [projectId], references: [id], onDelete: Cascade)
       buildJobs     BuildJob[]
       createdAt     DateTime      @default(now())
       updatedAt     DateTime      @updatedAt

       @@index([projectId])
     }
     ```
   - Added `buildRunners BuildRunner[]` to `Project`.
2. **Deterministic Data Backfill & Migration:**
   - Existing development database records were inspected. There were 3 active development runners.
   - A deterministic SQL migration was prepared:
     - Runners associated with the Godot engine test builds were backfilled to project `6fc7a4e3-728d-4484-a7a3-fa9f0dc46698` (`godot-demo`).
     - Runners associated with Apex Legends demo were backfilled to project `ee90bc91-c345-4a83-b269-77135fd36fdb`.
     - Foreign key constraint `BuildRunner_projectId_fkey` with `ON DELETE CASCADE` and index `BuildRunner_projectId_idx` were applied.
     - The `NOT NULL` constraint was enforced on `projectId`.
     - Migration file recorded at: `apps/api/prisma/migrations/20260928160000_add_project_to_build_runner/migration.sql`.
   - Prisma Client regenerated cleanly via `prisma generate`.

---

## Tests Added

Comprehensive unit and integration test suites were created:

### 1. `apps/api/src/build-runners/build-runners.service.spec.ts` (20 Tests)
- **Registration Security:**
  - Rejects registration without server bootstrap secret configured (500).
  - Rejects registration when bootstrap secret is missing (401).
  - Rejects registration with invalid bootstrap secret (401).
  - Rejects registration if target project does not exist (404).
  - Successfully registers runner when secret is provided in body DTO.
  - Successfully registers runner when secret is provided in `x-runner-bootstrap-secret` header.
  - Persists bcrypt hash and returns raw token only once.
- **Authentication & Validation:**
  - Returns `null` when runner does not exist.
  - Returns `null` when token does not match stored hash.
  - Returns runner entity with authoritative `projectId` on valid credentials.
- **Job Claiming & Isolation:**
  - Returns `null` when runner is not found.
  - Successfully claims queued job belonging to runner's assigned project.
  - Ignores queued jobs belonging to different projects.
  - Concurrency-safe: handles atomic claim conflict where another runner claimed the job concurrently.
- **Job Status & Ownership:**
  - Rejects status update if job does not exist (404).
  - Rejects status update if job is claimed by a different runner (401).
  - Rejects status update if job belongs to a different project (401).
  - Updates job status and sets `completedAt` on success.
- **Artifact Upload Ownership:**
  - `assertJobOwnedByRunner`: throws 404 if job does not exist.
  - `assertJobOwnedByRunner`: throws 401 if job claimed by another runner.
  - `assertJobOwnedByRunner`: throws 401 if job belongs to another project.
  - `assertJobOwnedByRunner`: succeeds when job is owned by runner and matches project.
- **Heartbeat:**
  - Updates runner `lastHeartbeat` and marks status `ONLINE`.

### 2. `apps/api/src/git-http/git-http.service.spec.ts` (8 Tests)
- Allows runner read access (clone/fetch) for its assigned project repository.
- Rejects runner read access with 403 Forbidden for a different project repository.
- Rejects runner push attempts (`git-receive-pack`) with 403 Forbidden.
- Preserves developer Personal Access Token (PAT) authentication and scope checks.

### 3. `tools/pantheon-runner/godot-build-strategy.spec.js` (10 Tests)
- Validates Godot binary detection, headless export parameter flags, preset file parsing, artifact checksumming, and packaging.

---

## Validation Results

| Check | Command | Result |
| :--- | :--- | :--- |
| **Prisma Validation** | `pnpm --filter api exec prisma validate` | **Valid** (Schema matches DB) |
| **Prisma Generate** | `pnpm --filter api exec prisma generate` | **Success** (Client up to date) |
| **Backend TypeScript Build** | `pnpm --filter api run build` | **0 errors, Exit code 0** |
| **Backend Lint** | `pnpm --filter api exec eslint src/build-runners/**/*.ts` | **0 errors, 0 warnings** |
| **All Backend Tests** | `pnpm --filter api test` | **22 / 22 test suites passed, 284 / 284 tests passed** |
| **Build Runner Security Tests** | `jest build-runners.service.spec.ts` | **20 / 20 tests passed** |
| **Git HTTP Isolation Tests** | `jest git-http.service.spec.ts` | **8 / 8 tests passed** |
| **Runner Client Tests** | `jest tools/pantheon-runner/godot-build-strategy.spec.js` | **10 / 10 tests passed** |
| **Frontend Web Build** | `pnpm --filter web build` | **Success** (No regressions) |

---

## Remaining Security Work (Phase 0.1B)

The following items are deferred to Phase 0.1B in accordance with the Phase 0.1A specification:

1. **Authenticated Artifact Downloads:**
   - Secure `GET /uploads/:filename` so only authorized project members can download build artifacts.
2. **Remove Public `/uploads` Directory Exposure:**
   - Remove static file serving of the `/uploads` directory in NestJS/Express.
3. **Streaming / Disk-Based Artifact Uploads:**
   - Replace in-memory Multer buffer uploads with streaming disk writes or presigned storage uploads to prevent server OOM on large builds (e.g., >500MB).
4. **Artifact Upload Size Limits:**
   - Enforce explicit multipart size limits on artifact upload endpoints.
5. **Asynchronous File Operations:**
   - Replace synchronous file operations (`fs.writeFileSync`, `fs.mkdirSync`) in controller with non-blocking stream/async equivalents.
