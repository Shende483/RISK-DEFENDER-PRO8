
import { IsNotEmpty, IsNumber, IsString, IsOptional, IsEnum, IsObject } from 'class-validator';

export class CreatePaymentDto {
  @IsNotEmpty()
  @IsString()
  planId: string;

  @IsOptional()
  @IsString()
  couponCode: string;

  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @IsNotEmpty()
  @IsString()
  currency: string;

  @IsNotEmpty()
  @IsEnum(['createBroker', 'renewBroker', 'tradingJournalActivate', 'tradingJournalRenew', 'alertActivate', 'alertRenew', 'penaltyPlan'])
  paymentType: 'createBroker' | 'renewBroker' | 'tradingJournalActivate' | 'tradingJournalRenew' | 'alertActivate' | 'alertRenew' | 'penaltyPlan';

  @IsObject()
  data: {
    marketTypeId?: string;
    brokerId?: string;
    subAccountName?: string;
    renewId?: string;
    journalId?: string;
    alertId?: string;
    penaltyId?: string;
  };
}
