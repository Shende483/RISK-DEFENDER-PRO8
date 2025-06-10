import BaseService from '../api-base/axios-base-service';

export interface BrokerAccount {
  _id: string;
  brokerName: string;
  brokerAccountName: string;
}

export interface TradingType {
  id: string;
  name: string;
}

export default class BrokerService extends BaseService {
  static getAllActiveMarketTypes(): any {
         throw new Error('Method not implemented.');
  }
  
  static async getBrokerDetails(params: { marketType: string }) {
    return this.post<BrokerAccount[]>('/brokerAccount/broker-details', params);
  }

  static async getSubBrokerDetails(params: { marketType: string; brokerId: string }) {
    return this.post<BrokerAccount[]>('/brokerAccount/sub-broker-details', params);
  }

  static async getTradingTypes(params: { marketType: string; brokerId: string; subBrokerId: string }) {
    return this.post<TradingType[]>('/brokerAccount/trading-types', params);
  }

  static async getTradingRules(params: { marketType: string; brokerId: string; subBrokerId: string; tradingType: string }) {
    return this.post<any>('/brokerAccount/trading-rules', params);
  }
}