"""
QuantPulse Data Models
Strongly typed models for candles, signals, strategy outputs, and backtest results.
"""
from typing import List, Optional, Tuple, Literal
from pydantic import BaseModel, Field

SupportedCoin = Literal['BTC', 'ETH', 'SOL', 'BNB', 'ADA', 'XRP', 'SUI', 'LINK', 'DOGE']
Timeframe = Literal['15m', '1h', '4h', '1d']
SignalType = Literal['LONG', 'SHORT', 'NO_TRADE']
MarketRegime = Literal[
    'BULLISH_TRENDING',
    'BEARISH_TRENDING',
    'HIGH_VOLATILITY',
    'RANGING_COMPRESSED',
    'UNCERTAIN_CHOPPY'
]

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
    score: float  # -10 to +10
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

class BacktestTrade(BaseModel):
    id: int
    coin: SupportedCoin
    type: Literal['LONG', 'SHORT']
    entry_time: int
    entry_price: float
    exit_time: int
    exit_price: float
    stop_loss: float
    take_profit: float
    return_pct: float
    net_pnl: float
    exit_reason: str
    risk_reward_ratio: float
    regime: MarketRegime

class BacktestSummary(BaseModel):
    coin: SupportedCoin
    timeframe: Timeframe
    period_start: str
    period_end: str
    sample_candles: int
    total_trades: int
    winning_trades: int
    losing_trades: int
    win_rate: float
    profit_factor: float
    net_return_pct: float
    max_drawdown_pct: float
    expectancy_pct: float
    average_risk_reward: float
    benchmark_buy_and_hold_pct: float
    trades: List[BacktestTrade]
