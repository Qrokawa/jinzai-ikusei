import { Controller, Get, Post, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EvaluationsService } from './evaluations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('evaluations')
@Controller('evaluations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EvaluationsController {
  constructor(private readonly evaluationsService: EvaluationsService) {}

  @Get('cycles')
  @ApiOperation({ summary: 'Get all evaluation cycles' })
  findAllCycles(@Request() req: any) {
    return this.evaluationsService.findAllCycles(req.user.tenantId);
  }

  @Get('cycles/:id')
  @ApiOperation({ summary: 'Get evaluation cycle by id' })
  findCycleById(@Param('id') id: string) {
    return this.evaluationsService.findCycleById(id);
  }

  @Post('cycles')
  @ApiOperation({ summary: 'Create evaluation cycle' })
  createCycle(@Request() req: any, @Body() data: any) {
    return this.evaluationsService.createCycle(req.user.tenantId, data);
  }

  @Get()
  @ApiOperation({ summary: 'Get all evaluations' })
  findAll(
    @Request() req: any,
    @Query('cycleId') cycleId?: string,
    @Query('evaluateeId') evaluateeId?: string,
    @Query('status') status?: string,
  ) {
    return this.evaluationsService.findAllEvaluations(req.user.tenantId, {
      cycleId,
      evaluateeId,
      status,
    });
  }

  @Post()
  @ApiOperation({ summary: 'Create evaluation' })
  create(@Request() req: any, @Body() data: any) {
    return this.evaluationsService.createEvaluation(req.user.tenantId, data);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit evaluation' })
  submit(@Param('id') id: string, @Body() data: any) {
    return this.evaluationsService.submitEvaluation(id, data.scores, data.overallComment);
  }
}
