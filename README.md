# QuantPulse Crypto — Professional Trading Analysis & Backtesting Platform

QuantPulse is an algorithmic trading analysis platform that identifies selective **LONG**, **SHORT**, and **NO TRADE** opportunities across nine supported cryptocurrencies using a 10-strategy quantitative confluence engine, interactive TradingView chart integration, and a walk-forward historical backtester.

---

## 1. Supported Cryptocurrencies

The platform strictly analyzes nine liquid cryptocurrencies:
* **BTC** — Bitcoin (`BINANCE:BTCUSDT`)
* **ETH** — Ethereum (`BINANCE:ETHUSDT`)
* **SOL** — Solana (`BINANCE:SOLUSDT`)
* **BNB** — BNB (`BINANCE:BNBUSDT`)
* **ADA** — Cardano (`BINANCE:ADAUSDT`)
* **XRP** — XRP (`BINANCE:XRPUSDT`)
* **SUI** — Sui (`BINANCE:SUIUSDT`)
* **LINK** — Chainlink (`BINANCE:LINKUSDT`)
* **DOGE** — Dogecoin (`BINANCE:DOGEUSDT`)

---

## 2. Quantitative Multi-Strategy Confluence Engine

1. **Trend Following**: EMA 20/50/200 stack combined with ADX $\ge 22$ directional trend filtering.
2. **Momentum Matrix**: RSI 14 centerline momentum and MACD histogram acceleration.
3. **Volume Breakout Detection**: Bollinger/Donchian channel boundary closes validated by volume expansion $\ge 1.35\times$ 20-period moving average.
4. **Support & Resistance**: Liquidity pivot clustering with nearest support/resistance retest buffers.
5. **Price Action & Swing Character**: Candlestick geometry (engulfing bars, hammer/shooting-star pin bars, and swing structure).
6. **ATR Volatility Regime**: 14-period Average True Range calibration for dynamic stop distances ($1.5\times$ to $2.0\times$ ATR).
7. **Mean Reversion**: Bollinger Band $\%B$ extremes paired with RSI exhaustion, active strictly during compressed ranging regimes.
8. **Multi-Timeframe Trend Confirmation**: Synchronizes current execution timeframe (15m, 1h) with higher timeframe (4h, 1d) structural slope.
9. **Volume Flow (OBV)**: On-Balance Volume trend vs. 14-period baseline to filter out low-volume false signals.
10. **Confluence Scoring & Regime Filtering**: Market classification (Bullish Trending, Bearish Trending, High Volatility, Ranging Compressed, Uncertain Choppy). Selective signals require confluence $\ge 66/100$ or $\le 34/100$; otherwise the engine strictly returns **NO TRADE**.

---

## 3. TradingView Chart Integration

The platform embeds TradingView's advanced charting interface:
* Direct symbol switching between all 9 supported pairs.
* Timeframe selection (15m, 1h, 4h, 1d).
* **Levels Comparison Panel**: Directly compare the system's independently calculated Entry, Stop Loss, and TP1/TP2/TP3 levels against the live chart.
* Direct link to open the chart inside TradingView.
* *Note:* The platform's quantitative signals are computed independently by its quantitative engine; TradingView provides candle visualization and does not run arbitrary backend code.

---

## 4. Step-by-Step Windows Local Setup Instructions

### Prerequisites
* **Python 3.10+**: Download from [python.org](https://www.python.org/downloads/) (check *"Add python.exe to PATH"* during installation).
* **Node.js 18+ & npm**: Download LTS from [nodejs.org](https://nodejs.org/).
* **Git**: Download from [git-scm.com](https://git-scm.com/).

### Setup Steps on Windows (PowerShell or Command Prompt)

1. **Clone the Repository**:
   ```powershell
   git clone https://github.com/<your-username>/quantpulse-crypto.git
   cd quantpulse-crypto
   ```

2. **Set Up Python Virtual Environment**:
   ```powershell
   python -m venv .venv
   .\.venv\Scripts\activate
   pip install --upgrade pip
   pip install -r python_engine/requirements.txt
   ```

3. **Install Web App Dependencies**:
   ```powershell
   npm install
   ```

4. **Run Unit Tests (Verification)**:
   ```powershell
   pytest python_engine/tests -v
   ```

5. **Start the Platform Locally**:
   ```powershell
   npm run dev
   ```
   Open your browser at `http://localhost:3000`.

6. **Run Python CLI Market Scanner (Optional)**:
   ```powershell
   python -m python_engine.main --timeframe 1h
   ```

---

## 5. Deployment Guide: Online 24/7 (Computer Switched Off)

To keep the platform and scheduled scanning operating while your computer is turned off:

### Option A: Free Cloud Hosting (Render / Railway)
1. Push your repository to GitHub.
2. Sign up on [Render.com](https://render.com) or [Railway.app](https://railway.app).
3. Create a **New Web Service** and connect your GitHub repository.
4. Set Build Command: `npm install && npm run build`
5. Set Start Command: `npm run start`
6. Add environment variable: `PORT=3000`
7. Click **Deploy**. Your dashboard will be live at an HTTPS URL 24/7.
*Note on free tiers:* Free instances on Render may sleep after 15 minutes of inactivity; waking takes ~30 seconds. For uninterrupted zero-latency uptime, a $5/month instance or self-hosted VPS (DigitalOcean / Hetzner) is recommended.

### Option B: GitHub Actions Scheduled Scans (100% Free)
* The repository includes `.github/workflows/analysis_schedule.yml`.
* It automatically triggers every 2 hours on GitHub's infrastructure, running the Python quantitative analysis engine across all 9 coins.
* You can view execution logs under the **Actions** tab on your GitHub repository anytime from any device.

### Option C: Docker Deployment (VPS or Local Server)
```bash
docker compose up -d --build
```
Access the application on port `3000`.

---

## 6. Verification Checklist

- [x] All 9 cryptocurrencies supported (BTC, ETH, SOL, BNB, ADA, XRP, SUI, LINK, DOGE).
- [x] Multi-strategy engine with 10 established strategy families implemented.
- [x] Selective LONG, SHORT, and NO TRADE output when evidence is insufficient.
- [x] Entry zones, SL, TP1, TP2, TP3, Risk-to-Reward ratio calculated.
- [x] Interactive TradingView chart integration with symbol and timeframe syncing.
- [x] Historical walk-forward backtesting simulator with fees (0.06%) and slippage (0.05%).
- [x] Automated unit test suite (`pytest python_engine/tests`).
- [x] GitHub Actions workflow for scheduled analysis (`.github/workflows/analysis_schedule.yml`).
- [x] In-browser ZIP project export tool for instantaneous deliverable download.
- [x] Zero Telegram dependencies or references anywhere in the codebase.
- [x] Windows setup and online deployment instructions documented.

---

## 7. Risk Disclaimer & Verification Statement

Quantitative signals, confluence scores, and historical backtest metrics are algorithmic estimations calculated from historical and real-time market data. They do not constitute financial advice, nor do they guarantee future profit. No strategy achieves an unverified 80% win rate; out-of-sample execution involves real-world execution variance, latency, and liquidity constraints. Always practice disciplined risk management.
