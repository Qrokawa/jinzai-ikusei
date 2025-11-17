import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';

@Injectable()
export class GoalsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, tenantId: string, createGoalDto: CreateGoalDto) {
    // Validate cycle exists and is active
    const cycle = await this.prisma.evaluationCycle.findUnique({
      where: { id: createGoalDto.cycleId },
    });

    if (!cycle || cycle.tenantId !== tenantId) {
      throw new NotFoundException('Evaluation cycle not found');
    }

    return this.prisma.goal.create({
      data: {
        tenantId,
        userId,
        cycleId: createGoalDto.cycleId,
        title: createGoalDto.title,
        description: createGoalDto.description,
        successCriteria: createGoalDto.successCriteria,
        weight: createGoalDto.weight,
        parentGoalId: createGoalDto.parentGoalId,
        status: 'draft',
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        cycle: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async findAll(tenantId: string, options?: { userId?: string; cycleId?: string; status?: string }) {
    return this.prisma.goal.findMany({
      where: {
        tenantId,
        ...(options?.userId && { userId: options.userId }),
        ...(options?.cycleId && { cycleId: options.cycleId }),
        ...(options?.status && { status: options.status }),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        cycle: {
          select: {
            id: true,
            name: true,
          },
        },
        progress: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const goal = await this.prisma.goal.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        cycle: true,
        progress: {
          orderBy: { createdAt: 'desc' },
        },
        parentGoal: {
          select: {
            id: true,
            title: true,
          },
        },
        childGoals: {
          select: {
            id: true,
            title: true,
            weight: true,
            status: true,
          },
        },
      },
    });

    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    return goal;
  }

  async update(id: string, userId: string, updateGoalDto: UpdateGoalDto) {
    const goal = await this.prisma.goal.findUnique({
      where: { id },
    });

    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    if (goal.userId !== userId) {
      throw new ForbiddenException('You can only update your own goals');
    }

    if (!['draft', 'pending_approval'].includes(goal.status)) {
      throw new BadRequestException('Cannot update goal in current status');
    }

    return this.prisma.goal.update({
      where: { id },
      data: updateGoalDto,
    });
  }

  async submitForApproval(id: string, userId: string) {
    const goal = await this.prisma.goal.findUnique({
      where: { id },
    });

    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    if (goal.userId !== userId) {
      throw new ForbiddenException('You can only submit your own goals');
    }

    if (goal.status !== 'draft') {
      throw new BadRequestException('Goal must be in draft status');
    }

    return this.prisma.goal.update({
      where: { id },
      data: { status: 'pending_approval' },
    });
  }

  async approve(id: string, approverId: string, comment?: string) {
    const goal = await this.prisma.goal.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    if (goal.status !== 'pending_approval') {
      throw new BadRequestException('Goal is not pending approval');
    }

    // Check if approver is the manager
    if (goal.user.managerId !== approverId) {
      throw new ForbiddenException('Only the manager can approve this goal');
    }

    return this.prisma.goal.update({
      where: { id },
      data: {
        status: 'approved',
        approvedBy: approverId,
        approvedAt: new Date(),
      },
    });
  }

  async reject(id: string, approverId: string, comment: string) {
    const goal = await this.prisma.goal.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    if (goal.status !== 'pending_approval') {
      throw new BadRequestException('Goal is not pending approval');
    }

    if (goal.user.managerId !== approverId) {
      throw new ForbiddenException('Only the manager can reject this goal');
    }

    return this.prisma.goal.update({
      where: { id },
      data: { status: 'draft' },
    });
  }

  async updateProgress(id: string, userId: string, updateProgressDto: UpdateProgressDto) {
    const goal = await this.prisma.goal.findUnique({
      where: { id },
    });

    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    if (goal.userId !== userId) {
      throw new ForbiddenException('You can only update progress of your own goals');
    }

    if (!['approved', 'in_progress'].includes(goal.status)) {
      throw new BadRequestException('Goal must be approved or in progress');
    }

    // Create progress entry
    await this.prisma.goalProgress.create({
      data: {
        goalId: id,
        progressPercentage: updateProgressDto.progressPercentage,
        comment: updateProgressDto.comment,
        updatedBy: userId,
      },
    });

    // Update goal status if needed
    const newStatus = goal.status === 'approved' ? 'in_progress' : goal.status;

    return this.prisma.goal.update({
      where: { id },
      data: { status: newStatus },
      include: {
        progress: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });
  }

  async getProgressHistory(id: string) {
    const goal = await this.prisma.goal.findUnique({
      where: { id },
    });

    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    return this.prisma.goalProgress.findMany({
      where: { goalId: id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPendingApprovals(managerId: string) {
    const subordinates = await this.prisma.user.findMany({
      where: { managerId },
      select: { id: true },
    });

    const subordinateIds = subordinates.map((s) => s.id);

    return this.prisma.goal.findMany({
      where: {
        userId: { in: subordinateIds },
        status: 'pending_approval',
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        cycle: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }
}
