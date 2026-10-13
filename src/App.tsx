/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect, useCallback } from 'react';
import { BacktestConfig, BacktestSummary, SignalType, SupportedCoin, Timeframe, TradeSetup } from './types/crypto';
import { SUPPORTED_COINS, getMarketDataForCoin } from './services/marketData';
import { evaluateMarket } from './engine/strategies';
import { runBacktest } from './engine/backtester';
import { Header } from './components/Header';
import { TickerStrip } from './components/TickerStrip';
import { SignalCard } from './components/SignalCard';
import { TradingViewWidget } from './components/TradingViewWidget';
import { BacktestingView } from './components/BacktestingView';
import { ArchitectureView } from './components/ArchitectureView';
import { CoinDetailModal } from './components/CoinDetailModal';
import { generateProjectZip } from './utils/zipExport';
import { Filter, Layers, LayoutGrid, Table as TableIcon, RefreshCw, AlertCircle, Clock, ShieldCheck } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'chart' | 'backtest' | 'architecture'>('overview');
  const [selectedCoin, setSelectedCoin] = useState<SupportedCoin>('BTC');
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('1h');
  
  const [setups, setSetups] = useState<TradeSetup[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [lastScanTime, setLastScanTime] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Filters for Overview
  const [signalFilter, setSignalFilter] = useState<'ALL' | SignalType>('ALL');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [selectedDetailSetup, setSelectedDetailSetup] = useState<TradeSetup | null>(null);

  // Export ZIP state
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Initial and default backtest summary
  const [defaultBacktestSummary, setDefaultBacktestSummary] = useState<BacktestSummary | null>(null);

  // Core market scanning routine (uses API if available, falls back seamlessly to client engine)
  const performMarketScan = useCallback(async (timeframe: Timeframe, forceFresh: boolean = false) => {
    try {
      setError(null);
      
      // 1. Try server API
      try {
        const response = await fetch(`/api/scan?timeframe=${timeframe}&fresh=${forceFresh}`);
        if (response.ok) {
          const resData = await response.json();
          if (resData.data && Array.isArray(resData.data) && resData.data.length > 0) {
            setSetups(resData.data);
            setLastScanTime(resData.timestamp || Date.now());
            return;
          }
        }
      } catch (apiErr) {
        // Server API unreachable; proceed with client evaluation engine
      }

      // 2. Direct client-side quantitative evaluation across all 9 coins
      const scanResults: TradeSetup[] = [];
      for (const meta of SUPPORTED_COINS) {
        const { candles, priceChange24h, isFallback } = await getMarketDataForCoin(meta, timeframe, 150);
        const htTf: Timeframe = timeframe === '15m' ? '1h' : timeframe === '1h' ? '4h' : '1d';
        const { candles: htCandles } = await getMarketDataForCoin(meta, htTf, 50).catch(() => ({ candles: [] }));

        const setup = evaluateMarket({
          coin: meta.coin,
          symbol: meta.binanceSymbol,
          tradingViewSymbol: meta.tradingViewSymbol,
          name: meta.name,
          timeframe,
          candles,
          higherTimeframeCandles: htCandles,
          priceChange24h,
        });

        if (isFallback) {
          setup.dataFreshness = 'FALLBACK_CACHED';
        }

        scanResults.push(setup);
      }

      setSetups(scanResults);
      setLastScanTime(Date.now());
    } catch (err: any) {
      console.error('Scan error:', err);
      setError(err?.message || 'Failed to complete market scan.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    performMarketScan(selectedTimeframe);
  }, [performMarketScan, selectedTimeframe]);

  // Handler for manual refresh
  const handleRefresh = () => {
    setRefreshing(true);
    performMarketScan(selectedTimeframe, true);
  };

  // Handler for running backtests
  const handleRunBacktest = async (config: BacktestConfig): Promise<BacktestSummary> => {
    // 1. Try server endpoint
    try {
      const resp = await fetch('/api/backtest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (resp.ok) {
        const data = await resp.json();
        setDefaultBacktestSummary(data);
        return data;
      }
    } catch (err) {
      // Fallback to client backtester
    }

    // 2. Client fallback
    const meta = SUPPORTED_COINS.find((c) => c.coin === config.coin) || SUPPORTED_COINS[0];
    const { candles } = await getMarketDataForCoin(meta, config.timeframe, config.candleLimit);
    const summary = runBacktest(candles, config);
    setDefaultBacktestSummary(summary);
    return summary;
  };

  // Export full ZIP package
  const handleExportZip = async () => {
    setIsExporting(true);
    try {
      const blob = await generateProjectZip();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quantpulse-crypto-platform-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export ZIP:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Navigate to TradingView for selected coin
  const handleOpenTradingViewForCoin = (setup: TradeSetup) => {
    setSelectedCoin(setup.coin);
    setActiveTab('chart');
  };

  // Filtered setups
  const filteredSetups = setups.filter((s) => {
    if (signalFilter === 'ALL') return true;
    return s.signal === signalFilter;
  });

  const longCount = setups.filter((s) => s.signal === 'LONG').length;
  const shortCount = setups.filter((s) => s.signal === 'SHORT').length;
  const noTradeCount = setups.filter((s) => s.signal === 'NO_TRADE').length;

  const currentCoinSetup = setups.find((s) => s.coin === selectedCoin);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* 3-Zone Header Contract */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onRefresh={handleRefresh}
        isRefreshing={refreshing}
        onExportZip={handleExportZip}
        isExporting={isExporting}
        lastScanTime={lastScanTime}
      />

      {/* 9-Coin Horizontal Ticker Strip */}
      <TickerStrip
        setups={setups}
        selectedCoin={selectedCoin}
        onSelectCoin={(coin) => {
          setSelectedCoin(coin);
          if (activeTab !== 'chart') {
            const match = setups.find((s) => s.coin === coin);
            if (match) setSelectedDetailSetup(match);
          }
        }}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error notification banner */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-3">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Tab 1: Market Scanner & Signals */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* KPI Summary Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
                <span className="text-xs text-slate-400 block mb-1">Evaluated Pairs</span>
                <span className="text-2xl font-bold font-mono text-white">9 / 9</span>
                <span className="text-[11px] text-slate-500 block mt-1">BTC, ETH, SOL, BNB, ADA, XRP, SUI, LINK, DOGE</span>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
                <span className="text-xs text-slate-400 block mb-1">Selective Longs</span>
                <span className="text-2xl font-bold font-mono text-emerald-400">{longCount}</span>
                <span className="text-[11px] text-slate-500 block mt-1">Confluence &ge; 66/100 threshold</span>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
                <span className="text-xs text-slate-400 block mb-1">Selective Shorts</span>
                <span className="text-2xl font-bold font-mono text-rose-400">{shortCount}</span>
                <span className="text-[11px] text-slate-500 block mt-1">Confluence &le; 34/100 threshold</span>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
                <span className="text-xs text-slate-400 block mb-1">Filtered No Trade</span>
                <span className="text-2xl font-bold font-mono text-slate-300">{noTradeCount}</span>
                <span className="text-[11px] text-slate-500 block mt-1">Insufficient confluence or chop</span>
              </div>
            </div>

            {/* Filter Bar & Controls */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
              {/* Signal Filter Segmented Controls */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                {(['ALL', 'LONG', 'SHORT', 'NO_TRADE'] as const).map((sig) => (
                  <button
                    key={sig}
                    onClick={() => setSignalFilter(sig)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                      signalFilter === sig
                        ? 'bg-slate-800 text-cyan-400 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {sig === 'ALL' ? 'All Pairs' : sig === 'NO_TRADE' ? 'No Trade' : sig}
                  </button>
                ))}
              </div>

              {/* Timeframe & View Mode Toggles */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                  {(['15m', '1h', '4h', '1d'] as Timeframe[]).map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setSelectedTimeframe(tf)}
                      className={`px-2.5 py-1 font-medium rounded transition-colors ${
                        selectedTimeframe === tf
                          ? 'bg-cyan-500/10 text-cyan-400 font-bold border border-cyan-500/30'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                  <button
                    onClick={() => setViewMode('cards')}
                    title="Grid View"
                    className={`p-1.5 rounded transition-colors ${
                      viewMode === 'cards' ? 'bg-slate-800 text-cyan-400' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    title="Table View"
                    className={`p-1.5 rounded transition-colors ${
                      viewMode === 'table' ? 'bg-slate-800 text-cyan-400' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <TableIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Display: Cards or Table */}
            {loading ? (
              <div className="py-20 text-center">
                <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin text-cyan-400" />
                <span className="text-sm text-slate-400 font-medium">Scanning cryptocurrency markets...</span>
              </div>
            ) : viewMode === 'cards' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredSetups.map((setup) => (
                  <SignalCard
                    key={setup.coin}
                    setup={setup}
                    onOpenDetails={(s) => setSelectedDetailSetup(s)}
                    onOpenTradingView={(s) => handleOpenTradingViewForCoin(s)}
                  />
                ))}
              </div>
            ) : (
              /* High-Density Table View */
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold">
                    <tr>
                      <th className="py-3 px-4">Coin</th>
                      <th className="py-3 px-4">Market Price</th>
                      <th className="py-3 px-4">24h Change</th>
                      <th className="py-3 px-4">Signal</th>
                      <th className="py-3 px-4">Confluence</th>
                      <th className="py-3 px-4">Entry Zone</th>
                      <th className="py-3 px-4">Stop Loss</th>
                      <th className="py-3 px-4">TP1 / TP2</th>
                      <th className="py-3 px-4">R:R</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 font-mono tabular-nums">
                    {filteredSetups.map((setup) => (
                      <tr key={setup.coin} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4 font-sans font-bold text-white flex items-center gap-1.5">
                          <span>{setup.coin}</span>
                          <span className="text-slate-500 font-normal text-[11px] font-mono">({setup.symbol})</span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-100">
                          ${setup.currentPrice < 1 ? setup.currentPrice.toFixed(4) : setup.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className={`py-3 px-4 font-semibold ${setup.priceChange24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {setup.priceChange24h >= 0 ? '+' : ''}{setup.priceChange24h.toFixed(2)}%
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              setup.signal === 'LONG'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : setup.signal === 'SHORT'
                                ? 'bg-rose-950 text-rose-400 border border-rose-800'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                          >
                            {setup.signal === 'NO_TRADE' ? 'NO TRADE' : setup.signal}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          {setup.confluenceScore} / 100
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          {setup.signal !== 'NO_TRADE'
                            ? `$${setup.entryZone[0].toFixed(2)} - $${setup.entryZone[1].toFixed(2)}`
                            : '--'}
                        </td>
                        <td className="py-3 px-4 text-rose-400">
                          {setup.signal !== 'NO_TRADE' ? `$${setup.stopLoss.toFixed(2)}` : '--'}
                        </td>
                        <td className="py-3 px-4 text-emerald-400">
                          {setup.signal !== 'NO_TRADE' ? `$${setup.takeProfit1.toFixed(2)} / $${setup.takeProfit2.toFixed(2)}` : '--'}
                        </td>
                        <td className="py-3 px-4 text-cyan-400">
                          {setup.signal !== 'NO_TRADE' ? `${setup.riskRewardRatio}:1` : '--'}
                        </td>
                        <td className="py-3 px-4 text-right font-sans">
                          <button
                            onClick={() => setSelectedDetailSetup(setup)}
                            className="px-2.5 py-1 text-[11px] font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded transition-colors"
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: TradingView Chart Integration */}
        {activeTab === 'chart' && (
          <TradingViewWidget
            selectedCoin={selectedCoin}
            onSelectCoin={setSelectedCoin}
            selectedTimeframe={selectedTimeframe}
            onSelectTimeframe={setSelectedTimeframe}
            currentSetup={currentCoinSetup}
          />
        )}

        {/* Tab 3: Historical Backtesting */}
        {activeTab === 'backtest' && (
          <BacktestingView
            onRunBacktest={handleRunBacktest}
            defaultSummary={defaultBacktestSummary}
          />
        )}

        {/* Tab 4: Architecture & Deployment */}
        {activeTab === 'architecture' && <ArchitectureView />}
      </main>

      {/* Deep Dive Modal */}
      <CoinDetailModal
        setup={selectedDetailSetup}
        onClose={() => setSelectedDetailSetup(null)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-xs text-slate-500 text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span>QuantPulse Crypto Platform</span>
            <span>·</span>
            <span>10-Strategy Confluence Engine</span>
            <span>·</span>
            <span className="text-emerald-500 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Zero Telegram Architecture Verified
            </span>
          </div>
          <div>
            <span>Quantitative analysis only · No automated exchange execution · Risk management required</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
