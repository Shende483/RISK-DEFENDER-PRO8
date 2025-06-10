import BaseService from '../api-base/axios-base-service';



export interface SubscriptionType {
  planId: string;
  planName: string;
  numberOfBroker: number;
  startDate: Date;
  endDate: Date;
  status: string;
  brokerId: string;
   marketTypeId:string;
   subAccountName:string;
}


 


export interface SubscriptionUpdateType {
  status: string;
}

export interface PaymentType {
  subscriptionId: string;
  amount: number;
  paymentMethod: string;
  transactionId: string;
  status: string;
}




export default class SubscriptionService {
  static VerifyCoupon: any;
 

  static async CreateSubscription(subscriptionType: SubscriptionType) {
    return BaseService.post<{ message: string }>(
      'subscription-details/subscribe',
      subscriptionType
    );
  }

  static async UpdateSubscription(UpdatesubscriptionType: SubscriptionUpdateType, id: string) {
    return BaseService.put<{ message: string }>(
      `subscription-details/update/${id}`,
      UpdatesubscriptionType
    );
  }
}
