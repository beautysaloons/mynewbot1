export type SupportedCoin = 'BTC' | 'ETH' | 'SOL' | 'BNB' | 'ADA' | 'XRP' | 'SUI' | 'LINK' | 'DOGE';

export type Timeframe = '15m' | '1h' | '4h' | '1d';

export type SignalType = 'LONG' | 'SHORT' | 'NO_TRADE';

export type MarketRegime = 
  | 'BULLISH_TRENDING'
  | 'BEARISH_TRENDING'
  | 'HIGH_VOLATILITY'
  | 'RANGING_COMPRESSED'
  | 'UNCERTAIN_CHOPPY';

export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StrategyResult {
  id: string;
  name: string;
  category: string;
  vote: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  score: number; // -10 to +10
  weight: number;
  description: string;
  evidence: string;
  invalidation: string;
}

export interface TradeSetup {
  coin: SupportedCoin;
  symbol: string; // e.g. BTCUSDT
  tradingViewSymbol: string; // e.g. BINANCE:BTCUSDT
  name: string;
  currentPrice: number;
  priceChange24h: number;
  signal: SignalType;
  signalTime: number;
  timeframe: Timeframe;
  marketRegime: MarketRegime;
  regimeDescription: string;
  
  // Levels
  entryPrice: number;
  entryZone: [number, number];
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  takeProfit3: number;
  riskRewardRatio: number;
  
  // Quantitative Metrics
  confluenceScore: number; // 0 to 100
  confidenceEstimate: number; // 0 to 100% (clearly marked as algorithmic evidence score)
  confidenceLabel: 'High' | 'Moderate' | 'Low' | 'Insufficient';
  
  // Historical context
  historicalWinRate?: number; // percentage if validated
  historicalSampleSize?: number;
  evaluationPeriod?: string;
  isValidated: boolean;
  
  // Breakdown
  strategies: StrategyResult[];
  supportingEvidence: string[];
  invalidationConditions: string[];
  higherTimeframeAlignment: 'ALIGNED' | 'CONFLICTING' | 'NEUTRAL';
  higherTimeframeTrend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  
  // Operational details
  dataFreshness: 'LIVE' | 'FALLBACK_CACHED';
  lastCandleTimestamp: number;
}

export interface BacktestConfig {
  coin: SupportedCoin;
  timeframe: Timeframe;
  initialBalance: number;
  riskPerTradePct: number; // e.g. 1.5%
  takerFeePct: number; // e.g. 0.06%
  slippagePct: number; // e.g. 0.05%
  candleLimit: number; // e.g. 300 to 500
}

export interface BacktestTrade {
  id: number;
  coin: SupportedCoin;
  type: 'LONG' | 'SHORT';
  entryTime: number;
  entryPrice: number;
  exitTime: number;
  exitPrice: number;
  stopLoss: number;
  takeProfit: number;
  returnPct: number;
  netPnl: number;
  exitReason: 'TAKE_PROFIT_1' | 'TAKE_PROFIT_2' | 'TAKE_PROFIT_3' | 'STOP_LOSS' | 'INVALIDATION' | 'TIME_EXIT';
  riskRewardRatio: number;
  regime: MarketRegime;
}

export interface BacktestSummary {
  coin: SupportedCoin;
  timeframe: Timeframe;
  periodStart: string;
  periodEnd: string;
  sampleCandles: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number; // %
  profitFactor: number;
  netReturnPct: number;
  maxDrawdownPct: number;
  expectancyPct: number;
  averageRiskReward: number;
  benchmarkBuyAndHoldPct: number;
  trades: BacktestTrade[];
  equityCurve: { timestamp: number; balance: number; drawdownPct: number }[];
  regimeBreakdown: {
    regime: string;
    tradeCount: number;
    winRate: number;
    netPnlPct: number;
  }[];
}

export interface CoinMetadata {
  coin: SupportedCoin;
  name: string;
  binanceSymbol: string;
  tradingViewSymbol: string;
  decimals: number;
}
