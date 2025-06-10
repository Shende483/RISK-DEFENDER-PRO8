import {
  Body,
  Controller,
  Post,
  Res,
  Req,
  UseGuards,
  Query,
  Get,
  Param,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { BrokerAccountDto } from './dto/trading-dashboard.dto';
import { Response, Request } from 'express';
import { BrokerAccountService } from './trading-dashboard.service';

@Controller('brokerAccount')
export class BrokerAccountController {
  constructor(private readonly brokerAccService: BrokerAccountService) {}

  

//get brokers list for user
  @Get('broker-details')
  @UseGuards(JwtAuthGuard)
  async getBrokerDetails(
    @Query('marketTypeId') marketTypeId: string,
    @Req() req: Request,
  ) {
    const { userId } = req['user'];
   console.log('YYYYYYYYYYYYYYYYYYYYYYYYYY', marketTypeId);
    if (!userId) {
      return {
        statusCode: 401,
        message: 'User Not Sign In',
        success: true,
      };
    }
    const brokerDetails =
      await this.brokerAccService.getBrokerDetailsByUserIdAndMarketType(
        userId,
        marketTypeId,
      );

    return {
      statusCode: 200,
      message: 'Broker details retrieved successfully',
      success: true,
      data: brokerDetails,
    };
  }




 // Updated endpoint for sub-brokers (POST with body)
  @Post('sub-broker-details')
  @UseGuards(JwtAuthGuard)
  async getSubBrokerDetails(
    @Body() body: { marketTypeId: string; brokerId: string },
    @Req() req: Request,
  ) {
    console.log('Received request for sub-broker details:', body);
    const { userId } = req['user'];
    const { marketTypeId, brokerId } = body;
    console.log('Parameters:', { userId, marketTypeId, brokerId });
    if (!userId) {
      return {
        statusCode: 401,
        message: 'User not signed in',
        success: false,
      };
    }
    try {
      const subBrokers =
        await this.brokerAccService.getSubBrokerDetailsByMarketTypeAndBrokerId(
          userId,
          marketTypeId,
          brokerId,
        );
      return {
        statusCode: 200,
        message: 'Sub-broker details retrieved successfully',
        success: true,
        data: subBrokers,
      };
    } catch (error) {
      return {
        statusCode: 400,
        message: error.message || 'Failed to retrieve sub-broker details',
        success: false,
      };
    }
  }




  @Post('trading-rules')
  @UseGuards(JwtAuthGuard)
  async getTradingRules(
    @Body() body: {  subBrokerId: string; tradingType: string },
    @Req() req: Request,
  ) {
    const { userId } = req['user'];
    const {  subBrokerId, tradingType } = body;
console.log('Received request for trading rules:', body);
    console.log('Parameters:', { userId, subBrokerId, tradingType });

    if (!userId) {
      return{
        statusCode: 401,
        message: 'User not signed in',
        success: false,
      };
    }

    if ( !subBrokerId || !tradingType) {
      return {
        statusCode: 400,
        message: 'Missing required parameters',
        success: false,
      };
    }

    try {
      const tradingRules = await this.brokerAccService.getTradingRules(
        userId,
        subBrokerId,
        tradingType,
      );
console.log('Trading rules:', tradingRules);
 return {
        statusCode: 200,
        message: 'Trading rules retrieved successfully',
        success: true,
        data: tradingRules,
      };
      
    } catch (error) {
      return {
        statusCode: 400,
        message: error.message || 'Failed to retrieve sub-broker details',
        success: false,
      };

    } 
  }
}
