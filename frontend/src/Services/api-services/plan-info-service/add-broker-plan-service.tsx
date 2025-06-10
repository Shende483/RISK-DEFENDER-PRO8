import BaseService from '../../api-base/axios-base-service';

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

export interface CouponResponse {
  statusCode: number;
  success: boolean;
  discountPercentage: number;
  message: string;
}

export default class BrokerPlanService extends BaseService {
  static async GetPlan() {
    return BaseService.get<PlanType[]>('subbroker-plan/getPlan');
  }

  static async VerifyCoupon(couponCode: string) {
    return BaseService.post<CouponResponse>('plan/coupon/verify', {code: couponCode});
  }
}