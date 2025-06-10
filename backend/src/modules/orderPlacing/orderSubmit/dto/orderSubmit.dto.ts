import {
  ArrayNotEmpty,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class OrderSubmitDto {
  @ApiProperty({
    description: 'The ID of the market type',
    example: '654321abcdef0987654321',
  })
  @IsString()
  @IsNotEmpty()
  marketTypeId: string;


  @ApiProperty({
    description: 'The ID of the market type',
    example: '654321abcdef0987654321',
  })
  @IsString()
  @IsNotEmpty()
  brokerId: string;

  
  @ApiProperty({
    description: 'The ID of the market type',
    example: '654321abcdef0987654321',
  })
  @IsString()
  @IsNotEmpty()
  brokerAccountName: string;

  @ApiProperty({
    description: 'The type of order',
    enum: ['cash', 'future', 'option']})
  @IsEnum(['cash', 'future', 'option'])
  orderType: 'cash' | 'future' | 'option';


  @ApiProperty({
    description: 'The trading symbol',
    example: 'AAPL',})
  @IsString()
  symbol: string;


  @ApiProperty({
    description: 'The allowed trading directions',
    enum: ['SELL', 'BUY'],})
  @IsOptional()
  @IsEnum(['SELL', 'BUY'])
  allowedDirection:"SELL" | "BUY";


  @ApiProperty({
    description: 'The margin types allowed',
    enum: ['CROSS', 'ISOLATED'],})
  @IsOptional()
  @IsEnum(['CROSS', 'ISOLATED'], )
  marginTypes: "CROSS" | "ISOLATED";



  @ApiProperty({
    description: 'The maximum allowed leverage',})
  @IsNumber()
  maxLeverage: number;


  @ApiProperty({
    description: 'The maximum allowed risk percentage',})
  @IsNumber()
  maxRiskPercentage: number;


  @ApiProperty({
    description: 'The type of order placing',
    enum: ['MARKET', 'STOP_MARKET'],
    example: 'Market'})
  @IsOptional()
  @IsEnum(['MARKET', 'STOP_MARKET'])
  orderPlacingType: 'MARKET' | 'STOP_MARKET';


  @ApiProperty({
    description: 'When user Select  orderPlacingType is stop order, then we need this field', })
  @IsNumber()
  entryPrice: number;


  @ApiProperty({
    description: 'The stop-loss price',
    example: 150.5,})
  @IsNumber()
  stopLoss: number;
  

  @ApiProperty({
    description: 'The target price',
    example: 160.0,})
  @IsNumber()
  targetPrice: number;

  @ApiProperty({
    description: 'Cancl order then need orderid',
    example: 150.5,})
  @IsNumber()
  orderId: number;

  @ApiProperty({
    description: 'To close Position we need quantity',
    example: 200,})
  @IsNumber()
  quantity: number;


}
