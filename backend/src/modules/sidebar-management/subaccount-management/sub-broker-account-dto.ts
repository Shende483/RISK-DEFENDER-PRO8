import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsObject, IsOptional, IsString, Matches } from 'class-validator';

// DTO for creating a broker account
export class SubBrokerAccountDto {


@IsNotEmpty()
  @IsString()
  @Matches(/^[0-9a-fA-F]{24}$/, { message: '_id must be a valid ObjectId' })
  @ApiProperty({ description: 'The ID of the sub-broker account', example: '68317a0c25c743ca4847c6c8' })
  _id: string;


  @IsNotEmpty()
  @IsString()
  @Matches(/^[0-9a-fA-F]{24}$/, { message: 'brokerId must be a valid ObjectId' })
  @ApiProperty({ description: 'The ID of the broker', example: '60c72b2f9b1e8b001f6472d1' })
  brokerId: string;

   @IsNotEmpty()
   @IsString()
  @Matches(/^[0-9a-fA-F]{24}$/, { message: 'proxyServiceId must be a valid ObjectId' })
  @ApiProperty({ description: 'The ID of the broker', example: '60c72b2f9b1e8b001f6472d1' })
  proxyServiceId: string;

  
  @IsNotEmpty()
  @IsBoolean()
 @ApiProperty({ description: 'Whether rules can be changed', example: true })
  noRulesChange: boolean;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: 'brokerkey key is missing' })
  brokerKey: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: 'The ID of the market type', example: 'stockmarket' })
  marketTypeId: string;


  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: 'The name of the broker account', example: 'MyBrokerAccount' })
  subAccountName: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: 'The main API key for the broker account', example: 'main-api-key-123' })
  mainApiKey: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: 'The main secret key for the broker account', example: 'main-secret-key-123' })
  mainSecretKey: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: 'The API key for the broker account', example: 'api-key-123' })
  subApiKey: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: 'The secret key for the broker account', example: 'secret-key-123' })
  subSecretKey: string;



  @IsObject()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Trading rules for the broker account',
    type: 'object',
    properties: {
      cash: {
        type: 'array',
        items: { type: 'object', properties: { key: { type: 'string' }, value: {} } },
        example: [{ key: 'maxLeverage', value: 50 }, { key: 'entrySide', value: 'Buy' }],
      },
      option: {
        type: 'array',
        items: { type: 'object', properties: { key: { type: 'string' }, value: {} } },
        example: [{ key: 'maxRiskEntry', value: 2 }, { key: 'entryType', value: 'Limit' }],
      },
      future: {
        type: 'array',
        items: { type: 'object', properties: { key: { type: 'string' }, value: {} } },
        example: [{ key: 'maxPendingOrder', value: 10 }, { key: 'marginTypes', value: 'Isolated' }],
      },
    },
  })
  tradingRuleData: {
    cash: { key: string; value: any }[];
    option: { key: string; value: any }[];
    future: { key: string; value: any }[];
  };
}