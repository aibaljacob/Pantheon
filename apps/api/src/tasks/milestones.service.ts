import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectAuthorizationService } from './project-authorization.service';
import { CreateMilestoneDto } from './dto/create-milestone.dto';
import { UpdateMilestoneDto } from './dto/update-milestone.dto';
import { MilestoneResponseDto } from './dto/milestone-response.dto';
import { TaskStatus } from '@prisma/client';

@Injectable()
export class MilestonesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authzService: ProjectAuthorizationService,
  ) {}

  private mapMilestoneWithProgress(milestone: any): MilestoneResponseDto {
    const totalTasks = milestone.tasks?.length || 0;
    const completedTasks =
      milestone.tasks?.filter((t: any) => t.status === TaskStatus.DONE).length || 0;
    const progressPercentage =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      id: milestone.id,
      projectId: milestone.projectId,
      title: milestone.title,
      description: milestone.description,
      dueDate: milestone.dueDate ? milestone.dueDate.toISOString() : null,
      isCompleted: milestone.isCompleted,
      totalTasks,
      completedTasks,
      progressPercentage,
      createdAt: milestone.createdAt.toISOString(),
      updatedAt: milestone.updatedAt.toISOString(),
    };
  }

  async createMilestone(
    projectId: string,
    dto: CreateMilestoneDto,
    userId: string,
    userRole?: string,
  ): Promise<MilestoneResponseDto> {
    const { project } = await this.authzService.assertCanManage(projectId, userId, userRole);

    const created = await this.prisma.milestone.create({
      data: {
        projectId: project.id,
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      },
      include: {
        tasks: {
          select: { id: true, status: true },
        },
      },
    });

    return this.mapMilestoneWithProgress(created);
  }

  async getMilestones(
    projectId: string,
    userId?: string,
    userRole?: string,
  ): Promise<MilestoneResponseDto[]> {
    const { project } = await this.authzService.assertCanView(projectId, userId, userRole);

    const milestones = await this.prisma.milestone.findMany({
      where: { projectId: project.id },
      orderBy: [{ isCompleted: 'asc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
      include: {
        tasks: {
          select: { id: true, status: true },
        },
      },
    });

    return milestones.map((m) => this.mapMilestoneWithProgress(m));
  }

  async getMilestone(
    projectId: string,
    milestoneId: string,
    userId?: string,
    userRole?: string,
  ): Promise<MilestoneResponseDto> {
    const { project } = await this.authzService.assertCanView(projectId, userId, userRole);

    const milestone = await this.prisma.milestone.findFirst({
      where: { id: milestoneId, projectId: project.id },
      include: {
        tasks: {
          select: { id: true, status: true },
        },
      },
    });

    if (!milestone) {
      throw new NotFoundException('Milestone not found.');
    }

    return this.mapMilestoneWithProgress(milestone);
  }

  async updateMilestone(
    projectId: string,
    milestoneId: string,
    dto: UpdateMilestoneDto,
    userId: string,
    userRole?: string,
  ): Promise<MilestoneResponseDto> {
    const { project } = await this.authzService.assertCanManage(projectId, userId, userRole);

    const existing = await this.prisma.milestone.findFirst({
      where: { id: milestoneId, projectId: project.id },
    });

    if (!existing) {
      throw new NotFoundException('Milestone not found.');
    }

    const updated = await this.prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        title: dto.title !== undefined ? dto.title.trim() : undefined,
        description:
          dto.description !== undefined ? dto.description.trim() || null : undefined,
        dueDate:
          dto.dueDate !== undefined
            ? dto.dueDate
              ? new Date(dto.dueDate)
              : null
            : undefined,
        isCompleted: dto.isCompleted !== undefined ? dto.isCompleted : undefined,
      },
      include: {
        tasks: {
          select: { id: true, status: true },
        },
      },
    });

    return this.mapMilestoneWithProgress(updated);
  }

  async deleteMilestone(
    projectId: string,
    milestoneId: string,
    userId: string,
    userRole?: string,
  ): Promise<{ success: boolean; message: string }> {
    const { project } = await this.authzService.assertCanManage(projectId, userId, userRole);

    const existing = await this.prisma.milestone.findFirst({
      where: { id: milestoneId, projectId: project.id },
    });

    if (!existing) {
      throw new NotFoundException('Milestone not found.');
    }

    await this.prisma.$transaction(async (tx) => {
      // Unlink all tasks from this milestone
      await tx.task.updateMany({
        where: { milestoneId },
        data: { milestoneId: null },
      });

      // Delete the milestone
      await tx.milestone.delete({
        where: { id: milestoneId },
      });
    });

    return { success: true, message: 'Milestone deleted successfully.' };
  }
}
