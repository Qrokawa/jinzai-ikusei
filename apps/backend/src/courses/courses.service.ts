import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, data: any) {
    return this.prisma.course.create({
      data: {
        tenantId,
        ...data,
      },
    });
  }

  async findAll(tenantId: string, options?: any) {
    return this.prisma.course.findMany({
      where: {
        tenantId,
        ...(options?.isPublished !== undefined && { isPublished: options.isPublished }),
        ...(options?.category && { category: options.category }),
        ...(options?.difficulty && { difficulty: options.difficulty }),
      },
      include: {
        lessons: {
          select: {
            id: true,
          },
        },
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        lessons: {
          include: {
            contents: true,
          },
          orderBy: { sortOrder: 'asc' },
        },
        courseSkills: {
          include: {
            skill: true,
          },
        },
        tests: true,
      },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    return course;
  }

  async enroll(userId: string, courseId: string, tenantId: string) {
    const enrollment = await this.prisma.courseEnrollment.create({
      data: {
        tenantId,
        userId,
        courseId,
        status: 'enrolled',
      },
    });

    // Initialize lesson progress
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: { lessons: true },
    });

    if (course) {
      for (const lesson of course.lessons) {
        await this.prisma.lessonProgress.create({
          data: {
            enrollmentId: enrollment.id,
            lessonId: lesson.id,
          },
        });
      }
    }

    return enrollment;
  }

  async getEnrollments(userId: string, tenantId: string) {
    return this.prisma.courseEnrollment.findMany({
      where: {
        userId,
        tenantId,
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            category: true,
            difficulty: true,
            estimatedDuration: true,
            thumbnailUrl: true,
          },
        },
        lessonProgress: {
          select: {
            lessonId: true,
            status: true,
            progressPercentage: true,
          },
        },
      },
      orderBy: { enrolledAt: 'desc' },
    });
  }

  async updateLessonProgress(enrollmentId: string, lessonId: string, data: any) {
    const progress = await this.prisma.lessonProgress.update({
      where: {
        enrollmentId_lessonId: {
          enrollmentId,
          lessonId,
        },
      },
      data: {
        progressPercentage: data.progressPercentage,
        timeSpent: { increment: data.timeSpent || 0 },
        lastPosition: data.lastPosition,
        lastAccessedAt: new Date(),
        ...(data.progressPercentage === 100 && { completedAt: new Date(), status: 'completed' }),
        ...(data.progressPercentage > 0 &&
          data.progressPercentage < 100 && { status: 'in_progress' }),
      },
    });

    // Update enrollment progress
    await this.updateEnrollmentProgress(enrollmentId);

    return progress;
  }

  private async updateEnrollmentProgress(enrollmentId: string) {
    const enrollment = await this.prisma.courseEnrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        lessonProgress: true,
      },
    });

    if (!enrollment) return;

    const totalLessons = enrollment.lessonProgress.length;
    const completedLessons = enrollment.lessonProgress.filter(
      (p) => p.status === 'completed',
    ).length;
    const progressPercentage = Math.round((completedLessons / totalLessons) * 100);

    await this.prisma.courseEnrollment.update({
      where: { id: enrollmentId },
      data: {
        progressPercentage,
        ...(progressPercentage === 100 && { status: 'completed', completedAt: new Date() }),
        ...(progressPercentage > 0 && progressPercentage < 100 && { status: 'in_progress' }),
      },
    });
  }
}
