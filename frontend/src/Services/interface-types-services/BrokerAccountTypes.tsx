// types.ts
export interface BrokerAccountPayload {
  brokerAccountName: string;
  marketTypeId: string;
  brokerId: string;
  subscriptionId: string;
  apiKey: string;
  secretKey: string;
  status: string;
  tradingRuleData: {
    cash: string[];
    option: string[];
    future: string[];
  };
}

export interface BrokerAccountResponse {
  message: string;
  data?: any; // Replace with actual response structure
}

export interface Broker {
  _id: string;
  name: string;
}

export interface Plan {
  _id: string;
  userId: string;
  planId: string;
  planName: string;
  numberOfBroker: number;
  startDate: string;
  endDate?: string;
  status?: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}
