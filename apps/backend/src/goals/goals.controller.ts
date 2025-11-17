import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { GoalsService } from './goals.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { ApproveGoalDto } from './dto/approve-goal.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('goals')
@Controller('goals')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new goal' })
  @ApiResponse({ status: 201, description: 'Goal created' })
  create(@Request() req: any, @Body() createGoalDto: CreateGoalDto) {
    return this.goalsService.create(req.user.sub, req.user.tenantId, createGoalDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all goals' })
  @ApiResponse({ status: 200, description: 'Return goals' })
  findAll(
    @Request() req: any,
    @Query('userId') userId?: string,
    @Query('cycleId') cycleId?: string,
    @Query('status') status?: string,
  ) {
    return this.goalsService.findAll(req.user.tenantId, { userId, cycleId, status });
  }

  @Get('my')
  @ApiOperation({ summary: 'Get my goals' })
  @ApiResponse({ status: 200, description: 'Return my goals' })
  findMyGoals(@Request() req: any, @Query('cycleId') cycleId?: string) {
    return this.goalsService.findAll(req.user.tenantId, { userId: req.user.sub, cycleId });
  }

  @Get('pending-approvals')
  @ApiOperation({ summary: 'Get goals pending approval (for managers)' })
  @ApiResponse({ status: 200, description: 'Return pending goals' })
  getPendingApprovals(@Request() req: any) {
    return this.goalsService.getPendingApprovals(req.user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get goal by id' })
  @ApiResponse({ status: 200, description: 'Return goal' })
  @ApiResponse({ status: 404, description: 'Goal not found' })
  findOne(@Param('id') id: string) {
    return this.goalsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update goal' })
  @ApiResponse({ status: 200, description: 'Goal updated' })
  update(@Request() req: any, @Param('id') id: string, @Body() updateGoalDto: UpdateGoalDto) {
    return this.goalsService.update(id, req.user.sub, updateGoalDto);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit goal for approval' })
  @ApiResponse({ status: 200, description: 'Goal submitted' })
  submitForApproval(@Request() req: any, @Param('id') id: string) {
    return this.goalsService.submitForApproval(id, req.user.sub);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve goal (for managers)' })
  @ApiResponse({ status: 200, description: 'Goal approved' })
  approve(@Request() req: any, @Param('id') id: string, @Body() approveDto: ApproveGoalDto) {
    return this.goalsService.approve(id, req.user.sub, approveDto.comment);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject goal (for managers)' })
  @ApiResponse({ status: 200, description: 'Goal rejected' })
  reject(@Request() req: any, @Param('id') id: string, @Body() approveDto: ApproveGoalDto) {
    return this.goalsService.reject(id, req.user.sub, approveDto.comment || '');
  }

  @Post(':id/progress')
  @ApiOperation({ summary: 'Update goal progress' })
  @ApiResponse({ status: 200, description: 'Progress updated' })
  updateProgress(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updateProgressDto: UpdateProgressDto,
  ) {
    return this.goalsService.updateProgress(id, req.user.sub, updateProgressDto);
  }

  @Get(':id/progress-history')
  @ApiOperation({ summary: 'Get progress history' })
  @ApiResponse({ status: 200, description: 'Return progress history' })
  getProgressHistory(@Param('id') id: string) {
    return this.goalsService.getProgressHistory(id);
  }
}
