import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { evaluateMarket } from './src/engine/strategies.js';
import { runBacktest } from './src/engine/backtester.js';
import { getMarketDataForCoin, SUPPORTED_COINS } from './src/services/marketData.js';
import { BacktestConfig, SupportedCoin, Timeframe, TradeSetup } from './src/types/crypto.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json());

// In-memory scan cache to prevent spamming Binance endpoints
let cachedScan: {
  timestamp: number;
  timeframe: Timeframe;
  results: TradeSetup[];
} | null = null;

// API: Health & Status
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ONLINE',
    service: 'QuantPulse Algorithmic Engine',
    coinsSupported: SUPPORTED_COINS.length,
    timestamp: Date.now(),
    strategiesCount: 10,
    serverUptimeSeconds: Math.floor(process.uptime()),
    zeroTelegramPolicy: 'ENFORCED'
  });
});

// API: Market Scan for all 9 supported coins
app.get('/api/scan', async (req: Request, res: Response) => {
  try {
    const timeframe = (req.query.timeframe as Timeframe) || '1h';
    const forceFresh = req.query.fresh === 'true';

    // Cache valid for 30 seconds unless explicitly forced
    if (!forceFresh && cachedScan && cachedScan.timeframe === timeframe && Date.now() - cachedScan.timestamp < 30000) {
      return res.json({
        cached: true,
        timestamp: cachedScan.timestamp,
        timeframe,
        data: cachedScan.results
      });
    }

    const scanPromises = SUPPORTED_COINS.map(async (meta) => {
      try {
        const { candles, priceChange24h, isFallback } = await getMarketDataForCoin(meta, timeframe, 150);
        // Also get higher timeframe candles for context
        const htTimeframe: Timeframe = timeframe === '15m' ? '1h' : timeframe === '1h' ? '4h' : '1d';
        const { candles: htCandles } = await getMarketDataForCoin(meta, htTimeframe, 50).catch(() => ({ candles: [] }));

        const setup = evaluateMarket({
          coin: meta.coin,
          symbol: meta.binanceSymbol,
          tradingViewSymbol: meta.tradingViewSymbol,
          name: meta.name,
          timeframe,
          candles,
          higherTimeframeCandles: htCandles,
          priceChange24h
        });

        if (isFallback) {
          setup.dataFreshness = 'FALLBACK_CACHED';
        }

        return setup;
      } catch (coinErr) {
        console.error(`Error scanning ${meta.coin}:`, coinErr);
        return null;
      }
    });

    const results = (await Promise.all(scanPromises)).filter((s): s is TradeSetup => s !== null);

    cachedScan = {
      timestamp: Date.now(),
      timeframe,
      results
    };

    res.json({
      cached: false,
      timestamp: Date.now(),
      timeframe,
      data: results
    });
  } catch (err: any) {
    console.error('Scan API failed:', err);
    res.status(500).json({ error: 'Internal scanning error', details: err?.message });
  }
});

// API: Historical Backtest Simulation
app.post('/api/backtest', async (req: Request, res: Response) => {
  try {
    const {
      coin = 'BTC',
      timeframe = '1h',
      initialBalance = 10000,
      riskPerTradePct = 1.5,
      takerFeePct = 0.06,
      slippagePct = 0.05,
      candleLimit = 350
    } = req.body;

    const coinMeta = SUPPORTED_COINS.find(c => c.coin === coin) || SUPPORTED_COINS[0];
    const { candles } = await getMarketDataForCoin(coinMeta, timeframe as Timeframe, candleLimit);

    const config: BacktestConfig = {
      coin: coin as SupportedCoin,
      timeframe: timeframe as Timeframe,
      initialBalance: Number(initialBalance),
      riskPerTradePct: Number(riskPerTradePct),
      takerFeePct: Number(takerFeePct),
      slippagePct: Number(slippagePct),
      candleLimit: Number(candleLimit)
    };

    const summary = runBacktest(candles, config);
    res.json(summary);
  } catch (err: any) {
    console.error('Backtest API error:', err);
    res.status(500).json({ error: 'Backtest failed', details: err?.message });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`QuantPulse Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
