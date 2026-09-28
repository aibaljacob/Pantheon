import { create } from 'zustand';
import type {
  BuildJobItem,
  MilestoneItem,
  PlayableBuildItem,
  PlaytestSession,
  ProjectActiveTeamMember,
  ProjectFormerTeamMember,
  ProjectRoleItem,
  TaskItem,
} from '../types';
import type { ProjectRepositoryData } from '../services/projectRepositoryService';
import type { FounderApplicationDetail } from '../services/projectApplicationService';

export interface ProjectWorkspaceData {
  team?: {
    activeMembers: ProjectActiveTeamMember[];
    formerMembers: ProjectFormerTeamMember[];
  };
  roles?: ProjectRoleItem[];
  tasks?: TaskItem[];
  milestones?: MilestoneItem[];
  repository?: Record<string, ProjectRepositoryData>;
  builds?: BuildJobItem[];
  playableBuilds?: PlayableBuildItem[];
  playtests?: PlaytestSession[];
  applications?: FounderApplicationDetail[];
}

interface WorkspaceStoreState {
  projects: Record<string, ProjectWorkspaceData>;

  // Data Setters
  setTeam: (
    projectId: string,
    team: { activeMembers: ProjectActiveTeamMember[]; formerMembers: ProjectFormerTeamMember[] },
  ) => void;
  setRoles: (projectId: string, roles: ProjectRoleItem[]) => void;
  setTasks: (projectId: string, tasks: TaskItem[]) => void;
  setMilestones: (projectId: string, milestones: MilestoneItem[]) => void;
  setRepository: (projectId: string, branch: string, data: ProjectRepositoryData) => void;
  setBuilds: (projectId: string, builds: BuildJobItem[]) => void;
  setPlayableBuilds: (projectId: string, playableBuilds: PlayableBuildItem[]) => void;
  setPlaytests: (projectId: string, playtests: PlaytestSession[]) => void;
  setApplications: (projectId: string, applications: FounderApplicationDetail[]) => void;

  // Invalidation / Reset Actions
  invalidateTeam: (projectId: string) => void;
  invalidateRoles: (projectId: string) => void;
  invalidateTasks: (projectId: string) => void;
  invalidateMilestones: (projectId: string) => void;
  invalidateRepository: (projectId: string, branch?: string) => void;
  invalidateBuilds: (projectId: string) => void;
  invalidatePlaytests: (projectId: string) => void;
  invalidateApplications: (projectId: string) => void;
  clearProject: (projectId: string) => void;

  // Granular Task / Milestone Mutators
  addTask: (projectId: string, task: TaskItem) => void;
  updateTask: (projectId: string, task: TaskItem) => void;
  removeTask: (projectId: string, taskId: string) => void;
  setTaskMilestones: (projectId: string, milestones: MilestoneItem[]) => void;

  // Granular Build Mutators
  addBuild: (projectId: string, build: BuildJobItem) => void;
  updateBuild: (projectId: string, build: BuildJobItem) => void;
  addPlayableBuild: (projectId: string, build: PlayableBuildItem) => void;

  // Granular Playtest Mutators
  addPlaytest: (projectId: string, playtest: PlaytestSession) => void;
}

// In-flight promise registry to deduplicate simultaneous identical requests
const inFlightRequests = new Map<string, Promise<unknown>>();

export function dedupeRequest<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const existing = inFlightRequests.get(key);
  if (existing) {
    return existing as Promise<T>;
  }

  const promise = fn().finally(() => {
    inFlightRequests.delete(key);
  });

  inFlightRequests.set(key, promise);
  return promise;
}

export const useWorkspaceStore = create<WorkspaceStoreState>()((set) => ({
  projects: {},

  setTeam: (projectId, team) =>
    set((state) => ({
      projects: {
        ...state.projects,
        [projectId]: {
          ...state.projects[projectId],
          team,
        },
      },
    })),

  setRoles: (projectId, roles) =>
    set((state) => ({
      projects: {
        ...state.projects,
        [projectId]: {
          ...state.projects[projectId],
          roles,
        },
      },
    })),

  setTasks: (projectId, tasks) =>
    set((state) => ({
      projects: {
        ...state.projects,
        [projectId]: {
          ...state.projects[projectId],
          tasks,
        },
      },
    })),

  setMilestones: (projectId, milestones) =>
    set((state) => ({
      projects: {
        ...state.projects,
        [projectId]: {
          ...state.projects[projectId],
          milestones,
        },
      },
    })),

  setRepository: (projectId, branch, data) =>
    set((state) => ({
      projects: {
        ...state.projects,
        [projectId]: {
          ...state.projects[projectId],
          repository: {
            ...(state.projects[projectId]?.repository || {}),
            [branch]: data,
          },
        },
      },
    })),

  setBuilds: (projectId, builds) =>
    set((state) => ({
      projects: {
        ...state.projects,
        [projectId]: {
          ...state.projects[projectId],
          builds,
        },
      },
    })),

  setPlayableBuilds: (projectId, playableBuilds) =>
    set((state) => ({
      projects: {
        ...state.projects,
        [projectId]: {
          ...state.projects[projectId],
          playableBuilds,
        },
      },
    })),

  setPlaytests: (projectId, playtests) =>
    set((state) => ({
      projects: {
        ...state.projects,
        [projectId]: {
          ...state.projects[projectId],
          playtests,
        },
      },
    })),

  setApplications: (projectId, applications) =>
    set((state) => ({
      projects: {
        ...state.projects,
        [projectId]: {
          ...state.projects[projectId],
          applications,
        },
      },
    })),

  invalidateTeam: (projectId) =>
    set((state) => {
      const project = state.projects[projectId];
      if (!project) return state;
      const updated = { ...project };
      delete updated.team;
      return {
        projects: { ...state.projects, [projectId]: updated },
      };
    }),

  invalidateRoles: (projectId) =>
    set((state) => {
      const project = state.projects[projectId];
      if (!project) return state;
      const updated = { ...project };
      delete updated.roles;
      return {
        projects: { ...state.projects, [projectId]: updated },
      };
    }),

  invalidateTasks: (projectId) =>
    set((state) => {
      const project = state.projects[projectId];
      if (!project) return state;
      const updated = { ...project };
      delete updated.tasks;
      return {
        projects: { ...state.projects, [projectId]: updated },
      };
    }),

  invalidateMilestones: (projectId) =>
    set((state) => {
      const project = state.projects[projectId];
      if (!project) return state;
      const updated = { ...project };
      delete updated.milestones;
      return {
        projects: { ...state.projects, [projectId]: updated },
      };
    }),

  invalidateRepository: (projectId, branch) =>
    set((state) => {
      const project = state.projects[projectId];
      if (!project || !project.repository) return state;
      if (branch) {
        const updatedRepo = { ...project.repository };
        delete updatedRepo[branch];
        return {
          projects: {
            ...state.projects,
            [projectId]: { ...project, repository: updatedRepo },
          },
        };
      }
      const updated = { ...project };
      delete updated.repository;
      return {
        projects: { ...state.projects, [projectId]: updated },
      };
    }),

  invalidateBuilds: (projectId) =>
    set((state) => {
      const project = state.projects[projectId];
      if (!project) return state;
      const updated = { ...project };
      delete updated.builds;
      delete updated.playableBuilds;
      return {
        projects: { ...state.projects, [projectId]: updated },
      };
    }),

  invalidatePlaytests: (projectId) =>
    set((state) => {
      const project = state.projects[projectId];
      if (!project) return state;
      const updated = { ...project };
      delete updated.playtests;
      return {
        projects: { ...state.projects, [projectId]: updated },
      };
    }),

  invalidateApplications: (projectId) =>
    set((state) => {
      const project = state.projects[projectId];
      if (!project) return state;
      const updated = { ...project };
      delete updated.applications;
      return {
        projects: { ...state.projects, [projectId]: updated },
      };
    }),

  clearProject: (projectId) =>
    set((state) => {
      const updated = { ...state.projects };
      delete updated[projectId];
      return { projects: updated };
    }),

  addTask: (projectId, task) =>
    set((state) => {
      const currentTasks = state.projects[projectId]?.tasks || [];
      return {
        projects: {
          ...state.projects,
          [projectId]: {
            ...state.projects[projectId],
            tasks: [task, ...currentTasks.filter((t) => t.id !== task.id)],
          },
        },
      };
    }),

  updateTask: (projectId, task) =>
    set((state) => {
      const currentTasks = state.projects[projectId]?.tasks || [];
      return {
        projects: {
          ...state.projects,
          [projectId]: {
            ...state.projects[projectId],
            tasks: currentTasks.map((t) => (t.id === task.id ? task : t)),
          },
        },
      };
    }),

  removeTask: (projectId, taskId) =>
    set((state) => {
      const currentTasks = state.projects[projectId]?.tasks || [];
      return {
        projects: {
          ...state.projects,
          [projectId]: {
            ...state.projects[projectId],
            tasks: currentTasks.filter((t) => t.id !== taskId),
          },
        },
      };
    }),

  setTaskMilestones: (projectId, milestones) =>
    set((state) => ({
      projects: {
        ...state.projects,
        [projectId]: {
          ...state.projects[projectId],
          milestones,
        },
      },
    })),

  addBuild: (projectId, build) =>
    set((state) => {
      const currentBuilds = state.projects[projectId]?.builds || [];
      return {
        projects: {
          ...state.projects,
          [projectId]: {
            ...state.projects[projectId],
            builds: [build, ...currentBuilds.filter((b) => b.id !== build.id)],
          },
        },
      };
    }),

  updateBuild: (projectId, build) =>
    set((state) => {
      const currentBuilds = state.projects[projectId]?.builds || [];
      return {
        projects: {
          ...state.projects,
          [projectId]: {
            ...state.projects[projectId],
            builds: currentBuilds.map((b) => (b.id === build.id ? build : b)),
          },
        },
      };
    }),

  addPlayableBuild: (projectId, build) =>
    set((state) => {
      const currentPlayables = state.projects[projectId]?.playableBuilds || [];
      return {
        projects: {
          ...state.projects,
          [projectId]: {
            ...state.projects[projectId],
            playableBuilds: [build, ...currentPlayables.filter((p) => p.id !== build.id)],
          },
        },
      };
    }),

  addPlaytest: (projectId, playtest) =>
    set((state) => {
      const currentPlaytests = state.projects[projectId]?.playtests || [];
      return {
        projects: {
          ...state.projects,
          [projectId]: {
            ...state.projects[projectId],
            playtests: [playtest, ...currentPlaytests.filter((p) => p.id !== playtest.id)],
          },
        },
      };
    }),
}));
