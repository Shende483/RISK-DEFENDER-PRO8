import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, ValidateIf } from 'class-validator';

export class LoginUserDto {
  @ApiPropertyOptional({})
  @IsOptional()
  @ValidateIf((o) => !o.mobile) // Validate email only if mobile is not provided
  @IsEmail({}, { message: 'Invalid email address' })
  @IsNotEmpty({ message: 'Email is required if mobile is not provided' })
  email?: string;

  @ApiPropertyOptional({})
  @IsOptional()
  @ValidateIf((o) => !o.email) // Validate mobile only if email is not provided
  @IsString()
  @IsNotEmpty({ message: 'Mobile is required if email is not provided' })
  mobile?: string;


  @ApiPropertyOptional({})
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password?: string;
}