import { IsEnum, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString } from 'class-validator';

export class VerifyPaymentDto {
  @IsNotEmpty()
  @IsString()
  razorpayOrderId: string;

  @IsNotEmpty()
  @IsString()
  razorpayPaymentId: string;

  @IsNotEmpty()
  @IsString()
  razorpaySignature: string;

  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @IsNotEmpty()
  @IsString()
  currency: string;

   @IsNotEmpty()
    @IsEnum(['createBroker', 'renewBroker', 'tradingJournalActivate', 'tradingJournalRenew', 'alertActivate', 'alertRenew', 'penaltyPlan'])
    paymentType: 'createBroker' | 'renewBroker' | 'tradingJournalActivate' | 'tradingJournalRenew' | 'alertActivate' | 'alertRenew' | 'penaltyPlan';

   @IsNotEmpty()
    @IsString()
    planId: string;
  
    @IsOptional()
    @IsString()
    marketTypeId: string;
  
    @IsOptional()
    @IsString()
    brokerId: string;
  
    @IsOptional()
    @IsString()
    subAccountName: string;
  
    @IsOptional()
    @IsString()
    couponCode: string;


    @IsOptional()
    @IsString()
    brokerRenewId: string;

    
  
  
}