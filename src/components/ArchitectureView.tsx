import React from 'react';
import { CheckCircle2, Terminal, Cloud, ShieldCheck, FileCode, Cpu, Layers } from 'lucide-react';

export const ArchitectureView: React.FC = () => {
  return (
    <div className="space-y-8 max-w-5xl mx-auto text-xs leading-relaxed">
      {/* Overview Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <Layers className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base font-bold text-white tracking-tight">System Architecture & Deployment Guide</h2>
        </div>
        <p className="text-slate-400">
          QuantPulse is built as a modular quantitative engine with dual runtimes: a high-performance Python 3 analytical core and an Express/React full-stack online dashboard with TradingView integration.
        </p>
      </div>

      {/* 10-Strategy Confluence Architecture */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <span>10-Strategy Quantitative Pipeline</span>
        </h3>
        <p className="text-slate-400">
          The engine does not count correlated indicators as independent votes. Each family is assigned an isolated weight, strict invalidation trigger, and regime compatibility filter:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
            <span className="font-semibold text-cyan-400">1. Trend Following (Weight 1.5x)</span>
            <p className="text-slate-300">EMA 20/50/200 stack + ADX &gt;= 22 directional trend filtering.</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
            <span className="font-semibold text-cyan-400">2. Momentum Matrix (Weight 1.2x)</span>
            <p className="text-slate-300">RSI centerline momentum (30-70 band) + MACD histogram expansion.</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
            <span className="font-semibold text-cyan-400">3. Volume Breakouts (Weight 1.4x)</span>
            <p className="text-slate-300">Boundary closes beyond Donchian/Bollinger validated by &gt;= 1.35x volume surge.</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
            <span className="font-semibold text-cyan-400">4. Support & Resistance (Weight 1.1x)</span>
            <p className="text-slate-300">Macro pivot cluster detection with retest buffers under 1.5%.</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
            <span className="font-semibold text-cyan-400">5. Price Action & Swings (Weight 1.3x)</span>
            <p className="text-slate-300">Engulfing candle character, hammer/shooting-star pin rejections, liquidity sweeps.</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
            <span className="font-semibold text-cyan-400">6. ATR Volatility Calibration (Weight 1.0x)</span>
            <p className="text-slate-300">Dynamic stop loss setting at 1.5x - 2.0x ATR to eliminate spread hazard.</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
            <span className="font-semibold text-cyan-400">7. Mean Reversion (Weight 1.1x)</span>
            <p className="text-slate-300">Active strictly during compressed ranges; Bollinger %B extremes with RSI exhaustion.</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
            <span className="font-semibold text-cyan-400">8. Multi-Timeframe Trend (Weight 1.4x)</span>
            <p className="text-slate-300">Higher timeframe (4h/1d) alignment check. Signals abort if macro slope conflicts.</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
            <span className="font-semibold text-cyan-400">9. Volume Flow / OBV (Weight 1.0x)</span>
            <p className="text-slate-300">On-Balance Volume 14-period baseline validation to eliminate false breakouts.</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
            <span className="font-semibold text-cyan-400">10. Confluence Scoring & Regime Filter (Weight 1.5x)</span>
            <p className="text-slate-300">Composite score (0-100). Requires &gt;= 66 for LONG, &lt;= 34 for SHORT; otherwise NO TRADE.</p>
          </div>
        </div>
      </div>

      {/* Windows Local Setup Instructions */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span>Step-by-Step Windows Local Setup</span>
        </h3>
        <p className="text-slate-400">
          Run these commands in Windows PowerShell or Terminal:
        </p>

        <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 font-mono text-slate-300 space-y-2 text-[11px] overflow-x-auto">
          <div className="text-slate-500"># 1. Clone or extract repository</div>
          <div>cd quantpulse-crypto</div>
          <div className="text-slate-500 mt-2"># 2. Create and activate Python virtual environment</div>
          <div>python -m venv .venv</div>
          <div>.\.venv\Scripts\activate</div>
          <div className="text-slate-500 mt-2"># 3. Install Python engine dependencies</div>
          <div>pip install -r python_engine/requirements.txt</div>
          <div className="text-slate-500 mt-2"># 4. Install Web App dependencies and start platform</div>
          <div>npm install</div>
          <div>npm run dev</div>
          <div className="text-slate-500 mt-2"># 5. Run Python automated unit test suite</div>
          <div>pytest python_engine/tests -v</div>
        </div>
      </div>

      {/* Online 24/7 Deployment Instructions */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Cloud className="w-4 h-4 text-cyan-400" />
          <span>Online Deployment (Operates With Computer Switched Off)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
            <h4 className="font-semibold text-white">Free Hosting via Render or Railway</h4>
            <ol className="list-decimal list-inside space-y-1 text-slate-400 text-[11px]">
              <li>Push your codebase to a private/public GitHub repository.</li>
              <li>Connect your repo to Render.com or Railway.app.</li>
              <li>Set Build Command: <code className="text-cyan-400">npm install && npm run build</code></li>
              <li>Set Start Command: <code className="text-cyan-400">npm run start</code></li>
              <li>Set Environment Variable: <code className="text-cyan-400">PORT=3000</code></li>
            </ol>
            <p className="text-slate-500 text-[10px] pt-1">
              *Honest notice: Free tiers sleep after 15 min of inactivity (30s spin-up time). For permanent non-sleeping operation, a $5/month instance or low-cost VPS is recommended.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
            <h4 className="font-semibold text-white">Scheduled Analysis via GitHub Actions</h4>
            <p className="text-slate-400 text-[11px]">
              The included workflow <code className="text-cyan-400">.github/workflows/analysis_schedule.yml</code> runs automatically every 2 hours directly on GitHub's cloud runners.
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
              <li>Operates 24/7 without requiring your local PC.</li>
              <li>Logs all market scans to the GitHub Actions tab.</li>
              <li>Zero additional costs or hosting fees required.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Verification Checklist */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Verification & Compliance Checklist</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>All 9 Supported Cryptocurrencies configured</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>10-Strategy Confluence Engine implemented</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Selective LONG, SHORT, NO TRADE logic</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Interactive TradingView chart embed widget</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Walk-forward backtesting simulator with fees</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Automated Pytest unit test suite</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>In-browser ZIP project export package</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Zero Telegram references or dependencies</span>
          </div>
        </div>
      </div>
    </div>
  );
};
