# Pantheon — Role-Aware Project Details Audit & Implementation Report

**Status:** Complete  
**Date:** September 29, 2026  
**Audience:** Pantheon Core Engineering Team  

---

## 1. Executive Summary

This implementation provides authoritative role-aware resolution, adaptive UI rendering, and defense-in-depth authorization for the **Project Details** page (`/projects/:id`). 

Previous implementations relied on basic frontend boolean flags (`isFounder`, `isMember`), which could expose workspace tabs (`tasks`, `builds`, `playtests`, `repo`, `applications`) or render inappropriate actions to visitors and non-members. 

With this upgrade:
1. **Authoritative Backend Relationship Resolution:** The backend `getProjectDetails` endpoint computes the viewer's explicit relationship (`FOUNDER`, `ACTIVE_MEMBER`, `APPLICANT`, `INVITEE`, `NON_MEMBER`, `VISITOR`) using verified database lookups across `project`, `projectMembers`, `projectInvitation`, and `projectApplication` records.
2. **Tab Access Filtering:** Navigation tabs are dynamically filtered based on role permissions (`allowedTabs`). Non-members and visitors can only view `overview`, `blueprint`, and `team`. Workspace tabs (`tasks`, `builds`, `repo`, `playtests`) require active membership or founder access, and the `applications` review tab is strictly reserved for the founder/admin.
3. **Contextual Action Banners:** Dedicated banners and actions are rendered for pending invitations (Accept / Decline), pending applications (Status badge + Withdraw action), and unauthenticated visitors (Sign in to apply CTA).
4. **Open Roles Recruitment:** Role-aware recruitment actions allow visitors to sign in, non-members to apply, applicants to monitor their application status or withdraw, active members to view roles in read-only mode, and founders to manage (create, edit, delete) roles.
5. **Private Workspace Telemetry Protection:** The right-column production telemetry card (which triggers backend task/milestone queries) is guarded so that unauthenticated visitors and non-members receive a sanitized public production overview rather than forbidden 403 API calls.

---

## 2. Viewer States & Resolution Matrix

| Viewer State | Identification Condition | Allowed Navigation Tabs | Permitted Overview Actions | Restricted Areas |
| :--- | :--- | :--- | :--- | :--- |
| **Founder** | Authenticated user is project `founderId` or system `Administrator`. | `overview`, `blueprint`, `team`, `tasks`, `builds`, `repo`, `playtests`, `applications` | Edit project, add/edit/delete open roles, review candidates, accept AI role recommendations, manage team roster. | None. Full workspace controls. |
| **Active Member** | Authenticated user has active record in `ProjectMember` table (`status: ACTIVE`). | `overview`, `blueprint`, `team`, `tasks`, `builds`, `repo`, `playtests` | View project overview, view blueprint, view team roster, leave project, manage assigned tasks. Read-only on open roles. | Cannot edit project, cannot create/delete roles, cannot view application submissions, cannot remove other members. |
| **Applicant** | Authenticated user has pending record in `ProjectApplication` (`status: PENDING`). | `overview`, `blueprint`, `team` | View public project information, view application status banner, withdraw pending application, apply for other open roles. | No internal tasks, private feedback, restricted builds, or repo access. Cannot review candidates. |
| **Invitee** | Authenticated user has pending record in `ProjectInvitation` (`status: PENDING`). | `overview`, `blueprint`, `team` | View public project information, accept invitation, decline invitation, apply for other open roles. | Cannot access workspace tabs until invitation is accepted. |
| **Non-Member** | Authenticated user with no active membership, application, or invitation. | `overview`, `blueprint`, `team` | View public project info, view public blueprint, view public team, apply for open roles. | No internal tasks, private builds, repository code, or applicant submissions. |
| **Visitor** | Unauthenticated browsing (`accessToken` is null). | `overview`, `blueprint`, `team` | View public project info, view public blueprint, view public team, click "Sign in to Apply". | Strictly public content only. All mutations and internal workspace tabs blocked. |

---

## 3. Data Privacy & Backend Authorization Audit

The UI guards in `ProjectDetailPage` are backed by service-level authorization:

1. **Tasks & Milestones (`TasksController`, `TaskService`):**
   - Calls `ProjectAuthorizationService.assertCanView(projectId, userId)`, which checks `isFounder || isMember || isAdmin`. Non-members and visitors receive `403 ForbiddenException`.
2. **Builds & Releases (`BuildsController`, `BuildsService`):**
   - Calls `ProjectAuthorizationService.assertCanView(projectId, userId)`. Mutations check `assertCanEdit` (strictly founder/admin).
3. **Repository Management (`ProjectRepositoryService`, `GitHttpService`):**
   - Read and write operations verify membership via `assertMemberAccess`. Anonymous or non-member requests are rejected with `403 Forbidden`.
4. **Candidate Applications (`ProjectApplicationsService`):**
   - `getProjectApplications(projectId, userId)` asserts that `userId === project.founderId || isAdmin`. Unauthorized requests receive `403 ForbiddenException`.
   - `withdrawCandidateApplication(applicationId, userId)` strictly checks `applicantId === userId`.
5. **Team Management (`ProjectMembersService`):**
   - Changing roles or removing members asserts `founderId === userId || isAdmin`.
   - `getTeamMembers` returns public studio attribution history including former members for transparency.
6. **Game Blueprint (`GameBlueprintService`):**
   - Published project blueprints are publicly readable.
   - Blueprint creation and editing (`upsertBlueprint`) strictly require `founderId === userId || isAdmin`.

---

## 4. Summary of Files Changed

### Backend (`apps/api`)
- `src/projects/projects.dto.ts`:
  - Defined `ProjectViewerRelationship = 'FOUNDER' | 'ACTIVE_MEMBER' | 'APPLICANT' | 'INVITEE' | 'NON_MEMBER' | 'VISITOR'`.
  - Added `ViewerPendingApplicationDto` and `ViewerPendingInvitationDto`.
  - Extended `ProjectDetailResponseDto` with `viewerRelationship`, `viewerRole`, `viewerPendingApplication`, and `viewerPendingInvitation`.
- `src/projects/projects.service.ts`:
  - Updated `getProjectDetails()` to perform authoritative queries for active membership, pending invitations, and pending applications.
  - Returns complete viewer context without trusting frontend assertions.
- `src/projects/projects.service.spec.ts`:
  - Added 6 comprehensive unit tests verifying viewer state resolution for `FOUNDER`, `ACTIVE_MEMBER`, `APPLICANT`, `INVITEE`, `NON_MEMBER`, and `VISITOR`.

### Frontend (`apps/web`)
- `src/features/projects/types.ts`:
  - Defined `ViewerRelationship`, `ViewerPendingApplication`, `ViewerPendingInvitation`.
  - Extended `ProjectDetail` interface.
- `src/pages/ProjectDetailPage.tsx`:
  - Added authoritative viewer relationship computation (`isFounder`, `isMember`, `isApplicant`, `isInvitee`, `isVisitor`, `canAccessWorkspace`).
  - Added dynamic tab filtering (`allowedTabs`) restricting workspace tabs for non-members.
  - Added viewer relationship badges in the top bar (`Studio Founder`, `Active Member`, `Applicant`, `Invited`, `Public Visitor`).
  - Added interactive banners for pending invitations (Accept / Decline) and applications (Withdraw).
  - Added visitor sign-in CTA banner.
  - Made Open Roles recruitment role-aware (Founder edit/delete, Applicant applied indicator, Non-member apply, Visitor sign-in).
  - Added public Production Profile card on the right column for non-members, avoiding 403 Forbidden calls from `ProductionProgressCard`.
  - Guarded all protected tabs (`tasks`, `builds`, `repo`, `playtests`, `applications`) with `canAccessWorkspace` and `isFounder`.

---

## 5. Verification & Test Results

1. **Backend Tests:**
   - Command: `pnpm --filter api test`
   - Result: **All 25 test suites passed (344/344 tests passing).**
2. **Backend Build:**
   - Command: `nest build`
   - Result: **Exit code 0.**
3. **Frontend Build:**
   - Command: `pnpm --filter web run build` (`tsc -b && vite build`)
   - Result: **Exit code 0, cleanly built.**
4. **Frontend ESLint:**
   - Command: `pnpm --filter web exec eslint src/pages/ProjectDetailPage.tsx src/features/projects/types.ts`
   - Result: **0 errors, 0 warnings.**

---

## 6. Remaining Authorization Considerations

- **Direct Deep-Linking to Restricted Tabs:** If an unauthenticated user or applicant attempts to navigate to `?tab=tasks`, the URL parameter is validated against `allowedTabs`; if invalid or forbidden, it automatically defaults to `overview`.
- **Public Blueprint Drafts:** Blueprints associated with unpublished/unapproved projects remain protected by the moderation status check in `getProjectDetails` and `getBlueprint`.
