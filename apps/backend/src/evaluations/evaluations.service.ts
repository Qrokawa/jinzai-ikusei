import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EvaluationsService {
  constructor(private prisma: PrismaService) {}

  async createCycle(tenantId: string, data: any) {
    return this.prisma.evaluationCycle.create({
      data: {
        tenantId,
        ...data,
      },
    });
  }

  async findAllCycles(tenantId: string) {
    return this.prisma.evaluationCycle.findMany({
      where: { tenantId },
      orderBy: { startDate: 'desc' },
    });
  }

  async findCycleById(id: string) {
    const cycle = await this.prisma.evaluationCycle.findUnique({
      where: { id },
    });
    if (!cycle) {
      throw new NotFoundException('Evaluation cycle not found');
    }
    return cycle;
  }

  async createEvaluation(tenantId: string, data: any) {
    return this.prisma.evaluation.create({
      data: {
        tenantId,
        ...data,
      },
      include: {
        evaluatee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        evaluator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async findAllEvaluations(tenantId: string, options?: any) {
    return this.prisma.evaluation.findMany({
      where: {
        tenantId,
        ...(options?.cycleId && { cycleId: options.cycleId }),
        ...(options?.evaluateeId && { evaluateeId: options.evaluateeId }),
        ...(options?.evaluatorId && { evaluatorId: options.evaluatorId }),
        ...(options?.status && { status: options.status }),
      },
      include: {
        evaluatee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        evaluator: {
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
      orderBy: { createdAt: 'desc' },
    });
  }

  async submitEvaluation(id: string, scores: any[], overallComment: string) {
    const evaluation = await this.prisma.evaluation.findUnique({
      where: { id },
    });

    if (!evaluation) {
      throw new NotFoundException('Evaluation not found');
    }

    // Create scores
    for (const score of scores) {
      await this.prisma.evaluationScore.upsert({
        where: {
          evaluationId_goalId: {
            evaluationId: id,
            goalId: score.goalId,
          },
        },
        create: {
          evaluationId: id,
          goalId: score.goalId,
          score: score.score,
          achievement: score.achievement,
          comment: score.comment,
        },
        update: {
          score: score.score,
          achievement: score.achievement,
          comment: score.comment,
        },
      });
    }

    // Update evaluation status
    return this.prisma.evaluation.update({
      where: { id },
      data: {
        status: 'submitted',
        overallComment,
        submittedAt: new Date(),
      },
      include: {
        scores: true,
      },
    });
  }
}
