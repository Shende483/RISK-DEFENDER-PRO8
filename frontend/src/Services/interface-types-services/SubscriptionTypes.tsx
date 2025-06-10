export interface SubscriptionType {
  planId: string;
  planName: string;
  numberOfBroker: number;
  startDate: Date;
  endDate: Date;
  status: string;
  brokerId: string;
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

export interface PlanType {
  gstRate: number;
  discountPercent: number;
  duration: "1 month" | "3 months" | "6 months" | "12 months";
  _id: string;
  name: string;
  description:string;
  price: number;
  billingCycle: string;
  features: string[];
  status: string;
}
