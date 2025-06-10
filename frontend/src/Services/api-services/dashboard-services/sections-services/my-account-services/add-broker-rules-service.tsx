import { ReactNode } from 'react';
import BaseService from '../../../../api-base/axios-base-service';

export interface SubBrokerAccount {
  _id: string;
  marketTypeId: string;
  brokerId: string;
  brokerName: ReactNode;
   brokerKey: string;
  subAccountName: string;
  startDate: string;
  endDate: string;
  proxyServiceId: string;
}

export interface TradingRules {
  cash: { key: string; value: any }[];
  future: { key: string; value: any }[];
  option: { key: string; value: any }[];
}

export interface SubBrokerResponse {
  length: number;
  statusCode: number;
  success: boolean;
  message: string;
  data: SubBrokerAccount[];
}

export interface TradingRulesResponse {
  statusCode: number;
  success: boolean;
  message: string;
}

export interface ApiKeyVerificationResponse {
  statusCode: number;
  success: boolean;
  message: string;
}

export default class TradingRulesService extends BaseService {
  static async getSubBrokerAccountDetails() {
    return this.get<SubBrokerResponse>('/subBrokerAccount/subbroker-accounts');
  }

  static async setTradingRules(body: { 

    _id:string;
    marketTypeId: string;
    brokerKey: string; 
    subApiKey: string; 
    subSecretKey: string; 
    mainApiKey: string;
    mainSecretKey: string;
    proxyServiceId: string; 
    noRulesChange:boolean;
    tradingRuleData: TradingRules 
  }) {
    return this.post<TradingRulesResponse>('/subBrokerAccount/set-trading-rules', body);
  }

  static async verifyMainApiKeys(body: {
    marketTypeId: string;
    brokerId: string;
     brokerKey: string;
    mainApiKey: string;
    mainSecretKey: string;
  }) {
    return this.post<ApiKeyVerificationResponse>('/subBrokerAccount/verify-main-api-keys', body);
  }

  static async verifySubApiKeys(body: {
    marketTypeId: string;
    brokerId: string;
     brokerKey: string;
    subApiKey: string; // Changed from apiKey
    subSecretKey: string; // Changed from apiSecret
  }) {
    return this.post<ApiKeyVerificationResponse>('/subBrokerAccount/verify-sub-api-keys', body);
  }
}