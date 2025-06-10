import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Res,
  UseGuards,
  UsePipes,
 
} from '@nestjs/common';
import { Response } from 'express';
import { AlertPlanService } from './alert-plan.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CouponDto } from '../common-coupon-plan/coupon-dto';


@Controller('plan')
export class AlertPlanController {
  constructor(private readonly planService: AlertPlanService) {}

  @Get('getPlan')
  async getActivePlan(@Res() res: Response) {
    console.log('getPlan');
    return this.planService.getActivePlan(res);
  }

  @Post('coupon/verify')
  @UseGuards(JwtAuthGuard)

  async verifyCoupon(@Body() couponDto: CouponDto, @Res() res: Response) {

    console.log("FGFGFFFFF",couponDto)
    return this.planService.verifyCoupon(couponDto.code, res);

  }
}