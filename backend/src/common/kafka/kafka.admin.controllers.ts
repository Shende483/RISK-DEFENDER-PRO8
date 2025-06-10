


import { Body, Controller, Get, Post, Param, Req, Res, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { KafkaAdminService } from './kafka-admin.service';
import { IsString, IsInt, Min, IsOptional, IsArray, ValidateNested, IsISO8601 } from 'class-validator';
import { Type } from 'class-transformer';

class ConfigEntryDto {
  @IsString()
  name: string;

  @IsString()
  value: string;
}

class CreateTopicDto {
  @IsString()
  topic: string;

  @IsInt()
  @Min(1)
  numPartitions: number;

  @IsInt()
  @Min(1)
  replicationFactor: number;

  @IsISO8601()
  timestamp: string;
}

@Controller('kafka-admin')
export class KafkaAdminController {
  constructor(private readonly kafkaAdminService: KafkaAdminService) {}

  @Post('topics')
  async createTopic(@Body() createTopicDto: CreateTopicDto, @Req() req: Request, @Res() res: Response) {
    console.log('createTopicDto:', createTopicDto);
   
  }

  @Post('topics/:topic/partitions')
  async increasePartitions(
    @Param('topic') topic: string,
    @Body('numPartitions') numPartitions: number,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      await this.kafkaAdminService.increasePartitions(topic, numPartitions);
      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: `Partitions for topic ${topic} increased to ${numPartitions}`,
        success: true,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: `Failed to increase partitions: ${error.message}`,
        success: false,
        timestamp: new Date().toISOString(),
      });
    }
  }

  @Get('topics')
  async listTopics(@Req() req: Request, @Res() res: Response) {
    try {
      const topics = await this.kafkaAdminService.listTopics();
      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Topics retrieved successfully',
        success: true,
        data: topics,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: `Failed to list topics: ${error.message}`,
        success: false,
        timestamp: new Date().toISOString(),
      });
    }
  }

  @Get('topics/:topic')
  async describeTopic(@Param('topic') topic: string, @Req() req: Request, @Res() res: Response) {
    const { userId } = req['user'];
    console.log('User from Token:', req['user']);

    if (!userId) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'UserId is required',
        success: false,
        timestamp: new Date().toISOString(),
      });
    }

    try {
      const topicDetails = await this.kafkaAdminService.describeTopic(topic);
      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Topic details retrieved successfully',
        success: true,
        data: topicDetails,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: `Failed to describe topic: ${error.message}`,
        success: false,
        timestamp: new Date().toISOString(),
      });
    }
  }
}