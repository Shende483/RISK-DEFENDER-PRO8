import BaseService from '../api-base/axios-base-service';
import { OrderPlacementype } from '../interface-types-services/OrderplacementTypes';

export default class OrderPlacementService extends BaseService {
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

    static async CreateOrder(order: OrderPlacementype) {
        return BaseService.post<OrderPlacementype>('order/createOrderTemplate', order);
    }
}