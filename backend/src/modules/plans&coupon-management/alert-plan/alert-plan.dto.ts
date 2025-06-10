import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsNotEmpty,
  IsArray,
  ArrayNotEmpty,
  IsOptional,
} from 'class-validator';

export class AlertPlanDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: 'Name of the plan (e.g., "1 Month")' })
  name: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: 'Description of the plan' })
  description: string;

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({ description: 'Price of the plan (e.g., 3500)' })
  price: number;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: 'Billing cycle (e.g., "monthly", "yearly")' })
  billingCycle: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @ApiProperty({ description: 'List of plan features', type: [String] })
  features: string[];

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: 'Duration of the plan (e.g., "1 month", "3 months")' })
  duration: string;

  @IsOptional()
  @IsNumber()
  @ApiProperty({ description: 'Discount percentage (e.g., 5 for 5%)', required: false })
  discountPercent?: number;

  @IsOptional()
  @IsNumber()
  @ApiProperty({ description: 'GST rate (e.g., 18 for 18%)', required: false })
  gstRate?: number;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'Plan status (e.g., "active", "inactive")', required: false })
  status?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'Creation date of the plan', required: false })
  createdDate?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'Last modified date of the plan', required: false })
  modifiedDate?: string;
}