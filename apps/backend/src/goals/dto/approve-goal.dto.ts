import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ApproveGoalDto {
  @ApiPropertyOptional({ example: '目標内容が適切です。承認します。' })
  @IsOptional()
  @IsString()
  comment?: string;
}
