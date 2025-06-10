import BaseService from "../api-base/axios-base-service"

import type { TradingRuleDetails, TradingRuletype } from "../interface-types-services/TradingRuleType";

export default class TradingRuleService extends BaseService {

    public static setAccessToken(authData: { accessToken: string, appUser: string, userId: string }) {
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

    static async CreateTradingRules(trading: TradingRuletype) {
        return BaseService.post<TradingRuletype>('trading-rules/createRules', trading)
    }

    static async getTradingRules() {
        return BaseService.get<TradingRuleDetails[]>('trading-rules/getRules');
    }

    static async updateTradingRules(trading: TradingRuletype) {
        return BaseService.put<TradingRuletype>('trading-rules/updateRules', trading)
    }

    static async deleteTradingRules(id: string) {
        return BaseService.delete(`trading-rules/${id}/deleteRules/`);
    }
}
