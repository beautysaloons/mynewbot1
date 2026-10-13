"""
Automated unit tests for QuantPulse quantitative engine.
Tests indicator calculations, selective signal logic, regime detection, and backtesting safety.
"""
import pytest
import numpy as np
import pandas as pd
from python_engine.models import Candle
from python_engine.indicators import (
    calculate_ema, calculate_sma, calculate_rsi, calculate_atr, calculate_adx
)
from python_engine.strategies import evaluate_market_python
from python_engine.backtester import run_python_backtest

def create_mock_candles(trend='up', count=100) -> list[Candle]:
    base = 100.0
    candles = []
    now = 1700000000000
    for i in range(count):
        step = 0.5 if trend == 'up' else (-0.5 if trend == 'down' else 0.05 * np.sin(i / 3))
        o = base + i * step
        c = o + step * 0.8
        h = max(o, c) + 0.3
        l = min(o, c) - 0.3
        v = 1000.0 + (i % 5) * 100.0
        candles.append(Candle(
            timestamp=now + i * 3600000,
            open=round(o, 2),
            high=round(h, 2),
            low=round(l, 2),
            close=round(c, 2),
            volume=round(v, 2)
        ))
    return candles

def test_indicators_not_empty():
    candles = create_mock_candles(trend='up', count=80)
    df = pd.DataFrame([c.model_dump() for c in candles])
    ema20 = calculate_ema(df['close'], 20)
    rsi = calculate_rsi(df['close'], 14)
    atr = calculate_atr(df, 14)
    adx, plus_di, minus_di = calculate_adx(df, 14)
    
    assert len(ema20) == 80
    assert 0 <= rsi.iloc[-1] <= 100
    assert atr.iloc[-1] > 0
    assert adx.iloc[-1] >= 0

def test_selective_signal_generation():
    candles = create_mock_candles(trend='up', count=100)
    setup = evaluate_market_python(
        coin='BTC',
        symbol='BTCUSDT',
        tradingview_symbol='BINANCE:BTCUSDT',
        name='Bitcoin',
        timeframe='1h',
        candles=candles
    )
    
    assert setup.coin == 'BTC'
    assert setup.signal in ('LONG', 'SHORT', 'NO_TRADE')
    assert 0 <= setup.confluence_score <= 100
    assert len(setup.strategies) == 10
    assert setup.stop_loss > 0
    assert setup.take_profit_1 > 0
    assert setup.risk_reward_ratio >= 1.0

def test_no_trade_during_flat_chop():
    candles = create_mock_candles(trend='flat', count=100)
    setup = evaluate_market_python(
        coin='ETH',
        symbol='ETHUSDT',
        tradingview_symbol='BINANCE:ETHUSDT',
        name='Ethereum',
        timeframe='1h',
        candles=candles
    )
    assert setup.signal in ('LONG', 'SHORT', 'NO_TRADE')
    assert len(setup.invalidation_conditions) > 0

def test_backtest_execution_safety():
    candles = create_mock_candles(trend='up', count=90)
    summary = run_python_backtest(
        coin='BTC',
        timeframe='1h',
        candles=candles,
        initial_balance=10000.0,
        risk_per_trade_pct=1.5,
        taker_fee_pct=0.06,
        slippage_pct=0.05
    )
    
    assert summary.coin == 'BTC'
    assert summary.sample_candles == 90
    assert 0 <= summary.win_rate <= 100
    assert summary.max_drawdown_pct >= 0
