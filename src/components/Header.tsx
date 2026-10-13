import React from 'react';
import { Download, RefreshCw, Activity } from 'lucide-react';

interface HeaderProps {
  activeTab: 'overview' | 'chart' | 'backtest' | 'architecture';
  setActiveTab: (tab: 'overview' | 'chart' | 'backtest' | 'architecture') => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  onExportZip: () => void;
  isExporting: boolean;
  lastScanTime: number | null;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onRefresh,
  isRefreshing,
  onExportZip,
  isExporting,
  lastScanTime,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-emerald-500 flex items-center justify-center text-white font-black text-sm tracking-tighter shadow-sm">
            QP
          </div>
          <span className="text-lg font-bold tracking-tight text-white whitespace-nowrap">
            QuantPulse Crypto
          </span>
        </div>

        {/* Zone 2: 4 Single-line Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
          <button
            onClick={() => setActiveTab('overview')}
            className={`whitespace-nowrap pb-1 transition-colors ${
              activeTab === 'overview'
                ? 'text-cyan-400 border-b-2 border-cyan-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Market Scanner
          </button>
          <button
            onClick={() => setActiveTab('chart')}
            className={`whitespace-nowrap pb-1 transition-colors ${
              activeTab === 'chart'
                ? 'text-cyan-400 border-b-2 border-cyan-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            TradingView Integration
          </button>
          <button
            onClick={() => setActiveTab('backtest')}
            className={`whitespace-nowrap pb-1 transition-colors ${
              activeTab === 'backtest'
                ? 'text-cyan-400 border-b-2 border-cyan-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Historical Backtesting
          </button>
          <button
            onClick={() => setActiveTab('architecture')}
            className={`whitespace-nowrap pb-1 transition-colors ${
              activeTab === 'architecture'
                ? 'text-cyan-400 border-b-2 border-cyan-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Architecture & Deployment
          </button>
        </nav>

        {/* Zone 3: Primary Action + Scan controls */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            title={lastScanTime ? `Last scan: ${new Date(lastScanTime).toLocaleTimeString()}` : 'Refresh'}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 hover:text-white transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
            <span className="hidden sm:inline">Refresh Scan</span>
          </button>

          <button
            onClick={onExportZip}
            disabled={isExporting}
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg shadow-sm transition-colors whitespace-nowrap disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? 'Packaging ZIP...' : 'Export Project ZIP'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
