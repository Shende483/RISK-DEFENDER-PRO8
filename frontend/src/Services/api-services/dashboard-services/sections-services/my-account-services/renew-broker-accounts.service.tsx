import { ReactNode } from 'react';
import BaseService from '../../../../api-base/axios-base-service';

export interface BrokerList {
  name: ReactNode;
  _id: string;
  brokerName: string;
  brokerAccountName: string;
}

export interface SubaccountValidationResponse {
  statusCode: number;
  success: boolean;
  message: string;
}

export default class BrokerExpireListService extends BaseService {
  static async getExpiredBrokerAccounts() {
    return this.get<BrokerList[]>('/subBrokerAccount/expired-broker-list');
  }

  static async validateSubaccountName(body: {  marketTypeId: string ,brokerId: string; subAccountName: string }) {
    return this.post<SubaccountValidationResponse>('/subBrokerAccount/validate-subaccount', body);
  }
}