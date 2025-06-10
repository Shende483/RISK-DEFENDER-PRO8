import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

// DTO for creating a broker account
export class BrokerAccountDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: 'The ID of the broker', example: 'broker123' })
  brokerId: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: 'The ID of the market type', example: 'stockmarket' })
  marketTypeId: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'The ID of the user (optional, added via JWT)', example: 'user123', required: false })
  userId?: string;

 

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: 'The name of the broker account', example: 'MyBrokerAccount' })
 subAccountName: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: 'The API key for the broker account', example: 'api-key-123' })
  apiKey: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: 'The secret key for the broker account', example: 'secret-key-123' })
  secretKey: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: 'The status of the broker account', example: 'active' })
  status: string;

  @IsObject()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Trading rules data for the broker account',
    type: 'object',
    properties: {
      cash: { type: 'array', items: { type: 'string' }, example: ['rule1: value1', 'rule2: value2'] },
      option: { type: 'array', items: { type: 'string' }, example: ['option1: value1', 'option2: value2'] },
      future: { type: 'array', items: { type: 'string' }, example: ['future1: value1', 'future2: value2'] },
    },
  })
  tradingRuleData: {
    cash: string[];
    option: string[];
    future: string[];
  };
}


 
