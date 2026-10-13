"""
Technical indicator computation library.
Includes EMA, SMA, ATR, RSI, MACD, Bollinger Bands, ADX, OBV, and Support/Resistance detection.
"""
from typing import List, Tuple
import numpy as np
import pandas as pd
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
    rsi = 100 - (100 / (1 + rs))
    return rsi.fillna(50)

def calculate_atr(df: pd.DataFrame, period: int = 14) -> pd.Series:
    high = df['high']
    low = df['low']
    close = df['close']
    prev_close = close.shift(1)
    
    tr1 = high - low
    tr2 = (high - prev_close).abs()
    tr3 = (low - prev_close).abs()
    tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
    
    return tr.ewm(com=period - 1, min_periods=period).mean().fillna(tr1)

def calculate_macd(series: pd.Series, fast: int = 12, slow: int = 26, signal: int = 9) -> Tuple[pd.Series, pd.Series, pd.Series]:
    fast_ema = calculate_ema(series, fast)
    slow_ema = calculate_ema(series, slow)
    macd_line = fast_ema - slow_ema
    signal_line = calculate_ema(macd_line, signal)
    histogram = macd_line - signal_line
    return macd_line, signal_line, histogram

def calculate_bollinger_bands(series: pd.Series, period: int = 20, num_std: float = 2.0) -> Tuple[pd.Series, pd.Series, pd.Series, pd.Series]:
    middle = series.rolling(window=period, min_periods=1).mean()
    std = series.rolling(window=period, min_periods=1).std().fillna(0)
    upper = middle + (std * num_std)
    lower = middle - (std * num_std)
    bandwidth = upper - lower
    percent_b = (series - lower) / bandwidth.replace(0, np.nan)
    return middle, upper, lower, percent_b.fillna(0.5)

def calculate_adx(df: pd.DataFrame, period: int = 14) -> Tuple[pd.Series, pd.Series, pd.Series]:
    high = df['high']
    low = df['low']
    close = df['close']
    
    up_move = high.diff()
    down_move = -low.diff()
    
    plus_dm = np.where((up_move > down_move) & (up_move > 0), up_move, 0.0)
    minus_dm = np.where((down_move > up_move) & (down_move > 0), down_move, 0.0)
    
    tr = pd.concat([
        high - low,
        (high - close.shift(1)).abs(),
        (low - close.shift(1)).abs()
    ], axis=1).max(axis=1)
    
    atr = tr.ewm(com=period - 1, min_periods=period).mean()
    smooth_plus_dm = pd.Series(plus_dm, index=df.index).ewm(com=period - 1, min_periods=period).mean()
    smooth_minus_dm = pd.Series(minus_dm, index=df.index).ewm(com=period - 1, min_periods=period).mean()
    
    plus_di = (smooth_plus_dm / atr.replace(0, np.nan)) * 100
    minus_di = (smooth_minus_dm / atr.replace(0, np.nan)) * 100
    
    dx = ((plus_di - minus_di).abs() / (plus_di + minus_di).replace(0, np.nan)) * 100
    adx = dx.ewm(com=period - 1, min_periods=period).mean()
    
    return adx.fillna(20), plus_di.fillna(20), minus_di.fillna(20)

def calculate_obv(df: pd.DataFrame) -> pd.Series:
    close = df['close']
    volume = df['volume']
    direction = np.where(close > close.shift(1), 1, np.where(close < close.shift(1), -1, 0))
    direction[0] = 0
    return (volume * direction).cumsum()

def find_support_resistance(df: pd.DataFrame, lookback: int = 40) -> Tuple[List[float], List[float], float, float]:
    slice_df = df.iloc[-lookback:]
    current_price = float(df['close'].iloc[-1])
    
    highs = slice_df['high'].values
    lows = slice_df['low'].values
    
    supports = []
    resistances = []
    
    for i in range(2, len(slice_df) - 2):
        if highs[i] > highs[i-1] and highs[i] > highs[i-2] and highs[i] > highs[i+1] and highs[i] > highs[i+2]:
            if highs[i] > current_price:
                resistances.append(float(highs[i]))
        if lows[i] < lows[i-1] and lows[i] < lows[i-2] and lows[i] < lows[i+1] and lows[i] < lows[i+2]:
            if lows[i] < current_price:
                supports.append(float(lows[i]))
                
    supports.sort(reverse=True)
    resistances.sort()
    
    nearest_support = supports[0] if supports else current_price * 0.97
    nearest_resistance = resistances[0] if resistances else current_price * 1.03
    
    return supports, resistances, nearest_support, nearest_resistance
