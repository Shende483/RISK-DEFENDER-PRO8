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
import { Response, Request } from 'express';
import { SubBrokerAccountService } from './sub-broker-account.service';
import { SubBrokerAccountDto } from './sub-broker-account-dto';

@Controller('subBrokerAccount')
export class SubBrokerAccountController {
  constructor(private readonly brokerAccService: SubBrokerAccountService) {}


// A] add subroker account page contollers

//get brokers list for add my broker page
  @Get('broker-list')
  @UseGuards(JwtAuthGuard)
  async getBrokerDetails(
    @Query('marketTypeId') marketTypeId: string,
    @Req() req: Request,
  ) {
    const { userId } = req['user'];
   console.log('XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', marketTypeId);
    if (!userId) {
      return {
        statusCode: 401,
        message: 'User Not Sign In',
        success: true,
      };
    }
    const brokerDetails =
      await this.brokerAccService.getBrokerListByMarketType(
        userId,
        marketTypeId,
      );
    return {
     statusCode: brokerDetails.statusCode,
      message: brokerDetails.message,
      success: brokerDetails.success,
      data: brokerDetails.data, // Use only the data array
    };
  }

@Post('validate-subaccount')
  @UseGuards(JwtAuthGuard)
  async validateSubaccountName(
    @Body() body: { marketTypeId: string; brokerId: string; subAccountName: string },
    @Req() req: Request,
    @Res() res: Response
  ) {
    console.log('Received request for verifying subaccount name:', body);
    const { userId } = req['user'];
    const { marketTypeId, brokerId, subAccountName } = body;
    console.log('Parameters:', { userId, marketTypeId, brokerId, subAccountName });
    if (!userId) {
      return {
        statusCode: 401,
        message: 'User not signed in',
        success: false,
      };
    }
     await this.brokerAccService.validateSubaccountName(
        userId,
        marketTypeId,
        brokerId,
        subAccountName,
        res
      );
  }





// B] Adding rules page contollers

//add rules page
  @Get('subbroker-accounts')
  @UseGuards(JwtAuthGuard)
  async getSubBrokerAccounts(
    @Req() req: Request,
  ) {
    const { userId } = req['user'];
    console.log('Fetching subbroker accounts for user:', userId);
    if (!userId) {
      return {
        statusCode: 401,
        message: 'User not signed in',
        success: false,
      };
    }
    const accountDetails = await this.brokerAccService.getSubBrokerAccountsByUser(userId);
    return {
      statusCode: accountDetails.statusCode,
      message: accountDetails.message,
      success: accountDetails.success,
      data: accountDetails.data,
    };
  }



@Post('verify-main-api-keys')
  @UseGuards(JwtAuthGuard)
  async verifyMainApiKeys(
    @Body() body: {
      brokerKey: string;
      marketTypeId: string;
      brokerId: string;
      mainApiKey: string;
      mainSecretKey: string;
    },
    @Req() req: Request,
    @Res() res: Response,
  ) {
    console.log('Received request for verifying Main Account API keys:', body);
    const { userId } = req['user'];
    if (!userId) {
      return res.status(200).json({
        statusCode: 401,
        message: 'User not signed in',
        success: false,
      });
    }
   await this.brokerAccService.verifyMainKeys({ ...body,  },userId,res);
  }


  @Post('verify-sub-api-keys')
  @UseGuards(JwtAuthGuard)
  async verifySubApiKeys(
    @Body() body: {
      marketTypeId: string;
      brokerId: string;
      brokerKey: string;
      subApiKey: string;
     subSecretKey: string;
    },
    @Req() req: Request,
    @Res() res: Response,
  ) {
    console.log('Received request for verifying Sub-Account API keys:', body);
    const { userId } = req['user'];
    if (!userId) {
      return res.status(200).json({
        statusCode: 401,
        message: 'User not signed in',
        success: false,
      });
    }
    await this.brokerAccService.verifySubKeys({ ...body, },userId,res);
  }


//finally set rules
  @Post('set-trading-rules')
  @UseGuards(JwtAuthGuard)
  async setTradingRules(
 @Body() body: {
      _id: string;
      marketTypeId: string;
      brokerKey: string;
      mainApiKey?: string;
      mainSecretKey?: string;
      subApiKey?: string;
      subSecretKey?: string;
      proxyServiceId?: string;
    noRulesChange?: boolean;
      tradingRuleData: {
        cash: { key: string; value: any }[];
        future: { key: string; value: any }[];
        option: { key: string; value: any }[];
      };
    },
    @Req() req: Request,
    @Res() res: Response,
  ) {
    console.log('User from Token:', req['user']);

    const { userId, email } = req['user'];
    console.log(`UserId: ${userId}, Email: ${email}`,body);

    if (!userId) {
      return res.status(200).json({
        statusCode: 400,
        message: 'UserId is required',
        success: false,
      });
    }
  
   const safeBody = {
    _id: body._id,
    marketTypeId: body.marketTypeId,
    brokerKey: body.brokerKey,
    mainApiKey: body.mainApiKey ?? '',
    mainSecretKey: body.mainSecretKey ?? '',
    proxyServiceId: body.proxyServiceId ?? '',
    subApiKey: body.subApiKey ?? '',
    subSecretKey: body.subSecretKey ?? '',
    tradingRuleData: body.tradingRuleData ?? '',
    noRulesChange: typeof body.noRulesChange === 'boolean' ? body.noRulesChange : false
  };
    await this.brokerAccService.setTradingRules(safeBody, userId, res);
    return { message: 'Broker Account created successfully.' };
  }




// C] Renew Broker Page controller

//get expired Subbroker Accounts

@Get('expired-broker-list')
  @UseGuards(JwtAuthGuard)
  async getExpiredBrokerAccounts(
    @Req() req: Request,
  ) {
    const { userId } = req['user'];
    console.log('Fetching expired broker accounts for user:', userId);
    if (!userId) {
      return {
        statusCode: 401,
        message: 'User not signed in',
        success: false,
      };
    }
    const expiredAccounts = await this.brokerAccService.getExpiredBrokerAccounts(userId);
    return {
      statusCode: expiredAccounts.statusCode,
      message: expiredAccounts.message,
      success: expiredAccounts.success,
      data: expiredAccounts.data,
    };
  }








  




}
