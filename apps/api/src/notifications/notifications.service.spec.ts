import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType } from '@prisma/client';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prismaMock: any;

  beforeEach(async () => {
    prismaMock = {
      notification: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  describe('getUserNotifications', () => {
    it('should enrich notifications with actionUrl matching their type and entity data', async () => {
      const mockProjectId = 'project-123';
      const mockNotifications = [
        {
          id: 'n1',
          userId: 'user-1',
          type: NotificationType.PROJECT_ROLE_CHANGED,
          title: 'Project Role Updated',
          message: 'Your role has been updated',
          entityType: 'PROJECT',
          entityId: mockProjectId,
          isRead: false,
          createdAt: new Date(),
        },
        {
          id: 'n2',
          userId: 'user-1',
          type: NotificationType.REMOVED_FROM_PROJECT,
          title: 'Removed from Project',
          message: 'You have been removed',
          entityType: 'PROJECT',
          entityId: mockProjectId,
          isRead: false,
          createdAt: new Date(),
        },
        {
          id: 'n3',
          userId: 'user-1',
          type: NotificationType.TASK_ASSIGNED,
          title: 'Task Assigned',
          message: 'You were assigned to task',
          entityType: 'Task',
          entityId: mockProjectId,
          isRead: true,
          createdAt: new Date(),
        },
        {
          id: 'n4',
          userId: 'user-1',
          type: NotificationType.INVITATION_RECEIVED,
          title: 'New Invitation',
          message: 'You have been invited',
          entityType: 'ProjectInvitation',
          entityId: mockProjectId,
          isRead: false,
          createdAt: new Date(),
        },
      ];

      prismaMock.notification.findMany.mockResolvedValue(mockNotifications);
      prismaMock.notification.count
        .mockResolvedValueOnce(4) // total
        .mockResolvedValueOnce(3); // unreadCount

      const result = await service.getUserNotifications('user-1', 1, 20);

      expect(result.items).toHaveLength(4);
      expect(result.items[0].actionUrl).toBe(
        `/projects/${mockProjectId}?tab=team`,
      );
      expect(result.items[1].actionUrl).toBe(`/projects/${mockProjectId}`);
      expect(result.items[2].actionUrl).toBe(
        `/projects/${mockProjectId}?tab=tasks`,
      );
      expect(result.items[3].actionUrl).toBe(`/projects/${mockProjectId}`);
      expect(result.unreadCount).toBe(3);
      expect(result.total).toBe(4);
    });
  });

  describe('resolveActionUrl', () => {
    it('should return null if entityId is missing', () => {
      expect(
        service.resolveActionUrl({
          type: NotificationType.PROJECT_ROLE_CHANGED,
          entityId: null,
        }),
      ).toBeNull();
    });

    it('should resolve correct tab for PROJECT_ROLE_CHANGED', () => {
      expect(
        service.resolveActionUrl({
          type: NotificationType.PROJECT_ROLE_CHANGED,
          entityId: 'proj-1',
        }),
      ).toBe('/projects/proj-1?tab=team');
    });

    it('should resolve correct path for REMOVED_FROM_PROJECT', () => {
      expect(
        service.resolveActionUrl({
          type: NotificationType.REMOVED_FROM_PROJECT,
          entityId: 'proj-1',
        }),
      ).toBe('/projects/proj-1');
    });
  });

  describe('createNotification', () => {
    it('should create a notification via prisma', async () => {
      const data = {
        userId: 'user-1',
        type: NotificationType.PROJECT_ROLE_CHANGED,
        title: 'Project Role Updated',
        message: 'Updated to Lead',
        entityType: 'PROJECT',
        entityId: 'proj-1',
      };
      prismaMock.notification.create.mockResolvedValue({
        id: 'notif-1',
        ...data,
      });

      const result = await service.createNotification(data);
      expect(prismaMock.notification.create).toHaveBeenCalledWith({ data });
      expect(result.id).toBe('notif-1');
    });
  });
});
