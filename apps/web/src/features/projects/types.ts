export interface PublicProjectRolePreview {
  id: string;
  title: string;
  roleName: string;
  experienceLevel: string;
  commitment: string;
}

export interface DashboardProjectItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  coverUrl?: string | null;
  status: string; // e.g. "IN_DEVELOPMENT", "PLANNING", "PROTOTYPE", "COMPLETED"
  moderationStatus: 'PENDING_REVIEW' | 'PUBLISHED' | 'REJECTED';
  genre?: string | null;
  platform?: string | null;
  gameEngine?: string | null;
  memberCount: number;
  userRole: string; // e.g. "Founder" or "Gameplay Programmer · Member"
  isFounder: boolean;
  updatedAt: string;
  founder?: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string | null;
  } | null;
  openRoleCount?: number;
  openRoles?: PublicProjectRolePreview[];
}

export interface DashboardProjectsResponse {
  projects: DashboardProjectItem[];
}

export interface CreateProjectInput {
  name: string;
  description: string;
  coverUrl?: string;
  status?: string;
  genre?: string;
  platform?: string;
  gameEngine?: string;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  coverUrl?: string;
  status?: string;
  genre?: string;
  platform?: string;
  gameEngine?: string;
}

export interface ProjectFounder {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
}

export interface ProjectMemberDetail {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  role: string;
  joinedAt: string;
}

export type ViewerRelationship =
  | 'FOUNDER'
  | 'ACTIVE_MEMBER'
  | 'APPLICANT'
  | 'INVITEE'
  | 'NON_MEMBER'
  | 'VISITOR';

export interface ViewerPendingApplication {
  id: string;
  projectRoleId: string;
  roleTitle: string;
  message?: string | null;
  createdAt: string;
}

export interface ViewerPendingInvitation {
  id: string;
  projectRoleId: string;
  roleTitle: string;
  inviterName: string;
  message?: string | null;
  createdAt: string;
}

export interface ProjectDetail {
  id: string;
  name: string;
  slug: string;
  description: string;
  coverUrl?: string | null;
  status: string;
  moderationStatus: 'PENDING_REVIEW' | 'PUBLISHED' | 'REJECTED';
  genre?: string | null;
  platform?: string | null;
  gameEngine?: string | null;
  createdAt: string;
  updatedAt: string;
  founder: ProjectFounder;
  members: ProjectMemberDetail[];
  memberCount: number;
  isFounder: boolean;
  isMember: boolean;
  viewerRelationship?: ViewerRelationship;
  viewerRole?: string | null;
  viewerPendingApplication?: ViewerPendingApplication | null;
  viewerPendingInvitation?: ViewerPendingInvitation | null;
}

export type ProjectRoleStatus = 'OPEN' | 'IN_REVIEW' | 'FILLED' | 'CLOSED';
export type ProjectRoleCommitment = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'REV_SHARE';
export type ProjectRoleExperienceLevel = 'JUNIOR' | 'MID' | 'SENIOR' | 'LEAD';

export interface ProjectRoleTaxonomyItem {
  id: string;
  name: string;
}

export interface ProjectRoleItem {
  id: string;
  projectId: string;
  roleId: string;
  roleName: string;
  title?: string | null;
  description?: string | null;
  experienceLevel: ProjectRoleExperienceLevel;
  commitment: ProjectRoleCommitment;
  status: ProjectRoleStatus;
  assignedMemberId?: string | null;
  assignedMemberName?: string | null;
  createdAt: string;
  updatedAt: string;
  requiredSkills: ProjectRoleTaxonomyItem[];
  requiredTools: ProjectRoleTaxonomyItem[];
}

export interface CreateProjectRoleInput {
  roleId: string;
  title?: string;
  description?: string;
  experienceLevel?: ProjectRoleExperienceLevel;
  commitment?: ProjectRoleCommitment;
  status?: ProjectRoleStatus;
  skillIds?: string[];
  toolIds?: string[];
}

export interface UpdateProjectRoleInput {
  roleId?: string;
  title?: string;
  description?: string;
  experienceLevel?: ProjectRoleExperienceLevel;
  commitment?: ProjectRoleCommitment;
  status?: ProjectRoleStatus;
  skillIds?: string[];
  toolIds?: string[];
}

import type { RecommendedCandidate } from './services/talentMatchingService';

export interface DraftRoleRecommendation {
  roleId: string;
  roleName: string;
  title?: string | null;
  description?: string | null;
  experienceLevel: ProjectRoleExperienceLevel;
  commitment: ProjectRoleCommitment;
  skillIds: string[];
  toolIds: string[];
  requiredSkills: ProjectRoleTaxonomyItem[];
  requiredTools: ProjectRoleTaxonomyItem[];
  reasoning: string;
  topCandidates?: RecommendedCandidate[];
}

export interface AiRoleRecommendationsResponse {
  recommendedRoles: DraftRoleRecommendation[];
}

export type ProjectMemberStatus = 'ACTIVE' | 'LEFT' | 'REMOVED';

export interface AssignedProjectRole {
  id: string;
  roleId: string;
  roleName: string;
  title?: string | null;
  experienceLevel?: string;
  commitment?: string;
  status?: string;
}

export interface ProjectActiveTeamMember {
  id: string;
  membershipId?: string;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  headline?: string | null;
  role: string;
  projectRoleId?: string | null;
  projectRoleTitle?: string | null;
  projectRoleName?: string | null;
  assignedRoles?: AssignedProjectRole[];
  joinedAt: string;
  isFounder: boolean;
}

export interface ProjectFormerTeamMember {
  id: string;
  membershipId?: string;
  userId?: string | null;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  headline?: string | null;
  role: string;
  projectRoleId?: string | null;
  projectRoleTitle?: string | null;
  projectRoleName?: string | null;
  assignedRoles?: AssignedProjectRole[];
  status: 'LEFT' | 'REMOVED';
  joinedAt: string;
  leftAt: string;
  isFounder?: boolean;
}

export interface ProjectTeamResponse {
  projectId?: string;
  activeCount?: number;
  activeMembers: ProjectActiveTeamMember[];
  formerMembers: ProjectFormerTeamMember[];
}

export type ProjectTaskMember = ProjectMemberDetail | ProjectActiveTeamMember;

export type TaskType =
  | 'FEATURE'
  | 'BUG'
  | 'ART'
  | 'AUDIO'
  | 'CODE'
  | 'DESIGN'
  | 'TEST'
  | 'OTHER';

export type TaskStatus = 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'BLOCKED' | 'DONE';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface TaskAssignee {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
}

export interface TaskMilestoneSummary {
  id: string;
  title: string;
}

export interface TaskDependencySummary {
  id: string;
  taskNumber: number;
  taskCode: string;
  title: string;
  status: TaskStatus;
}

export interface TaskCommitItem {
  id: string;
  taskId: string;
  commitHash: string;
  commitMsg: string;
  authorName: string;
  branchName: string;
  timestamp: string;
  author?: {
    id: string;
    username: string;
    avatarUrl?: string | null;
    displayName?: string | null;
  } | null;
}

export interface TaskItem {
  id: string;
  projectId: string;
  taskNumber: number;
  taskCode: string;
  title: string;
  description?: string | null;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string | null;
  blockedReason?: string | null;
  assigneeId?: string | null;
  assignee?: TaskAssignee | null;
  milestoneId?: string | null;
  milestone?: TaskMilestoneSummary | null;
  dependencies?: TaskDependencySummary[];
  dependents?: TaskDependencySummary[];
  createdAt: string;
  updatedAt: string;
}

export interface MilestoneItem {
  id: string;
  projectId: string;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  isCompleted: boolean;
  totalTasks: number;
  completedTasks: number;
  progressPercentage: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  type?: TaskType;
  priority?: TaskPriority;
  status?: TaskStatus;
  dueDate?: string;
  blockedReason?: string;
  milestoneId?: string;
  assigneeId?: string;
  dependencyTaskIds?: string[];
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  type?: TaskType;
  priority?: TaskPriority;
  status?: TaskStatus;
  dueDate?: string | null;
  blockedReason?: string | null;
  milestoneId?: string | null;
  assigneeId?: string | null;
  dependencyTaskIds?: string[];
}

export interface CreateMilestoneInput {
  title: string;
  description?: string;
  dueDate?: string;
}

export interface UpdateMilestoneInput {
  title?: string;
  description?: string;
  dueDate?: string;
  isCompleted?: boolean;
}

export type BuildStatus = 'QUEUED' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
export type BuildPlatform = 'WINDOWS' | 'MAC' | 'LINUX' | 'WEBGL';

export interface BuildTriggeredByUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
}

export interface BuildMilestoneInfo {
  id: string;
  title: string;
}

export interface BuildRunnerInfo {
  id: string;
  name: string;
  platform: BuildPlatform;
  isOnline: boolean;
}

export interface BuildJobItem {
  id: string;
  projectId: string;
  buildRunnerId?: string | null;
  commitHash?: string | null;
  branchName?: string | null;
  targetPlatform: BuildPlatform;
  status: BuildStatus;
  triggeredById: string;
  triggeredBy: BuildTriggeredByUser;
  milestoneId?: string | null;
  milestone?: BuildMilestoneInfo | null;
  buildRunner?: BuildRunnerInfo | null;
  buildLogs?: string | null;
  errorMessage?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  durationSeconds?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface PlayableBuildItem {
  id: string;
  projectId: string;
  buildJobId?: string | null;
  milestoneId?: string | null;
  milestone?: BuildMilestoneInfo | null;
  version: string;
  title: string;
  platform: BuildPlatform;
  storagePath?: string | null;
  fileSizeBytes?: number | null;
  fileChecksum?: string | null;
  releaseNotes?: string | null;
  uploadedById?: string | null;
  uploadedBy?: BuildTriggeredByUser | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBuildInput {
  targetPlatform: BuildPlatform;
  branchName?: string;
  commitHash?: string;
  milestoneId?: string;
}

export interface CreatePlayableBuildInput {
  version: string;
  title: string;
  platform: BuildPlatform;
  buildJobId?: string;
  milestoneId?: string;
  storagePath?: string;
  fileSizeBytes?: number;
  fileChecksum?: string;
  releaseNotes?: string;
}

export interface PlaytestSession {
  id: string;
  title: string;
  instructions?: string | null;
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  playableBuild?: {
    id?: string;
    version: string;
    platform: string;
    title: string;
    fileSizeBytes?: string | null;
    buildJob?: { commitHash?: string };
  } | null;
  _count: {
    feedback: number;
  };
  createdAt: string;
}

export interface GamePillar {
  title: string;
  description: string;
}

export interface GameFeature {
  title: string;
  description: string;
  category?: 'GAMEPLAY' | 'TECHNICAL' | 'ART' | 'AUDIO' | string;
}

export interface ColorSwatch {
  hex: string;
  name: string;
  role: 'DOMINANT' | 'SECONDARY' | 'ACCENT' | 'HIGHLIGHT' | 'SHADOW';
}

export interface VisualDirection {
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

export interface GameplayLoopStep {
  stepNumber: number;
  phase: string;
  title: string;
  description: string;
  pacing?: string;
}

export interface GameplayLoopData {
  summary: string;
  steps: GameplayLoopStep[];
  generatedAt?: string;
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

export interface ProductionPlanDraft {
  summary: string;
  targetMilestoneTitle: string;
  estimatedWeeks: number;
  systems: ProductionPlanSystemDraft[];
  generatedAt: string;
}

export interface ApproveProductionPlanInput {
  milestoneTitle: string;
  milestoneDescription?: string;
  tasks: Array<{
    tempId: string;
    title: string;
    description?: string;
    type?: string;
    priority?: string;
    discipline?: string;
    dependsOnTempIds?: string[];
  }>;
}

export interface ApproveProductionPlanResult {
  milestoneId: string;
  milestoneTitle: string;
  taskCount: number;
  tasks: Array<{
    id: string;
    taskNumber: number;
    taskCode: string;
    title: string;
  }>;
}

export interface SkillCoverageMember {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  matchedSkills: string[];
}

export interface SkillCoverageOpenRole {
  id: string;
  title: string;
  openPositions: number;
  skills: string[];
}

export interface SkillCoverageCandidate {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  headline: string | null;
  matchScore: number;
}

export interface SkillCoverageDiscipline {
  discipline: string;
  status: 'COVERED' | 'RECRUITING' | 'GAP';
  requiredSkills: string[];
  coveredByMembers: SkillCoverageMember[];
  openRoles: SkillCoverageOpenRole[];
  recommendedCandidatesCount: number;
  sampleCandidate?: SkillCoverageCandidate | null;
}

export interface SkillCoverageData {
  totalRequiredSkills: number;
  coveredCount: number;
  recruitingCount: number;
  gapCount: number;
  coveragePercentage: number;
  disciplines: SkillCoverageDiscipline[];
}

export interface StoryFaction {
  id: string;
  name: string;
  description: string;
  alignment?: string;
  leader?: string;
  ideals?: string;
}

export interface StoryTimelineEra {
  id: string;
  era: string;
  title: string;
  description: string;
  impact?: string;
}

export interface StoryBible {
  summary: string;
  themes: string[];
  worldLore: string;
  settingRules: string;
  factions: StoryFaction[];
  timeline: StoryTimelineEra[];
}

export interface CharacterRelationship {
  targetCharacterId: string;
  targetCharacterName: string;
  relationshipType: string;
  details: string;
}

export interface CharacterCodexEntry {
  id: string;
  name: string;
  archetype: string;
  role: 'PROTAGONIST' | 'ANTAGONIST' | 'SUPPORTING' | 'FACTION_LEADER' | 'NPC';
  backstory: string;
  motivation: string;
  goal: string;
  conflict: string;
  arc: string;
  relationships: CharacterRelationship[];
}

export interface ScreenplayDialogueLine {
  id: string;
  characterName: string;
  parenthetical?: string;
  dialogue: string;
}

export interface ScreenplaySlugline {
  intExt: 'INT' | 'EXT' | 'INT/EXT';
  location: string;
  timeOfDay: 'DAY' | 'NIGHT' | 'DUSK' | 'DAWN' | 'CONTINUOUS';
}

export interface ScreenplayScene {
  id: string;
  sceneNumber: number;
  title: string;
  slugline: ScreenplaySlugline;
  summary: string;
  actionDirections: string;
  dialogueLines: ScreenplayDialogueLine[];
  notes?: string;
  isDraft?: boolean;
}

export interface QuestChoice {
  id: string;
  text: string;
  consequence: string;
  targetNodeId?: string;
}

export interface QuestNode {
  id: string;
  title: string;
  act: string;
  type: 'START' | 'CHOICE' | 'OBJECTIVE' | 'CONSEQUENCE' | 'ENDING';
  description: string;
  choices: QuestChoice[];
  objectives: string[];
  isDraft?: boolean;
}

export interface NarrativeData {
  storyBible: StoryBible;
  characters: CharacterCodexEntry[];
  scenes: ScreenplayScene[];
  quests: QuestNode[];
  updatedAt?: string;
}

export interface NarrativeAiProposal {
  section: 'STORY_BIBLE' | 'CHARACTERS' | 'SCENE' | 'QUEST';
  draft: any;
  continuityNotes: string[];
  generatedAt: string;
}

export interface GameBlueprint {
  id: string;
  projectId: string;
  tagline?: string | null;
  targetAudience?: string | null;
  cameraPerspective?: string | null;
  artStyle?: string | null;
  audioTone?: string | null;
  networkModel?: string | null;
  targetFps?: number | null;
  targetResolution?: string | null;
  coreLoop?: string | null;
  summary?: string | null;
  pillars?: GamePillar[] | null;
  keyFeatures?: GameFeature[] | null;
  targetSpecs?: Record<string, unknown> | null;
  visualDirection?: VisualDirection | null;
  gameplayLoop?: GameplayLoopData | null;
  narrative?: NarrativeData | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertGameBlueprintInput {
  tagline?: string;
  targetAudience?: string;
  cameraPerspective?: string;
  artStyle?: string;
  audioTone?: string;
  networkModel?: string;
  targetFps?: number;
  targetResolution?: string;
  coreLoop?: string;
  summary?: string;
  pillars?: GamePillar[];
  keyFeatures?: GameFeature[];
  targetSpecs?: Record<string, unknown>;
  visualDirection?: VisualDirection;
  gameplayLoop?: GameplayLoopData;
  narrative?: NarrativeData;
}

export type ArtProposalCategory =
  | 'CHARACTERS_COSTUMES'
  | 'ENVIRONMENTS_ARCHITECTURE'
  | 'PROPS_WEAPONS'
  | 'UI_ICONS'
  | 'LIGHTING_COLOR';

export type ArtProposalStatus =
  | 'DRAFT'
  | 'IN_VOTING'
  | 'REVISION_REQUESTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'ARCHIVED';

export type ArtVoteType = 'APPROVE' | 'DISAPPROVE' | 'NEUTRAL';

export type DesignAssetCategory =
  | 'CHARACTERS_COSTUMES'
  | 'ENVIRONMENTS_ARCHITECTURE'
  | 'PROPS_WEAPONS'
  | 'UI_ICONS'
  | 'LIGHTING_COLOR';

export type DesignAssetStatus = 'PROPOSED' | 'APPROVED' | 'ARCHIVED';

export interface ArtProposalVoteSummary {
  approveCount: number;
  disapproveCount: number;
  neutralCount: number;
  totalVotes: number;
  eligibleVoters: number;
  participationRate: number;
}

export interface ArtProposalVoteDetail {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  round: number;
  voteType: ArtVoteType;
  feedback?: string | null;
  createdAt: string;
}

export interface ArtProposalCommentItem {
  id: string;
  authorId: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
  content: string;
  createdAt: string;
}

export interface ArtProposalRevision {
  round: number;
  revisionNotes: string;
  revisedBy: string;
  revisedAt: string;
  votesSummary: {
    approve: number;
    disapprove: number;
    neutral: number;
    total: number;
  };
}

export interface ArtProposalItem {
  id: string;
  projectId: string;
  authorId: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
  title: string;
  category: ArtProposalCategory;
  status: ArtProposalStatus;
  rationale: string;
  designNotes?: string | null;
  paletteColors?: ColorSwatch[];
  referenceImages?: Array<{ url: string; name?: string; size?: string }>;
  currentRound: number;
  founderDecision?: string | null;
  decisionNotes?: string | null;
  decidedAt?: string | null;
  createdTaskId?: string | null;
  createdTask?: {
    id: string;
    taskCode: string;
    taskNumber: number;
    title: string;
    status: string;
  } | null;
  revisions?: ArtProposalRevision[];
  commentsCount?: number;
  voteSummary: ArtProposalVoteSummary;
  currentRoundVotes?: ArtProposalVoteDetail[];
  comments?: ArtProposalCommentItem[];
  userVote?: {
    voteType: ArtVoteType;
    feedback?: string | null;
    createdAt: string;
  } | null;
  isFounder?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DesignAssetItem {
  id: string;
  projectId: string;
  authorId: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
  title: string;
  category: DesignAssetCategory;
  status: DesignAssetStatus;
  description?: string | null;
  fileUrl: string;
  thumbnailUrl: string;
  tags: string[];
  sourceDetails?: string | null;
  creatorDetails?: string | null;
  licenseDetails?: string | null;
  paletteColors?: ColorSwatch[];
  proposalId?: string | null;
  proposal?: {
    id: string;
    title: string;
    status: string;
  } | null;
  createdTaskId?: string | null;
  createdTask?: {
    id: string;
    taskCode: string;
    taskNumber: number;
    title: string;
    status: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}
