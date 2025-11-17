import { IsString, IsUUID, IsOptional, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateGoalDto {
  @ApiProperty({ example: '新規顧客獲得件数の達成' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: '年間60件の新規顧客獲得を目指す' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: '60件以上の新規顧客獲得' })
  @IsOptional()
  @IsString()
  successCriteria?: string;

  @ApiProperty({ example: 40 })
  @IsInt()
  @Min(0)
  @Max(100)
  weight: number;

  @ApiProperty()
  @IsUUID()
  cycleId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  parentGoalId?: string;
}
