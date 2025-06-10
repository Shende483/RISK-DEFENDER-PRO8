import { Controller, Post, Body, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { VerifyPaymentDto } from './dto/verify-payment-dto';


@Controller('payment-details')
export class PaymentDetailsController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('create-payment')
  @UseGuards(JwtAuthGuard)
  async createPayment(
    @Body() body: CreatePaymentDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    console.log('createPayment body:', body);
    const { userId, email, mobile } = req['user'];
    console.log(`UserId: ${userId}, mobile: ${mobile}, email: ${email}`);

    if (!userId) {
      return res.status(200).json({
        statusCode: 400,
        message: 'UserId is required',
        success: false,
      });
    }
    return this.paymentService.initiatePayment(
      { ...body, userId, email, mobile },
      res,
    );
  }



  @Post('verify-payment')
  @UseGuards(JwtAuthGuard)
  async verifyPayment(
    @Body() body: VerifyPaymentDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const { userId, email } = req['user'];
    console.log(`UserId: ${userId}, Email: ${email}`);

    const finalData = { ...body, userId };
    console.log('Verifyingvvvvvvvvvvvvvvvvvvvvvvvvvvv Payment:', finalData);

    return this.paymentService.verifyPayment(finalData, res);
  }
}