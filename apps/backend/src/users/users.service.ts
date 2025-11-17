import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto & { password: string }) {
    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: {
        tenantId_email: {
          tenantId: createUserDto.tenantId,
          email: createUserDto.email,
        },
      },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    return this.prisma.user.create({
      data: {
        tenantId: createUserDto.tenantId,
        email: createUserDto.email,
        passwordHash: createUserDto.password,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        organizationId: createUserDto.organizationId,
        employeeId: createUserDto.employeeId,
        position: createUserDto.position,
        jobTitle: createUserDto.jobTitle,
        hireDate: createUserDto.hireDate,
        managerId: createUserDto.managerId,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        employeeId: true,
        position: true,
        jobTitle: true,
        organizationId: true,
        managerId: true,
        status: true,
        createdAt: true,
      },
    });
  }

  async findAll(tenantId: string, options?: { organizationId?: string; status?: string }) {
    return this.prisma.user.findMany({
      where: {
        tenantId,
        deletedAt: null,
        ...(options?.organizationId && { organizationId: options.organizationId }),
        ...(options?.status && { status: options.status }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        employeeId: true,
        position: true,
        jobTitle: true,
        organizationId: true,
        managerId: true,
        status: true,
        hireDate: true,
        lastLoginAt: true,
        createdAt: true,
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        organization: true,
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        subordinates: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user || user.deletedAt) {
      throw new NotFoundException('User not found');
    }

    const { passwordHash, mfaSecret, ...result } = user;
    return result;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findFirst({
      where: {
        email,
        deletedAt: null,
      },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user || user.deletedAt) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        employeeId: true,
        position: true,
        jobTitle: true,
        organizationId: true,
        managerId: true,
        status: true,
        updatedAt: true,
      },
    });
  }

  async remove(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user || user.deletedAt) {
      throw new NotFoundException('User not found');
    }

    // Soft delete
    return this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async getSubordinates(managerId: string) {
    return this.prisma.user.findMany({
      where: {
        managerId,
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        employeeId: true,
        position: true,
        jobTitle: true,
      },
    });
  }
}
