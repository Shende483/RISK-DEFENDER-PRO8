// src/types/commonTypes.ts
export interface MarketType {
  name: string;
  shortName: string;
}

export interface TradingType {
  id: string;
  name: string;
}

export const MARKET_TYPES: MarketType[] = [
  { name: 'Stock Market', shortName: 'stockmarket' },
  { name: 'Cryptocurrency', shortName: 'cryptocurrency' },
  { name: 'Forex', shortName: 'forex' },
];

export const TRADING_TYPES: TradingType[] = [
  { id: 'cash', name: 'Cash' },
  { id: 'future', name: 'Future' },
  { id: 'option', name: 'Option' },
];


