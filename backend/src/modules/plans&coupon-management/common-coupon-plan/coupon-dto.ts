import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsNotEmpty, IsOptional } from 'class-validator';

export class CouponDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: 'Unique coupon code' })
  code: string;
}