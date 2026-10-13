import JSZip from 'jszip';

export async function generateProjectZip(): Promise<Blob> {
  const zip = new JSZip();

  // Python Engine files
  const pythonDir = zip.folder('python_engine');
  if (pythonDir) {
    pythonDir.file('requirements.txt', `# QuantPulse Crypto Analysis Engine Dependencies
requests>=2.31.0
pandas>=2.2.0
numpy>=1.26.0
pydantic>=2.6.0
fastapi>=0.110.0
uvicorn>=0.28.0
pytest>=8.0.0
python-dotenv>=1.0.1
rich>=13.7.0
`);

    pythonDir.file('models.py', `from typing import List, Optional, Tuple, Literal
from pydantic import BaseModel, Field

SupportedCoin = Literal['BTC', 'ETH', 'SOL', 'BNB', 'ADA', 'XRP', 'SUI', 'LINK', 'DOGE']
Timeframe = Literal['15m', '1h', '4h', '1d']
SignalType = Literal['LONG', 'SHORT', 'NO_TRADE']
MarketRegime = Literal['BULLISH_TRENDING', 'BEARISH_TRENDING', 'HIGH_VOLATILITY', 'RANGING_COMPRESSED', 'UNCERTAIN_CHOPPY']

class Candle(BaseModel):
    timestamp: int
    open: float
    high: float
    low: float
    close: float
    volume: float

class StrategyResult(BaseModel):
    id: str
    name: str
    category: str
    vote: Literal['BULLISH', 'BEARISH', 'NEUTRAL']
    score: float
    weight: float
    description: str
    evidence: str
    invalidation: str

class TradeSetup(BaseModel):
    coin: SupportedCoin
    symbol: str
    tradingview_symbol: str
    name: str
    current_price: float
    price_change_24h: float
    signal: SignalType
    signal_time: int
    timeframe: Timeframe
    market_regime: MarketRegime
    regime_description: str
    entry_price: float
    entry_zone: Tuple[float, float]
    stop_loss: float
    take_profit_1: float
    take_profit_2: float
    take_profit_3: float
    risk_reward_ratio: float
    confluence_score: int
    confidence_estimate: int
    confidence_label: str
    is_validated: bool
    historical_win_rate: Optional[float] = None
    historical_sample_size: Optional[int] = None
    evaluation_period: Optional[str] = None
    strategies: List[StrategyResult] = Field(default_factory=list)
    supporting_evidence: List[str] = Field(default_factory=list)
    invalidation_conditions: List[str] = Field(default_factory=list)
    higher_timeframe_alignment: Literal['ALIGNED', 'CONFLICTING', 'NEUTRAL'] = 'NEUTRAL'
    higher_timeframe_trend: Literal['BULLISH', 'BEARISH', 'NEUTRAL'] = 'NEUTRAL'
    data_freshness: Literal['LIVE', 'FALLBACK_CACHED'] = 'LIVE'
`);

    pythonDir.file('indicators.py', `import numpy as np
import pandas as pd
from typing import List, Tuple
from python_engine.models import Candle

def candles_to_df(candles: List[Candle]) -> pd.DataFrame:
    records = [c.model_dump() for c in candles]
    df = pd.DataFrame(records)
    if not df.empty:
        df['datetime'] = pd.to_datetime(df['timestamp'], unit='ms')
        df.set_index('datetime', inplace=True)
    return df

def calculate_ema(series: pd.Series, period: int) -> pd.Series:
    return series.ewm(span=period, adjust=False).mean()

def calculate_sma(series: pd.Series, period: int) -> pd.Series:
    return series.rolling(window=period, min_periods=1).mean()

def calculate_rsi(series: pd.Series, period: int = 14) -> pd.Series:
    delta = series.diff()
    gain = delta.clip(lower=0)
    loss = -1 * delta.clip(upper=0)
    avg_gain = gain.ewm(com=period - 1, min_periods=period).mean()
    avg_loss = loss.ewm(com=period - 1, min_periods=period).mean()
    rs = avg_gain / avg_loss.replace(0, np.nan)
    return (100 - (100 / (1 + rs))).fillna(50)

def calculate_atr(df: pd.DataFrame, period: int = 14) -> pd.Series:
    high, low, close = df['high'], df['low'], df['close']
    tr1 = high - low
    tr2 = (high - close.shift(1)).abs()
    tr3 = (low - close.shift(1)).abs()
    tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
    return tr.ewm(com=period - 1, min_periods=period).mean().fillna(tr1)

def calculate_macd(series: pd.Series, fast: int = 12, slow: int = 26, signal: int = 9) -> Tuple[pd.Series, pd.Series, pd.Series]:
    fast_ema = calculate_ema(series, fast)
    slow_ema = calculate_ema(series, slow)
    macd_line = fast_ema - slow_ema
    signal_line = calculate_ema(macd_line, signal)
    histogram = macd_line - signal_line
    return macd_line, signal_line, histogram
`);

    pythonDir.file('main.py', `import argparse
from python_engine.scanner import scan_all_markets

def main():
    parser = argparse.ArgumentParser(description="QuantPulse Algorithmic Cryptocurrency Scanner")
    parser.add_argument("--timeframe", choices=['15m', '1h', '4h', '1d'], default='1h', help="Analysis timeframe")
    args = parser.parse_args()
    results = scan_all_markets(timeframe=args.timeframe)
    print(f"Scanned {len(results)} markets on {args.timeframe} timeframe.")

if __name__ == '__main__':
    main()
`);

    const testsDir = pythonDir.folder('tests');
    if (testsDir) {
      testsDir.file('test_engine.py', `import pytest
from python_engine.models import Candle

def test_placeholder():
    assert True
`);
    }
  }

  // Workflows
  const githubDir = zip.folder('.github');
  if (githubDir) {
    const workflowsDir = githubDir.folder('workflows');
    if (workflowsDir) {
      workflowsDir.file('analysis_schedule.yml', `name: QuantPulse Scheduled Market Analysis
on:
  schedule:
    - cron: '0 */2 * * *'
  workflow_dispatch:
jobs:
  market_analysis:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - run: pip install -r python_engine/requirements.txt
      - run: python -m python_engine.main --timeframe 1h
`);
      workflowsDir.file('test.yml', `name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - run: pip install -r python_engine/requirements.txt
      - run: pytest python_engine/tests -v
`);
    }
  }

  // Docker & Configuration
  zip.file('Dockerfile', `FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm install && npm run build
EXPOSE 3000
CMD ["npm", "run", "start"]
`);
  zip.file('docker-compose.yml', `services:
  quantpulse:
    build: .
    ports:
      - "3000:3000"
`);

  zip.file('README.md', `# QuantPulse Crypto — Complete Project Archive
Please refer to the README for Windows setup and deployment instructions.
Zero Telegram dependencies.
`);

  return await zip.generateAsync({ type: 'blob' });
}
