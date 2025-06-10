import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateBrokerDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({})
  marketTypeId: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({})
  name: string;


    @IsNotEmpty()
  @IsString()
  @ApiProperty({})
  key: string;

  @IsOptional()
  @IsString()
  @ApiProperty({})
  status?: string;
}
