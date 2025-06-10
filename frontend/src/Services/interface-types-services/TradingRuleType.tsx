
export interface TradingRuletype {
  _id: string;
    marketTypeId: string;
    rules: {
        cash: string[];
        option: string[];
        future: string[];
      };
}

export interface TradingRuleDetails{
  _id: string;
  marketTypeId: string;
  rules: {
      cash: string[];
      option: string[];
      future: string[];
  }
} 
