import { Controller, Get, Post, Body, Param, UseGuards, Request, Query, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('courses')
@Controller('courses')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all courses' })
  findAll(
    @Request() req: any,
    @Query('isPublished') isPublished?: boolean,
    @Query('category') category?: string,
    @Query('difficulty') difficulty?: string,
  ) {
    return this.coursesService.findAll(req.user.tenantId, {
      isPublished,
      category,
      difficulty,
    });
  }

  @Get('enrollments')
  @ApiOperation({ summary: 'Get my enrollments' })
  getMyEnrollments(@Request() req: any) {
    return this.coursesService.getEnrollments(req.user.sub, req.user.tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get course by id' })
  findOne(@Param('id') id: string) {
    return this.coursesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create course' })
  create(@Request() req: any, @Body() data: any) {
    return this.coursesService.create(req.user.tenantId, data);
  }

  @Post(':id/enroll')
  @ApiOperation({ summary: 'Enroll in course' })
  enroll(@Request() req: any, @Param('id') id: string) {
    return this.coursesService.enroll(req.user.sub, id, req.user.tenantId);
  }

  @Patch('enrollments/:enrollmentId/lessons/:lessonId/progress')
  @ApiOperation({ summary: 'Update lesson progress' })
  updateLessonProgress(
    @Param('enrollmentId') enrollmentId: string,
    @Param('lessonId') lessonId: string,
    @Body() data: any,
  ) {
    return this.coursesService.updateLessonProgress(enrollmentId, lessonId, data);
  }
}
