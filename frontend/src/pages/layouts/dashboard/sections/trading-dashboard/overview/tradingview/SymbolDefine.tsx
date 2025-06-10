import { useMemo, useState, useContext, createContext } from 'react';

export const initialSymbols = [
  'BTCUSDT',
  'BTCUSDT.P',
  'BINANCE:ETHUSDT.P',
  'BINANCE:BNBUSDT.P',
  'BINANCE:XRPUSDT.P',
  'BINANCE:ADAUSDT.P',
  'BINANCE:SOLUSDT.P',
  'BINANCE:DOGEUSDT.P',
  'BINANCE:MATICUSDT.P',
  'BINANCE:DOTUSDT.P',
  'BINANCE:AVAXUSDT.P',
  'BINANCE:LTCUSDT.P',
  'BINANCE:LINKUSDT.P',
  'BINANCE:QARUSDT.P',
  'BINANCE:AEDUSDT.P',
  'BINANCE:SARUSDT.P',
  'BINANCE:KZTUSDT.P',
  'BINANCE:NGNUSDT.P',
  'BINANCE:UAHUSDT.P',
  'BINANCE:PKRUSDT.P',
  'BINANCE:KESUSDT.P',
  'BINANCE:TZSUSDT.P',
];

const SymbolContext = createContext({ symbol: '', setSymbol: (symbol: string) => {} });

export const SymbolProvider = ({ children }: { children: React.ReactNode }) => {
  const [symbol, setSymbol] = useState(initialSymbols[0]);

  const contextValue = useMemo(() => ({ symbol, setSymbol }), [symbol, setSymbol]);

  return <SymbolContext.Provider value={contextValue}>{children}</SymbolContext.Provider>;
};

export const useSymbol = () => {
  const context = useContext(SymbolContext);
  if (context === undefined) {
    throw new Error('useSymbol must be used within a SymbolProvider');
  }
  return context;
};
