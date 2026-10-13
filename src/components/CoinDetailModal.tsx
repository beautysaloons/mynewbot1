import React from 'react';
import { TradeSetup } from '../types/crypto';
import { X, CheckCircle2, AlertTriangle, ArrowUpRight, ArrowDownRight, ShieldAlert } from 'lucide-react';

interface CoinDetailModalProps {
  setup: TradeSetup | null;
  onClose: () => void;
}

export const CoinDetailModal: React.FC<CoinDetailModalProps> = ({ setup, onClose }) => {
  if (!setup) return null;

  const formatPrice = (p: number) => {
    if (p < 1) return `$${p.toFixed(4)}`;
    return `$${p.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold text-white tracking-tight">{setup.coin}</span>
            <span className="text-sm text-slate-400">{setup.name}</span>
            <span
              className={`ml-2 px-2.5 py-0.5 rounded text-xs font-bold tracking-wider ${
                setup.signal === 'LONG'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : setup.signal === 'SHORT'
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              {setup.signal === 'NO_TRADE' ? 'NO TRADE' : setup.signal}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs">
            <div>
              <span className="text-slate-400 block mb-1">Current Price</span>
              <span className="text-base font-bold font-mono tabular-nums text-white">
                {formatPrice(setup.currentPrice)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Confluence Score</span>
              <span className="text-base font-bold font-mono tabular-nums text-cyan-400">
                {setup.confluenceScore} / 100
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Market Regime</span>
              <span className="text-sm font-semibold text-slate-200 block truncate">
                {setup.marketRegime.replace('_', ' ')}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Historical Win Rate</span>
              <span className="text-sm font-semibold font-mono tabular-nums text-emerald-400">
                {setup.historicalWinRate}% ({setup.historicalSampleSize} trades)
              </span>
            </div>
          </div>

          {/* Trade Execution Zones (if active trade) */}
          {setup.signal !== 'NO_TRADE' && (
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-3">
              <h4 className="font-semibold text-slate-300">Execution Parameters & Sizing</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono tabular-nums">
                <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Entry Zone</span>
                  <span className="text-slate-200 font-bold">{formatPrice(setup.entryZone[0])} - {formatPrice(setup.entryZone[1])}</span>
                </div>
                <div className="p-2.5 rounded bg-slate-900 border border-rose-900/40">
                  <span className="text-rose-400 block text-[11px]">Stop Loss</span>
                  <span className="text-rose-300 font-bold">{formatPrice(setup.stopLoss)}</span>
                </div>
                <div className="p-2.5 rounded bg-slate-900 border border-emerald-900/40">
                  <span className="text-emerald-400 block text-[11px]">TP1 / TP2 / TP3</span>
                  <span className="text-emerald-300 font-bold">{formatPrice(setup.takeProfit1)} / {formatPrice(setup.takeProfit2)}</span>
                </div>
                <div className="p-2.5 rounded bg-slate-900 border border-cyan-900/40">
                  <span className="text-cyan-400 block text-[11px]">Risk:Reward</span>
                  <span className="text-cyan-300 font-bold">{setup.riskRewardRatio}:1</span>
                </div>
              </div>
            </div>
          )}

          {/* 10 Strategy Breakdown Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white tracking-tight">10-Strategy Confluence Evaluation Matrix</h4>
              <span className="text-xs text-slate-400">Independent weights & votes</span>
            </div>

            <div className="border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800/80 bg-slate-950/40">
              {setup.strategies.map((strat, index) => (
                <div key={strat.id} className="p-3.5 hover:bg-slate-900/50 transition-colors text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5 max-w-xl">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 font-mono text-[11px]">{(index + 1).toString().padStart(2, '0')}.</span>
                      <span className="font-semibold text-slate-200">{strat.name}</span>
                      <span className="text-slate-500 text-[11px]">({strat.category})</span>
                    </div>
                    <p className="text-slate-400 text-[11px]">{strat.evidence}</p>
                    <p className="text-slate-500 text-[10px]">Invalidation: {strat.invalidation}</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    <span className="font-mono text-slate-400 text-[11px]">W: {strat.weight}x</span>
                    <span
                      className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                        strat.vote === 'BULLISH'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : strat.vote === 'BEARISH'
                          ? 'bg-rose-950 text-rose-400 border border-rose-800'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {strat.vote}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Supporting Evidence & Invalidation Rules Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Supporting Evidence */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Supporting Quantitative Evidence</span>
              </div>
              <ul className="space-y-1.5 text-slate-300 pl-1">
                {setup.supportingEvidence.length > 0 ? (
                  setup.supportingEvidence.map((ev, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-emerald-500">•</span>
                      <span>{ev}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-slate-500">No decisive directional factors identified.</li>
                )}
              </ul>
            </div>

            {/* Invalidation Rules */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="flex items-center gap-1.5 font-semibold text-rose-400">
                <AlertTriangle className="w-4 h-4" />
                <span>Invalidation Conditions & Hazards</span>
              </div>
              <ul className="space-y-1.5 text-slate-300 pl-1">
                {setup.invalidationConditions.length > 0 ? (
                  setup.invalidationConditions.map((inv, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-rose-500">•</span>
                      <span>{inv}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-slate-500">Standard stop loss trigger applies.</li>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span>Walk-forward validation period: {setup.evaluationPeriod || '2025-2026'}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium transition-colors"
          >
            Close Analysis
          </button>
        </div>
      </div>
    </div>
  );
};
