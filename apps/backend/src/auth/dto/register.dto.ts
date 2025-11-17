import { IsEmail, IsString, MinLength, IsUUID, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: '太郎' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: '田中' })
  @IsString()
  lastName: string;

  @ApiProperty({ example: 'uuid' })
  @IsUUID()
  tenantId: string;

  @ApiPropertyOptional({ example: 'uuid' })
  @IsOptional()
  @IsUUID()
  organizationId?: string;
}
