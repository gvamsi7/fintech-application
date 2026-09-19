export type TradingMode = "paper" | "live";
export type OrderSide = "BUY" | "SELL";
export type OrderType = "MARKET" | "LIMIT" | "SL";

export type TradeOrder = {
  symbol: string;
  exchange: "NSE" | "BSE" | "NFO" | "MCX";
  side: OrderSide;
  type: OrderType;
  quantity: number;
  price?: number;
};

export interface BrokerAdapter {
  getQuotes(symbols: string[]): Promise<Record<string, number>>;
  getFunds(): Promise<number>;
  placeOrder(order: TradeOrder): Promise<{ orderId: string; status: string }>;
}

/**
 * Production broker adapters belong on the server.
 * Never expose broker API secrets in browser bundles.
 */
export function isLiveTradingEnabled() {
  return process.env.TRADING_MODE === "live";
}
