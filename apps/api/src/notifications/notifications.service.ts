import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async createNotification(data: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    entityType?: string;
    entityId?: string;
  }) {
    return this.prisma.notification.create({
      data,
    });
  }

  async getUserNotifications(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [items, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where: { userId } }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    const enrichedItems = items.map((item) => ({
      ...item,
      actionUrl: this.resolveActionUrl(item),
    }));

    return {
      items: enrichedItems,
      total,
      unreadCount,
      page,
      limit,
    };
  }

  resolveActionUrl(item: {
    type: NotificationType;
    entityType?: string | null;
    entityId?: string | null;
  }): string | null {
    if (!item.entityId) return null;

    if (item.type === NotificationType.PROJECT_ROLE_CHANGED) {
      return `/projects/${item.entityId}?tab=team`;
    }
    if (item.type === NotificationType.REMOVED_FROM_PROJECT) {
      return `/projects/${item.entityId}`;
    }
    if (
      item.type === NotificationType.INVITATION_RECEIVED ||
      (item.type as string) === 'INVITATION_ACCEPTED'
    ) {
      return `/projects/${item.entityId}`;
    }
    if (
      item.type === NotificationType.APPLICATION_ACCEPTED ||
      item.type === NotificationType.APPLICATION_REJECTED
    ) {
      return `/projects/${item.entityId}`;
    }

    const entityType = item.entityType?.toUpperCase();
    if (item.type === NotificationType.TASK_ASSIGNED || entityType === 'TASK') {
      return `/projects/${item.entityId}?tab=tasks`;
    }
    if (entityType === 'PROJECT') {
      return `/projects/${item.entityId}`;
    }
    if (entityType === 'PLAYTEST') {
      return `/projects/${item.entityId}?tab=playtests`;
    }
    if (entityType === 'APPLICATION') {
      return `/projects/${item.entityId}?tab=applications`;
    }

    return `/projects/${item.entityId}`;
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });
    return { unreadCount: count };
  }

  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException('Cannot modify another user notification');
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { success: true };
  }
}
