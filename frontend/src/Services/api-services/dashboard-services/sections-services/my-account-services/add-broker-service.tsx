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

export default class BrokerListService extends BaseService {
  static async getBrokerDetails(params: { marketTypeId: string }) {
    return this.get<BrokerList[]>('/subBrokerAccount/broker-list', { params });
  }

  static async validateSubaccountName(body: {  marketTypeId: string ,brokerId: string; subAccountName: string }) {
    return this.post<SubaccountValidationResponse>('/subBrokerAccount/validate-subaccount', body);
  }
}