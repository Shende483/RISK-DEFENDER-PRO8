import BaseService from '../../api-base/axios-base-service';
import type { SubscriptionPlan } from "../../../Admin/component/plan/PlanForm";





export interface PlanType {
  _id: string;
  name: string;
  duration: string;
  price: number;
  discountPercent: number;
  billingCycle: string;
  features: string[];
  description: string;
  gstRate: number;
  status: string;
  createdDate: string;
  modifiedDate: string;
  __v: number;
}



export default class BrokerPlanService extends BaseService {
  public static setAccessToken(authData: { accessToken: string; appUser: string; userId: string }) {
    localStorage.setItem('appUser', JSON.stringify(authData.appUser));
    localStorage.setItem('accessToken', authData.accessToken);
    localStorage.setItem('userId', authData.userId);
  }

  public static getAppUser() {
    return JSON.parse(localStorage.getItem('appUser') as string);
  }

  public static getAccessToken() {
    return localStorage.getItem('accessToken');
  }

  public static getUserId(): string {
    const userId = localStorage.getItem('userId');
    return userId !== null ? userId : '';
  }

  static async CreatePlan(plan: PlanType) {
    return BaseService.post<PlanType>('plan/createPlan', plan);
  }

  static async GetPlan() {
    return BaseService.get<SubscriptionPlan[]>('plan/getPlan');
  }

  static async updatePlan(plan: PlanType) {
    return BaseService.put<PlanType>('plan/updatePlan', plan);
  }

  static async deletePlan(id: string) {
    return BaseService.delete<PlanType>(`plan/${id}/deletePlan`);
  }
}
