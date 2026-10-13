import { BacktestConfig, BacktestSummary, BacktestTrade, Candle, MarketRegime } from '../types/crypto';
import { evaluateMarket } from './strategies';

export function runBacktest(candles: Candle[], config: BacktestConfig): BacktestSummary {
  const { coin, timeframe, initialBalance, riskPerTradePct, takerFeePct, slippagePct } = config;
  
  if (candles.length < 60) {
    throw new Error('Insufficient historical candle count for meaningful backtest (minimum 60 required).');
  }

  let currentBalance = initialBalance;
  let peakBalance = initialBalance;
  let maxDrawdownPct = 0;
  const trades: BacktestTrade[] = [];
  const equityCurve: { timestamp: number; balance: number; drawdownPct: number }[] = [
    { timestamp: candles[0].timestamp, balance: initialBalance, drawdownPct: 0 }
  ];

  const regimeStats: Record<MarketRegime, { count: number; wins: number; pnl: number }> = {
    BULLISH_TRENDING: { count: 0, wins: 0, pnl: 0 },
    BEARISH_TRENDING: { count: 0, wins: 0, pnl: 0 },
    HIGH_VOLATILITY: { count: 0, wins: 0, pnl: 0 },
    RANGING_COMPRESSED: { count: 0, wins: 0, pnl: 0 },
    UNCERTAIN_CHOPPY: { count: 0, wins: 0, pnl: 0 }
  };

  let activeTrade: {
    type: 'LONG' | 'SHORT';
    entryIndex: number;
    entryTime: number;
    entryPrice: number;
    stopLoss: number;
    tp1: number;
    tp2: number;
    tp3: number;
    positionSizeUsd: number;
    riskReward: number;
    regime: MarketRegime;
  } | null = null;

  // Walk forward bar by bar (starting after warm-up period of 35 bars)
  const warmUpBars = 35;
  for (let i = warmUpBars; i < candles.length - 1; i++) {
    const historicalSlice = candles.slice(0, i + 1);
    const currentBar = candles[i];
    const nextBar = candles[i + 1];

    // If we have an active position, check price progression in current bar
    if (activeTrade) {
      let exitPrice = 0;
      let exitReason: BacktestTrade['exitReason'] | null = null;

      if (activeTrade.type === 'LONG') {
        if (currentBar.low <= activeTrade.stopLoss) {
          // Hit stop loss with slippage
          exitPrice = activeTrade.stopLoss * (1 - slippagePct / 100);
          exitReason = 'STOP_LOSS';
        } else if (currentBar.high >= activeTrade.tp3) {
          exitPrice = activeTrade.tp3 * (1 - slippagePct / 100);
          exitReason = 'TAKE_PROFIT_3';
        } else if (currentBar.high >= activeTrade.tp2) {
          exitPrice = activeTrade.tp2 * (1 - slippagePct / 100);
          exitReason = 'TAKE_PROFIT_2';
        } else if (currentBar.high >= activeTrade.tp1 && i - activeTrade.entryIndex >= 8) {
          // Scaled TP1 exit after hold duration
          exitPrice = activeTrade.tp1 * (1 - slippagePct / 100);
          exitReason = 'TAKE_PROFIT_1';
        } else if (i - activeTrade.entryIndex > 24) {
          // Time-based exit if stagnation
          exitPrice = currentBar.close;
          exitReason = 'TIME_EXIT';
        }
      } else {
        // SHORT position
        if (currentBar.high >= activeTrade.stopLoss) {
          exitPrice = activeTrade.stopLoss * (1 + slippagePct / 100);
          exitReason = 'STOP_LOSS';
        } else if (currentBar.low <= activeTrade.tp3) {
          exitPrice = activeTrade.tp3 * (1 + slippagePct / 100);
          exitReason = 'TAKE_PROFIT_3';
        } else if (currentBar.low <= activeTrade.tp2) {
          exitPrice = activeTrade.tp2 * (1 + slippagePct / 100);
          exitReason = 'TAKE_PROFIT_2';
        } else if (currentBar.low <= activeTrade.tp1 && i - activeTrade.entryIndex >= 8) {
          exitPrice = activeTrade.tp1 * (1 + slippagePct / 100);
          exitReason = 'TAKE_PROFIT_1';
        } else if (i - activeTrade.entryIndex > 24) {
          exitPrice = currentBar.close;
          exitReason = 'TIME_EXIT';
        }
      }

      if (exitReason) {
        // Calculate PnL with fees
        const grossReturnPct = activeTrade.type === 'LONG'
          ? ((exitPrice - activeTrade.entryPrice) / activeTrade.entryPrice) * 100
          : ((activeTrade.entryPrice - exitPrice) / activeTrade.entryPrice) * 100;

        // Apply two legs of taker fee (entry + exit)
        const netReturnPct = grossReturnPct - (takerFeePct * 2);
        const tradePnlUsd = (activeTrade.positionSizeUsd * netReturnPct) / 100;

        currentBalance += tradePnlUsd;
        if (currentBalance > peakBalance) {
          peakBalance = currentBalance;
        }
        const currentDrawdown = ((peakBalance - currentBalance) / peakBalance) * 100;
        if (currentDrawdown > maxDrawdownPct) {
          maxDrawdownPct = currentDrawdown;
        }

        const completedTrade: BacktestTrade = {
          id: trades.length + 1,
          coin,
          type: activeTrade.type,
          entryTime: activeTrade.entryTime,
          entryPrice: activeTrade.entryPrice,
          exitTime: currentBar.timestamp,
          exitPrice,
          stopLoss: activeTrade.stopLoss,
          takeProfit: activeTrade.tp2,
          returnPct: Number(netReturnPct.toFixed(2)),
          netPnl: Number(tradePnlUsd.toFixed(2)),
          exitReason,
          riskRewardRatio: activeTrade.riskReward,
          regime: activeTrade.regime
        };

        trades.push(completedTrade);

        // Update regime stats
        regimeStats[activeTrade.regime].count++;
        regimeStats[activeTrade.regime].pnl += netReturnPct;
        if (netReturnPct > 0) {
          regimeStats[activeTrade.regime].wins++;
        }

        equityCurve.push({
          timestamp: currentBar.timestamp,
          balance: Number(currentBalance.toFixed(2)),
          drawdownPct: Number(currentDrawdown.toFixed(2))
        });

        activeTrade = null;
      }
    }

    // If no active trade, evaluate strategy on the closed historical bar
    if (!activeTrade && i < candles.length - 2) {
      const setup = evaluateMarket({
        coin,
        symbol: `${coin}USDT`,
        tradingViewSymbol: `BINANCE:${coin}USDT`,
        name: coin,
        timeframe,
        candles: historicalSlice,
        priceChange24h: 0
      });

      if (setup.signal === 'LONG' || setup.signal === 'SHORT') {
        // Enter on the next bar's open with slippage
        const entryPrice = setup.signal === 'LONG'
          ? nextBar.open * (1 + slippagePct / 100)
          : nextBar.open * (1 - slippagePct / 100);

        // Calculate dynamic position size based on risk per trade
        const riskDistance = Math.abs(entryPrice - setup.stopLoss);
        const riskDollarAmount = (currentBalance * riskPerTradePct) / 100;
        const positionUnits = riskDistance > 0 ? riskDollarAmount / riskDistance : 0;
        const positionSizeUsd = Math.min(positionUnits * entryPrice, currentBalance * 0.95);

        if (positionSizeUsd > 10) {
          activeTrade = {
            type: setup.signal,
            entryIndex: i + 1,
            entryTime: nextBar.timestamp,
            entryPrice,
            stopLoss: setup.stopLoss,
            tp1: setup.takeProfit1,
            tp2: setup.takeProfit2,
            tp3: setup.takeProfit3,
            positionSizeUsd,
            riskReward: setup.riskRewardRatio,
            regime: setup.marketRegime
          };
        }
      }
    }
  }

  // Calculate aggregate metrics
  const winningTrades = trades.filter(t => t.netPnl > 0);
  const losingTrades = trades.filter(t => t.netPnl <= 0);
  const winRate = trades.length > 0 ? Number(((winningTrades.length / trades.length) * 100).toFixed(1)) : 0;
  
  const grossProfit = winningTrades.reduce((sum, t) => sum + t.netPnl, 0);
  const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.netPnl, 0));
  const profitFactor = grossLoss > 0 ? Number((grossProfit / grossLoss).toFixed(2)) : (grossProfit > 0 ? 9.99 : 0);

  const netReturnPct = Number((((currentBalance - initialBalance) / initialBalance) * 100).toFixed(2));
  const expectancyPct = trades.length > 0 
    ? Number((trades.reduce((sum, t) => sum + t.returnPct, 0) / trades.length).toFixed(2))
    : 0;

  const averageRiskReward = trades.length > 0
    ? Number((trades.reduce((sum, t) => sum + t.riskRewardRatio, 0) / trades.length).toFixed(2))
    : 0;

  // Benchmark: Buy and Hold over the same period
  const firstPrice = candles[warmUpBars]?.open || 1;
  const lastPrice = candles[candles.length - 1]?.close || 1;
  const benchmarkBuyAndHoldPct = Number((((lastPrice - firstPrice) / firstPrice) * 100).toFixed(2));

  const regimeBreakdown = Object.entries(regimeStats).map(([regime, data]) => ({
    regime,
    tradeCount: data.count,
    winRate: data.count > 0 ? Number(((data.wins / data.count) * 100).toFixed(1)) : 0,
    netPnlPct: Number(data.pnl.toFixed(2))
  }));

  const startFormatted = new Date(candles[0].timestamp).toISOString().split('T')[0];
  const endFormatted = new Date(candles[candles.length - 1].timestamp).toISOString().split('T')[0];

  return {
    coin,
    timeframe,
    periodStart: startFormatted,
    periodEnd: endFormatted,
    sampleCandles: candles.length,
    totalTrades: trades.length,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    winRate,
    profitFactor,
    netReturnPct,
    maxDrawdownPct: Number(maxDrawdownPct.toFixed(2)),
    expectancyPct,
    averageRiskReward,
    benchmarkBuyAndHoldPct,
    trades: trades.slice(-50), // Return last 50 trades for clean UI tabular inspection
    equityCurve,
    regimeBreakdown
  };
}
