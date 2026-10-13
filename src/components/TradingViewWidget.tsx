import React, { useEffect, useRef, useState } from 'react';
import { SupportedCoin, Timeframe, TradeSetup } from '../types/crypto';
import { SUPPORTED_COINS } from '../services/marketData';
import { ExternalLink, Info, ShieldAlert, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface TradingViewWidgetProps {
  selectedCoin: SupportedCoin;
  onSelectCoin: (coin: SupportedCoin) => void;
  selectedTimeframe: Timeframe;
  onSelectTimeframe: (tf: Timeframe) => void;
  currentSetup?: TradeSetup;
}

export const TradingViewWidget: React.FC<TradingViewWidgetProps> = ({
  selectedCoin,
  onSelectCoin,
  selectedTimeframe,
  onSelectTimeframe,
  currentSetup,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [iframeKey, setIframeKey] = useState(0);

  const coinMeta = SUPPORTED_COINS.find((c) => c.coin === selectedCoin) || SUPPORTED_COINS[0];

  // Map timeframe to TradingView interval string
  const tvIntervalMap: Record<Timeframe, string> = {
    '15m': '15',
    '1h': '60',
    '4h': '240',
    '1d': 'D',
  };

  const tvInterval = tvIntervalMap[selectedTimeframe] || '60';

  useEffect(() => {
    // Re-render iframe on symbol or timeframe change
    setIframeKey((prev) => prev + 1);
  }, [selectedCoin, selectedTimeframe]);

  const widgetUrl = `https://s.tradingview.com/widgetembed/?frameElementId=tradingview_widget&symbol=${encodeURIComponent(
    coinMeta.tradingViewSymbol
  )}&interval=${tvInterval}&hidesidetoolbar=0&symboledit=1&saveimage=1&toolbarbg=0f172a&theme=dark&style=1&timezone=Etc%2FUTC&studies=%5B%5D&enabled_features=%5B%5D&disabled_features=%5B%5D&show_popup_button=1&popup_width=1000&popup_height=650&locale=en`;

  const tradingViewExternalUrl = `https://www.tradingview.com/chart/?symbol=${encodeURIComponent(
    coinMeta.tradingViewSymbol
  )}`;

  const formatPrice = (p?: number) => {
    if (!p) return '--';
    if (p < 1) return `$${p.toFixed(4)}`;
    return `$${p.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-6">
      {/* Control bar: Coin tabs & Timeframe selector */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        {/* Coin Selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {SUPPORTED_COINS.map((c) => (
            <button
              key={c.coin}
              onClick={() => onSelectCoin(c.coin)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                selectedCoin === c.coin
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {c.coin}
            </button>
          ))}
        </div>

        {/* Timeframe Selector & External Link */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            {(['15m', '1h', '4h', '1d'] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                onClick={() => onSelectTimeframe(tf)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  selectedTimeframe === tf
                    ? 'bg-slate-800 text-cyan-400 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          <a
            href={tradingViewExternalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap border border-slate-700"
          >
            <span>Open in TradingView</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Main Grid: Chart on Left, Levels Comparison on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* TradingView Chart Container */}
        <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg flex flex-col h-[580px]">
          <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium text-slate-300">
              Interactive TradingView Chart · {coinMeta.tradingViewSymbol} · {selectedTimeframe.toUpperCase()}
            </span>
            <span className="text-[11px] text-slate-500 hidden sm:inline">
              Data feed provided via TradingView embed
            </span>
          </div>

          <div ref={containerRef} className="flex-1 w-full h-full relative">
            <iframe
              key={iframeKey}
              src={widgetUrl}
              title={`TradingView Chart ${selectedCoin}`}
              className="w-full h-full border-0"
              allowFullScreen
            />
          </div>
        </div>

        {/* Levels Comparison & Quantitative Alignment Panel */}
        <div className="lg:col-span-1 bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">{selectedCoin} Strategy Levels</h3>
                <span className="text-xs text-slate-400">Algorithmic execution matrix</span>
              </div>
              {currentSetup && (
                <div
                  className={`px-2 py-0.5 rounded text-xs font-bold ${
                    currentSetup.signal === 'LONG'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : currentSetup.signal === 'SHORT'
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {currentSetup.signal === 'NO_TRADE' ? 'NO TRADE' : currentSetup.signal}
                </div>
              )}
            </div>

            {currentSetup ? (
              <div className="mt-4 space-y-3.5 text-xs">
                {/* Current Price */}
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">Live Price</span>
                  <span className="font-mono tabular-nums font-bold text-white text-sm">
                    {formatPrice(currentSetup.currentPrice)}
                  </span>
                </div>

                {currentSetup.signal !== 'NO_TRADE' ? (
                  <>
                    {/* Entry Zone */}
                    <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80">
                      <div className="flex justify-between items-center text-slate-400 mb-1">
                        <span>Optimal Entry Zone</span>
                        <span className="text-cyan-400 font-mono">Mid: {formatPrice(currentSetup.entryPrice)}</span>
                      </div>
                      <div className="font-mono tabular-nums text-slate-200 font-semibold">
                        {formatPrice(currentSetup.entryZone[0])} - {formatPrice(currentSetup.entryZone[1])}
                      </div>
                    </div>

                    {/* Stop Loss */}
                    <div className="p-2.5 rounded-lg bg-rose-950/20 border border-rose-800/40">
                      <div className="flex justify-between items-center text-rose-300 mb-1 font-medium">
                        <span>Stop Loss (Structural/ATR)</span>
                        <span className="font-mono tabular-nums">
                          {((Math.abs(currentSetup.currentPrice - currentSetup.stopLoss) / currentSetup.currentPrice) * 100).toFixed(2)}%
                        </span>
                      </div>
                      <div className="font-mono tabular-nums text-rose-400 font-bold text-sm">
                        {formatPrice(currentSetup.stopLoss)}
                      </div>
                    </div>

                    {/* Take Profits */}
                    <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-800/40 space-y-2">
                      <div className="text-emerald-300 font-medium">Take Profit Targets (1.5R - 3.8R)</div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">TP1 (Conservative)</span>
                        <span className="font-mono tabular-nums text-emerald-400 font-semibold">{formatPrice(currentSetup.takeProfit1)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">TP2 (Target Objective)</span>
                        <span className="font-mono tabular-nums text-emerald-300 font-bold">{formatPrice(currentSetup.takeProfit2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">TP3 (Trend Runner)</span>
                        <span className="font-mono tabular-nums text-emerald-200 font-semibold">{formatPrice(currentSetup.takeProfit3)}</span>
                      </div>
                    </div>

                    {/* Risk-Reward & Confluence */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="p-2 rounded bg-slate-950 border border-slate-800 text-center">
                        <span className="text-slate-400 block text-[11px]">Risk-to-Reward</span>
                        <span className="font-mono font-bold text-cyan-400 text-sm">
                          {currentSetup.riskRewardRatio}:1
                        </span>
                      </div>
                      <div className="p-2 rounded bg-slate-950 border border-slate-800 text-center">
                        <span className="text-slate-400 block text-[11px]">Confluence</span>
                        <span className="font-mono font-bold text-slate-200 text-sm">
                          {currentSetup.confluenceScore}/100
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-2">
                    <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                      <ShieldAlert className="w-4 h-4 text-amber-400" />
                      <span>No Trade Setup Filtered</span>
                    </div>
                    <p className="text-slate-400 leading-relaxed">
                      {currentSetup.invalidationConditions[0] || 'Technical factors do not meet the minimum confluence threshold (66/100).'}
                    </p>
                    <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-500">
                      Regime: {currentSetup.marketRegime.replace('_', ' ')}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-slate-500 py-6 text-center">
                Loading quantitative levels for {selectedCoin}...
              </div>
            )}
          </div>

          {/* Architectural Disclaimer Notice */}
          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center gap-1 font-semibold text-slate-300">
              <Info className="w-3.5 h-3.5 text-cyan-400" />
              <span>Independent Quantitative Engine</span>
            </div>
            <p className="leading-normal">
              TradingView renders live market candles. Signals and levels are computed independently by QuantPulse's multi-strategy engine and do not execute within TradingView cloud.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
