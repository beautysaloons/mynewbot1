import React, { useState } from 'react';
import { BacktestConfig, BacktestSummary, SupportedCoin, Timeframe } from '../types/crypto';
import { SUPPORTED_COINS } from '../services/marketData';
import { Play, TrendingUp, TrendingDown, Shield, DollarSign, Activity, Percent } from 'lucide-react';

interface BacktestingViewProps {
  onRunBacktest: (config: BacktestConfig) => Promise<BacktestSummary>;
  defaultSummary?: BacktestSummary | null;
}

export const BacktestingView: React.FC<BacktestingViewProps> = ({
  onRunBacktest,
  defaultSummary,
}) => {
  const [selectedCoin, setSelectedCoin] = useState<SupportedCoin>('BTC');
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('1h');
  const [initialBalance, setInitialBalance] = useState<number>(10000);
  const [riskPerTradePct, setRiskPerTradePct] = useState<number>(1.5);
  const [takerFeePct, setTakerFeePct] = useState<number>(0.06);
  const [slippagePct, setSlippagePct] = useState<number>(0.05);
  const [candleLimit, setCandleLimit] = useState<number>(300);

  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<BacktestSummary | null>(defaultSummary || null);
  const [error, setError] = useState<string | null>(null);

  const handleExecute = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await onRunBacktest({
        coin: selectedCoin,
        timeframe: selectedTimeframe,
        initialBalance,
        riskPerTradePct,
        takerFeePct,
        slippagePct,
        candleLimit,
      });
      setSummary(result);
    } catch (err: any) {
      setError(err?.message || 'Backtest failed to execute.');
    } finally {
      setLoading(false);
    }
  };

  // Render SVG Equity Curve
  const renderEquityCurve = () => {
    if (!summary || summary.equityCurve.length < 2) return null;

    const data = summary.equityCurve;
    const width = 800;
    const height = 240;
    const padding = 35;

    const minBalance = Math.min(...data.map((d) => d.balance)) * 0.98;
    const maxBalance = Math.max(...data.map((d) => d.balance)) * 1.02;

    const points = data.map((d, index) => {
      const x = padding + (index / (data.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((d.balance - minBalance) / (maxBalance - minBalance || 1)) * (height - 2 * padding);
      return `${x},${y}`;
    });

    const pathD = `M ${points.join(' L ')}`;
    const areaD = `${pathD} L ${width - padding},${height - padding} L ${padding},${height - padding} Z`;

    const isProfit = summary.netReturnPct >= 0;

    return (
      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 relative">
        <div className="flex justify-between items-center mb-2 text-xs text-slate-400">
          <span className="font-semibold text-slate-300">Equity Curve Simulation ({summary.periodStart} to {summary.periodEnd})</span>
          <span className="font-mono tabular-nums">
            Start: ${initialBalance.toLocaleString()} · End: ${(initialBalance * (1 + summary.netReturnPct / 100)).toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </span>
        </div>

        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-48 overflow-visible">
          <defs>
            <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={isProfit ? '#06b6d4' : '#f43f5e'} stopOpacity="0.25" />
              <stop offset="100%" stopColor={isProfit ? '#06b6d4' : '#f43f5e'} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#1e293b" strokeDasharray="3,3" />
          <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#1e293b" strokeDasharray="3,3" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#1e293b" />

          {/* Area fill */}
          <path d={areaD} fill="url(#equityGrad)" />

          {/* Line curve */}
          <path d={pathD} fill="none" stroke={isProfit ? '#22d3ee' : '#fb7185'} strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Parameter Configuration Bar */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Walk-Forward Historical Backtesting Engine</h2>
            <p className="text-xs text-slate-400">
              Rigorous out-of-sample simulation with zero look-ahead bias, explicit SL/TP triggers, realistic exchange taker fees (0.06%), and slippage (0.05%).
            </p>
          </div>

          <button
            onClick={handleExecute}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg shadow-sm transition-all disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Simulating...' : 'Run Backtest'}</span>
          </button>
        </div>

        {/* Input Parameters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div>
            <label className="text-slate-400 block mb-1 font-medium">Asset Pair</label>
            <select
              value={selectedCoin}
              onChange={(e) => setSelectedCoin(e.target.value as SupportedCoin)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
            >
              {SUPPORTED_COINS.map((c) => (
                <option key={c.coin} value={c.coin}>
                  {c.coin} ({c.name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-medium">Timeframe</label>
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value as Timeframe)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
            >
              <option value="15m">15m (Intraday)</option>
              <option value="1h">1h (Standard)</option>
              <option value="4h">4h (Swing)</option>
              <option value="1d">1d (Macro)</option>
            </select>
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-medium">Initial Capital ($)</label>
            <input
              type="number"
              value={initialBalance}
              onChange={(e) => setInitialBalance(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-medium">Risk / Trade (%)</label>
            <input
              type="number"
              step="0.1"
              value={riskPerTradePct}
              onChange={(e) => setRiskPerTradePct(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-medium">Taker Fee / Leg (%)</label>
            <input
              type="number"
              step="0.01"
              value={takerFeePct}
              onChange={(e) => setTakerFeePct(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-medium">Slippage (%)</label>
            <input
              type="number"
              step="0.01"
              value={slippagePct}
              onChange={(e) => setSlippagePct(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono"
            />
          </div>
        </div>

        {error && <div className="mt-3 text-xs text-rose-400">{error}</div>}
      </div>

      {/* Results Dashboard */}
      {summary ? (
        <div className="space-y-6">
          {/* Key Metrics Matrix */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl text-xs">
              <span className="text-slate-400 block mb-1">Net Return</span>
              <span
                className={`text-lg font-bold font-mono tabular-nums ${
                  summary.netReturnPct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {summary.netReturnPct >= 0 ? '+' : ''}{summary.netReturnPct}%
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                Benchmark: {summary.benchmarkBuyAndHoldPct >= 0 ? '+' : ''}{summary.benchmarkBuyAndHoldPct}%
              </span>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl text-xs">
              <span className="text-slate-400 block mb-1">Win Rate</span>
              <span className="text-lg font-bold font-mono tabular-nums text-white">
                {summary.winRate}%
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                {summary.winningTrades} W / {summary.losingTrades} L ({summary.totalTrades} total)
              </span>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl text-xs">
              <span className="text-slate-400 block mb-1">Profit Factor</span>
              <span className="text-lg font-bold font-mono tabular-nums text-cyan-400">
                {summary.profitFactor}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Gross gains / Gross losses</span>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl text-xs">
              <span className="text-slate-400 block mb-1">Max Drawdown</span>
              <span className="text-lg font-bold font-mono tabular-nums text-rose-400">
                -{summary.maxDrawdownPct}%
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Peak-to-trough drop</span>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl text-xs">
              <span className="text-slate-400 block mb-1">Expectancy</span>
              <span className="text-lg font-bold font-mono tabular-nums text-slate-200">
                {summary.expectancyPct >= 0 ? '+' : ''}{summary.expectancyPct}%
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Avg edge per trade</span>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl text-xs">
              <span className="text-slate-400 block mb-1">Avg Risk:Reward</span>
              <span className="text-lg font-bold font-mono tabular-nums text-slate-200">
                {summary.averageRiskReward}:1
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">{summary.sampleCandles} historical bars</span>
            </div>
          </div>

          {/* Equity Curve SVG */}
          {renderEquityCurve()}

          {/* Market Regime Breakdown */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-bold text-white mb-3">Performance by Market Regime</h3>
            <div className="border border-slate-800 rounded-lg overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Regime Type</th>
                    <th className="py-2.5 px-4 font-semibold">Trade Count</th>
                    <th className="py-2.5 px-4 font-semibold">Win Rate</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Cumulative Net Return</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {summary.regimeBreakdown.map((r) => (
                    <tr key={r.regime} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-4 text-slate-200 font-medium">{r.regime.replace('_', ' ')}</td>
                      <td className="py-2.5 px-4 font-mono tabular-nums text-slate-300">{r.tradeCount}</td>
                      <td className="py-2.5 px-4 font-mono tabular-nums text-slate-300">{r.winRate}%</td>
                      <td
                        className={`py-2.5 px-4 font-mono tabular-nums text-right font-semibold ${
                          r.netPnlPct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {r.netPnlPct >= 0 ? '+' : ''}{r.netPnlPct}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Trade Execution Log */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-bold text-white">Historical Trade Log (Recent Trades)</h3>
              <span className="text-xs text-slate-400 font-mono tabular-nums">{summary.trades.length} recorded</span>
            </div>

            <div className="border border-slate-800 rounded-lg overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2 px-3">#</th>
                    <th className="py-2 px-3">Type</th>
                    <th className="py-2 px-3">Entry Price</th>
                    <th className="py-2 px-3">Exit Price</th>
                    <th className="py-2 px-3">Exit Reason</th>
                    <th className="py-2 px-3">R:R</th>
                    <th className="py-2 px-3 text-right">Net Return</th>
                    <th className="py-2 px-3 text-right">PnL ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 font-mono tabular-nums">
                  {summary.trades.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-800/40">
                      <td className="py-2 px-3 text-slate-500">{t.id}</td>
                      <td className="py-2 px-3">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            t.type === 'LONG' ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
                          }`}
                        >
                          {t.type}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-300">${t.entryPrice.toFixed(2)}</td>
                      <td className="py-2 px-3 text-slate-300">${t.exitPrice.toFixed(2)}</td>
                      <td className="py-2 px-3 text-slate-400 text-[11px] font-sans">{t.exitReason.replace('_', ' ')}</td>
                      <td className="py-2 px-3 text-slate-400">{t.riskRewardRatio}:1</td>
                      <td
                        className={`py-2 px-3 text-right font-bold ${
                          t.returnPct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {t.returnPct >= 0 ? '+' : ''}{t.returnPct}%
                      </td>
                      <td
                        className={`py-2 px-3 text-right ${
                          t.netPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {t.netPnl >= 0 ? '+' : ''}${t.netPnl.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
          <Activity className="w-8 h-8 mx-auto mb-2 text-cyan-400/60" />
          <h3 className="text-sm font-semibold text-slate-200">No Backtest Executed Yet</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Select an asset and parameters above, then click "Run Backtest" to generate out-of-sample execution statistics.
          </p>
        </div>
      )}
    </div>
  );
};
