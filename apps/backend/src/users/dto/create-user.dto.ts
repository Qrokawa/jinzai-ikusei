import { IsEmail, IsString, IsUUID, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '太郎' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: '田中' })
  @IsString()
  lastName: string;

  @ApiProperty()
  @IsUUID()
  tenantId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @ApiPropertyOptional({ example: 'EMP001' })
  @IsOptional()
  @IsString()
  employeeId?: string;

  @ApiPropertyOptional({ example: '主任' })
  @IsOptional()
  @IsString()
  position?: string;

  @ApiPropertyOptional({ example: '営業' })
  @IsOptional()
  @IsString()
  jobTitle?: string;

  @ApiPropertyOptional({ example: '2020-04-01' })
  @IsOptional()
  @IsDateString()
  hireDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  managerId?: string;
}
