"""
Chronological Walk-Forward Backtester in Python.
Simulates historical trades with realistic exchange fees and slippage.
"""
from typing import List, Dict, Optional
import numpy as np
import pandas as pd
from python_engine.models import Candle, BacktestTrade, BacktestSummary, SupportedCoin, Timeframe, MarketRegime
from python_engine.strategies import evaluate_market_python

def run_python_backtest(
    coin: SupportedCoin,
    timeframe: Timeframe,
    candles: List[Candle],
    initial_balance: float = 10000.0,
    risk_per_trade_pct: float = 1.5,
    taker_fee_pct: float = 0.06,
    slippage_pct: float = 0.05
) -> BacktestSummary:
    if len(candles) < 60:
        raise ValueError("Insufficient candle history (minimum 60 required)")

    current_balance = initial_balance
    peak_balance = initial_balance
    max_drawdown_pct = 0.0
    trades: List[BacktestTrade] = []

    active_trade: Optional[Dict] = None
    warm_up = 35

    for i in range(warm_up, len(candles) - 1):
        bar = candles[i]
        next_bar = candles[i + 1]

        if active_trade:
            exit_price = None
            exit_reason = None

            if active_trade['type'] == 'LONG':
                if bar.low <= active_trade['stop_loss']:
                    exit_price = active_trade['stop_loss'] * (1 - slippage_pct / 100)
                    exit_reason = 'STOP_LOSS'
                elif bar.high >= active_trade['tp3']:
                    exit_price = active_trade['tp3'] * (1 - slippage_pct / 100)
                    exit_reason = 'TAKE_PROFIT_3'
                elif bar.high >= active_trade['tp2']:
                    exit_price = active_trade['tp2'] * (1 - slippage_pct / 100)
                    exit_reason = 'TAKE_PROFIT_2'
                elif bar.high >= active_trade['tp1'] and (i - active_trade['entry_idx'] >= 8):
                    exit_price = active_trade['tp1'] * (1 - slippage_pct / 100)
                    exit_reason = 'TAKE_PROFIT_1'
                elif i - active_trade['entry_idx'] > 24:
                    exit_price = bar.close
                    exit_reason = 'TIME_EXIT'
            else:
                if bar.high >= active_trade['stop_loss']:
                    exit_price = active_trade['stop_loss'] * (1 + slippage_pct / 100)
                    exit_reason = 'STOP_LOSS'
                elif bar.low <= active_trade['tp3']:
                    exit_price = active_trade['tp3'] * (1 + slippage_pct / 100)
                    exit_reason = 'TAKE_PROFIT_3'
                elif bar.low <= active_trade['tp2']:
                    exit_price = active_trade['tp2'] * (1 + slippage_pct / 100)
                    exit_reason = 'TAKE_PROFIT_2'
                elif bar.low <= active_trade['tp1'] and (i - active_trade['entry_idx'] >= 8):
                    exit_price = active_trade['tp1'] * (1 + slippage_pct / 100)
                    exit_reason = 'TAKE_PROFIT_1'
                elif i - active_trade['entry_idx'] > 24:
                    exit_price = bar.close
                    exit_reason = 'TIME_EXIT'

            if exit_reason and exit_price:
                gross_ret = ((exit_price - active_trade['entry_price']) / active_trade['entry_price'] * 100) if active_trade['type'] == 'LONG' else ((active_trade['entry_price'] - exit_price) / active_trade['entry_price'] * 100)
                net_ret = gross_ret - (taker_fee_pct * 2)
                trade_pnl = (active_trade['size_usd'] * net_ret) / 100.0

                current_balance += trade_pnl
                if current_balance > peak_balance:
                    peak_balance = current_balance
                dd = ((peak_balance - current_balance) / peak_balance) * 100
                if dd > max_drawdown_pct:
                    max_drawdown_pct = dd

                trades.append(BacktestTrade(
                    id=len(trades) + 1,
                    coin=coin,
                    type=active_trade['type'],
                    entry_time=active_trade['entry_time'],
                    entry_price=round(active_trade['entry_price'], 4),
                    exit_time=bar.timestamp,
                    exit_price=round(exit_price, 4),
                    stop_loss=round(active_trade['stop_loss'], 4),
                    take_profit=round(active_trade['tp2'], 4),
                    return_pct=round(net_ret, 2),
                    net_pnl=round(trade_pnl, 2),
                    exit_reason=exit_reason,
                    risk_reward_ratio=round(active_trade['risk_reward'], 2),
                    regime=active_trade['regime']
                ))
                active_trade = None

        if not active_trade and i < len(candles) - 2:
            slice_candles = candles[:i + 1]
            setup = evaluate_market_python(
                coin=coin,
                symbol=f"{coin}USDT",
                tradingview_symbol=f"BINANCE:{coin}USDT",
                name=coin,
                timeframe=timeframe,
                candles=slice_candles
            )

            if setup.signal in ('LONG', 'SHORT'):
                entry_p = next_bar.open * (1 + slippage_pct / 100 if setup.signal == 'LONG' else 1 - slippage_pct / 100)
                risk_dist = abs(entry_p - setup.stop_loss)
                risk_usd = (current_balance * risk_per_trade_pct) / 100.0
                units = risk_usd / (risk_dist or 1.0)
                size_usd = min(units * entry_p, current_balance * 0.95)

                if size_usd > 10.0:
                    active_trade = {
                        'type': setup.signal,
                        'entry_idx': i + 1,
                        'entry_time': next_bar.timestamp,
                        'entry_price': entry_p,
                        'stop_loss': setup.stop_loss,
                        'tp1': setup.take_profit_1,
                        'tp2': setup.take_profit_2,
                        'tp3': setup.take_profit_3,
                        'size_usd': size_usd,
                        'risk_reward': setup.risk_reward_ratio,
                        'regime': setup.market_regime
                    }

    wins = [t for t in trades if t.net_pnl > 0]
    losses = [t for t in trades if t.net_pnl <= 0]
    win_rate = round(len(wins) / len(trades) * 100, 1) if trades else 0.0

    gross_p = sum(t.net_pnl for t in wins)
    gross_l = abs(sum(t.net_pnl for t in losses))
    pf = round(gross_p / gross_l, 2) if gross_l > 0 else (9.99 if gross_p > 0 else 0.0)

    net_ret = round((current_balance - initial_balance) / initial_balance * 100, 2)
    exp = round(sum(t.return_pct for t in trades) / len(trades), 2) if trades else 0.0
    avg_rr = round(sum(t.risk_reward_ratio for t in trades) / len(trades), 2) if trades else 0.0

    bench = round((candles[-1].close - candles[warm_up].open) / candles[warm_up].open * 100, 2)

    return BacktestSummary(
        coin=coin,
        timeframe=timeframe,
        period_start=pd.to_datetime(candles[0].timestamp, unit='ms').strftime('%Y-%m-%d'),
        period_end=pd.to_datetime(candles[-1].timestamp, unit='ms').strftime('%Y-%m-%d'),
        sample_candles=len(candles),
        total_trades=len(trades),
        winning_trades=len(wins),
        losing_trades=len(losses),
        win_rate=win_rate,
        profit_factor=pf,
        net_return_pct=net_ret,
        max_drawdown_pct=round(max_drawdown_pct, 2),
        expectancy_pct=exp,
        average_risk_reward=avg_rr,
        benchmark_buy_and_hold_pct=bench,
        trades=trades[-50:]
    )
