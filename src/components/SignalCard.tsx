import React from 'react';
import { TradeSetup } from '../types/crypto';
import { ChevronRight, ArrowUpRight, ArrowDownRight, ShieldAlert, BarChart2 } from 'lucide-react';

interface SignalCardProps {
  setup: TradeSetup;
  onOpenDetails: (setup: TradeSetup) => void;
  onOpenTradingView: (setup: TradeSetup) => void;
}

export const SignalCard: React.FC<SignalCardProps> = ({
  setup,
  onOpenDetails,
  onOpenTradingView,
}) => {
  const isPositive = setup.priceChange24h >= 0;
  const isTrade = setup.signal !== 'NO_TRADE';

  const formatPrice = (val: number) => {
    if (val < 1) return `$${val.toFixed(4)}`;
    return `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between">
      {/* Top row: Coin symbol, name, and Signal badge */}
      <div>
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-white tracking-tight">{setup.coin}</span>
              <span className="text-xs text-slate-400 font-medium">{setup.name}</span>
            </div>
            {/* Clean unboxed metadata */}
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
              <span>{setup.symbol}</span>
              <span aria-hidden="true">·</span>
              <span className="capitalize">{setup.timeframe} TF</span>
              <span aria-hidden="true">·</span>
              <span>{setup.marketRegime.replace('_', ' ').toLowerCase()}</span>
            </div>
          </div>

          <div className="text-right">
            <div
              className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-bold tracking-wider ${
                setup.signal === 'LONG'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : setup.signal === 'SHORT'
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              {setup.signal === 'LONG' && <ArrowUpRight className="w-3.5 h-3.5 mr-1" />}
              {setup.signal === 'SHORT' && <ArrowDownRight className="w-3.5 h-3.5 mr-1" />}
              {setup.signal === 'NO_TRADE' && <ShieldAlert className="w-3.5 h-3.5 mr-1" />}
              {setup.signal === 'NO_TRADE' ? 'NO TRADE' : setup.signal}
            </div>
          </div>
        </div>

        {/* Current price & 24h change */}
        <div className="flex items-baseline justify-between py-2 border-y border-slate-800/80 mb-4">
          <div>
            <span className="text-xs text-slate-400 block">Market Price</span>
            <span className="text-xl font-bold font-mono tabular-nums text-white">
              {formatPrice(setup.currentPrice)}
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 block">24h Change</span>
            <span className={`text-sm font-semibold font-mono tabular-nums ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isPositive ? '+' : ''}{setup.priceChange24h.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Levels Grid if trade is active, or Reason if NO_TRADE */}
        {isTrade ? (
          <div className="grid grid-cols-3 gap-2 mb-4 bg-slate-950/60 p-3 rounded-lg border border-slate-800/60 text-xs">
            <div>
              <span className="text-slate-400 block">Entry Zone</span>
              <span className="font-mono tabular-nums text-slate-200 font-medium">
                {formatPrice(setup.entryZone[0])} - {formatPrice(setup.entryZone[1])}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Stop Loss</span>
              <span className="font-mono tabular-nums text-rose-400 font-semibold">
                {formatPrice(setup.stopLoss)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">TP1 / TP2</span>
              <span className="font-mono tabular-nums text-emerald-400 font-semibold">
                {formatPrice(setup.takeProfit1)} / {formatPrice(setup.takeProfit2)}
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/60 text-xs mb-4">
            <span className="text-slate-400 font-medium block mb-1">Reason for No Trade:</span>
            <p className="text-slate-300 line-clamp-2">
              {setup.invalidationConditions[0] || 'Indicator signals lack sufficient confluence or trend alignment.'}
            </p>
          </div>
        )}

        {/* Quantitative Evidence & Confluence Bar */}
        <div className="space-y-1.5 mb-4 text-xs">
          <div className="flex justify-between items-center text-slate-400">
            <span>Confluence Score</span>
            <span className="font-mono tabular-nums text-slate-200 font-medium">
              {setup.confluenceScore} / 100
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                setup.signal === 'LONG'
                  ? 'bg-emerald-400'
                  : setup.signal === 'SHORT'
                  ? 'bg-rose-400'
                  : 'bg-slate-500'
              }`}
              style={{ width: `${Math.max(5, setup.confluenceScore)}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-slate-400 pt-1">
            <span>Algorithmic Confidence: <strong className="text-slate-300">{setup.confidenceLabel}</strong> ({setup.confidenceEstimate}%)</span>
            {isTrade && (
              <span className="font-mono tabular-nums text-cyan-400">
                R:R {setup.riskRewardRatio}:1
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
        <button
          onClick={() => onOpenTradingView(setup)}
          className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
        >
          <BarChart2 className="w-3.5 h-3.5" />
          <span>TradingView Chart</span>
        </button>

        <button
          onClick={() => onOpenDetails(setup)}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
        >
          <span>Deep Analysis</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
