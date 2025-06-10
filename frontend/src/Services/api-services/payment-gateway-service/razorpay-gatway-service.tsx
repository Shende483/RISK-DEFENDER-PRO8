
import BaseService from "../../api-base/axios-base-service";

interface PaymentDetails {
  planId: string;
  couponCode: string;
  amount: number;
  currency: string;
  paymentType: 'createBroker' | 'renewBroker' | 'tradingJournalActivate' | 'tradingJournalRenew' | 'alertActivate' | 'alertRenew' | 'penaltyPlan';
  data: {
    marketTypeId?: string;
    brokerId?: string;
    subAccountName?: string;
    brokerRenewId?: string;
    journalId?: string;
    alertId?: string;
    penaltyId?: string;
  };
}

interface VerifyPaymentDetails {
  razorpayPaymentId: string;
  razorpayOrderId: string;
  razorpaySignature: string;
  amount: number;
  planId: string;
  paymentType: 'createBroker' | 'renewBroker' | 'tradingJournalActivate' | 'tradingJournalRenew' | 'alertActivate' | 'alertRenew' | 'penaltyPlan';
  marketTypeId?: string;
  brokerId?: string;
  subAccountName?: string;
  brokerRenewId?: string;
  journalId?: string;
  alertId?: string;
  penaltyId?: string;
  couponCode: string;
  currency:string
}

export default class RazorpayService extends BaseService {
  static async createPayment(paymentDetails: PaymentDetails) {
    return BaseService.post<{
      keyId: string; // Changed from any to string
      notes: any;
      amount: number;
      currency: string;
      orderId: string;
      email?: string;
      mobile?: string;
      createdAt: number;
      status: string;
    }>('payment-details/create-payment', paymentDetails);
  }

  static async verifyPayment(verifyDetails: VerifyPaymentDetails) {
    return BaseService.post('payment-details/verify-payment', verifyDetails);
  }
}
