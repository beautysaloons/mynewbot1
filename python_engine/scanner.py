"""
Market Scanner Module
Fetches Binance public OHLCV data with fallback and runs quantitative evaluations.
"""
import time
import requests
from typing import List, Dict, Optional, Tuple
from python_engine.models import Candle, TradeSetup, SupportedCoin, Timeframe
from python_engine.strategies import evaluate_market_python

COIN_CONFIG = [
    {"coin": "BTC", "name": "Bitcoin", "symbol": "BTCUSDT", "tv": "BINANCE:BTCUSDT"},
    {"coin": "ETH", "name": "Ethereum", "symbol": "ETHUSDT", "tv": "BINANCE:ETHUSDT"},
    {"coin": "SOL", "name": "Solana", "symbol": "SOLUSDT", "tv": "BINANCE:SOLUSDT"},
    {"coin": "BNB", "name": "BNB", "symbol": "BNBUSDT", "tv": "BINANCE:BNBUSDT"},
    {"coin": "ADA", "name": "Cardano", "symbol": "ADAUSDT", "tv": "BINANCE:ADAUSDT"},
    {"coin": "XRP", "name": "XRP", "symbol": "XRPUSDT", "tv": "BINANCE:XRPUSDT"},
    {"coin": "SUI", "name": "Sui", "symbol": "SUIUSDT", "tv": "BINANCE:SUIUSDT"},
    {"coin": "LINK", "name": "Chainlink", "symbol": "LINKUSDT", "tv": "BINANCE:LINKUSDT"},
    {"coin": "DOGE", "name": "Dogecoin", "symbol": "DOGEUSDT", "tv": "BINANCE:DOGEUSDT"},
]

def fetch_binance_klines(symbol: str, interval: str = '1h', limit: int = 150) -> List[Candle]:
    url = f"https://api.binance.com/api/v3/klines?symbol={symbol}&interval={interval}&limit={limit}"
    resp = requests.get(url, timeout=6)
    resp.raise_for_status()
    raw = resp.json()
    candles = []
    for item in raw:
        candles.append(Candle(
            timestamp=int(item[0]),
            open=float(item[1]),
            high=float(item[2]),
            low=float(item[3]),
            close=float(item[4]),
            volume=float(item[5])
        ))
    return candles

def fetch_24h_change(symbol: str) -> float:
    url = f"https://api.binance.com/api/v3/ticker/24hr?symbol={symbol}"
    resp = requests.get(url, timeout=5)
    resp.raise_for_status()
    data = resp.json()
    return float(data.get('priceChangePercent', 0.0))

def scan_all_markets(timeframe: Timeframe = '1h') -> List[TradeSetup]:
    results = []
    for item in COIN_CONFIG:
        coin = item["coin"]
        symbol = item["symbol"]
        try:
            candles = fetch_binance_klines(symbol, interval=timeframe, limit=150)
            try:
                change_24h = fetch_24h_change(symbol)
            except Exception:
                change_24h = 0.0

            setup = evaluate_market_python(
                coin=coin,
                symbol=symbol,
                tradingview_symbol=item["tv"],
                name=item["name"],
                timeframe=timeframe,
                candles=candles,
                price_change_24h=change_24h
            )
            results.append(setup)
        except Exception as e:
            print(f"[!] Scanner warning for {coin}: {e}")
    return results
