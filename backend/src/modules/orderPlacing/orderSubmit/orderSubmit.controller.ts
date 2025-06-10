import { Body, Controller, Post, Req, Res, UseGuards, HttpException, HttpStatus, Get } from '@nestjs/common';
import { OrderSubmitDto } from './dto/orderSubmit.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { OrderSubmitService } from './orderSubmit.service';
import { Request, Response } from 'express';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import{KafkaProducerService} from '../../../common/kafka/kafka-producer.service';

// In-memory store for tracking last request times
const requestTracker: Record<string, number> = {};

// Custom Guard for Double-Click Prevention
@Injectable()
@Controller('order-submit')
export class OrderSubmitController {
  constructor(
    private readonly orderSubmitService: OrderSubmitService,
    private readonly kafkaProducerService: KafkaProducerService
  ) {}
  
 
//GET BALANCE 
@Get('get-balance')
@UseGuards(JwtAuthGuard)
async getBalance(
  @Body() createOrderDto: OrderSubmitDto,
  @Res() res: Response,
  @Req() req: Request,
) {
  console.log('Received Body:', createOrderDto);
  const { userId, email } = req['user'];
  const operation ='getbalance';
  await this.orderSubmitService.getBalance(createOrderDto, res, userId,operation);
}


//GET SYMBOL LIST
@Get('get-symbol-list')           
@UseGuards(JwtAuthGuard)
async getSymbolList(
  @Body() createOrderDto: OrderSubmitDto, 
  @Res() res: Response,
  @Req() req: Request,
) {
  console.log('Received Body:', createOrderDto);
  const { userId, email } = req['user'];
  await this.orderSubmitService.getSymbolList(createOrderDto, res, userId);
  return { message: 'Symbol list fetched successfully' };   

}

//SET VALID STOP LOSS 
@Post('set-valid-stop-loss')
@UseGuards(JwtAuthGuard)
async setValidStopLoss(     
  @Body() createOrderDto: OrderSubmitDto,
  @Res() res: Response,
  @Req() req: Request,
) {                       
  console.log('Received Body:', createOrderDto);
  const { userId, email } = req['user'];
  await this.orderSubmitService.setValidStopLoss(createOrderDto, res, userId);
  return { message: 'Valid stop loss set successfully' };
}


//SET VALID TARGET
@Post('set-valid-target')
@UseGuards(JwtAuthGuard)
async setValidTarget(
  @Body() createOrderDto: OrderSubmitDto,     
  @Res() res: Response,
  @Req() req: Request,
) {
  console.log('Received Body:', createOrderDto);
  const { userId, email } = req['user'];
  await this.orderSubmitService.setValidTarget(createOrderDto, res, userId);
  return { message: 'Valid target set successfully' };
}



  //PLACE MARKET ORDER(MARKET ENTRY) ,STOPLOSS ORDER(PENDING ENTRY)
  @Post('place-new-order')
  //@UseGuards(JwtAuthGuard)
  async placeNewOrder(
    @Body() createOrderDto: OrderSubmitDto,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    console.log('Received Body:', createOrderDto);
  //  const { userId, email } = req['user'];
   // const operation ='placeorder';
   // await this.orderSubmitService.placeNewOrder(createOrderDto, res, userId,operation);
    await this.kafkaProducerService.sendMessage('trading-topic', createOrderDto);
  }

  

//MODIFY PENDING ORDER BY POSITION CARD
  @Post('place-pending-order')
  @UseGuards(JwtAuthGuard)
  async placePendingOrder(
    @Body() createOrderDto: OrderSubmitDto,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    console.log('Received Body:', createOrderDto);
    const { userId, email } = req['user'];
    const operation ='placeorder';
    await this.orderSubmitService.placePendingOrder(createOrderDto, res, userId,operation);
  }

  //CANCEL PENDING ORDER BY POSITION CARD
  @Post('cancel-pending-order')
  @UseGuards(JwtAuthGuard)
  async cancelPendingOrder(
    @Body() createOrderDto: OrderSubmitDto,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    console.log('Received Body:', createOrderDto);
    const { userId, email } = req['user'];
    const operation ='cancelOrder';
    await this.orderSubmitService.cancelPendingOrder(createOrderDto, res, userId,operation);
    return { message: 'Pending order cancelled successfully' };
  }


//MODIFY STOPLOSS BY POSITION CARD
  @Post('modify-stop-loss')
  @UseGuards(JwtAuthGuard)
  async modifyStopLoss(
    @Body() createOrderDto: OrderSubmitDto,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    console.log('Received Body:', createOrderDto);
    const { userId, email } = req['user'];

    await this.orderSubmitService.modifyStopLoss(createOrderDto, res, userId);
    return { message: 'Stop loss modified successfully' };
  }

  //MODIFY TARGET BY POSITION CARD
  @Post('modify-target')
  @UseGuards(JwtAuthGuard)
  async modifyTarget(
    @Body() createOrderDto: OrderSubmitDto,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    console.log('Received Body:', createOrderDto);
    const { userId, email } = req['user'];
    await this.orderSubmitService.modifyTarget(createOrderDto, res, userId);
    return { message: 'Target modified successfully' };
  }

//CLSOSE POSITION BY POSITION CARD
  @Post('close-position')
  @UseGuards(JwtAuthGuard)
  async closePosition(
    @Body() createOrderDto: OrderSubmitDto,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    console.log('Received Body:', createOrderDto);
    const { userId, email } = req['user'];
    const operation ='closePosition';
    await this.orderSubmitService.closePosition(createOrderDto, res, userId,operation);
    return { message: 'Position closed successfully' };
  }
}
