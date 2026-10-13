import React from 'react';
import { SupportedCoin, TradeSetup } from '../types/crypto';

interface TickerStripProps {
  setups: TradeSetup[];
  selectedCoin: SupportedCoin;
  onSelectCoin: (coin: SupportedCoin) => void;
}

export const TickerStrip: React.FC<TickerStripProps> = ({
  setups,
  selectedCoin,
  onSelectCoin,
}) => {
  return (
    <div className="border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-sm overflow-x-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center gap-3 min-w-max">
        {setups.map((setup) => {
          const isSelected = setup.coin === selectedCoin;
          const isPositive = setup.priceChange24h >= 0;

          return (
            <button
              key={setup.coin}
              onClick={() => onSelectCoin(setup.coin)}
              className={`flex items-center gap-3 px-3 py-1.5 rounded-lg border text-xs transition-all ${
                isSelected
                  ? 'bg-slate-800/90 border-cyan-500/50 shadow-sm'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-white">
                <span>{setup.coin}</span>
              </div>

              <span className="font-mono tabular-nums text-slate-200">
                ${setup.currentPrice < 1 ? setup.currentPrice.toFixed(4) : setup.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>

              <span className={`font-mono tabular-nums ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isPositive ? '+' : ''}{setup.priceChange24h.toFixed(2)}%
              </span>

              <span
                className={`font-mono font-semibold px-1.5 py-0.5 rounded text-[10px] tracking-wider ${
                  setup.signal === 'LONG'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                    : setup.signal === 'SHORT'
                    ? 'bg-rose-950 text-rose-300 border border-rose-800/60'
                    : 'bg-slate-800 text-slate-400 border border-slate-700/60'
                }`}
              >
                {setup.signal === 'NO_TRADE' ? 'NO TRADE' : setup.signal}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
