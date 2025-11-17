import { IsString, IsOptional, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProgressDto {
  @ApiProperty({ example: 75 })
  @IsInt()
  @Min(0)
  @Max(100)
  progressPercentage: number;

  @ApiPropertyOptional({ example: '8月末時点で45件獲得。順調に進捗中。' })
  @IsOptional()
  @IsString()
  comment?: string;
}
