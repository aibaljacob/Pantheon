# Pantheon Account & Project Deletion Security Audit

**Audit Date:** September 28, 2026  
**Auditor:** Senior Product Architect, Backend Engineer & Security Reviewer  
**Audit Scope:** Account Deletion, Project Deletion, Database Cascades, Historical Data Retention, and Physical Resource Cleanup  
**Mode:** AUDIT ONLY — No application code, Prisma schema, or database records modified.

---

## 1. Scope

Following the successful completion of Build Runner Security (Phase 0.1A) and Build Artifact Security (Phase 0.1B), this audit investigates:
1. **User Account Lifecycle:** Account deletion mechanisms, data retention, historical attribution, and cascade impacts.
2. **Project Lifecycle:** Project deletion, archiving, project membership lifecycle, and team continuity.
3. **Database Cascades:** Foreign key constraints, `onDelete` behaviors (`Cascade`, `SetNull`, `Restrict`), and cross-table destructive ripple effects.
4. **Historical Data Integrity:** Tasks, commits, pull requests, releases, build jobs, playtests, and bug feedback attribution.
5. **Ownership & Governance:** Project founder deletion and ownership transfer capabilities.
6. **Physical Resource Cleanup:** Filesystem artifacts in `uploads/builds/`, `uploads/temp/`, `uploads/avatars/`, `uploads/banners/`, `uploads/portfolio/`, `uploads/resumes/`, and bare Git repositories in `repos/<slug>.git`.
7. **External Agents & Daemons:** Build runner daemon behavior upon project or runner deletion.

Every finding in this document has been verified against the active source code, Prisma schema, controllers, services, and unit test suites.

---

## 2. Database Relationship Map

The following table comprehensively documents every relational foreign key connected to `User` and `Project` in [`apps/api/prisma/schema.prisma`](file:///d:/Projects/Pantheon/apps/api/prisma/schema.prisma), analyzing the current `onDelete` cascade behavior and its security/data-integrity risk:

| Parent Model | Child Model | Foreign Key Column | Field Nullability | Prisma `onDelete` | Risk Level | Notes & Consequences |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **User** | `UserProfile` | `UserProfile.userId` | Required (1:1) | `Cascade` | **Safe** | Profile data belongs exclusively to the user account. |
| **UserProfile** | `UserProfessionalIdentity` | `profileId` | Required (1:1) | `Cascade` | **Safe** | Identity roles/skills belong exclusively to profile. |
| **UserProfile** | `UserExperience` | `profileId` | Required | `Cascade` | **Safe** | Personal employment history. |
| **UserProfile** | `UserEducation` | `profileId` | Required | `Cascade` | **Safe** | Personal education history. |
| **UserProfile** | `UserPortfolioItem` | `profileId` | Required | `Cascade` | **P2** | DB record deleted, but physical cover image on disk is orphaned. |
| **UserProfile** | `UserResume` | `profileId` | Required (1:1) | `Cascade` | **P2** | DB record deleted, but physical PDF/DOCX file on disk is orphaned. |
| **UserProfile** | `UserLink` | `profileId` | Required | `Cascade` | **Safe** | Personal external links. |
| **User** | `UserFollow` (as follower) | `followerId` | Required | `Cascade` | **Safe** | Follow graph cleanup. |
| **User** | `UserFollow` (as following) | `followingId` | Required | `Cascade` | **Safe** | Follow graph cleanup. |
| **User** | `AuthSession` | `userId` | Required | `Cascade` | **Safe** | DB session cleanup (in-memory cache requires invalidation). |
| **User** | `EmailVerificationToken` | `userId` | Required | `Cascade` | **Safe** | Token cleanup. |
| **User** | `PasswordResetToken` | `userId` | Required | `Cascade` | **Safe** | Token cleanup. |
| **User** | `PersonalAccessToken` | `userId` | Required | `Cascade` | **Safe** | PAT credentials invalidated immediately. |
| **User** | `Notification` | `userId` | Required | `Cascade` | **Safe** | Recipient's notifications deleted. |
| **User** | `Project` (Founded) | `Project.founderId` | Required | `Cascade` | **P0 (Critical)** | **Catastrophic Cascade:** If a founder's account is deleted, ALL projects founded by that user are instantly and irreversibly obliterated from PostgreSQL along with all team data! |
| **User** | `ProjectMember` | `ProjectMember.userId` | Required | `Cascade` | **P0 (Critical)** | **Audit Trail Destroyed:** Deleting a user deletes their membership history, wiping former member cards (`status: LEFT/REMOVED`) and team records. |
| **User** | `ProjectInvitation` (sent) | `inviterId` | Required | `Cascade` | **P1 (High)** | Sent invitations are purged if inviter account is deleted. |
| **User** | `ProjectInvitation` (received) | `inviteeId` | Required | `Cascade` | **Safe** | Pending invitation purged if invitee account is deleted. |
| **User** | `ProjectApplication` | `applicantId` | Required | `Cascade` | **P1 (High)** | Candidate application records purged from project review queues. |
| **User** | `Task` (assigned) | `Task.assigneeId` | Optional | `SetNull` | **P1 (High)** | Assignee becomes `NULL`. No historical attribution of who completed/worked on the task is retained. |
| **User** | `TaskCommitLink` | `TaskCommitLink.authorId` | Optional | `SetNull` | **Safe** | `authorId` becomes `NULL`, but snapshot string `authorName` is preserved. |
| **User** | `RepoCommit` | `RepoCommit.authorId` | Required | `Cascade` | **P0 (Critical)** | **Git DB Desync:** Commits authored by the user are deleted from `RepoCommit` table, destroying the repository's database commit history! |
| **User** | `RepoPullRequest` (author) | `authorId` | Required | `Cascade` | **P0 (Critical)** | Pull requests opened by the user are deleted, destroying PR discussions, code reviews, and merged PR records. |
| **User** | `RepoPullRequest` (merger) | `mergedById` | Optional | `SetNull` | **Safe** | Merger set to `NULL`, PR remains. |
| **User** | `RepoRelease` | `authorId` | Required | `Cascade` | **P1 (High)** | Releases published by the user are deleted from repository metadata. |
| **User** | `BuildJob` (triggeredBy) | `triggeredById` | Required | `Cascade` | **P0 (Critical)** | Build jobs triggered by the user are deleted, destroying build logs and execution audit records. |
| **User** | `PlayableBuild` (uploader) | `uploadedById` | Optional | `SetNull` | **Safe** | `uploadedById` becomes `NULL`, build remains. |
| **User** | `PlaytestSession` (creator) | `createdById` | Required | `Cascade` | **P0 (Critical)** | **Playtest Annihilation:** Deleting the creator deletes the entire `PlaytestSession`, which cascades to delete **ALL feedback submitted by all other testers**! |
| **User** | `PlaytestFeedback` (reporter) | `reporterId` | Required | `Cascade` | **P0 (Critical)** | Bug reports, reproduction steps, and system specs submitted by the user are deleted. |
| **Project** | `ProjectMember` | `projectId` | Required | `Cascade` | **Expected** | Memberships removed with project. |
| **Project** | `ProjectRole` | `projectId` | Required | `Cascade` | **Expected** | Project roles removed with project. |
| **ProjectRole** | `ProjectRoleSkill` | `projectRoleId` | Required | `Cascade` | **Expected** | Role skills removed with role. |
| **ProjectRole** | `ProjectRoleTool` | `projectRoleId` | Required | `Cascade` | **Expected** | Role tools removed with role. |
| **Project** | `ProjectInvitation` | `projectId` | Required | `Cascade` | **Expected** | Invitations removed with project. |
| **Project** | `ProjectApplication` | `projectId` | Required | `Cascade` | **Expected** | Applications removed with project. |
| **Project** | `ProjectRepository` | `projectId` | Required (1:1) | `Cascade` | **P1 (High)** | DB record deleted, but bare Git repository on disk (`repos/<slug>.git`) is **NEVER deleted** (orphaned). |
| **ProjectRepository** | `RepoBranch` | `repositoryId` | Required | `Cascade` | **Expected** | Branch metadata deleted with repository. |
| **RepoBranch** | `RepoFile` | `branchId` | Required | `Cascade` | **Expected** | File cache deleted with branch. |
| **ProjectRepository** | `RepoCommit` | `repositoryId` | Required | `Cascade` | **Expected** | Commit metadata deleted with repository. |
| **ProjectRepository** | `RepoPullRequest` | `repositoryId` | Required | `Cascade` | **Expected** | PRs deleted with repository. |
| **ProjectRepository** | `RepoRelease` | `repositoryId` | Required | `Cascade` | **Expected** | Releases deleted with repository. |
| **Project** | `Milestone` | `projectId` | Required | `Cascade` | **Expected** | Milestones deleted with project. |
| **Project** | `Task` | `projectId` | Required | `Cascade` | **Expected** | Tasks deleted with project. |
| **Task** | `TaskCommitLink` | `taskId` | Required | `Cascade` | **Expected** | Commit links deleted with task. |
| **Project** | `BuildRunner` | `projectId` | Required | `Cascade` | **P1 (High)** | DB record deleted, but active runner daemons enter unhandled infinite 401 error loops. |
| **Project** | `BuildJob` | `projectId` | Required | `Cascade` | **Expected** | Build jobs deleted with project. |
| **Project** | `PlayableBuild` | `projectId` | Required | `Cascade` | **P1 (High)** | DB record deleted, but physical ZIP artifacts on disk (`uploads/builds/<projectId>/...`) are **NEVER deleted** (orphaned). |
| **Project** | `PlaytestSession` | `projectId` | Required | `Cascade` | **Expected** | Playtests deleted with project. |
| **PlaytestSession** | `PlaytestFeedback` | `sessionId` | Required | `Cascade` | **Expected** | Feedback deleted with session. |

---

## 3. User Account Deletion

### Current Implementation Status: **NOT IMPLEMENTED**

1. **Endpoint Search:** Repository-wide inspection confirmed that no endpoint exists for user account deletion:
   - `apps/api/src/auth/auth.controller.ts`: No `DELETE` endpoints.
   - `apps/api/src/profile/profile.controller.ts`: Only deletes sub-resources (`avatar`, `banner`, `experience/:id`, `education/:id`, `portfolio/:id`, `resume`, `links/:id`). No `DELETE /profile/me` or `DELETE /users/me`.
   - `apps/api/src/admin/admin.controller.ts`: Only lists users and gets details. No `DELETE /admin/users/:id`.
   - Frontend (`apps/web`): No account deletion button, modal, or action exists.
2. **Prisma Schema Support:**
   - `model User` has no `deletedAt` field (no soft delete).
   - `model User` has no `isActive` or `status` flag (default active).
3. **Hypothetical Direct Deletion (`prisma.user.delete`):**
   If executed today, PostgreSQL cascades would trigger severe collateral destruction:
   - **Founded Projects:** Every project where `founderId === user.id` is instantly wiped out due to `onDelete: Cascade`.
   - **Repository History:** Every commit authored by the user in `RepoCommit` and PR in `RepoPullRequest` is wiped out.
   - **Playtest Bug Reports:** Every `PlaytestFeedback` filed by the user is deleted.
   - **Playtest Sessions:** Every `PlaytestSession` created by the user is deleted along with all other testers' feedback.
   - **Team Membership Audit Trail:** `ProjectMember` records are wiped out, destroying former member cards and leave/removal timestamps.
   - **Physical Storage:** Disk files (avatars, banners, resumes, portfolio items) remain permanently orphaned on disk.

---

## 4. Project Deletion

### Current Implementation Status: **NOT IMPLEMENTED**

1. **Endpoint Search:**
   - `apps/api/src/projects/projects.controller.ts` contains:
     - `POST /projects` (create)
     - `PATCH /projects/:id` (update)
     - `DELETE /projects/:id/roles/:roleId` (delete role)
     - `DELETE /projects/:id/members/me` (leave project)
     - `DELETE /projects/:id/members/:memberId` (remove member)
     - **NO `DELETE /projects/:id`** exists.
   - `apps/api/src/projects/projects.service.ts`: No `deleteProject` method exists.
   - `apps/api/src/admin/admin.controller.ts`: Only `approve` and `reject` project moderation endpoints exist. No project deletion endpoint exists.
   - Frontend (`apps/web`): No project deletion UI exists in `ProjectDetailPage` or project settings.
2. **Project Lifecycle States:**
   - `enum ProjectStatus` contains: `PLANNING`, `PRE_PRODUCTION`, `PROTOTYPE`, `IN_DEVELOPMENT`, `ALPHA`, `BETA`, `COMPLETED`, `PAUSED`.
   - `ARCHIVED` status is **NOT IMPLEMENTED**.
   - `CANCELLED` status is **NOT IMPLEMENTED**.
   - `DELETED` status is **NOT IMPLEMENTED**.
   - `deletedAt` column is **NOT IMPLEMENTED**.
3. **Hypothetical Direct Deletion (`prisma.project.delete`):**
   If executed today, PostgreSQL cascades would delete all relational rows (`members`, `tasks`, `milestones`, `buildJobs`, `playableBuilds`, `playtests`, `runners`, `invitations`, `applications`).
   However:
   - **The bare Git repository directory (`repos/<slug>.git`) remains on disk forever.**
   - **All build artifact ZIP files (`uploads/builds/<projectId>/...`) remain on disk forever.**
   - **All registered build runner daemons fail with infinite 401 errors.**

---

## 5. Historical Data Integrity

A game production studio platform requires immutable historical attribution for completed work, shipped code, and testing logs, even when individual contractors or employees depart or close their accounts.

The current implementation treats historical records inconsistently:

| Data Type | Desired Retention Behavior | Current Schema Behavior on User Deletion | Impact / Severity |
| :--- | :--- | :--- | :--- |
| **Task Assignment** | **Preserve Attribution (C)** | `assigneeId` set to `NULL` (`SetNull`). | **P1 (High)**: Current assignee is unassigned, but because `Task` lacks an activity log or `completedById`, all history of who worked on or completed the task is permanently lost. |
| **Task Completion** | **Preserve Attribution (C)** | **Not Supported (E)** | `Task` model has no `completedById` or `completedAt` fields. |
| **Task History / Audit** | **Preserve Attribution (C)** | **Not Supported (E)** | No `TaskHistory` or `TaskActivity` table exists. |
| **Commit Author Information** | **Preserve Attribution (C)** | **CASCADE DELETED (A)** | **P0 (Critical)**: `RepoCommit.authorId` has `onDelete: Cascade`. Commits disappear from the database view. |
| **Task Commit Links** | **Preserve Attribution (C)** | `authorId` set to `NULL` (`SetNull`), `authorName` preserved. | **Safe**: `authorName String` stores a snapshot of the author's name at link creation time. |
| **Playtest Feedback** | **Preserve Attribution (C)** | **CASCADE DELETED (A)** | **P0 (Critical)**: `PlaytestFeedback.reporterId` has `onDelete: Cascade`. Bug reports and testing evidence filed by the user are deleted. |
| **Playtest Sessions** | **Preserve Attribution (C)** | **CASCADE DELETED (A)** | **P0 (Critical)**: `PlaytestSession.createdById` has `onDelete: Cascade`. Deleting the session creator deletes the session AND all feedback from all other users. |
| **Project Membership History** | **Preserve Attribution (C)** | **CASCADE DELETED (A)** | **P0 (Critical)**: `ProjectMember.userId` has `onDelete: Cascade`. Departed member cards and contribution timelines are wiped. |
| **Pull Requests** | **Preserve Attribution (C)** | **CASCADE DELETED (A)** | **P0 (Critical)**: `RepoPullRequest.authorId` has `onDelete: Cascade`. Merged code reviews and PR history are destroyed. |
| **Releases** | **Preserve Attribution (C)** | **CASCADE DELETED (A)** | **P1 (High)**: `RepoRelease.authorId` has `onDelete: Cascade`. Release metadata is deleted. |
| **Job Applications** | **Anonymize / Retain (B)** | **CASCADE DELETED (A)** | **P1 (High)**: Applicant applications are deleted, leaving gaps in studio recruitment pipelines. |
| **Invitations** | **Cancel Pending (A), Retain Accepted (C)** | **CASCADE DELETED (A)** | **P2 (Medium)**: Accepted invitations are purged from historical audit records. |
| **Notifications** | **Safe to Delete (A)** | **CASCADE DELETED (A)** | **Safe** for recipient's notifications. |

---

## 6. Project Founder Deletion

### Confirmed Fatal Flaw: **Catastrophic Project Cascade**

In `apps/api/prisma/schema.prisma` lines 388–394:
```prisma
model Project {
  ...
  founderId   String
  founder     User   @relation("FoundedProjects", fields: [founderId], references: [id], onDelete: Cascade)
  ...
}
```

1. **Current Code Guardrails:**
   - In `project-members.service.ts` line 563:
     ```ts
     if (project.founderId === userId) {
       throw new BadRequestException('The project founder cannot leave the project.');
     }
     ```
   - In `project-members.service.ts` line 467:
     ```ts
     if (targetMember.userId === project.founderId) {
       throw new BadRequestException('The project founder cannot be removed.');
     }
     ```
   The application logic explicitly prevents the founder from leaving or being removed from the team.
2. **Database Cascade Disconnect:**
   If a founder deletes their user account, PostgreSQL does **NOT** reject the operation. Because `onDelete: Cascade` is configured on `founderId`, PostgreSQL automatically deletes the entire `Project` row.
3. **Impact on Studio Teams:**
   A studio with 10 developers, 500 tasks, 20 builds, and a full Git repository would have its entire production workspace silently destroyed simply because the original creator closed their personal account.

---

## 7. Ownership Transfer

### Current Implementation Status: **NOT IMPLEMENTED**

1. **Endpoint Search:** Zero endpoints exist for transferring project ownership:
   - No `POST /projects/:id/transfer-ownership`
   - No `PATCH /projects/:id/founder`
2. **Service Logic:** Zero methods exist in `projects.service.ts` or `project-members.service.ts` to reassign `Project.founderId`.
3. **Data Model Constraints:**
   - `Project.founderId` is a required string.
   - `ProjectMember` has a role title string `Founder`, but authorization in `ProjectAuthorizationService` checks `project.founderId === userId`.
   - Without an ownership transfer mechanism, a project cannot survive the departure of its founder.

---

## 8. Physical File Cleanup

The following table audits all filesystem-backed storage across Pantheon:

| Resource Directory | Path Pattern | Database Reference | Deletion Trigger in Code | Physical Cleanup Implemented? | Orphan Possibility |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Build Artifacts** | `uploads/builds/<projectId>/<jobId>/artifact.zip` | `PlayableBuild.storagePath` | None | **NO** | **100% Guaranteed** on record deletion. |
| **Build Temp Spools** | `uploads/temp/temp-build-<uuid>-<rand>.zip` | None (ephemeral) | Controller `finally` / unlink | **Partial** | Left orphaned if Node process crashes during upload. |
| **Bare Git Repositories** | `repos/<slug>.git/` | `ProjectRepository.repoDiskPath` | None | **NO** | **100% Guaranteed** on project deletion. |
| **User Avatars** | `uploads/avatars/avatar-<userId>-<ts>.<ext>` | `UserProfile.avatarUrl` | `@Delete('me/avatar')` | **YES** (when explicitly deleted via API); **NO** on user account deletion. | **Guaranteed** on user deletion. |
| **User Banners** | `uploads/banners/banner-<userId>-<ts>.<ext>` | `UserProfile.bannerUrl` | `@Delete('me/banner')` | **YES** (when explicitly deleted via API); **NO** on user account deletion. | **Guaranteed** on user deletion. |
| **User Resumes** | `uploads/resumes/resume-<userId>-<ts>.<ext>` | `UserResume.downloadUrl` | `@Delete('me/resume')` | **YES** (when explicitly deleted via API); **NO** on user account deletion. | **Guaranteed** on user deletion. |
| **User Portfolio** | `uploads/portfolio/portfolio-<userId>-<ts>.<ext>` | `UserPortfolioItem.coverUrl` | `@Delete('me/portfolio/:id')` | **NO** (`deleteFileByUrl` is never called in `deletePortfolioItem`). | **100% Guaranteed** even during normal portfolio item deletion! |
| **Runner Workspaces** | `tools/pantheon-runner/workspace/<jobId>/` | None (runner local) | Runner daemon `finally` | **Partial** | Left orphaned if runner process is killed or crashes during Git clone/Godot build. |

---

## 9. Build Runner Cleanup

### Current Relationship: `BuildRunner` → `Project` (`onDelete: Cascade`)

1. **Database Cascade:** When a project is deleted, all associated `BuildRunner` records are cascade-deleted from PostgreSQL.
2. **Authentication Invalidation:**
   - In `apps/api/src/build-runners/build-runners.controller.ts`, every runner endpoint is protected by `BuildRunnerAuthGuard`.
   - `BuildRunnerAuthGuard` validates `x-runner-id` and `x-runner-token` against the database.
   - When the `BuildRunner` record is deleted, `validateRunnerCredentials` returns `null`, and the guard throws `UnauthorizedException('Invalid runner credentials')`.
3. **Daemon State:**
   - In `tools/pantheon-runner/index.js`, the daemon runs background intervals for heartbeat (30s) and job polling (5s).
   - When the runner record is deleted, both endpoints return HTTP 401.
   - The daemon does not gracefully exit or shut down; it logs errors indefinitely to `console.error` every 5 seconds.
4. **In-Flight Jobs:**
   - If a build job is running when the project is deleted, the daemon completes the Godot compilation locally.
   - When it attempts `POST /build-runners/jobs/:id/artifacts` or `PATCH /build-runners/jobs/:id/status`, both fail with 401 Unauthorized or 404 Not Found.
   - The runner workspace directory `tools/pantheon-runner/workspace/<jobId>/` may remain uncleaned on the runner host.

---

## 10. Git Repository Cleanup

### Current Architecture: Native Bare Git Repositories

1. **Storage Location:** Bare Git repositories are created in `repos/<safeSlug>.git` (defined by `ProjectRepository.repoDiskPath` via `repo-migration.ts` and `project-repository.service.ts`).
2. **Database Cascade:**
   - `Project` → `ProjectRepository` has `onDelete: Cascade`.
   - When a project is deleted in PostgreSQL, the `ProjectRepository` row is deleted.
3. **Filesystem Independence:**
   - `git.service.ts` contains methods for `initBareRepository`, `commitFiles`, `readCommitHistory`, etc., but **zero methods for deleting repository directories**.
   - Neither `projects.service.ts` nor `project-repository.service.ts` has any filesystem deletion calls (`fs.rmSync` or `fsp.rm`).
4. **Consequences:**
   - Every deleted project leaves behind its complete Git commit graph, tree objects, and blobs on the host disk indefinitely.
   - Because repository paths use project slugs, creating a future project with the same name could cause path collisions if the database slug generation algorithm matches an orphaned disk path.

---

## 11. Builds, Playtests, and Feedback

### Current Deletion Ripple Effects

1. **BuildJob Deletion:**
   - `PlayableBuild.buildJobId` is configured with `onDelete: SetNull`.
   - Deleting a `BuildJob` unlinks the `PlayableBuild`, but the playable build record and its ZIP archive remain intact.
2. **PlayableBuild Deletion:**
   - `PlaytestSession.playableBuildId` is configured with `onDelete: Cascade`!
   - If an engineer deletes an obsolete `PlayableBuild` record, PostgreSQL **CASCADE DELETES ALL PlaytestSession records** linked to that build.
   - Those `PlaytestSession` deletions in turn **CASCADE DELETE ALL PlaytestFeedback records** (bug reports, tester logs) attached to those sessions!
   - This represents an unintended destructive cascade chain: `PlayableBuild` → `PlaytestSession` → `PlaytestFeedback`.
3. **Playtest Deletion Endpoint:**
   - `DELETE /projects/:projectId/playtests/:playtestId` is implemented in `playtest.controller.ts`.
   - It performs hard deletion: `await this.prisma.playtestSession.delete({ where: { id: playtestId } })`.
   - All associated `PlaytestFeedback` is permanently deleted. Any feedback items previously converted into tasks lose their link to the original feedback (`Task.convertedFeedback` relation becomes `null`).

---

## 12. Applications & Invitations

### Current Behavior

1. **ProjectApplication:**
   - Has foreign keys to `Project` (`onDelete: Cascade`), `ProjectRole` (`onDelete: Cascade`), and `applicant` (`onDelete: Cascade`).
   - If an applicant user deletes their account, their application is deleted.
   - If a project role is deleted, all applications for that role are cascade-deleted.
   - **Flaw:** When a role is marked `FILLED`, existing pending applications are **NOT** automatically updated or rejected. They remain in `PENDING` status indefinitely.
2. **ProjectInvitation:**
   - Has foreign keys to `Project` (`onDelete: Cascade`), `ProjectRole` (`onDelete: Cascade`), `inviter` (`onDelete: Cascade`), and `invitee` (`onDelete: Cascade`).
   - If either the inviter or invitee account is deleted, the invitation is deleted.
   - **Flaw:** When a role is filled, pending invitations are **NOT** automatically cancelled. The invitee can theoretically attempt to accept an invitation for an already-filled role.

---

## 13. Notifications

### Current Behavior & Dangling References

1. **Data Model Structure:**
   ```prisma
   model Notification {
     id         String           @id @default(uuid())
     userId     String           // Recipient
     type       NotificationType
     title      String
     message    String           @db.Text
     entityType String?          // e.g. "Task", "Project", "BuildJob"
     entityId   String?          // UUID of target entity
     isRead     Boolean          @default(false)
     createdAt  DateTime         @default(now())
     user       User             @relation("UserNotifications", fields: [userId], references: [id], onDelete: Cascade)
   }
   ```
2. **Foreign Key Limitations:**
   - `entityType` and `entityId` are plain strings, not foreign keys.
   - When a `Task`, `Project`, `BuildJob`, or `PlaytestSession` is deleted, related notifications remain in the recipient's inbox.
   - When the user clicks the notification in the frontend, the app requests the deleted entity and crashes or displays an error.

---

## 14. API & Authorization Audit

Summary of all deletion and lifecycle endpoints currently existing in the backend:

| Endpoint | Method | Required Role | Auth Mechanism | Current Action | Physical Resource Cleanup |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/projects/:id/members/me` | `DELETE` | Active Member (non-founder) | `JwtAuthGuard` | Soft departure: sets `status: LEFT`, unassigns tasks, frees roles. | N/A |
| `/projects/:id/members/:memberId` | `DELETE` | Project Founder | `JwtAuthGuard` | Soft departure: sets `status: REMOVED`, unassigns tasks, frees roles. | N/A |
| `/projects/:id/roles/:roleId` | `DELETE` | Project Founder | `JwtAuthGuard` | Hard deletes `ProjectRole` row; cascades to skills/tools/invitations/applications. | N/A |
| `/tasks/:taskId` | `DELETE` | Project Manager / Admin | `JwtAuthGuard` | Hard deletes `Task` row; cascades to `TaskCommitLink`. | N/A |
| `/milestones/:milestoneId` | `DELETE` | Project Manager / Admin | `JwtAuthGuard` | Unlinks tasks, then hard deletes `Milestone` row. | N/A |
| `/projects/:projectId/playtests/:playtestId` | `DELETE` | Project Manager / Admin | `JwtAuthGuard` | Hard deletes `PlaytestSession` row; cascades to `PlaytestFeedback`. | **None** (Playable build artifact untouched). |
| `/profile/me/avatar` | `DELETE` | Authenticated User | `JwtAuthGuard` | Clears `avatarUrl`, unlinks file from disk. | **YES** (`deleteFileByUrl`) |
| `/profile/me/banner` | `DELETE` | Authenticated User | `JwtAuthGuard` | Clears `bannerUrl`, unlinks file from disk. | **YES** (`deleteFileByUrl`) |
| `/profile/me/resume` | `DELETE` | Authenticated User | `JwtAuthGuard` | Deletes `UserResume` row, unlinks file from disk. | **YES** (`deleteFileByUrl`) |
| `/profile/me/portfolio/:id` | `DELETE` | Authenticated User | `JwtAuthGuard` | Deletes `UserPortfolioItem` row. | **NO** (cover image file orphaned on disk). |
| `/personal-access-tokens/:id` | `DELETE` | Authenticated User | `JwtAuthGuard` | Hard deletes `PersonalAccessToken` row. | N/A |
| `/auth/users/me` (Account Delete) | `DELETE` | **N/A** | **N/A** | **NOT IMPLEMENTED** | **N/A** |
| `/projects/:id` (Project Delete) | `DELETE` | **N/A** | **N/A** | **NOT IMPLEMENTED** | **N/A** |
| `/projects/:id/archive` | `PATCH` | **N/A** | **N/A** | **NOT IMPLEMENTED** | **N/A** |
| `/projects/:id/transfer-ownership` | `POST` | **N/A** | **N/A** | **NOT IMPLEMENTED** | **N/A** |
| `/projects/:id/builds/:buildId` | `DELETE` | **N/A** | **N/A** | **NOT IMPLEMENTED** | **N/A** |

---

## 15. Transaction & Failure Safety

1. **Database vs Filesystem Isolation:**
   - PostgreSQL transactions (`prisma.$transaction`) ensure atomicity across relational tables.
   - However, **there is zero transactional coordination between PostgreSQL and the Node.js filesystem**.
   - If database rows are deleted and disk unlinking fails (e.g. file lock on Windows, permission error, power failure), physical files remain permanently orphaned.
   - If physical files are deleted and the database transaction aborts/rolls back, the database references non-existent files on disk.
2. **Current Portfolio Deletion Bug:**
   - In `apps/api/src/profile/profile.service.ts` line 282:
     ```ts
     await this.prisma.userPortfolioItem.delete({ where: { id } });
     ```
   - Notice that `this.profileStorageService.deleteFileByUrl(item.coverUrl)` is **never called**. Every portfolio item deleted by a user permanently orphans its image in `uploads/portfolio/`.

---

## 16. Real-World Failure Scenarios

### SCENARIO A: Founder deletes their account while the project has 5 active members.
- **Current Actual Behavior:**
  If a direct database delete occurs on the founder's `User` record, PostgreSQL's foreign key constraint `Project_founderId_fkey ON DELETE CASCADE` activates. The entire project is deleted immediately. The 5 active developers lose all tasks, milestones, roles, and project access. The bare Git repository and all build artifacts remain orphaned on the host filesystem.

### SCENARIO B: Project has 10 builds and 500 MB of artifacts, then project is deleted.
- **Current Actual Behavior:**
  All `BuildJob` and `PlayableBuild` database records are deleted. However, zero filesystem cleanup code exists. The 500 MB of ZIP archives in `uploads/builds/<projectId>/` remain on the disk forever with no reference in the database.

### SCENARIO C: Project is deleted while a BuildJob is RUNNING.
- **Current Actual Behavior:**
  The `BuildJob` and `BuildRunner` rows in PostgreSQL are deleted. The runner daemon completes the Godot compilation in its local workspace. When it attempts to upload the ZIP or report status, `BuildRunnerAuthGuard` rejects the request with HTTP 401 (runner credentials no longer exist in DB). The runner logs error messages every 5 seconds indefinitely. The workspace on the runner machine remains until manually cleared.

### SCENARIO D: User who authored 50 commits deletes their account.
- **Current Actual Behavior:**
  PostgreSQL deletes all 50 `RepoCommit` records due to `RepoCommit.authorId` having `onDelete: Cascade`. The bare Git repository on disk still contains the commits, but Pantheon's database repository viewer shows 0 commits for the branch, causing an inconsistency between Git disk state and the platform UI.

### SCENARIO E: User who reported 20 playtest bugs deletes their account.
- **Current Actual Behavior:**
  All 20 `PlaytestFeedback` records are cascade-deleted due to `PlaytestFeedback.reporterId` having `onDelete: Cascade`. The development team permanently loses bug descriptions, crash logs, and severity ratings. If any bug was converted to a task, the task remains, but the source bug report is gone.

### SCENARIO F: Project is deleted while a runner daemon is online.
- **Current Actual Behavior:**
  The `BuildRunner` row in PostgreSQL is deleted. The runner daemon continues pinging `POST /build-runners/heartbeat` and `POST /build-runners/jobs/claim`. Both return 401 Unauthorized. The daemon process does not shut down and continues looping until stopped manually.

### SCENARIO G: Database project record is deleted but physical Git repository remains.
- **Current Actual Behavior:**
  The bare Git repository directory `repos/<slug>.git` remains on disk indefinitely. Git HTTP endpoints (`git-http.service.ts`) check `prisma.project.findUnique` first, so requests return 404 Not Found. If another project is later created with a similar name, the collision resolution logic appends a random number (`<slug>-1234`), leaving the original repo abandoned.

### SCENARIO H: Database PlayableBuild record is deleted but ZIP artifact remains.
- **Current Actual Behavior:**
  The `uploads/builds/<projectId>/<jobId>/artifact.zip` file remains on disk with no database record pointing to it. Furthermore, deleting the `PlayableBuild` cascade-deletes all `PlaytestSession` and `PlaytestFeedback` records attached to it.

---

## 17. Confirmed Security / Data-Integrity Issues

### Severity Classification

| Issue ID | Severity | Category | Target Component | Description | Confirmed Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **VULN-CASCADE-01** | **P0 (Critical)** | Data Loss | `schema.prisma:394` (`Project.founderId`) | **Founder Deletion Destroys Entire Project:** `onDelete: Cascade` causes a founder deletion to wipe out the entire project workspace, all members, tasks, and builds. | **CONFIRMED** |
| **VULN-CASCADE-02** | **P0 (Critical)** | Data Integrity | `schema.prisma:582` (`RepoCommit.authorId`) | **User Deletion Destroys Git Commit DB History:** `onDelete: Cascade` deletes commit records from PostgreSQL when the author account is deleted. | **CONFIRMED** |
| **VULN-CASCADE-03** | **P0 (Critical)** | Data Loss | `schema.prisma:939` (`PlaytestFeedback.reporterId`) | **User Deletion Destroys Bug Reports:** `onDelete: Cascade` deletes QA feedback and bug reports when the reporter account is deleted. | **CONFIRMED** |
| **VULN-CASCADE-04** | **P0 (Critical)** | Data Loss | `schema.prisma:915` (`PlaytestSession.createdById`) | **Session Creator Deletion Destroys Other Testers' Feedback:** `onDelete: Cascade` deletes the session and all feedback from all other users. | **CONFIRMED** |
| **VULN-CASCADE-05** | **P0 (Critical)** | Audit Trail | `schema.prisma:428` (`ProjectMember.userId`) | **User Deletion Wipes Team Audit History:** `onDelete: Cascade` deletes former member history, left timestamps, and contribution records. | **CONFIRMED** |
| **VULN-CASCADE-06** | **P0 (Critical)** | Data Loss | `schema.prisma:914` (`PlaytestSession.playableBuildId`) | **Build Deletion Destroys Playtests & Feedback:** `onDelete: Cascade` on `PlaytestSession.playableBuildId` causes deleting a build to wipe playtests and feedback. | **CONFIRMED** |
| **VULN-CLEANUP-01** | **P1 (High)** | Resource Leak | `projects/git.service.ts` / `repos/` | **Bare Git Repositories Never Cleaned Up:** Physical Git repositories are orphaned indefinitely upon project deletion. | **CONFIRMED** |
| **VULN-CLEANUP-02** | **P1 (High)** | Resource Leak | `builds/` / `uploads/builds/` | **Build Artifact ZIP Archives Never Cleaned Up:** Physical build ZIPs are orphaned indefinitely upon build or project deletion. | **CONFIRMED** |
| **VULN-LIFECYCLE-01** | **P1 (High)** | Lifecycle / Governance | `projects/` | **Ownership Transfer Not Implemented:** A project cannot be transferred to another team member; it is permanently bound to the original creator. | **CONFIRMED** |
| **VULN-LIFECYCLE-02** | **P1 (High)** | Compliance / Governance | `auth/` / `profile/` | **Account Deletion & Project Deletion Not Implemented:** Users cannot delete their accounts or projects through any API or UI. | **CONFIRMED** |
| **VULN-CLEANUP-03** | **P2 (Medium)** | Resource Leak | `profile/storage/` | **Portfolio & Profile Files Orphaned on Deletion:** Portfolio cover images are never unlinked upon deletion; avatar/banner/resumes are orphaned if user is deleted. | **CONFIRMED** |
| **VULN-DAEMON-01** | **P2 (Medium)** | Operational Stability | `tools/pantheon-runner/index.js` | **Daemon Infinite 401 Loop:** Runners loop indefinitely logging 401 errors when their project/runner record is deleted. | **CONFIRMED** |
| **VULN-NOTIFICATION-01**| **P2 (Medium)** | User Experience | `notifications/` | **Dangling Notification Entity References:** Notifications retain dead string references to deleted entities, causing 404s. | **CONFIRMED** |
| **VULN-ROLE-01** | **P2 (Medium)** | Workflow Integrity | `projects/project-members.service.ts` | **Ghost Invitations/Applications on Role Fill:** Filling a role does not cancel pending invitations or reject pending applications. | **CONFIRMED** |
| **VULN-LIFECYCLE-03** | **P3 (Low)** | Lifecycle | `projects/` | **No Project Archival Status:** `ProjectStatus` lacks an `ARCHIVED` state for read-only project preservation. | **CONFIRMED** |
| **VULN-CACHE-01** | **P3 (Low)** | Session Security | `auth/auth-session.cache.ts` | **Cached Session TTL Invalidation:** In-memory session cache retains entries for up to 30s unless explicitly purged during deletion. | **CONFIRMED** |

---

## 18. Recommended Minimal Design — AUDIT ONLY

To address the confirmed vulnerabilities in future implementation phases without introducing unnecessary complexity, the following architecture strategy is recommended:

### Phase 0.2A: MUST FIX (Data Loss & Cascade Prevention)

1. **Re-architect Prisma Cascades for Historical Records:**
   - Change `RepoCommit.authorId` from `onDelete: Cascade` to `onDelete: SetNull` (or introduce a system Tombstone User ID) so Git commit metadata is never deleted.
   - Change `PlaytestFeedback.reporterId` from `onDelete: Cascade` to `onDelete: SetNull` so bug reports and testing evidence remain intact.
   - Change `PlaytestSession.createdById` from `onDelete: Cascade` to `onDelete: SetNull` so playtests are not deleted when their creator departs.
   - Change `PlaytestSession.playableBuildId` from `onDelete: Cascade` to `onDelete: SetNull` so deleting a build does not wipe playtest feedback.
   - Change `ProjectMember.userId` to retain former member records or introduce soft user deletion.
2. **Prevent Founder Deletion Cascade:**
   - Change `Project.founderId` foreign key from `onDelete: Cascade` to `onDelete: Restrict` (or `onDelete: NoAction`).
   - If a user attempts to delete their account while being the active founder of any project with members, the database must **REJECT** the deletion until ownership is transferred or the project is explicitly deleted.
3. **Implement Project Ownership Transfer:**
   - Add endpoint `POST /projects/:projectId/transfer-ownership` requiring founder authentication and a target active project member.
   - Updates `Project.founderId` and adjusts role titles atomically within `prisma.$transaction`.

### Phase 0.2B: SHOULD FIX (Safe Deletion & Physical Cleanup)

1. **Implement User Account Deletion (`DELETE /profile/me` or `/auth/me`):**
   - Re-verify password or OAuth state.
   - Reject if user is sole founder of active multi-member projects (must transfer or delete first).
   - Invalidate in-memory session cache (`authSessionCache.invalidateUser(userId)`).
   - Anonymize personal details (username to `deleted-user-<uuid>`, email to `deleted-<uuid>@pantheon.local`, clear bio/names).
   - Unlink avatar, banner, resume, and portfolio files from disk.
   - Soft-delete or tombstone the user record so foreign keys pointing to `User` remain valid for historical attribution.
2. **Implement Project Deletion (`DELETE /projects/:projectId`):**
   - Require founder authentication + project name confirmation string.
   - Two-phase cleanup:
     1. Database transaction deletes or marks project `DELETED`.
     2. Asynchronous cleanup worker purges physical files:
        - Removes bare git directory: `fsp.rm(repoDiskPath, { recursive: true, force: true })`.
        - Removes build artifacts: `fsp.rm('uploads/builds/' + projectId, { recursive: true, force: true })`.
3. **Fix Portfolio File Cleanup Bug:**
   - Update `deletePortfolioItem` in `profile.service.ts` to invoke `profileStorageService.deleteFileByUrl(item.coverUrl)`.

### Phase 0.2C: CAN DEFER (Enhancements & Archival)

1. **Project Archival:** Add `ARCHIVED` to `ProjectStatus` and make repository and tasks read-only.
2. **Runner Daemon Graceful Shutdown:** Teach runner daemon to detect HTTP 401/404 during heartbeat and terminate gracefully rather than loop indefinitely.
3. **Notification Dead-Link Cleanup:** Clean up or hide notifications whose `entityId` has been deleted.

---

## 19. Files Inspected

The following 32 files across the Pantheon codebase were inspected during this audit:

### Backend Schema & Configuration
- [`apps/api/prisma/schema.prisma`](file:///d:/Projects/Pantheon/apps/api/prisma/schema.prisma)
- [`apps/api/src/main.ts`](file:///d:/Projects/Pantheon/apps/api/src/main.ts)
- [`apps/api/src/app.module.ts`](file:///d:/Projects/Pantheon/apps/api/src/app.module.ts)

### Auth & User Subsystem
- [`apps/api/src/auth/auth.controller.ts`](file:///d:/Projects/Pantheon/apps/api/src/auth/auth.controller.ts)
- [`apps/api/src/auth/auth.service.ts`](file:///d:/Projects/Pantheon/apps/api/src/auth/auth.service.ts)
- [`apps/api/src/auth/auth-session.cache.ts`](file:///d:/Projects/Pantheon/apps/api/src/auth/auth-session.cache.ts)
- [`apps/api/src/auth/jwt-auth.guard.ts`](file:///d:/Projects/Pantheon/apps/api/src/auth/jwt-auth.guard.ts)
- [`apps/api/src/personal-access-tokens/personal-access-tokens.controller.ts`](file:///d:/Projects/Pantheon/apps/api/src/personal-access-tokens/personal-access-tokens.controller.ts)

### Profile & Media Storage Subsystem
- [`apps/api/src/profile/profile.controller.ts`](file:///d:/Projects/Pantheon/apps/api/src/profile/profile.controller.ts)
- [`apps/api/src/profile/profile.service.ts`](file:///d:/Projects/Pantheon/apps/api/src/profile/profile.service.ts)
- [`apps/api/src/profile/storage/profile-storage.service.ts`](file:///d:/Projects/Pantheon/apps/api/src/profile/storage/profile-storage.service.ts)

### Projects & Team Membership Subsystem
- [`apps/api/src/projects/projects.controller.ts`](file:///d:/Projects/Pantheon/apps/api/src/projects/projects.controller.ts)
- [`apps/api/src/projects/projects.service.ts`](file:///d:/Projects/Pantheon/apps/api/src/projects/projects.service.ts)
- [`apps/api/src/projects/project-members.service.ts`](file:///d:/Projects/Pantheon/apps/api/src/projects/project-members.service.ts)
- [`apps/api/src/projects/project-invitations.service.ts`](file:///d:/Projects/Pantheon/apps/api/src/projects/project-invitations.service.ts)
- [`apps/api/src/projects/project-applications.service.ts`](file:///d:/Projects/Pantheon/apps/api/src/projects/project-applications.service.ts)
- [`apps/api/src/projects/project-repository.controller.ts`](file:///d:/Projects/Pantheon/apps/api/src/projects/project-repository.controller.ts)
- [`apps/api/src/projects/project-repository.service.ts`](file:///d:/Projects/Pantheon/apps/api/src/projects/project-repository.service.ts)
- [`apps/api/src/projects/repo-migration.ts`](file:///d:/Projects/Pantheon/apps/api/src/projects/repo-migration.ts)
- [`apps/api/src/projects/git.service.ts`](file:///d:/Projects/Pantheon/apps/api/src/projects/git.service.ts)
- [`apps/api/src/git-http/git-http.service.ts`](file:///d:/Projects/Pantheon/apps/api/src/git-http/git-http.service.ts)

### Tasks & Milestones Subsystem
- [`apps/api/src/tasks/tasks.controller.ts`](file:///d:/Projects/Pantheon/apps/api/src/tasks/tasks.controller.ts)
- [`apps/api/src/tasks/tasks.service.ts`](file:///d:/Projects/Pantheon/apps/api/src/tasks/tasks.service.ts)
- [`apps/api/src/tasks/milestones.controller.ts`](file:///d:/Projects/Pantheon/apps/api/src/tasks/milestones.controller.ts)
- [`apps/api/src/tasks/milestones.service.ts`](file:///d:/Projects/Pantheon/apps/api/src/tasks/milestones.service.ts)
- [`apps/api/src/tasks/project-authorization.service.ts`](file:///d:/Projects/Pantheon/apps/api/src/tasks/project-authorization.service.ts)

### Builds & Playtests Subsystem
- [`apps/api/src/builds/builds.controller.ts`](file:///d:/Projects/Pantheon/apps/api/src/builds/builds.controller.ts)
- [`apps/api/src/builds/builds.service.ts`](file:///d:/Projects/Pantheon/apps/api/src/builds/builds.service.ts)
- [`apps/api/src/build-runners/build-runners.controller.ts`](file:///d:/Projects/Pantheon/apps/api/src/build-runners/build-runners.controller.ts)
- [`apps/api/src/build-runners/build-runners.service.ts`](file:///d:/Projects/Pantheon/apps/api/src/build-runners/build-runners.service.ts)
- [`apps/api/src/playtest/playtest.controller.ts`](file:///d:/Projects/Pantheon/apps/api/src/playtest/playtest.controller.ts)
- [`apps/api/src/playtest/playtest.service.ts`](file:///d:/Projects/Pantheon/apps/api/src/playtest/playtest.service.ts)
- [`apps/api/src/notifications/notifications.controller.ts`](file:///d:/Projects/Pantheon/apps/api/src/notifications/notifications.controller.ts)
- [`apps/api/src/notifications/notifications.service.ts`](file:///d:/Projects/Pantheon/apps/api/src/notifications/notifications.service.ts)
- [`tools/pantheon-runner/index.js`](file:///d:/Projects/Pantheon/tools/pantheon-runner/index.js)

### Frontend Verification
- [`apps/web/src/pages/ProjectDetailPage.tsx`](file:///d:/Projects/Pantheon/apps/web/src/pages/ProjectDetailPage.tsx)
- [`apps/web/src/pages/ProfilePage.tsx`](file:///d:/Projects/Pantheon/apps/web/src/pages/ProfilePage.tsx)
- [`apps/web/src/features/projects/components/FormerMemberCard.tsx`](file:///d:/Projects/Pantheon/apps/web/src/features/projects/components/FormerMemberCard.tsx)
- [`apps/web/src/features/profile/components/PortfolioSection.tsx`](file:///d:/Projects/Pantheon/apps/web/src/features/profile/components/PortfolioSection.tsx)

---

## 20. Conclusion

The audit reveals that **account deletion, project deletion, and project ownership transfer are completely unimplemented** in Pantheon today. 

More critically, the underlying database schema currently contains **destructive foreign-key cascade configurations (`onDelete: Cascade`)** that would cause massive, irreversible data loss across multi-member studios if account deletion were implemented naively:
1. Deleting a founder's account would annihilate entire studios and all attached tasks, milestones, builds, and repositories.
2. Deleting a committer's account would purge commit history from the platform database.
3. Deleting a QA tester's account would delete all bug reports and test evidence.
4. Deleting a build would purge all playtest sessions and feedback.
5. Deleting projects or builds would permanently leak bare Git repositories and multi-gigabyte build archives onto the server filesystem.

Before any account or project deletion endpoints are exposed to users, the database cascade constraints must be redesigned to enforce ownership protection (`Restrict`) and historical attribution preservation (`SetNull` / Tombstone).

---

## Phase 0.2A — Cascade Hardening

**Implementation Date:** September 28, 2026  
**Implementation Status:** COMPLETED  
**Scope Boundary Notice:** This phase hardened database relational foreign-key cascades and nullability safety only. **Actual account deletion, project deletion, ownership transfer, project archival, and physical disk cleanups remain UNIMPLEMENTED.**

---

### 1. Hardened Foreign-Key Relationships

The 6 destructive cascade relationships identified during the Phase 0.2 audit were hardened in [`apps/api/prisma/schema.prisma`](file:///d:/Projects/Pantheon/apps/api/prisma/schema.prisma):

| Model | Field | Type Change | Old Behavior | New Behavior | Production Protection Objective |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `Project` | `founderId` | `String` (Required) | `onDelete: Cascade` | `onDelete: Restrict` | Prevents catastrophic deletion of an entire project and all studio workspace data if a founder account deletion is attempted. Rejects deletion at the database constraint level. |
| `ProjectMember` | `userId` | `String?` (Optional) | `onDelete: Cascade` | `onDelete: SetNull` | Preserves historical team membership records (`status: LEFT/REMOVED`, role, joined/left timestamps) when a user departs or their account is removed. |
| `RepoCommit` | `authorId` | `String?` (Optional) | `onDelete: Cascade` | `onDelete: SetNull` | Preserves repository database commit metadata and commit history when the author user account is removed. Native Git Bare repository history remains unaffected. |
| `PlaytestSession` | `playableBuildId` | `String?` (Optional) | `onDelete: Cascade` | `onDelete: SetNull` | Preserves playtest sessions and all attached playtest feedback even if the associated build record is removed. |
| `PlaytestSession` | `createdById` | `String?` (Optional) | `onDelete: Cascade` | `onDelete: SetNull` | Prevents deletion of the entire playtest session and all other testers' feedback when the session creator's account is removed. |
| `PlaytestFeedback` | `reporterId` | `String?` (Optional) | `onDelete: Cascade` | `onDelete: SetNull` | Preserves bug reports, severity ratings, reproduction steps, system specifications, and task links when the reporter user account is removed. |

---

### 2. Database Migration

- **Migration Identifier:** `20260928190000_harden_database_cascades`
- **Migration Location:** [`apps/api/prisma/migrations/20260928190000_harden_database_cascades/migration.sql`](file:///d:/Projects/Pantheon/apps/api/prisma/migrations/20260928190000_harden_database_cascades/migration.sql)
- **Execution Strategy:** DDL statements executed against the target PostgreSQL database (Neon), updating table foreign-key constraints from `ON DELETE CASCADE` to `ON DELETE RESTRICT` / `ON DELETE SET NULL`, and altering column nullability to `DROP NOT NULL`. Migration recorded in `_prisma_migrations`.
- **Validation:** Executed `prisma migrate diff` comparing schema datasource with Prisma datamodel; confirmed 0 pending differences (`-- This is an empty migration.`).

---

### 3. Review of All Cascade Relationships in Schema

A complete audit of all `onDelete: Cascade` occurrences in [`apps/api/prisma/schema.prisma`](file:///d:/Projects/Pantheon/apps/api/prisma/schema.prisma) was conducted, classifying each into 4 categories:

#### Category A: Appropriate Security / Session Cascade
- `AuthSession.userId` → Purges DB sessions upon user deletion.
- `PersonalAccessToken.userId` → Revokes personal access tokens immediately upon user deletion.
- `EmailVerificationToken.userId` → Revokes verification tokens upon user deletion.
- `PasswordResetToken.userId` → Invalidates password reset tokens upon user deletion.
- `Notification.userId` → Cleans up notification feeds belonging to deleted user.

#### Category B: Appropriate Dependent-Data Cascade
- `UserProfile.userId`, `UserProfessionalIdentity.profileId`, `UserExperience.profileId`, `UserEducation.profileId`, `UserPortfolioItem.profileId`, `UserResume.profileId`, `UserLink.profileId` → Private personal profile metadata.
- `UserFollow.followerId`, `UserFollow.followingId` → Social graph edges.
- `ProjectMember.projectId`, `ProjectRole.projectId`, `ProjectRoleSkill.projectRoleId`, `ProjectRoleTool.projectRoleId` → Sub-entities of the project.
- `ProjectInvitation.projectId`, `ProjectApplication.projectId` → In-flight project recruitment queues.
- `ProjectRepository.projectId`, `RepoBranch.repositoryId`, `RepoFile.branchId`, `RepoCommit.repositoryId` → Repository sub-entities belonging to the project.
- `Milestone.projectId`, `Task.projectId`, `TaskCommitLink.taskId` → Work breakdown entities belonging to the project.
- `BuildRunner.projectId`, `BuildJob.projectId`, `PlayableBuild.projectId`, `PlaytestSession.projectId`, `PlaytestFeedback.sessionId` → Operational artifacts belonging directly to the project or session.

#### Category C: Historical-Data Destructive Cascade (Hardened in 0.2A)
- `Project.founderId` → Hardened to `Restrict`.
- `ProjectMember.userId` → Hardened to `SetNull`.
- `RepoCommit.authorId` → Hardened to `SetNull`.
- `PlaytestSession.playableBuildId` → Hardened to `SetNull`.
- `PlaytestSession.createdById` → Hardened to `SetNull`.
- `PlaytestFeedback.reporterId` → Hardened to `SetNull`.

#### Category D: Requires Further Audit (Phase 0.2B/C)
- `RepoPullRequest.authorId` (Cascade) → Should become `SetNull` when PR lifecycle is expanded.
- `RepoRelease.authorId` (Cascade) → Should become `SetNull` when release management is finalized.
- `BuildJob.triggeredById` (Cascade) → Should become `SetNull` when CI history retention is implemented.
- `ProjectApplication.applicantId` (Cascade) → Requires recruitment candidate retention policy.
- `ProjectInvitation.inviterId` (Cascade) → Requires invitation audit trail policy.

---

### 4. Application Compatibility Changes

Because `ProjectMember.userId`, `RepoCommit.authorId`, `PlaytestSession.createdById`, `PlaytestSession.playableBuildId`, and `PlaytestFeedback.reporterId` are now nullable:

1. **DTO Updates:**
   - [`apps/api/src/projects/projects.dto.ts`](file:///d:/Projects/Pantheon/apps/api/src/projects/projects.dto.ts): Made `userId?: string | null` in `ProjectActiveTeamMemberDto`, `ProjectFormerTeamMemberDto`, and `ProjectMemberDetailDto`.
   - [`apps/api/src/admin/admin.dto.ts`](file:///d:/Projects/Pantheon/apps/api/src/admin/admin.dto.ts): Updated `userId: string | null` in `AdminProjectDetailDto`.
   - [`apps/web/src/features/projects/types.ts`](file:///d:/Projects/Pantheon/apps/web/src/features/projects/types.ts): Updated `ProjectFormerTeamMember.userId` to `string | null`, and `PlaytestSession.playableBuild` to `{ ... } | null`.
2. **Service Mapping & Null Fallbacks:**
   - [`apps/api/src/projects/project-members.service.ts`](file:///d:/Projects/Pantheon/apps/api/src/projects/project-members.service.ts): Guarded `m.user` when mapping former members, providing `'Former Member'` / `'deleted_user'` fallbacks.
   - [`apps/api/src/projects/projects.service.ts`](file:///d:/Projects/Pantheon/apps/api/src/projects/projects.service.ts): Handled null `m.user` gracefully in project member list mapping.
   - [`apps/api/src/admin/admin.service.ts`](file:///d:/Projects/Pantheon/apps/api/src/admin/admin.service.ts): Handled null `m.user` and null `m.userId` when projecting team members.
   - [`apps/api/src/playtest/playtest.service.ts`](file:///d:/Projects/Pantheon/apps/api/src/playtest/playtest.service.ts): Updated `convertFeedbackToTask` to null-safely access `playableBuild?.version || 'N/A'` and `feedback.reporterId || 'Anonymous'`.
   - [`apps/api/src/projects/talent-matching.service.ts`](file:///d:/Projects/Pantheon/apps/api/src/projects/talent-matching.service.ts): Guarded `m.userId` when indexing active team members.
   - [`apps/api/src/projects/graph-team-formation/graph-builder.ts`](file:///d:/Projects/Pantheon/apps/api/src/projects/graph-team-formation/graph-builder.ts) & [`baseline-comparison.service.ts`](file:///d:/Projects/Pantheon/apps/api/src/projects/graph-team-formation/baseline-comparison.service.ts): Filtered null user IDs out of excluded member sets and past membership tracking.
3. **Frontend UI Compatibility:**
   - [`apps/web/src/features/projects/components/playtest/PlaytestsTab.tsx`](file:///d:/Projects/Pantheon/apps/web/src/features/projects/components/playtest/PlaytestsTab.tsx): Added null-safety check for `playtest.playableBuild`, displaying "Build Removed" fallback badge when build is null.
   - [`apps/web/src/pages/PlaytestDetailPage.tsx`](file:///d:/Projects/Pantheon/apps/web/src/pages/PlaytestDetailPage.tsx): Handled optional build information and `fb.reporter?.username || 'Deleted User'`.

---

### 5. Authorization Safety Verification

- **Mechanism:** `ProjectAuthorizationService` validates user permissions with queries strictly checking `where: { userId: currentUserId, projectId }` and `status: 'ACTIVE'`.
- **Safety Guarantee:** Rows where `userId` is `NULL` can never evaluate to true against any authenticated `userId` string. Deleted or anonymized historical member records cannot satisfy membership checks, and former members cannot regain access.

---

### 6. Tests & Validation

1. **Dedicated Database Cascade Test Suite:**
   - Added [`apps/api/src/database/cascade-hardening.spec.ts`](file:///d:/Projects/Pantheon/apps/api/src/database/cascade-hardening.spec.ts).
   - Validated:
     - Project founder deletion blocked by `Restrict`.
     - `RepoCommit` preserved with `authorId: null` on author deletion; native Git repository untouched.
     - `PlaytestFeedback` preserved with `reporterId: null` on reporter deletion.
     - `PlaytestSession` preserved with `createdById: null` on creator deletion; feedback preserved.
     - `ProjectMember` preserved with `userId: null`, maintaining historical status (`LEFT`/`REMOVED`).
     - `PlaytestSession` preserved with `playableBuildId: null` on build deletion.
     - Authorization safety: `userId: null` members cannot satisfy active membership authorization.
2. **Regression Verification:**
   - **Prisma Validate:** Passed (`prisma validate`).
   - **Prisma Generate:** Passed (`prisma generate`).
   - **Backend Unit Tests:** All 23 test suites passed (307 tests total, 0 failures).
   - **Backend Build:** Passed (`nest build`).
   - **Frontend Build:** Passed (`tsc -b && vite build`).
   - **Backend Linter:** Passed with 0 errors.
