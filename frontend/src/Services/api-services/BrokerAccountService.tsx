// BrokerAccountService.ts
import BaseService from '../api-base/axios-base-service';

import type {
  Plan,
  BrokerAccountPayload,
  BrokerAccountResponse,
} from '../interface-types-services/BrokerAccountTypes';

export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  success: boolean;
  data: T;
}

export interface Broker {
  _id: string;
  name: string;
}

export default class BrokerAccountService extends BaseService {
  public static setAccessToken(authData: { accessToken: string; appUser: string; userId: string }) {
    localStorage.setItem('appUser', JSON.stringify(authData.appUser));
    localStorage.setItem('accessToken', authData.accessToken);
    localStorage.setItem('userId', authData.userId);
  }

  public static getAccessToken() {
    return localStorage.getItem('accessToken');
  }

  public static getUserId(): string {
    const userId = localStorage.getItem('userId');
    return userId ?? ''; // return an empty string if userId is null
  }

  static async createBrokerAccount(payload: BrokerAccountPayload): Promise<BrokerAccountResponse> {
    return this.post<BrokerAccountResponse>('brokerAccount/createBrokerAccount', payload);
  }

  // static async getBrokersByMarketTypeId(marketTypeId: string): Promise<Broker[]> {
  //   const response = await this.get<Broker[]>(
  //     `broker/by-market-type?marketTypeId=${marketTypeId}`
  //   );
  //   return response.data;
  // }
/*
  static async getUserSubscriptionPlans() {
    return this.get<Plan[]>('subscription-details/get-user-subscriptions');
  }
    */

  static async fetchBrokersByMarketTypeId(marketTypeId: string) {
    const response = await this.get<Broker[]>(`broker/by-market-type?marketTypeId=${marketTypeId}`
    );
    return response.data;
  }
}
