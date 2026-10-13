import { Candle } from '../types/crypto';

export function calculateSMA(data: number[], period: number): number[] {
  const result: number[] = new Array(data.length).fill(0);
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum += data[i];
    if (i >= period) {
      sum -= data[i - period];
    }
    if (i >= period - 1) {
      result[i] = sum / period;
    } else {
      result[i] = data[i]; // fallback for early bars
    }
  }
  return result;
}

export function calculateEMA(data: number[], period: number): number[] {
  const result: number[] = new Array(data.length).fill(0);
  if (data.length === 0) return result;
  
  const multiplier = 2 / (period + 1);
  result[0] = data[0];

  for (let i = 1; i < data.length; i++) {
    result[i] = (data[i] - result[i - 1]) * multiplier + result[i - 1];
  }
  return result;
}

export function calculateRSI(closes: number[], period: number = 14): number[] {
  const result: number[] = new Array(closes.length).fill(50);
  if (closes.length <= period) return result;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  result[period] = 100 - (100 / (1 + rs));

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? Math.abs(diff) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    result[i] = 100 - (100 / (1 + rs));
  }

  return result;
}

export function calculateATR(candles: Candle[], period: number = 14): number[] {
  const result: number[] = new Array(candles.length).fill(0);
  if (candles.length === 0) return result;

  const trueRanges: number[] = [];
  trueRanges.push(candles[0].high - candles[0].low);

  for (let i = 1; i < candles.length; i++) {
    const current = candles[i];
    const prev = candles[i - 1];
    const tr = Math.max(
      current.high - current.low,
      Math.abs(current.high - prev.close),
      Math.abs(current.low - prev.close)
    );
    trueRanges.push(tr);
  }

  // Wilder's smoothing for ATR
  let sum = 0;
  for (let i = 0; i < Math.min(period, trueRanges.length); i++) {
    sum += trueRanges[i];
  }
  let currentATR = sum / period;
  result[Math.min(period - 1, candles.length - 1)] = currentATR;

  for (let i = period; i < candles.length; i++) {
    currentATR = (currentATR * (period - 1) + trueRanges[i]) / period;
    result[i] = currentATR;
  }

  // Backfill early values
  for (let i = 0; i < period; i++) {
    if (result[i] === 0) result[i] = trueRanges[i] || candles[0].high - candles[0].low;
  }

  return result;
}

export interface MACDResult {
  macdLine: number[];
  signalLine: number[];
  histogram: number[];
}

export function calculateMACD(
  closes: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): MACDResult {
  const fastEMA = calculateEMA(closes, fastPeriod);
  const slowEMA = calculateEMA(closes, slowPeriod);

  const macdLine: number[] = fastEMA.map((fast, i) => fast - slowEMA[i]);
  const signalLine = calculateEMA(macdLine, signalPeriod);
  const histogram: number[] = macdLine.map((m, i) => m - signalLine[i]);

  return { macdLine, signalLine, histogram };
}

export interface BollingerResult {
  middle: number[];
  upper: number[];
  lower: number[];
  percentB: number[];
}

export function calculateBollingerBands(
  closes: number[],
  period: number = 20,
  stdDevMultiplier: number = 2
): BollingerResult {
  const middle = calculateSMA(closes, period);
  const upper: number[] = new Array(closes.length).fill(0);
  const lower: number[] = new Array(closes.length).fill(0);
  const percentB: number[] = new Array(closes.length).fill(0.5);

  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) {
      upper[i] = closes[i] * 1.02;
      lower[i] = closes[i] * 0.98;
      percentB[i] = 0.5;
      continue;
    }

    let sumSquares = 0;
    for (let j = 0; j < period; j++) {
      sumSquares += Math.pow(closes[i - j] - middle[i], 2);
    }
    const stdDev = Math.sqrt(sumSquares / period);
    upper[i] = middle[i] + stdDev * stdDevMultiplier;
    lower[i] = middle[i] - stdDev * stdDevMultiplier;

    const bandWidth = upper[i] - lower[i];
    percentB[i] = bandWidth > 0 ? (closes[i] - lower[i]) / bandWidth : 0.5;
  }

  return { middle, upper, lower, percentB };
}

export interface ADXResult {
  adx: number[];
  plusDI: number[];
  minusDI: number[];
}

export function calculateADX(candles: Candle[], period: number = 14): ADXResult {
  const len = candles.length;
  const adx: number[] = new Array(len).fill(20);
  const plusDI: number[] = new Array(len).fill(20);
  const minusDI: number[] = new Array(len).fill(20);

  if (len < period * 2) return { adx, plusDI, minusDI };

  const plusDM: number[] = [0];
  const minusDM: number[] = [0];
  const tr: number[] = [candles[0].high - candles[0].low];

  for (let i = 1; i < len; i++) {
    const highDiff = candles[i].high - candles[i - 1].high;
    const lowDiff = candles[i - 1].low - candles[i].low;

    plusDM.push(highDiff > lowDiff && highDiff > 0 ? highDiff : 0);
    minusDM.push(lowDiff > highDiff && lowDiff > 0 ? lowDiff : 0);

    tr.push(Math.max(
      candles[i].high - candles[i].low,
      Math.abs(candles[i].high - candles[i - 1].close),
      Math.abs(candles[i].low - candles[i - 1].close)
    ));
  }

  // Smooth TR, +DM, -DM
  let smoothTR = 0;
  let smoothPlusDM = 0;
  let smoothMinusDM = 0;

  for (let i = 0; i < period; i++) {
    smoothTR += tr[i];
    smoothPlusDM += plusDM[i];
    smoothMinusDM += minusDM[i];
  }

  const dxList: number[] = [];

  for (let i = period; i < len; i++) {
    smoothTR = smoothTR - (smoothTR / period) + tr[i];
    smoothPlusDM = smoothPlusDM - (smoothPlusDM / period) + plusDM[i];
    smoothMinusDM = smoothMinusDM - (smoothMinusDM / period) + minusDM[i];

    const pDI = smoothTR > 0 ? (smoothPlusDM / smoothTR) * 100 : 0;
    const mDI = smoothTR > 0 ? (smoothMinusDM / smoothTR) * 100 : 0;

    plusDI[i] = pDI;
    minusDI[i] = mDI;

    const diSum = pDI + mDI;
    const dx = diSum > 0 ? (Math.abs(pDI - mDI) / diSum) * 100 : 0;
    dxList.push(dx);

    if (dxList.length >= period) {
      let adxSum = 0;
      for (let j = dxList.length - period; j < dxList.length; j++) {
        adxSum += dxList[j];
      }
      adx[i] = adxSum / period;
    } else {
      adx[i] = dx;
    }
  }

  return { adx, plusDI, minusDI };
}

export function calculateOBV(candles: Candle[]): number[] {
  const obv: number[] = new Array(candles.length).fill(0);
  if (candles.length === 0) return obv;

  obv[0] = candles[0].volume;
  for (let i = 1; i < candles.length; i++) {
    if (candles[i].close > candles[i - 1].close) {
      obv[i] = obv[i - 1] + candles[i].volume;
    } else if (candles[i].close < candles[i - 1].close) {
      obv[i] = obv[i - 1] - candles[i].volume;
    } else {
      obv[i] = obv[i - 1];
    }
  }
  return obv;
}

export interface SupportResistanceLevels {
  supports: number[];
  resistances: number[];
  nearestSupport: number;
  nearestResistance: number;
}

export function findSupportResistance(candles: Candle[], lookback: number = 30): SupportResistanceLevels {
  const currentPrice = candles[candles.length - 1]?.close || 0;
  const slice = candles.slice(-lookback);
  const pivots: { type: 'HIGH' | 'LOW'; price: number }[] = [];

  for (let i = 2; i < slice.length - 2; i++) {
    const prev2 = slice[i - 2];
    const prev1 = slice[i - 1];
    const curr = slice[i];
    const next1 = slice[i + 1];
    const next2 = slice[i + 2];

    if (curr.high > prev1.high && curr.high > prev2.high && curr.high > next1.high && curr.high > next2.high) {
      pivots.push({ type: 'HIGH', price: curr.high });
    }
    if (curr.low < prev1.low && curr.low < prev2.low && curr.low < next1.low && curr.low < next2.low) {
      pivots.push({ type: 'LOW', price: curr.low });
    }
  }

  const supports = pivots
    .filter(p => p.price < currentPrice)
    .map(p => p.price)
    .sort((a, b) => b - a);

  const resistances = pivots
    .filter(p => p.price > currentPrice)
    .map(p => p.price)
    .sort((a, b) => a - b);

  return {
    supports,
    resistances,
    nearestSupport: supports[0] || currentPrice * 0.97,
    nearestResistance: resistances[0] || currentPrice * 1.03
  };
}
