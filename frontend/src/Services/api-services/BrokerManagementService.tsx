import BaseService from '../api-base/axios-base-service';

import type { BrokerManagement, BrokerManagmentdetails } from '../interface-types-services/BrokerManagementTypes';

export default class BrokerManagmentService extends BaseService {
  static async createBroker(BrokerManagment: BrokerManagement) {
    return this.post<{ message: string }>('broker/createBroker', BrokerManagment);
  }

  static async getBrokers() {
    return this.get<BrokerManagmentdetails[]>('broker/getBroker');
  }

  static async updateBroker(BrokerManagment: BrokerManagement) {
    return this.put<{ message: string }>('broker/updateBroker', BrokerManagment);
  }

  static async deleteByIdBroker(id: string) {
    return this.delete(`broker/${id}/deleteBroker`);
  }
}
