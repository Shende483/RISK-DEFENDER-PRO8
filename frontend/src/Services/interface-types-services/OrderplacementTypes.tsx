export interface OrderPlacementype {
    marketTypeId: string;
    orderType: string;
    orderPlacingType: string;
    entryPrice?: number;
    symbol: string;
    allowedDirection?: string[];
    marginTypes?: string[];
    maxLeverage: number;
    maxRiskPercentage: number;
    stopLoss: number;
    targetPrice: number;
    status: string;
}