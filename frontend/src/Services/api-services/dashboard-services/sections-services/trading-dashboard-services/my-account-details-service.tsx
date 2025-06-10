import BaseService from '../../../../api-base/axios-base-service';

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
  static async getBrokerDetails(params: { marketTypeId: string }) {
    return this.get<BrokerAccount[]>('/brokerAccount/broker-details', { params });
  }

  static async getSubBrokerDetails(data: { marketTypeId: string; brokerId: string }) {
    return this.post<BrokerAccount[]>('/brokerAccount/sub-broker-details', data);
  }

  static async getTradingRules(data: { subBrokerId: string; tradingType: string }) {
    return this.post<any>('/brokerAccount/trading-rules', data);
  }
}