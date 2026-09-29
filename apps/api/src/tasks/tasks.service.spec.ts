import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { MilestonesService } from './milestones.service';
import { ProjectAuthorizationService } from './project-authorization.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  Prisma,
  ProjectMemberStatus,
  ProjectModerationStatus,
  Role,
  TaskPriority,
  TaskStatus,
  TaskType,
} from '@prisma/client';

describe('Tasks & Milestones Module', () => {
  let tasksService: TasksService;
  let milestonesService: MilestonesService;
  let authzService: ProjectAuthorizationService;
  let prismaMock: any;

  const mockProjectId = 'project-uuid-1';
  const mockFounderId = 'founder-uuid-1';
  const mockMemberId = 'member-uuid-2';
  const mockRemovedMemberId = 'removed-member-uuid-3';
  const mockUnrelatedUserId = 'unrelated-user-uuid-4';
  const mockAdminId = 'admin-uuid-5';

  const mockProject = {
    id: mockProjectId,
    slug: 'cyber-odyssey',
    founderId: mockFounderId,
    moderationStatus: ProjectModerationStatus.PUBLISHED,
    members: [
      { userId: mockMemberId, status: ProjectMemberStatus.ACTIVE },
      { userId: mockRemovedMemberId, status: ProjectMemberStatus.REMOVED },
    ],
  };

  beforeEach(async () => {
    prismaMock = {
      project: {
        findFirst: jest.fn().mockImplementation((args: any) => {
          if (
            args.where?.OR?.some(
              (cond: any) =>
                cond.id === mockProjectId || cond.slug === mockProjectId,
            )
          ) {
            return Promise.resolve(mockProject);
          }
          return Promise.resolve(null);
        }),
        findUnique: jest.fn().mockImplementation((args: any) => {
          if (args.where?.id === mockProjectId) {
            return Promise.resolve({
              founderId: mockFounderId,
              members: [{ status: ProjectMemberStatus.ACTIVE }],
            });
          }
          return Promise.resolve(null);
        }),
      },
      task: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        delete: jest.fn(),
      },
      taskDependency: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        createMany: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
      },
      milestone: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      $transaction: jest.fn(
        async (cb: (prisma: typeof prismaMock) => Promise<unknown>) =>
          await cb(prismaMock),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        MilestonesService,
        ProjectAuthorizationService,
        { provide: PrismaService, useValue: prismaMock },
        {
          provide: NotificationsService,
          useValue: {
            createNotification: jest.fn().mockResolvedValue({}),
          },
        },
      ],
    }).compile();

    tasksService = module.get<TasksService>(TasksService);
    milestonesService = module.get<MilestonesService>(MilestonesService);
    authzService = module.get<ProjectAuthorizationService>(
      ProjectAuthorizationService,
    );
  });

  // ==========================================
  // TASKS TESTS
  // ==========================================
  describe('TasksService', () => {
    it('1. should create a task with default TODO and MEDIUM priority', async () => {
      prismaMock.task.findFirst.mockResolvedValueOnce(null); // No previous task
      prismaMock.task.create.mockResolvedValueOnce({
        id: 'task-1',
        projectId: mockProjectId,
        taskNumber: 1,
        title: 'Initial player movement',
        description: 'Implement WASD controller',
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        assigneeId: null,
        milestoneId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await tasksService.createTask(
        mockProjectId,
        {
          title: 'Initial player movement',
          description: 'Implement WASD controller',
        },
        mockFounderId,
      );

      expect(result.taskNumber).toBe(1);
      expect(result.taskCode).toBe('TASK-1');
      expect(result.status).toBe(TaskStatus.TODO);
      expect(result.priority).toBe(TaskPriority.MEDIUM);
    });

    it('2. should generate next project-scoped task number sequentially', async () => {
      prismaMock.task.findFirst.mockResolvedValueOnce({ taskNumber: 15 });
      prismaMock.task.create.mockResolvedValueOnce({
        id: 'task-16',
        projectId: mockProjectId,
        taskNumber: 16,
        title: 'Fix player collision',
        status: TaskStatus.TODO,
        priority: TaskPriority.HIGH,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await tasksService.createTask(
        mockProjectId,
        { title: 'Fix player collision', priority: TaskPriority.HIGH },
        mockFounderId,
      );

      expect(result.taskNumber).toBe(16);
      expect(result.taskCode).toBe('TASK-16');
    });

    it('3. should handle unique constraint collision and retry', async () => {
      prismaMock.task.findFirst
        .mockResolvedValueOnce({ taskNumber: 5 })
        .mockResolvedValueOnce({ taskNumber: 6 });

      const p2002Error = new Prisma.PrismaClientKnownRequestError('Collision', {
        code: 'P2002',
        clientVersion: '6.19.3',
      });

      prismaMock.task.create
        .mockRejectedValueOnce(p2002Error)
        .mockResolvedValueOnce({
          id: 'task-7',
          projectId: mockProjectId,
          taskNumber: 7,
          title: 'Collision resolved task',
          status: TaskStatus.TODO,
          priority: TaskPriority.MEDIUM,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

      const result = await tasksService.createTask(
        mockProjectId,
        { title: 'Collision resolved task' },
        mockFounderId,
      );

      expect(result.taskNumber).toBe(7);
      expect(result.taskCode).toBe('TASK-7');
    });

    it('4. should get all project tasks', async () => {
      prismaMock.task.findMany.mockResolvedValueOnce([
        {
          id: 'task-1',
          projectId: mockProjectId,
          taskNumber: 1,
          title: 'Task 1',
          status: TaskStatus.TODO,
          priority: TaskPriority.MEDIUM,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const tasks = await tasksService.getTasks(
        mockProjectId,
        {},
        mockMemberId,
      );
      expect(tasks).toHaveLength(1);
      expect(tasks[0].taskCode).toBe('TASK-1');
    });

    it('5. should filter tasks by status', async () => {
      prismaMock.task.findMany.mockResolvedValueOnce([]);

      await tasksService.getTasks(
        mockProjectId,
        { status: TaskStatus.IN_PROGRESS },
        mockFounderId,
      );

      expect(prismaMock.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: TaskStatus.IN_PROGRESS }),
        }),
      );
    });

    it('6. should filter tasks by priority', async () => {
      prismaMock.task.findMany.mockResolvedValueOnce([]);

      await tasksService.getTasks(
        mockProjectId,
        { priority: TaskPriority.CRITICAL },
        mockFounderId,
      );

      expect(prismaMock.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ priority: TaskPriority.CRITICAL }),
        }),
      );
    });

    it('7. should filter tasks by assignee', async () => {
      prismaMock.task.findMany.mockResolvedValueOnce([]);

      await tasksService.getTasks(
        mockProjectId,
        { assigneeId: mockMemberId },
        mockFounderId,
      );

      expect(prismaMock.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ assigneeId: mockMemberId }),
        }),
      );
    });

    it('8. should update task details', async () => {
      prismaMock.task.findFirst.mockResolvedValueOnce({
        id: 'task-1',
        projectId: mockProjectId,
        assigneeId: mockFounderId,
      });
      prismaMock.task.update.mockResolvedValueOnce({
        id: 'task-1',
        projectId: mockProjectId,
        taskNumber: 1,
        title: 'Updated title',
        description: 'Updated desc',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const updated = await tasksService.updateTask(
        mockProjectId,
        'task-1',
        { title: 'Updated title', description: 'Updated desc' },
        mockFounderId,
      );

      expect(updated.title).toBe('Updated title');
    });

    it('9. should update task status', async () => {
      prismaMock.task.findFirst.mockResolvedValueOnce({
        id: 'task-1',
        projectId: mockProjectId,
        assigneeId: mockMemberId,
      });
      prismaMock.task.update.mockResolvedValueOnce({
        id: 'task-1',
        projectId: mockProjectId,
        taskNumber: 1,
        title: 'Task 1',
        status: TaskStatus.DONE,
        priority: TaskPriority.MEDIUM,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const updated = await tasksService.updateTaskStatus(
        mockProjectId,
        'task-1',
        TaskStatus.DONE,
        mockMemberId,
      );

      expect(updated.status).toBe(TaskStatus.DONE);
    });

    it('10. should assign task to an active project member', async () => {
      prismaMock.task.findFirst.mockResolvedValueOnce({
        id: 'task-1',
        projectId: mockProjectId,
      });
      prismaMock.project.findUnique.mockResolvedValueOnce({
        founderId: mockFounderId,
        members: [{ status: ProjectMemberStatus.ACTIVE }],
      });
      prismaMock.task.update.mockResolvedValueOnce({
        id: 'task-1',
        projectId: mockProjectId,
        taskNumber: 1,
        title: 'Task 1',
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        assigneeId: mockMemberId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const updated = await tasksService.updateTaskAssignee(
        mockProjectId,
        'task-1',
        mockMemberId,
        mockFounderId,
      );

      expect(updated.assigneeId).toBe(mockMemberId);
    });

    it('11. should reject assignment to a non-member', async () => {
      prismaMock.project.findUnique.mockResolvedValueOnce({
        founderId: mockFounderId,
        members: [], // User not a member
      });

      await expect(
        tasksService.createTask(
          mockProjectId,
          { title: 'Task with invalid user', assigneeId: 'random-user-id' },
          mockFounderId,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('12. should reject assignment to a removed member', async () => {
      prismaMock.project.findUnique.mockResolvedValueOnce({
        founderId: mockFounderId,
        members: [{ status: ProjectMemberStatus.REMOVED }],
      });

      await expect(
        tasksService.createTask(
          mockProjectId,
          { title: 'Task with removed user', assigneeId: mockRemovedMemberId },
          mockFounderId,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('13. should delete task', async () => {
      prismaMock.task.findFirst.mockResolvedValueOnce({
        id: 'task-1',
        projectId: mockProjectId,
      });
      prismaMock.task.delete.mockResolvedValueOnce({ id: 'task-1' });

      const res = await tasksService.deleteTask(
        mockProjectId,
        'task-1',
        mockFounderId,
      );
      expect(res.success).toBe(true);
    });

    it('14. should reject unauthorized project access on task retrieval', async () => {
      await expect(
        tasksService.getTasks(mockProjectId, {}, mockUnrelatedUserId),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ==========================================
  // MILESTONES TESTS
  // ==========================================
  describe('MilestonesService', () => {
    it('15. should create a milestone', async () => {
      prismaMock.milestone.create.mockResolvedValueOnce({
        id: 'ms-1',
        projectId: mockProjectId,
        title: 'Pre-Production Milestone',
        description: 'Complete concept art and core mechanics',
        dueDate: new Date('2026-12-31'),
        isCompleted: false,
        tasks: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const milestone = await milestonesService.createMilestone(
        mockProjectId,
        {
          title: 'Pre-Production Milestone',
          description: 'Complete concept art and core mechanics',
          dueDate: '2026-12-31',
        },
        mockFounderId,
      );

      expect(milestone.id).toBe('ms-1');
      expect(milestone.title).toBe('Pre-Production Milestone');
      expect(milestone.progressPercentage).toBe(0);
      expect(milestone.totalTasks).toBe(0);
    });

    it('16. should get milestones with task progress statistics', async () => {
      prismaMock.milestone.findMany.mockResolvedValueOnce([
        {
          id: 'ms-1',
          projectId: mockProjectId,
          title: 'Core Mechanics',
          description: null,
          dueDate: null,
          isCompleted: false,
          tasks: [
            { id: 't1', status: TaskStatus.DONE },
            { id: 't2', status: TaskStatus.DONE },
            { id: 't3', status: TaskStatus.IN_PROGRESS },
            { id: 't4', status: TaskStatus.TODO },
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const milestones = await milestonesService.getMilestones(
        mockProjectId,
        mockMemberId,
      );

      expect(milestones).toHaveLength(1);
      expect(milestones[0].totalTasks).toBe(4);
      expect(milestones[0].completedTasks).toBe(2);
      expect(milestones[0].progressPercentage).toBe(50);
    });

    it('17. should calculate 100% progress when all tasks are complete', async () => {
      prismaMock.milestone.findFirst.mockResolvedValueOnce({
        id: 'ms-1',
        projectId: mockProjectId,
        title: 'Vertical Slice',
        isCompleted: true,
        tasks: [
          { id: 't1', status: TaskStatus.DONE },
          { id: 't2', status: TaskStatus.DONE },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const ms = await milestonesService.getMilestone(
        mockProjectId,
        'ms-1',
        mockMemberId,
      );
      expect(ms.progressPercentage).toBe(100);
      expect(ms.completedTasks).toBe(2);
    });

    it('18. should update milestone details', async () => {
      prismaMock.milestone.findFirst.mockResolvedValueOnce({
        id: 'ms-1',
        projectId: mockProjectId,
      });
      prismaMock.milestone.update.mockResolvedValueOnce({
        id: 'ms-1',
        projectId: mockProjectId,
        title: 'Updated Milestone',
        description: 'New notes',
        dueDate: null,
        isCompleted: true,
        tasks: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const updated = await milestonesService.updateMilestone(
        mockProjectId,
        'ms-1',
        { title: 'Updated Milestone', isCompleted: true },
        mockFounderId,
      );

      expect(updated.title).toBe('Updated Milestone');
      expect(updated.isCompleted).toBe(true);
    });

    it('19. should delete milestone and unlink its tasks', async () => {
      prismaMock.milestone.findFirst.mockResolvedValueOnce({
        id: 'ms-1',
        projectId: mockProjectId,
      });
      prismaMock.task.updateMany.mockResolvedValueOnce({ count: 5 });
      prismaMock.milestone.delete.mockResolvedValueOnce({ id: 'ms-1' });

      const res = await milestonesService.deleteMilestone(
        mockProjectId,
        'ms-1',
        mockFounderId,
      );

      expect(res.success).toBe(true);
      expect(prismaMock.task.updateMany).toHaveBeenCalledWith({
        where: { milestoneId: 'ms-1' },
        data: { milestoneId: null },
      });
    });

    it('20. should reject unauthorized project access on milestone creation', async () => {
      await expect(
        milestonesService.createMilestone(
          mockProjectId,
          { title: 'Illegal Milestone' },
          mockUnrelatedUserId,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ==========================================
  // ACCESS CONTROL TESTS
  // ==========================================
  describe('Project Access Control Rules', () => {
    it('21. should permit Founder full management access', async () => {
      const access = await authzService.assertCanManage(
        mockProjectId,
        mockFounderId,
      );
      expect(access.isFounder).toBe(true);
    });

    it('22. should permit Administrator full management access', async () => {
      const access = await authzService.assertCanManage(
        mockProjectId,
        mockAdminId,
        Role.ADMINISTRATOR,
      );
      expect(access.isAdmin).toBe(true);
    });

    it('23. should permit Active Member to view but not manage milestones', async () => {
      const viewAccess = await authzService.assertCanView(
        mockProjectId,
        mockMemberId,
      );
      expect(viewAccess.isMember).toBe(true);

      await expect(
        authzService.assertCanManage(mockProjectId, mockMemberId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('24. should deny Removed Member all project access', async () => {
      await expect(
        authzService.assertCanView(mockProjectId, mockRemovedMemberId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('25. should automatically unassign tasks when member leaves or is removed', async () => {
      prismaMock.task.updateMany.mockResolvedValueOnce({ count: 3 });

      await tasksService.unassignTasksForMember(mockProjectId, mockMemberId);

      expect(prismaMock.task.updateMany).toHaveBeenCalledWith({
        where: {
          projectId: mockProjectId,
          assigneeId: mockMemberId,
        },
        data: {
          assigneeId: null,
        },
      });
    });
  });

  // ==========================================
  // PRODUCTION TASK UPGRADE TESTS
  // ==========================================
  describe('Production Task Upgrade: Type, Due Date, Dependencies, Blocked Reason', () => {
    const baseMockTask = {
      id: 'task-1',
      projectId: mockProjectId,
      taskNumber: 1,
      title: 'Core Engine Loop',
      description: 'Implement main tick',
      type: TaskType.FEATURE,
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      dueDate: null,
      blockedReason: null,
      assigneeId: null,
      milestoneId: null,
      dependencies: [],
      dependents: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('26. should create a task with specific task type (e.g. BUG, AUDIO) and update task type', async () => {
      prismaMock.task.findFirst.mockResolvedValueOnce(null);
      prismaMock.task.create.mockResolvedValueOnce({
        ...baseMockTask,
        type: TaskType.BUG,
        title: 'Fix sound crackling',
      });

      const created = await tasksService.createTask(
        mockProjectId,
        {
          title: 'Fix sound crackling',
          type: TaskType.BUG,
        },
        mockFounderId,
      );

      expect(created.type).toBe(TaskType.BUG);

      // Now test updating task type
      prismaMock.task.findFirst.mockResolvedValueOnce({
        ...baseMockTask,
        type: TaskType.BUG,
      });
      prismaMock.task.update.mockResolvedValueOnce({
        ...baseMockTask,
        type: TaskType.AUDIO,
      });

      const updated = await tasksService.updateTask(
        mockProjectId,
        'task-1',
        { type: TaskType.AUDIO },
        mockFounderId,
      );

      expect(updated.type).toBe(TaskType.AUDIO);
    });

    it('27. should set and retrieve due date on task creation and update', async () => {
      const targetDueDate = new Date('2026-10-31T23:59:59.000Z');
      prismaMock.task.findFirst.mockResolvedValueOnce(null);
      prismaMock.task.create.mockResolvedValueOnce({
        ...baseMockTask,
        dueDate: targetDueDate,
      });

      const created = await tasksService.createTask(
        mockProjectId,
        {
          title: 'Alpha milestone polish',
          dueDate: targetDueDate.toISOString(),
        },
        mockFounderId,
      );

      expect(created.dueDate).toBe(targetDueDate.toISOString());

      // Update due date
      const newDueDate = new Date('2026-11-15T00:00:00.000Z');
      prismaMock.task.findFirst.mockResolvedValueOnce({
        ...baseMockTask,
        dueDate: targetDueDate,
      });
      prismaMock.task.update.mockResolvedValueOnce({
        ...baseMockTask,
        dueDate: newDueDate,
      });

      const updated = await tasksService.updateTask(
        mockProjectId,
        'task-1',
        { dueDate: newDueDate.toISOString() },
        mockFounderId,
      );

      expect(updated.dueDate).toBe(newDueDate.toISOString());
    });

    it('28. should set blocked status with a blocked reason, and clear blocked reason when resolved', async () => {
      prismaMock.task.findFirst.mockResolvedValueOnce({
        ...baseMockTask,
        status: TaskStatus.IN_PROGRESS,
      });
      prismaMock.task.update.mockResolvedValueOnce({
        ...baseMockTask,
        status: TaskStatus.BLOCKED,
        blockedReason: 'Waiting on physics middleware license approval',
      });

      const blockedTask = await tasksService.updateTaskStatus(
        mockProjectId,
        'task-1',
        TaskStatus.BLOCKED,
        mockFounderId,
        undefined,
        'Waiting on physics middleware license approval',
      );

      expect(blockedTask.status).toBe(TaskStatus.BLOCKED);
      expect(blockedTask.blockedReason).toBe(
        'Waiting on physics middleware license approval',
      );

      // Resolving task (e.g. to DONE) clears blocked reason
      prismaMock.task.findFirst.mockResolvedValueOnce({
        ...baseMockTask,
        status: TaskStatus.BLOCKED,
        blockedReason: 'Waiting on physics middleware license approval',
      });
      prismaMock.task.update.mockResolvedValueOnce({
        ...baseMockTask,
        status: TaskStatus.DONE,
        blockedReason: null,
      });

      const unblockedTask = await tasksService.updateTaskStatus(
        mockProjectId,
        'task-1',
        TaskStatus.DONE,
        mockFounderId,
      );

      expect(unblockedTask.status).toBe(TaskStatus.DONE);
      expect(unblockedTask.blockedReason).toBeNull();
    });

    it('29. should successfully add a valid dependency between tasks in the same project', async () => {
      const taskA = { ...baseMockTask, id: 'task-A', taskNumber: 1 };
      const taskB = { ...baseMockTask, id: 'task-B', taskNumber: 2 };

      // 1) find task A
      prismaMock.task.findFirst.mockResolvedValueOnce(taskA);
      // 2) find target task B in same project
      prismaMock.task.findFirst.mockResolvedValueOnce(taskB);
      // 3) check duplicate
      prismaMock.taskDependency.findUnique.mockResolvedValueOnce(null);
      // 4) check cycle: task-B has no dependencies
      prismaMock.taskDependency.findMany.mockResolvedValueOnce([]);
      // 5) create dependency
      prismaMock.taskDependency.create.mockResolvedValueOnce({
        taskId: 'task-A',
        dependsOnTaskId: 'task-B',
      });
      // 6) return updated task A with dependency
      prismaMock.task.findFirst.mockResolvedValueOnce({
        ...taskA,
        dependencies: [
          {
            dependsOnTask: {
              id: 'task-B',
              taskNumber: 2,
              title: taskB.title,
              status: taskB.status,
            },
          },
        ],
      });

      const result = await tasksService.addDependency(
        mockProjectId,
        'task-A',
        'task-B',
        mockFounderId,
      );

      expect(prismaMock.taskDependency.create).toHaveBeenCalledWith({
        data: {
          taskId: 'task-A',
          dependsOnTaskId: 'task-B',
        },
      });
      expect(result.dependencies).toHaveLength(1);
      expect(result.dependencies[0].id).toBe('task-B');
      expect(result.dependencies[0].taskCode).toBe('TASK-2');
    });

    it('30. should reject self-dependency (taskId === dependsOnTaskId)', async () => {
      prismaMock.task.findFirst.mockResolvedValueOnce(baseMockTask);

      await expect(
        tasksService.addDependency(
          mockProjectId,
          'task-1',
          'task-1',
          mockFounderId,
        ),
      ).rejects.toThrow(
        new BadRequestException('A task cannot depend on itself.'),
      );

      expect(prismaMock.taskDependency.create).not.toHaveBeenCalled();
    });

    it('31. should reject cross-project dependency', async () => {
      const taskInProject = { ...baseMockTask, id: 'task-1' };

      // Task 1 exists in project
      prismaMock.task.findFirst.mockResolvedValueOnce(taskInProject);
      // Prerequisite task does not exist in this project (returns null)
      prismaMock.task.findFirst.mockResolvedValueOnce(null);

      await expect(
        tasksService.addDependency(
          mockProjectId,
          'task-1',
          'task-from-foreign-project',
          mockFounderId,
        ),
      ).rejects.toThrow(
        new BadRequestException(
          'Prerequisite task does not exist in this project.',
        ),
      );

      expect(prismaMock.taskDependency.create).not.toHaveBeenCalled();
    });

    it('32. should reject duplicate dependency relationship', async () => {
      const taskA = { ...baseMockTask, id: 'task-A' };
      const taskB = { ...baseMockTask, id: 'task-B' };

      prismaMock.task.findFirst.mockResolvedValueOnce(taskA);
      prismaMock.task.findFirst.mockResolvedValueOnce(taskB);
      // Duplicate found
      prismaMock.taskDependency.findUnique.mockResolvedValueOnce({
        id: 'existing-dep-uuid',
        taskId: 'task-A',
        dependsOnTaskId: 'task-B',
      });

      await expect(
        tasksService.addDependency(
          mockProjectId,
          'task-A',
          'task-B',
          mockFounderId,
        ),
      ).rejects.toThrow(
        new BadRequestException('This dependency relationship already exists.'),
      );

      expect(prismaMock.taskDependency.create).not.toHaveBeenCalled();
    });

    it('33. should reject direct circular dependency (A -> B -> A)', async () => {
      // Trying to make Task A depend on Task B, when Task B already depends on Task A
      const taskA = { ...baseMockTask, id: 'task-A' };
      const taskB = { ...baseMockTask, id: 'task-B' };

      prismaMock.task.findFirst.mockResolvedValueOnce(taskA);
      prismaMock.task.findFirst.mockResolvedValueOnce(taskB);
      prismaMock.taskDependency.findUnique.mockResolvedValueOnce(null);

      // When traversing from Task B: Task B has prerequisite Task A
      prismaMock.taskDependency.findMany.mockResolvedValueOnce([
        { dependsOnTaskId: 'task-A' },
      ]);

      await expect(
        tasksService.addDependency(
          mockProjectId,
          'task-A',
          'task-B',
          mockFounderId,
        ),
      ).rejects.toThrow(
        new BadRequestException(
          'Circular dependency detected. A task cannot depend on a task that depends on it.',
        ),
      );

      expect(prismaMock.taskDependency.create).not.toHaveBeenCalled();
    });

    it('34. should reject multi-hop circular dependency (A -> B -> C -> A)', async () => {
      // We want to add Task A depends on Task C.
      // Task C depends on Task B, and Task B depends on Task A.
      const taskA = { ...baseMockTask, id: 'task-A' };
      const taskC = { ...baseMockTask, id: 'task-C' };

      prismaMock.task.findFirst.mockResolvedValueOnce(taskA);
      prismaMock.task.findFirst.mockResolvedValueOnce(taskC);
      prismaMock.taskDependency.findUnique.mockResolvedValueOnce(null);

      // Traversal starts from Task C:
      // Step 1: dependencies of Task C -> [Task B]
      prismaMock.taskDependency.findMany.mockResolvedValueOnce([
        { dependsOnTaskId: 'task-B' },
      ]);
      // Step 2: dependencies of Task B -> [Task A]
      prismaMock.taskDependency.findMany.mockResolvedValueOnce([
        { dependsOnTaskId: 'task-A' },
      ]);

      await expect(
        tasksService.addDependency(
          mockProjectId,
          'task-A',
          'task-C',
          mockFounderId,
        ),
      ).rejects.toThrow(
        new BadRequestException(
          'Circular dependency detected. A task cannot depend on a task that depends on it.',
        ),
      );

      expect(prismaMock.taskDependency.create).not.toHaveBeenCalled();
    });

    it('35. should remove an existing dependency relationship', async () => {
      const taskA = { ...baseMockTask, id: 'task-A' };

      prismaMock.task.findFirst.mockResolvedValueOnce(taskA);
      prismaMock.taskDependency.findUnique.mockResolvedValueOnce({
        id: 'dep-uuid-1',
        taskId: 'task-A',
        dependsOnTaskId: 'task-B',
      });
      prismaMock.taskDependency.delete.mockResolvedValueOnce({
        id: 'dep-uuid-1',
      });
      prismaMock.task.findFirst.mockResolvedValueOnce({
        ...taskA,
        dependencies: [],
      });

      const result = await tasksService.removeDependency(
        mockProjectId,
        'task-A',
        'task-B',
        mockFounderId,
      );

      expect(prismaMock.taskDependency.delete).toHaveBeenCalledWith({
        where: {
          taskId_dependsOnTaskId: {
            taskId: 'task-A',
            dependsOnTaskId: 'task-B',
          },
        },
      });
      expect(result.dependencies).toHaveLength(0);
    });

    it('36. should enforce authorization rules for dependency management', async () => {
      // Unrelated user cannot add dependency
      await expect(
        tasksService.addDependency(
          mockProjectId,
          'task-A',
          'task-B',
          mockUnrelatedUserId,
        ),
      ).rejects.toThrow(ForbiddenException);

      // Removed member cannot remove dependency
      await expect(
        tasksService.removeDependency(
          mockProjectId,
          'task-A',
          'task-B',
          mockRemovedMemberId,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
