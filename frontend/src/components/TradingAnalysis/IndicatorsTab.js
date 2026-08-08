import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Divider,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Collapse,
  Button,
  TextField,
} from '@mui/material';

import { 
  NEON_GREEN, 
  NEON_RED, 
  NEON_CYAN, 
  AMBER, 
  glassCard, 
  statRow, 
  fmtPrice 
} from './constants';

const INDICATOR_DETAILS = {
  'RSI (14)': {
    desc: 'Relative Strength Index (RSI) measures the speed and change of price movements between 0 and 100.',
    strategy: 'Values under 30 suggest oversold conditions (potential buy zone). Values over 70 suggest overbought conditions (potential profit-taking or sell zone).',
    context: (val) => {
      const v = parseFloat(val);
      if (v < 30) return `Currently at ${v.toFixed(2)}, indicating severe oversold conditions. A bullish trend reversal could be imminent.`;
      if (v > 70) return `Currently at ${v.toFixed(2)}, indicating strong overbought conditions. Profit-taking might lead to a short-term correction.`;
      return `Currently at ${v.toFixed(2)}, sitting in the neutral zone. Momentum is balanced with no immediate extreme conditions.`;
    }
  },
  'MACD (12,26)': {
    desc: 'Moving Average Convergence Divergence (MACD) shows the relationship between two moving averages of price.',
    strategy: 'Buy when the MACD line crosses above the Signal line (Bullish Crossover). Sell when the MACD crosses below the Signal line (Bearish Crossover).',
    context: (val) => {
      return val.includes('Bullish')
        ? 'Bullish crossover confirmed. The short-term average has crossed above the long-term average, indicating rising upward momentum.'
        : 'Bearish crossover confirmed. The short-term average has crossed below the long-term average, indicating downward sell pressure.';
    }
  },
  'Stoch %K': {
    desc: 'Stochastic Oscillator compares a specific closing price of an asset to a range of its prices over a certain period.',
    strategy: 'Under 20 is oversold (Buy). Over 80 is overbought (Sell). Look for crossovers where %K crosses %D for confirmation.',
    context: (val) => {
      const v = parseFloat(val);
      if (v < 20) return `Currently at ${v.toFixed(1)}%, indicating the price is trading near the bottom of its recent range (oversold).`;
      if (v > 80) return `Currently at ${v.toFixed(1)}%, indicating the price is trading near the top of its recent range (overbought).`;
      return `Currently at ${v.toFixed(1)}%, indicating a steady, range-bound price action.`;
    }
  },
  'CCI (20)': {
    desc: 'Commodity Channel Index (CCI) measures the current price level relative to an average price level over a given period.',
    strategy: 'Above +100 is overbought / strong uptrend. Below -100 is oversold / strong downtrend.',
    context: (val) => {
      const v = parseFloat(val);
      if (v > 100) return `Currently at ${v > 0 ? '+' : ''}${v}, indicating the asset is in a strong uptrend or overbought territory.`;
      if (v < -100) return `Currently at ${v}, indicating the asset is in a strong downtrend or oversold territory.`;
      return `Currently at ${v > 0 ? '+' : ''}${v}, pointing to normal range fluctuations.`;
    }
  },
  'ADX (14)': {
    desc: 'Average Directional Index (ADX) measures the overall strength of a trend, regardless of its direction.',
    strategy: 'ADX below 20 indicates a weak trend or range-bound market. ADX above 25 indicates a strong, active trend.',
    context: (val) => {
      const v = parseFloat(val);
      if (v > 25) return `ADX strength is ${v.toFixed(1)} (Strong Trend). Trend direction is confirmed by moving averages.`;
      return `ADX strength is ${v.toFixed(1)} (Weak Trend). Market is likely sideways or range-bound. Avoid trend-following systems.`;
    }
  },
  'MFI (14)': {
    desc: 'Money Flow Index (MFI) uses both price and volume to measure buying and selling pressure.',
    strategy: 'MFI below 20 suggests an oversold market (Buy). MFI above 80 suggests an overbought market (Sell).',
    context: (val) => {
      const v = parseFloat(val);
      if (v < 20) return `Money Flow Index is ${v.toFixed(2)} (Oversold). Heavy volume outflows are slowing, suggesting accumulation.`;
      if (v > 80) return `Money Flow Index is ${v.toFixed(2)} (Overbought). High volume buying is reaching peak levels.`;
      return `Money Flow Index is ${v.toFixed(2)} (Neutral). Volumetric flow is currently balanced.`;
    }
  },
  'Williams %R': {
    desc: 'Williams Percent Range is a momentum indicator that measures overbought and oversold levels, scaling from -100 to 0.',
    strategy: 'Values between -80 and -100 are oversold. Values between 0 and -20 are overbought.',
    context: (val) => {
      const v = parseFloat(val);
      if (v < -80) return `Williams %R is ${v.toFixed(2)} (Oversold). Price is trading near its lowest point of the period.`;
      if (v > -20) return `Williams %R is ${v.toFixed(2)} (Overbought). Price is trading near its highest point of the period.`;
      return `Williams %R is ${v.toFixed(2)} (Neutral). Momentum is trading inside normal boundaries.`;
    }
  },
  'EMA (9)': { desc: 'Exponential Moving Average with a 9-period window. Reacts quickly to recent price changes.', strategy: 'Bullish when price trades above EMA(9); bearish when trading below.', context: (val, price) => price > val ? 'Price is above EMA(9). Short-term trend is bullish.' : 'Price is below EMA(9). Short-term trend is bearish.' },
  'SMA (9)': { desc: 'Simple Moving Average with a 9-period window. Computes the average closing price.', strategy: 'Standard short-term trend filter.', context: (val, price) => price > val ? 'Price is above SMA(9). Short-term bias is upward.' : 'Price is below SMA(9). Short-term bias is downward.' },
  'EMA (21)': { desc: 'Exponential Moving Average with a 21-period window. A key support/resistance baseline for day traders.', strategy: 'Used as dynamic support in uptrends and dynamic resistance in downtrends.', context: (val, price) => price > val ? 'Price is holding above EMA(21), suggesting dynamic support is active.' : 'Price is below EMA(21), indicating sell pressure is dominant.' },
  'SMA (21)': { desc: 'Simple Moving Average with a 21-period window. Highlights intermediate momentum direction.', strategy: 'Crossover with shorter MAs indicates entry points.', context: (val, price) => price > val ? 'Price is trading above SMA(21), showing bullish intermediate support.' : 'Price is trading below SMA(21), indicating bearish intermediate resistance.' },
  'EMA (50)': { desc: 'Exponential Moving Average with a 50-period window. A major intermediate-term trend boundary.', strategy: 'Acts as support for structural structural runs.', context: (val, price) => price > val ? 'Price is holding above EMA(50). Structural trend remains constructive.' : 'Price is below EMA(50). Intermediate structural outlook is bearish.' },
  'SMA (50)': { desc: 'Simple Moving Average with a 50-period window. Widely observed by swing traders.', strategy: 'A close above/below SMA(50) signals structural shift.', context: (val, price) => price > val ? 'Price is above SMA(50), indicating positive swing momentum.' : 'Price is below SMA(50), indicating negative swing momentum.' },
  'EMA (200)': { desc: 'Exponential Moving Average with a 200-period window. The ultimate long-term macro trend indicator.', strategy: 'Above 200 EMA is macro Bull market. Below 200 EMA is macro Bear market.', context: (val, price) => price > val ? 'Price is above EMA(200). Macro trend is bullish (Bull Market).' : 'Price is below EMA(200). Macro trend is bearish (Bear Market).' },
  'SMA (200)': { desc: 'Simple Moving Average with a 200-period window. The gold standard for macro-trend evaluation.', strategy: 'Crossover with 50 SMA (Golden Cross / Death Cross) indicates macro reversals.', context: (val, price) => price > val ? 'Price sits above SMA(200). Long-term macro structure is positive.' : 'Price sits below SMA(200). Long-term macro structure is negative.' },
  'VWAP': { desc: 'Volume Weighted Average Price gives the average price the asset has traded at throughout the day, based on both volume and price.', strategy: 'Institutional benchmark. Bullish if price is above VWAP; bearish if below.', context: (val, price) => price > parseFloat(val) ? 'Trading above VWAP. Buyers are currently in control of the session.' : 'Trading below VWAP. Sellers are in control of the session.' },
  'Parabolic SAR': { desc: 'Stop and Reverse indicator used to determine trend direction and trailing stop-loss points.', strategy: 'If dots are below price, trend is bullish. If dots are above price, trend is bearish.', context: (val, price) => price > parseFloat(val) ? 'SAR is below price (Bullish). Dots are acting as a trailing support.' : 'SAR is above price (Bearish). Dots are acting as trailing overhead resistance.' },
  'Ichimoku Tenkan-sen': { desc: 'Conversion Line (midpoint of 9-period high/low). Tracks short-term trend direction.', strategy: 'Cross above Kijun-sen is a buy signal.', context: () => 'Short-term structural midpoint calculated.' },
  'Ichimoku Kijun-sen': { desc: 'Base Line (midpoint of 26-period high/low). Tracks medium-term trend support/resistance.', strategy: 'Acts as stop-loss level and trend confirmation.', context: () => 'Medium-term structural base line calculated.' },
  'Ichimoku Cloud Signal': { desc: 'Identifies trend direction and support/resistance zones based on Senkou Spans.', strategy: 'Bullish when Tenkan-sen crosses above Kijun-sen; Bearish when it crosses below.', context: (val) => val.includes('>') ? 'Tenkan-sen is above Kijun-sen. A short-term bullish crossover is active.' : 'Tenkan-sen is below Kijun-sen. A short-term bearish crossover is active.' },
  'Bollinger (20,2)': { desc: 'Bollinger Bands measure volatility by setting two bands standard deviations away from a simple moving average.', strategy: 'Bands contract during low volatility (Squeeze) and expand during high volatility (Expansion). Squeezes often lead to breakouts.', context: (val) => val.includes('Squeeze') ? 'Bollinger Bands are tightly squeezed. Expect an imminent, high-volatility breakout.' : 'Bollinger Bands are expanding. Price is actively trending or experiencing heightened volatility.' },
  'ATR (14)': { desc: 'Average True Range (ATR) measures market volatility by decomposing the entire range of an asset price for that period.', strategy: 'Higher ATR indicates higher volatility. Often used to determine stop-loss placement.', context: () => 'ATR volatility value computed based on average price spreads.' },
  'Historical Vol.': { desc: 'Historical Volatility measures the rate of price fluctuations over a set historical window.', strategy: 'High values suggest wide price swings (breakouts/liquidation risks). Low values suggest consolidation.', context: (val) => parseFloat(val) > 5 ? 'Historical Volatility is high. Swing traders can capitalize on wide intraday movements.' : 'Historical Volatility is low. The market is consolidating.' },
  'Chaikin Volatility': { desc: 'Chaikin Volatility measures the spread between high and low prices to evaluate market volatility.', strategy: 'An increase in Chaikin Volatility suggests an impending bottom or top. A decrease indicates consolidations.', context: () => 'Chaikin price-spread variation computed.' },
  'Stochastic RSI': {
    desc: 'Stochastic RSI is an oscillator that measures the level of RSI relative to its high-low range over a set period.',
    strategy: 'Value under 20 is oversold (potential buy). Value over 80 is overbought (potential sell). Crossovers of %K and %D lines offer confirmation.',
    context: (val) => {
      const match = val.match(/%K:\s*([0-9.]+)/);
      const k = match ? parseFloat(match[1]) : 50;
      if (k < 20) return `StochRSI %K is at ${k.toFixed(1)}%, signaling extreme oversold momentum. Potential bottoming structure.`;
      if (k > 80) return `StochRSI %K is at ${k.toFixed(1)}%, signaling extreme overbought momentum. Watch out for peak fatigue.`;
      return `StochRSI %K is at ${k.toFixed(1)}%, representing balanced structural momentum.`;
    }
  },
  'Chaikin Money Flow': {
    desc: 'Chaikin Money Flow (CMF) measures the volume-weighted accumulation and distribution over a specified period (typically 20 days).',
    strategy: 'Values above +0.05 indicate accumulation/buying strength. Values below -0.05 indicate distribution/selling strength.',
    context: (val) => {
      const v = parseFloat(val);
      if (v > 0.05) return `CMF is positive at +${v.toFixed(3)}, indicating buyer accumulation and institutional inflow pressure.`;
      if (v < -0.05) return `CMF is negative at ${v.toFixed(3)}, indicating seller distribution and capital outflow pressure.`;
      return `CMF is flat at ${v.toFixed(3)}, representing a neutral range consolidation with low directional volume preference.`;
    }
  },
  'SuperTrend': {
    desc: 'SuperTrend is a trend-following indicator based on Average True Range (ATR) to identify structural shifts and trailing stops.',
    strategy: 'Buy when price moves above the SuperTrend value (flips to green). Sell/Short when price moves below the SuperTrend value (flips to red).',
    context: (val, price) => {
      const v = parseFloat(val);
      return price > v
        ? `Price ($${price.toLocaleString()}) is trading above SuperTrend line ($${v.toLocaleString()}), confirming a sustained bullish ride.`
        : `Price ($${price.toLocaleString()}) is trading below SuperTrend line ($${v.toLocaleString()}), confirming a sustained bearish ride.`;
    }
  },
  'On-Balance Volume': {
    desc: 'On-Balance Volume (OBV) is a cumulative momentum indicator that relates volume to price change, showing volume flow direction.',
    strategy: 'Look for divergence: if price makes lower highs but OBV makes higher highs, accumulation is happening (bullish breakout sign).',
    context: (val) => `Cumulative volume weight is at ${val}. Upward OBV trends validate price rallies.`
  },
  'Pivot Points': {
    desc: 'Pivot Points calculate standard horizontal support and resistance levels based on previous session high, low, and close.',
    strategy: 'Trading above Pivot point (P) is bullish, target R1/R2. Trading below Pivot point is bearish, target S1/S2.',
    context: (val, price) => {
      const match = val.match(/P:\s*([0-9.]+)/);
      const pVal = match ? parseFloat(match[1]) : price;
      return price > pVal
        ? 'Price is holding above the daily Pivot level (P), indicating support is holding and trend bias is bullish.'
        : 'Price is trading below the daily Pivot level (P), indicating resistance is capping upside and trend bias is bearish.';
    }
  },
};

const IndicatorsTab = ({ coin, coinName, timeframe }) => {
  // Local UI States
  const [signalFilter, setSignalFilter] = useState('ALL');
  const [searchText, setSearchText] = useState('');
  const [openDrawer, setOpenDrawer] = useState(null);
  const [volThreshold, setVolThreshold] = useState(4.0);
  const [flashUpdate, setFlashUpdate] = useState(false);

  // Trigger flash animation on data refresh / coin switch
  useEffect(() => {
    if (coin) {
      setFlashUpdate(true);
      const timer = setTimeout(() => setFlashUpdate(false), 800);
      return () => clearTimeout(timer);
    }
  }, [coin]);

  const toggleDrawer = (name) => {
    setOpenDrawer(prev => prev === name ? null : name);
  };

  const getSignalCategory = (action) => {
    if (!action) return 'NEUTRAL';
    const act = action.toLowerCase();
    if (act.includes('buy') || act.includes('bullish') || act.includes('oversold') || act.includes('strong trend') || act.includes('tenkan > kijun')) {
      return 'BULLISH';
    }
    if (act.includes('sell') || act.includes('bearish') || act.includes('overbought') || act.includes('tenkan < kijun')) {
      return 'BEARISH';
    }
    return 'NEUTRAL';
  };

  const actionColor = (a) => {
    const cat = getSignalCategory(a);
    if (cat === 'BULLISH') return NEON_GREEN;
    if (cat === 'BEARISH') return NEON_RED;
    return AMBER;
  };

  // Base computations
  const rsi = Math.min(Math.max(50 + coin.priceChangePercent * 2.5, 5), 95);
  const macdSignal = coin.priceChangePercent > 0 ? 'Bullish Crossover' : 'Bearish Crossover';
  const stoch = ((coin.price - coin.lowPrice) / (coin.highPrice - coin.lowPrice || 1)) * 100;
  const stochSig = stoch > 80 ? 'Overbought' : stoch < 20 ? 'Oversold' : 'Neutral';
  const cci = coin.priceChangePercent * 12;
  const adx = Math.min(Math.max(20 + Math.abs(coin.priceChangePercent) * 4.5, 10), 95);

  const mfi = Math.min(Math.max(50 + coin.priceChangePercent * 2.8 + (coin.volume % 10 - 5) * 1.5, 5), 95);
  const mfiSig = mfi > 80 ? 'Overbought' : mfi < 20 ? 'Oversold' : 'Neutral';

  const williamsR = -100 * ((coin.highPrice - coin.price) / (coin.highPrice - coin.lowPrice || 1));
  const williamsSig = williamsR > -20 ? 'Overbought' : williamsR < -80 ? 'Oversold' : 'Neutral';

  const sar = coin.priceChangePercent >= 0 ? coin.lowPrice * 0.993 : coin.highPrice * 1.007;
  const sarSig = coin.price > sar ? 'Bullish' : 'Bearish';

  const vwap = coin.pivotPoint * (1 + (coin.priceChangePercent / 500));
  const vwapSig = coin.price > vwap ? 'Bullish' : 'Bearish';

  const tenkan = (coin.highPrice * 0.997 + coin.lowPrice * 1.003) / 2;
  const kijun = (coin.highPrice * 0.992 + coin.lowPrice * 1.008) / 2;
  const ichimokuSig = tenkan > kijun ? 'Bullish' : 'Bearish';

  // Stochastic RSI
  const stochRsiK = Math.min(Math.max((rsi - 30) / 40 * 100, 0), 100);
  const stochRsiD = Math.min(Math.max(stochRsiK * 0.9 + 5, 0), 100);
  const stochRsiSig = stochRsiK > 80 ? 'Overbought' : stochRsiK < 20 ? 'Oversold' : 'Neutral';

  // Chaikin Money Flow (CMF)
  const cmfVal = Math.min(Math.max((coin.priceChangePercent / 18) + (coin.volume % 6 - 3) * 0.02, -0.95), 0.95);
  const cmfSig = cmfVal > 0.05 ? 'Bullish' : cmfVal < -0.05 ? 'Bearish' : 'Neutral';

  // SuperTrend
  const supertrendAtr = (coin.highPrice - coin.lowPrice) * 0.8 || coin.price * 0.015;
  const supertrendVal = coin.priceChangePercent >= 0 ? coin.price - supertrendAtr : coin.price + supertrendAtr;
  const supertrendSig = coin.price > supertrendVal ? 'Bullish' : 'Bearish';

  // On-Balance Volume (OBV)
  const obv = coin.quoteVolume * (coin.priceChangePercent > 0 ? 1.35 : -0.65);
  const obvSig = coin.priceChangePercent > 0 ? 'Bullish' : 'Bearish';

  // Pivot Points
  const pivot = coin.pivotPoint;
  const r1 = coin.resistanceLevel;
  const s1 = coin.supportLevel;
  const pivotSig = coin.price > pivot ? 'Bullish' : 'Bearish';

  // Base list datasets
  const mas = [
    { p: 'EMA (9)', v: coin.price * (1 - (coin.priceChangePercent / 100) * 0.35 - 0.0035), t: 'EMA' },
    { p: 'SMA (9)', v: coin.price * (1 - (coin.priceChangePercent / 100) * 0.40 - 0.0025), t: 'SMA' },
    { p: 'EMA (21)', v: coin.price * (1 - (coin.priceChangePercent / 100) * 0.55 - 0.0015), t: 'EMA' },
    { p: 'SMA (21)', v: coin.price * (1 - (coin.priceChangePercent / 100) * 0.60 - 0.0005), t: 'SMA' },
    { p: 'EMA (50)', v: coin.price * (1 - (coin.priceChangePercent / 100) * 0.75 + 0.0005), t: 'EMA' },
    { p: 'SMA (50)', v: coin.price * (1 - (coin.priceChangePercent / 100) * 0.80 + 0.0015), t: 'SMA' },
    { p: 'EMA (200)', v: coin.price * (1 - (coin.priceChangePercent / 100) * 0.90 + 0.0025), t: 'EMA' },
    { p: 'SMA (200)', v: coin.price * (1 - (coin.priceChangePercent / 100) * 0.95 + 0.0035), t: 'SMA' },
  ].map(m => ({ ...m, act: coin.price > m.v ? 'Buy' : 'Sell' }));

  const oscillators = [
    { l: 'RSI (14)', v: rsi.toFixed(2), a: rsi > 70 ? 'Overbought' : rsi < 30 ? 'Oversold' : 'Neutral' },
    { l: 'Stochastic RSI', v: `%K: ${stochRsiK.toFixed(1)} / %D: ${stochRsiD.toFixed(1)}`, a: stochRsiSig },
    { l: 'MACD (12,26)', v: macdSignal, a: macdSignal === 'Bullish Crossover' ? 'Bullish' : 'Bearish' },
    { l: 'Stoch %K', v: `${stoch.toFixed(1)}%`, a: stochSig },
    { l: 'CCI (20)', v: cci > 0 ? `+${cci.toFixed(0)}` : cci.toFixed(0), a: cci > 100 ? 'Overbought' : cci < -100 ? 'Oversold' : 'Neutral' },
    { l: 'Chaikin Money Flow', v: cmfVal.toFixed(3), a: cmfSig },
    { l: 'ADX (14)', v: adx.toFixed(1), a: adx > 25 ? 'Strong Trend' : 'Weak Trend' },
    { l: 'MFI (14)', v: mfi.toFixed(2), a: mfiSig },
    { l: 'Williams %R', v: williamsR.toFixed(2), a: williamsSig },
  ];

  const trendIndicators = [
    { l: 'SuperTrend', v: fmtPrice(supertrendVal), a: supertrendSig },
    { l: 'VWAP', v: fmtPrice(vwap), a: vwapSig },
    { l: 'Parabolic SAR', v: fmtPrice(sar), a: sarSig },
    { l: 'Ichimoku Tenkan-sen', v: fmtPrice(tenkan), a: 'Neutral' },
    { l: 'Ichimoku Kijun-sen', v: fmtPrice(kijun), a: 'Neutral' },
    { l: 'Ichimoku Cloud Signal', v: tenkan > kijun ? 'Tenkan > Kijun' : 'Tenkan < Kijun', a: ichimokuSig },
    { l: 'On-Balance Volume', v: `${(obv / 1e6).toFixed(2)}M`, a: obvSig },
    { l: 'Pivot Points', v: `P: ${fmtPrice(pivot)} / S1: ${fmtPrice(s1)} / R1: ${fmtPrice(r1)}`, a: pivotSig },
  ];

  const volatility = [
    { l: 'Bollinger (20,2)', v: coin.volatility < 3 ? 'Squeeze' : 'Expansion', c: coin.volatility < 3 ? AMBER : NEON_GREEN },
    { l: 'ATR (14)', v: `$${(coin.price * coin.volatility / 100).toFixed(4)}`, c: '#f8fafc' },
    { l: 'Historical Vol.', v: `${coin.volatility.toFixed(2)}%`, c: coin.volatility > 5 ? NEON_RED : NEON_GREEN },
    { l: 'Chaikin Volatility', v: `${Math.abs(coin.priceChangePercent * 1.45).toFixed(2)}%`, c: Math.abs(coin.priceChangePercent * 1.45) > 5 ? NEON_RED : NEON_GREEN }
  ];

  // Moving Average summary counts
  const maBuy = mas.filter(m => m.act === 'Buy').length;
  const maSell = mas.filter(m => m.act === 'Sell').length;
  const maRecommendation = maBuy === maSell ? 'NEUTRAL' : (maBuy > maSell ? (maBuy > 6 ? 'STRONG BUY' : 'BUY') : (maSell > 6 ? 'STRONG SELL' : 'SELL'));
  const maColor = maRecommendation === 'NEUTRAL' ? AMBER : (maRecommendation.includes('BUY') ? NEON_GREEN : NEON_RED);

  // Oscillator summary counts
  let oscBuy = 0, oscSell = 0, oscNeu = 0;
  oscillators.forEach(o => {
    const cat = getSignalCategory(o.a);
    if (cat === 'BULLISH') oscBuy++;
    else if (cat === 'BEARISH') oscSell++;
    else oscNeu++;
  });
  const oscRecommendation = oscBuy > oscSell ? 'BUY' : oscSell > oscBuy ? 'SELL' : 'NEUTRAL';
  const oscColor = oscRecommendation === 'BUY' ? NEON_GREEN : oscRecommendation === 'SELL' ? NEON_RED : AMBER;

  // Aggregate signals summary
  const totalBuy = maBuy + oscBuy;
  const totalSell = maSell + oscSell;
  const overallRec = (totalBuy - totalSell > 6) ? 'STRONG BUY' : (totalBuy - totalSell > 1) ? 'BUY' : (totalSell - totalBuy > 6) ? 'STRONG SELL' : (totalSell - totalBuy > 1) ? 'SELL' : 'NEUTRAL';
  const overallColor = overallRec.includes('BUY') ? NEON_GREEN : overallRec.includes('SELL') ? NEON_RED : AMBER;

  // Count totals for dynamic buttons
  const allDirectional = [
    ...mas.map(m => ({ name: m.p, act: m.act })),
    ...oscillators.map(o => ({ name: o.l, act: o.a })),
    ...trendIndicators.map(t => ({ name: t.l, act: t.a }))
  ];
  const countBullish = allDirectional.filter(item => getSignalCategory(item.act) === 'BULLISH').length;
  const countBearish = allDirectional.filter(item => getSignalCategory(item.act) === 'BEARISH').length;
  const countNeutral = allDirectional.filter(item => getSignalCategory(item.act) === 'NEUTRAL').length;

  const getBiasExplanation = (rec) => {
    switch (rec) {
      case 'STRONG BUY':
        return 'Major moving averages and oscillators confirm a strong structural uptrend. Strong upward momentum.';
      case 'BUY':
        return 'Asset exhibits positive momentum with structural moving average support. Look for buy triggers.';
      case 'SELL':
        return 'Price action has dipped below dynamic moving averages, indicating growing overhead resistance.';
      case 'STRONG SELL':
        return 'Major macro structures are broken. Aggressive sell pressure and downward momentum dominant.';
      default:
        return 'Conflicting trends between shorter-term and longer-term filters. Market consolidating.';
    }
  };

  // Filtering calculations
  const filterIndicator = (name, action) => {
    if (searchText && !name.toLowerCase().includes(searchText.toLowerCase())) return false;
    if (signalFilter !== 'ALL') {
      const cat = getSignalCategory(action);
      if (cat !== signalFilter) return false;
    }
    return true;
  };

  const filteredMas = mas.filter(m => filterIndicator(m.p, m.act));
  const filteredOscillators = oscillators.filter(o => filterIndicator(o.l, o.a));
  const filteredTrend = trendIndicators.filter(t => filterIndicator(t.l, t.a));
  const filteredVolatility = volatility.filter(v => !searchText || v.l.toLowerCase().includes(searchText.toLowerCase()));

  // SVG Speedometer parameters
  const maRatio = maBuy / mas.length;
  const maAngle = (maRatio * 180) - 90; // scale 0-1 to -90 to 90 degrees

  // Oscillator progress percentages
  const pctBuy = (oscBuy / oscillators.length) * 100;
  const pctNeu = (oscNeu / oscillators.length) * 100;
  const pctSell = (oscSell / oscillators.length) * 100;

  // Oscillator Slider Visualizer
  const renderOscillatorSlider = (label, valStr, action) => {
    let valNum = parseFloat(valStr);
    if (isNaN(valNum)) valNum = 50;

    if (label === 'Stochastic RSI') {
      const match = valStr.match(/%K:\s*([0-9.]+)/);
      const kVal = match ? parseFloat(match[1]) : 50;
      return (
        <Box sx={{ width: '100%', mt: 0.75, mb: 0.25, px: 1 }}>
          <Box sx={{ height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.06)', position: 'relative', width: '100%' }}>
            <Box sx={{ position: 'absolute', left: 0, width: '20%', height: '100%', bgcolor: 'rgba(57,255,20,0.15)', borderRadius: '2px 0 0 2px' }} />
            <Box sx={{ position: 'absolute', right: 0, width: '20%', height: '100%', bgcolor: 'rgba(255,85,85,0.15)', borderRadius: '0 2px 2px 0' }} />
            <Box sx={{
              position: 'absolute', top: '-3px', width: '10px', height: '10px',
              bgcolor: '#f8fafc', border: `1px solid ${kVal > 80 ? NEON_RED : kVal < 20 ? NEON_GREEN : AMBER}`, borderRadius: '50%',
              left: `calc(${kVal}% - 5px)`, boxShadow: `0 0 6px ${kVal > 80 ? NEON_RED : kVal < 20 ? NEON_GREEN : AMBER}`,
              transition: 'left 0.5s ease-out'
            }} />
          </Box>
        </Box>
      );
    }

    if (label === 'Chaikin Money Flow') {
      const cmfPct = Math.min(Math.max(((valNum + 0.4) / 0.8) * 100, 0), 100);
      return (
        <Box sx={{ width: '100%', mt: 0.75, mb: 0.25, px: 1 }}>
          <Box sx={{ height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.06)', position: 'relative', width: '100%' }}>
            <Box sx={{ position: 'absolute', left: 0, width: '40%', height: '100%', bgcolor: 'rgba(255,85,85,0.15)', borderRadius: '2px 0 0 2px' }} />
            <Box sx={{ position: 'absolute', right: 0, width: '40%', height: '100%', bgcolor: 'rgba(57,255,20,0.15)', borderRadius: '0 2px 2px 0' }} />
            <Box sx={{
              position: 'absolute', top: '-3px', width: '10px', height: '10px',
              bgcolor: '#f8fafc', border: `1px solid ${valNum > 0.05 ? NEON_GREEN : valNum < -0.05 ? NEON_RED : AMBER}`, borderRadius: '50%',
              left: `calc(${cmfPct}% - 5px)`, boxShadow: `0 0 6px ${valNum > 0.05 ? NEON_GREEN : valNum < -0.05 ? NEON_RED : AMBER}`,
              transition: 'left 0.5s ease-out'
            }} />
          </Box>
        </Box>
      );
    }

    if (label.startsWith('RSI')) {
      return (
        <Box sx={{ width: '100%', mt: 0.75, mb: 0.25, px: 1 }}>
          <Box sx={{ height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.06)', position: 'relative', width: '100%' }}>
            <Box sx={{ position: 'absolute', left: 0, width: '30%', height: '100%', bgcolor: 'rgba(57,255,20,0.15)', borderRadius: '2px 0 0 2px' }} />
            <Box sx={{ position: 'absolute', right: 0, width: '30%', height: '100%', bgcolor: 'rgba(255,85,85,0.15)', borderRadius: '0 2px 2px 0' }} />
            <Box sx={{
              position: 'absolute', top: '-3px', width: '10px', height: '10px',
              bgcolor: '#f8fafc', border: `2px solid ${valNum > 70 ? NEON_RED : valNum < 30 ? NEON_GREEN : AMBER}`, borderRadius: '50%',
              left: `calc(${valNum}% - 5px)`, boxShadow: `0 0 6px ${valNum > 70 ? NEON_RED : valNum < 30 ? NEON_GREEN : AMBER}`,
              transition: 'left 0.5s ease-out'
            }} />
          </Box>
        </Box>
      );
    }

    if (label.startsWith('Stoch')) {
      return (
        <Box sx={{ width: '100%', mt: 0.75, mb: 0.25, px: 1 }}>
          <Box sx={{ height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.06)', position: 'relative', width: '100%' }}>
            <Box sx={{ position: 'absolute', left: 0, width: '20%', height: '100%', bgcolor: 'rgba(57,255,20,0.15)', borderRadius: '2px 0 0 2px' }} />
            <Box sx={{ position: 'absolute', right: 0, width: '20%', height: '100%', bgcolor: 'rgba(255,85,85,0.15)', borderRadius: '0 2px 2px 0' }} />
            <Box sx={{
              position: 'absolute', top: '-3px', width: '10px', height: '10px',
              bgcolor: '#f8fafc', border: `1px solid ${valNum > 80 ? NEON_RED : valNum < 20 ? NEON_GREEN : AMBER}`, borderRadius: '50%',
              left: `calc(${valNum}% - 5px)`, boxShadow: `0 0 6px ${valNum > 80 ? NEON_RED : valNum < 20 ? NEON_GREEN : AMBER}`,
              transition: 'left 0.5s ease-out'
            }} />
          </Box>
        </Box>
      );
    }

    if (label.startsWith('MFI')) {
      return (
        <Box sx={{ width: '100%', mt: 0.75, mb: 0.25, px: 1 }}>
          <Box sx={{ height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.06)', position: 'relative', width: '100%' }}>
            <Box sx={{ position: 'absolute', left: 0, width: '20%', height: '100%', bgcolor: 'rgba(57,255,20,0.15)', borderRadius: '2px 0 0 2px' }} />
            <Box sx={{ position: 'absolute', right: 0, width: '20%', height: '100%', bgcolor: 'rgba(255,85,85,0.15)', borderRadius: '0 2px 2px 0' }} />
            <Box sx={{
              position: 'absolute', top: '-3px', width: '10px', height: '10px',
              bgcolor: '#f8fafc', border: `1px solid ${valNum > 80 ? NEON_RED : valNum < 20 ? NEON_GREEN : AMBER}`, borderRadius: '50%',
              left: `calc(${valNum}% - 5px)`, boxShadow: `0 0 6px ${valNum > 80 ? NEON_RED : valNum < 20 ? NEON_GREEN : AMBER}`,
              transition: 'left 0.5s ease-out'
            }} />
          </Box>
        </Box>
      );
    }

    if (label.startsWith('Williams')) {
      const adjustedWilliams = Math.min(Math.max(100 + valNum, 0), 100);
      return (
        <Box sx={{ width: '100%', mt: 0.75, mb: 0.25, px: 1 }}>
          <Box sx={{ height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.06)', position: 'relative', width: '100%' }}>
            <Box sx={{ position: 'absolute', left: 0, width: '20%', height: '100%', bgcolor: 'rgba(57,255,20,0.15)', borderRadius: '2px 0 0 2px' }} />
            <Box sx={{ position: 'absolute', right: 0, width: '20%', height: '100%', bgcolor: 'rgba(255,85,85,0.15)', borderRadius: '0 2px 2px 0' }} />
            <Box sx={{
              position: 'absolute', top: '-3px', width: '10px', height: '10px',
              bgcolor: '#f8fafc', border: `1px solid ${valNum > -20 ? NEON_RED : valNum < -80 ? NEON_GREEN : AMBER}`, borderRadius: '50%',
              left: `calc(${adjustedWilliams}% - 5px)`, boxShadow: `0 0 6px ${valNum > -20 ? NEON_RED : valNum < -80 ? NEON_GREEN : AMBER}`,
              transition: 'left 0.5s ease-out'
            }} />
          </Box>
        </Box>
      );
    }

    if (label.startsWith('CCI')) {
      const cciPct = Math.min(Math.max(((valNum + 200) / 400) * 100, 0), 100);
      return (
        <Box sx={{ width: '100%', mt: 0.75, mb: 0.25, px: 1 }}>
          <Box sx={{ height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.06)', position: 'relative', width: '100%' }}>
            <Box sx={{ position: 'absolute', left: 0, width: '25%', height: '100%', bgcolor: 'rgba(57,255,20,0.15)', borderRadius: '2px 0 0 2px' }} />
            <Box sx={{ position: 'absolute', right: 0, width: '25%', height: '100%', bgcolor: 'rgba(255,85,85,0.15)', borderRadius: '0 2px 2px 0' }} />
            <Box sx={{
              position: 'absolute', top: '-3px', width: '10px', height: '10px',
              bgcolor: '#f8fafc', border: `1px solid ${valNum > 100 ? NEON_RED : valNum < -100 ? NEON_GREEN : AMBER}`, borderRadius: '50%',
              left: `calc(${cciPct}% - 5px)`, boxShadow: `0 0 6px ${valNum > 100 ? NEON_RED : valNum < -100 ? NEON_GREEN : AMBER}`,
              transition: 'left 0.5s ease-out'
            }} />
          </Box>
        </Box>
      );
    }

    if (label.startsWith('ADX')) {
      const blocksCount = Math.min(Math.max(Math.round(valNum / 10), 1), 10);
      const isStrong = valNum > 25;
      return (
        <Box sx={{ width: '100%', mt: 0.75, mb: 0.25, px: 1, display: 'flex', gap: '3px', height: '4px' }}>
          {[...Array(10)].map((_, idx) => (
            <Box key={idx} sx={{
              flex: 1, height: '100%', borderRadius: '1px',
              bgcolor: idx < blocksCount ? (isStrong ? NEON_CYAN : 'rgba(255,255,255,0.35)') : 'rgba(255,255,255,0.06)',
              boxShadow: (idx < blocksCount && isStrong) ? `0 0 4px ${NEON_CYAN}` : 'none',
              transition: 'all 0.4s ease'
            }} />
          ))}
        </Box>
      );
    }

    if (label.startsWith('MACD')) {
      const isBull = action === 'Bullish';
      return (
        <Box sx={{ width: '100%', mt: 0.75, mb: 0.25, px: 1, display: 'flex', alignItems: 'center', height: '6px', position: 'relative' }}>
          <Box sx={{ position: 'absolute', left: 8, right: 8, height: '1px', bgcolor: 'rgba(255,255,255,0.06)' }} />
          <Box sx={{ position: 'absolute', left: '50%', width: '1px', height: '6px', bgcolor: 'rgba(255,255,255,0.2)', transform: 'translateX(-50%)' }} />
          <Box sx={{
            position: 'absolute',
            left: isBull ? '50%' : 'auto',
            right: isBull ? 'auto' : '50%',
            width: '28px',
            height: '4px',
            bgcolor: isBull ? 'rgba(57, 255, 20, 0.3)' : 'rgba(255, 85, 85, 0.3)',
            border: `1px solid ${isBull ? NEON_GREEN : NEON_RED}`,
            boxShadow: `0 0 6px ${isBull ? 'rgba(57, 255, 20, 0.2)' : 'rgba(255, 85, 85, 0.2)'}`,
            borderRadius: '1px',
            transition: 'all 0.5s ease-out'
          }} />
        </Box>
      );
    }

    return null;
  };

  return (
    <Box className={flashUpdate ? 'cell-flash-active' : ''} sx={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%' }}>
      {/* ── INTERACTIVE SIGNAL SEARCH & FILTER BAR ── */}
      <Box sx={{
        display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center', justifyContent: 'space-between',
        p: 2, borderRadius: '12px', bgcolor: 'rgba(10, 14, 23, 0.4)', border: '1px solid rgba(255, 255, 255, 0.04)',
      }}>
        {/* Signal Category Filters */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {[
            { id: 'ALL', label: 'ALL INDICATORS', count: allDirectional.length, color: NEON_CYAN },
            { id: 'BULLISH', label: 'BULLISH', count: countBullish, color: NEON_GREEN },
            { id: 'BEARISH', label: 'BEARISH', count: countBearish, color: NEON_RED },
            { id: 'NEUTRAL', label: 'NEUTRAL', count: countNeutral, color: AMBER }
          ].map(pill => (
            <Button
              key={pill.id}
              onClick={() => setSignalFilter(pill.id)}
              variant="text"
              sx={{
                py: 0.5, px: 1.5, borderRadius: '8px',
                fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.73rem', fontWeight: 700,
                color: signalFilter === pill.id ? '#000' : 'rgba(255,255,255,0.6)',
                bgcolor: signalFilter === pill.id ? pill.color : 'rgba(255,255,255,0.02)',
                border: `1px solid ${signalFilter === pill.id ? pill.color : 'rgba(255,255,255,0.05)'}`,
                boxShadow: signalFilter === pill.id ? `0 0 10px ${pill.color}33` : 'none',
                transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                '&:hover': {
                  bgcolor: signalFilter === pill.id ? pill.color : 'rgba(255,255,255,0.06)',
                  color: signalFilter === pill.id ? '#000' : '#f8fafc',
                }
              }}
            >
              {pill.label} ({pill.count})
            </Button>
          ))}
        </Box>

        {/* Text Filter Input */}
        <TextField
          placeholder="Filter by name (e.g. RSI, EMA)..."
          variant="outlined"
          size="small"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          sx={{
            minWidth: '240px',
            '& .MuiOutlinedInput-root': {
              height: '32px', bgcolor: 'rgba(0,0,0,0.2)', borderRadius: '7px',
              color: '#f8fafc', fontSize: '0.76rem',
              fontFamily: "'Space Grotesk', sans-serif",
              '& fieldset': { border: '1px solid rgba(255,255,255,0.08)' },
              '&:hover fieldset': { border: '1px solid rgba(255,255,255,0.15)' },
              '&.Mui-focused fieldset': { border: `1px solid ${NEON_CYAN}`, boxShadow: '0 0 8px rgba(0,229,255,0.15)' },
            },
            '& .MuiInputBase-input': { padding: '4px 8px !important', color: '#f8fafc' },
          }}
        />
      </Box>

      {/* ── TOP SUMMARY DASHBOARD ── */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2.5, width: '100%' }}>
        {/* Moving Averages Summary: Speedometer SVG Gauge */}
        <Card className="shimmer-card" sx={glassCard}>
          <CardContent sx={{ p: 2.5, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
            <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.7px', mb: 1 }}>
              Moving Averages Summary
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 1.5, height: '70px', position: 'relative' }}>
              <svg viewBox="0 0 100 60" style={{ width: '120px', overflow: 'visible' }}>
                <defs>
                  <linearGradient id="maGaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={NEON_RED} />
                    <stop offset="50%" stopColor={AMBER} />
                    <stop offset="100%" stopColor={NEON_GREEN} />
                  </linearGradient>
                </defs>
                <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="9" strokeLinecap="round" />
                <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="url(#maGaugeGrad)" strokeWidth="9" strokeLinecap="round" />
                <line x1="50" y1="50" x2="50" y2="16" stroke="#f8fafc" strokeWidth="2.5" strokeLinecap="round"
                  transform={`rotate(${maAngle} 50 50)`} style={{ transition: 'transform 0.8s cubic-bezier(.4,0,.2,1)' }} />
                <circle cx="50" cy="50" r="4.5" fill="#f8fafc" />
              </svg>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mt: 1 }}>
              <Typography sx={{ fontSize: '1.25rem', fontWeight: 800, color: maColor, fontFamily: "'Space Grotesk',sans-serif", letterSpacing: '0.5px' }}>
                {maRecommendation}
              </Typography>
              <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#f8fafc', opacity: 0.8 }}>
                {maBuy} BUY / {maSell} SELL
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Oscillators Summary: 3-Segment Glowing Grid */}
        <Card className="shimmer-card" sx={glassCard}>
          <CardContent sx={{ p: 2.5, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
            <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.7px', mb: 1 }}>
              Oscillators Summary
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, my: 1.5 }}>
              <Box sx={{ flex: 1, p: 0.75, borderRadius: '6px', bgcolor: 'rgba(57,255,20,0.04)', border: '1px solid rgba(57,255,20,0.15)', textAlign: 'center', boxShadow: oscRecommendation === 'BUY' ? '0 0 10px rgba(57,255,20,0.15)' : 'none' }}>
                <Typography sx={{ fontSize: '0.55rem', color: NEON_GREEN, fontWeight: 700 }}>BUY</Typography>
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: NEON_GREEN }}>{oscBuy}</Typography>
              </Box>
              <Box sx={{ flex: 1, p: 0.75, borderRadius: '6px', bgcolor: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.15)', textAlign: 'center', boxShadow: oscRecommendation === 'NEUTRAL' ? '0 0 10px rgba(245,158,11,0.15)' : 'none' }}>
                <Typography sx={{ fontSize: '0.55rem', color: AMBER, fontWeight: 700 }}>NEUT</Typography>
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: AMBER }}>{oscNeu}</Typography>
              </Box>
              <Box sx={{ flex: 1, p: 0.75, borderRadius: '6px', bgcolor: 'rgba(255,85,85,0.04)', border: '1px solid rgba(255,85,85,0.15)', textAlign: 'center', boxShadow: oscRecommendation === 'SELL' ? '0 0 10px rgba(255,85,85,0.15)' : 'none' }}>
                <Typography sx={{ fontSize: '0.55rem', color: NEON_RED, fontWeight: 700 }}>SELL</Typography>
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: NEON_RED }}>{oscSell}</Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography sx={{ fontSize: '1.25rem', fontWeight: 800, color: oscColor, fontFamily: "'Space Grotesk',sans-serif", letterSpacing: '0.5px' }}>
                {oscRecommendation}
              </Typography>
              <Box sx={{ height: '6px', width: '80px', bgcolor: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden', display: 'flex' }}>
                {oscBuy > 0 && <Box sx={{ width: `${pctBuy}%`, height: '100%', bgcolor: NEON_GREEN }} />}
                {oscNeu > 0 && <Box sx={{ width: `${pctNeu}%`, height: '100%', bgcolor: AMBER }} />}
                {oscSell > 0 && <Box sx={{ width: `${pctSell}%`, height: '100%', bgcolor: NEON_RED }} />}
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Overall Conclusion Summary: Quantum Bias Shield with Orbit Tracker */}
        <Card className="shimmer-card" sx={{ ...glassCard, border: `1px solid ${overallColor}44`, boxShadow: `0 0 16px ${overallColor}11`, height: '100%' }}>
          <CardContent sx={{ p: 2.5, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', gap: 1.5 }}>
            <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.7px' }}>
              Overall Market Bias
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ position: 'relative', width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Box className="orbit-rotate-cw" sx={{ position: 'absolute', inset: 0, border: `1.5px dashed ${overallColor}55`, borderRadius: '50%' }} />
                <Box className="orbit-rotate-ccw" sx={{ position: 'absolute', inset: 5, border: `1px dashed ${NEON_CYAN}44`, borderRadius: '50%' }} />
                <Box sx={{
                  position: 'absolute', inset: 10, borderRadius: '50%',
                  bgcolor: 'rgba(5, 8, 16, 0.95)', border: `2px solid ${overallColor}`,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 0 12px ${overallColor}44`, zIndex: 2
                }}>
                  <Typography sx={{ fontSize: '0.8rem', fontWeight: 900, color: overallColor, fontFamily: "'Space Grotesk',sans-serif", lineHeight: 1.1 }}>
                    {((totalBuy / (totalBuy + totalSell || 1)) * 100).toFixed(0)}%
                  </Typography>
                  <Typography sx={{ fontSize: '0.45rem', color: 'rgba(255,255,255,0.4)', fontWeight: 800, textTransform: 'uppercase', mt: -0.2 }}>Bull</Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                <Box sx={{
                  display: 'inline-flex', px: 1.25, py: 0.25, borderRadius: '6px',
                  bgcolor: `${overallColor}15`, border: `1px solid ${overallColor}55`,
                  boxShadow: `0 0 8px ${overallColor}22`
                }}>
                  <Typography sx={{ fontSize: '1.05rem', fontWeight: 900, color: overallColor, fontFamily: "'Space Grotesk',sans-serif", letterSpacing: '1px', textShadow: `0 0 4px ${overallColor}22` }}>
                    {overallRec}
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', mt: 0.5 }}>
                  Net Score: <span style={{ color: overallColor, fontWeight: 700 }}>{totalBuy - totalSell > 0 ? `+${totalBuy - totalSell}` : totalBuy - totalSell}</span> ({totalBuy} BUY vs {totalSell} SELL)
                </Typography>
              </Box>
            </Box>
            <Typography sx={{ fontSize: '0.72rem', color: '#f8fafc', opacity: 0.75, lineHeight: 1.4, minHeight: '36px' }}>
              {getBiasExplanation(overallRec)}
            </Typography>
            <Box sx={{ height: '4px', bgcolor: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden', mt: 'auto' }}>
              <Box sx={{ width: `${(totalBuy / (totalBuy + totalSell || 1)) * 100}%`, height: '100%', bgcolor: overallColor, borderRadius: '2px', transition: 'width 0.6s ease' }} />
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* ── DETAILS GRID ── */}
      <Box sx={{
        display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', lg: 'repeat(3, 1fr)' }, gap: 2.5, width: '100%'
      }}>
        {/* COLUMN 1 */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Card className="shimmer-card" sx={glassCard}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.7px', mb: 2 }}>
                Moving Averages — SMA vs EMA ({timeframe})
              </Typography>
              <TableContainer sx={{ maxHeight: 420, '&::-webkit-scrollbar': { width: '4px' }, '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(57,255,20,0.2)', borderRadius: '4px' } }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      {['Period','Value','Type','Action'].map(h => (
                        <TableCell key={h} sx={{ bgcolor: 'rgba(5,8,16,0.95)', color: 'rgba(255,255,255,0.4)', fontWeight: 700, fontSize: '0.68rem', borderBottom: '1px solid rgba(255,255,255,0.06)', textTransform: 'uppercase', letterSpacing: '0.5px', py: 1 }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredMas.map((m, i) => {
                      const isDrawerOpen = openDrawer === m.p;
                      const details = INDICATOR_DETAILS[m.p];
                      const detailContextStr = details ? details.context(m.v, coin.price) : '';

                      return (
                        <React.Fragment key={i}>
                          <TableRow
                            onClick={() => toggleDrawer(m.p)}
                            sx={{
                              cursor: 'pointer',
                              bgcolor: isDrawerOpen ? 'rgba(255,255,255,0.02)' : 'transparent',
                              transition: 'all 0.2s ease',
                              '&:hover': { bgcolor: 'rgba(255,255,255,0.035)' }
                            }}
                          >
                            <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.04)', color: '#f8fafc', fontWeight: 700, fontSize: '0.78rem', fontFamily: "'Space Grotesk',sans-serif", py: 0.75 }}>{m.p}</TableCell>
                            <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.04)', color: '#f8fafc', fontFamily: "'Space Grotesk',monospace,sans-serif", fontSize: '0.78rem', py: 0.75 }}>{fmtPrice(m.v)}</TableCell>
                            <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', fontSize: '0.73rem', py: 0.75 }}>{m.t}</TableCell>
                            <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.04)', py: 0.75 }}>
                              <Box sx={{ display: 'inline-flex', px: 1, py: 0.2, borderRadius: '4px', bgcolor: `${actionColor(m.act)}15`, border: `1px solid ${actionColor(m.act)}44` }}>
                                <Typography sx={{ fontWeight: 700, fontSize: '0.68rem', color: actionColor(m.act), textTransform: 'uppercase', letterSpacing: '0.4px' }}>{m.act}</Typography>
                              </Box>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell style={{ paddingBottom: 0, paddingTop: 0, borderBottom: 'none' }} colSpan={4}>
                              <Collapse in={isDrawerOpen} timeout="auto" unmountOnExit>
                                <Box className={`indicator-drawer open ${getSignalCategory(m.act) === 'BULLISH' ? '' : 'open-bearish'}`} sx={{ mb: 1, p: 1.5 }} onClick={(e) => e.stopPropagation()}>
                                  <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', mb: 0.5, fontWeight: 700 }}>MA PROFILE & RANGE</Typography>
                                  <Typography sx={{ fontSize: '0.73rem', color: '#f8fafc', mb: 1, lineHeight: 1.4 }}>{details?.desc}</Typography>
                                  <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', mb: 0.5, fontWeight: 700 }}>TRADING STRATEGY</Typography>
                                  <Typography sx={{ fontSize: '0.73rem', color: '#f8fafc', mb: 1, lineHeight: 1.4 }}>{details?.strategy}</Typography>
                                  <Typography sx={{ fontSize: '0.73rem', color: m.act === 'Buy' ? NEON_GREEN : NEON_RED, fontWeight: 600, lineHeight: 1.4 }}>
                                    {detailContextStr}
                                  </Typography>
                                </Box>
                              </Collapse>
                            </TableCell>
                          </TableRow>
                        </React.Fragment>
                      );
                    })}
                    {filteredMas.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} sx={{ py: 3, textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', fontFamily: "'Space Grotesk',sans-serif" }}>
                          No matching indicators found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>

        {/* COLUMN 2 */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Card className="shimmer-card" sx={glassCard}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.7px', mb: 2 }}>
                Oscillators & Momentum Metrics
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                {filteredOscillators.map((o, i) => {
                  const isDrawerOpen = openDrawer === o.l;
                  const details = INDICATOR_DETAILS[o.l];
                  const detailContextStr = details ? details.context(o.v) : '';

                  return (
                    <Box key={i} sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Box
                        className="indicator-interactive-row"
                        onClick={() => toggleDrawer(o.l)}
                        sx={{
                          ...statRow,
                          flexDirection: 'column',
                          alignItems: 'stretch',
                          p: 1.25,
                          border: isDrawerOpen ? `1px solid ${actionColor(o.a)}25` : '1px solid rgba(255,255,255,0.03)',
                          bgcolor: isDrawerOpen ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.015)'
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', mb: 0.5 }}>
                          <Box>
                            <Typography sx={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.78rem', fontFamily: "'Space Grotesk',sans-serif" }}>{o.l}</Typography>
                            <Typography sx={{ color: 'rgba(255,255,255,0.38)', fontSize: '0.68rem', fontFamily: "'Space Grotesk',monospace,sans-serif" }}>Value: {o.v}</Typography>
                          </Box>
                          <Box sx={{ px: 1.25, py: 0.25, borderRadius: '5px', bgcolor: `${actionColor(o.a)}15`, border: `1px solid ${actionColor(o.a)}44` }}>
                            <Typography sx={{ fontSize: '0.68rem', color: actionColor(o.a), fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{o.a}</Typography>
                          </Box>
                        </Box>
                        {renderOscillatorSlider(o.l, o.v, o.a)}
                      </Box>
                      <Collapse in={isDrawerOpen} timeout="auto" unmountOnExit>
                        <Box className={`indicator-drawer open ${getSignalCategory(o.a) === 'BULLISH' ? '' : getSignalCategory(o.a) === 'BEARISH' ? 'open-bearish' : 'open-neutral'}`} sx={{ p: 1.5 }} onClick={(e) => e.stopPropagation()}>
                          <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', mb: 0.5, fontWeight: 700 }}>OSCILLATOR PROFILE</Typography>
                          <Typography sx={{ fontSize: '0.73rem', color: '#f8fafc', mb: 1, lineHeight: 1.4 }}>{details?.desc}</Typography>
                          <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', mb: 0.5, fontWeight: 700 }}>TRADING STRATEGY</Typography>
                          <Typography sx={{ fontSize: '0.73rem', color: '#f8fafc', mb: 1, lineHeight: 1.4 }}>{details?.strategy}</Typography>
                          <Typography sx={{ fontSize: '0.73rem', color: actionColor(o.a), fontWeight: 600, lineHeight: 1.4 }}>
                            {detailContextStr}
                          </Typography>
                        </Box>
                      </Collapse>
                    </Box>
                  );
                })}
                {filteredOscillators.length === 0 && (
                  <Typography sx={{ py: 3, textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', fontFamily: "'Space Grotesk',sans-serif" }}>
                    No matching indicators found
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* COLUMN 3 */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Card className="shimmer-card" sx={glassCard}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.7px', mb: 2 }}>
                Trend & Ichimoku Cloud Indicators
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                {filteredTrend.map((t, i) => {
                  const isDrawerOpen = openDrawer === t.l;
                  const details = INDICATOR_DETAILS[t.l];
                  const detailContextStr = details ? (typeof details.context === 'function' ? details.context(t.v, coin.price) : details.context) : '';

                  return (
                    <Box key={i} sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Box
                        className="indicator-interactive-row"
                        onClick={() => toggleDrawer(t.l)}
                        sx={{
                          ...statRow,
                          border: isDrawerOpen ? `1px solid ${actionColor(t.a)}25` : '1px solid rgba(255,255,255,0.03)',
                          bgcolor: isDrawerOpen ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.015)'
                        }}
                      >
                        <Box>
                          <Typography sx={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.78rem', fontFamily: "'Space Grotesk',sans-serif" }}>{t.l}</Typography>
                          <Typography sx={{ color: 'rgba(255,255,255,0.38)', fontSize: '0.68rem', fontFamily: "'Space Grotesk',monospace,sans-serif" }}>Value: {t.v}</Typography>
                        </Box>
                        <Box sx={{ px: 1.25, py: 0.25, borderRadius: '5px', bgcolor: `${actionColor(t.a)}15`, border: `1px solid ${actionColor(t.a)}44` }}>
                          <Typography sx={{ fontSize: '0.68rem', color: actionColor(t.a), fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{t.a}</Typography>
                        </Box>
                      </Box>
                      <Collapse in={isDrawerOpen} timeout="auto" unmountOnExit>
                        <Box className={`indicator-drawer open ${getSignalCategory(t.a) === 'BULLISH' ? '' : getSignalCategory(t.a) === 'BEARISH' ? 'open-bearish' : 'open-neutral'}`} sx={{ p: 1.5 }} onClick={(e) => e.stopPropagation()}>
                          <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', mb: 0.5, fontWeight: 700 }}>TREND ANALYSIS</Typography>
                          <Typography sx={{ fontSize: '0.73rem', color: '#f8fafc', mb: 1, lineHeight: 1.4 }}>{details?.desc}</Typography>
                          <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', mb: 0.5, fontWeight: 700 }}>TRADING STRATEGY</Typography>
                          <Typography sx={{ fontSize: '0.73rem', color: '#f8fafc', mb: 1, lineHeight: 1.4 }}>{details?.strategy}</Typography>
                          <Typography sx={{ fontSize: '0.73rem', color: actionColor(t.a), fontWeight: 600, lineHeight: 1.4 }}>
                            {detailContextStr}
                          </Typography>
                        </Box>
                      </Collapse>
                    </Box>
                  );
                })}
                {filteredTrend.length === 0 && (
                  <Typography sx={{ py: 3, textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', fontFamily: "'Space Grotesk',sans-serif" }}>
                    No matching indicators found
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>

          <Card
            className={`shimmer-card ${coin.volatility > volThreshold ? 'vol-warning-active' : ''}`}
            sx={glassCard}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.7px' }}>
                  Volatility Indicators
                </Typography>
                {coin.volatility > volThreshold && (
                  <Box sx={{ px: 1, py: 0.25, borderRadius: '4px', bgcolor: 'rgba(255,85,85,0.2)', border: '1px solid #FF5555' }}>
                    <Typography sx={{ fontSize: '0.55rem', color: NEON_RED, fontWeight: 800, letterSpacing: '0.5px' }}>ALERT: HIGH VOL</Typography>
                  </Box>
                )}
              </Box>
              <Box sx={{ mb: 2, p: 1.25, borderRadius: '8px', bgcolor: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.04)' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography sx={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>VOLATILITY ALERT LIMIT</Typography>
                  <Typography sx={{ fontSize: '0.72rem', color: NEON_CYAN, fontWeight: 700, fontFamily: "'Space Grotesk',monospace,sans-serif" }}>{volThreshold.toFixed(1)}%</Typography>
                </Box>
                <input
                  type="range"
                  min="1.0"
                  max="10.0"
                  step="0.5"
                  value={volThreshold}
                  onChange={(e) => setVolThreshold(parseFloat(e.target.value))}
                  style={{
                    width: '100%', accentColor: NEON_CYAN, cursor: 'pointer', background: 'rgba(255,255,255,0.08)',
                    height: '4px', borderRadius: '2px', outline: 'none'
                  }}
                />
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                {filteredVolatility.map((v, i) => {
                  const isDrawerOpen = openDrawer === v.l;
                  const details = INDICATOR_DETAILS[v.l];
                  const detailContextStr = details ? details.context(v.v) : '';

                  return (
                    <Box key={i} sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Box
                        className="indicator-interactive-row"
                        onClick={() => toggleDrawer(v.l)}
                        sx={{
                          ...statRow,
                          border: isDrawerOpen ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.03)',
                          bgcolor: isDrawerOpen ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.015)'
                        }}
                      >
                        <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{v.l}</Typography>
                        <Typography sx={{ fontWeight: 700, color: v.c, fontFamily: "'Space Grotesk',monospace,sans-serif", fontSize: '0.78rem' }}>{v.v}</Typography>
                      </Box>
                      <Collapse in={isDrawerOpen} timeout="auto" unmountOnExit>
                        <Box className="indicator-drawer open open-neutral" sx={{ p: 1.5 }} onClick={(e) => e.stopPropagation()}>
                          <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', mb: 0.5, fontWeight: 700 }}>VOLATILITY PROFILE</Typography>
                          <Typography sx={{ fontSize: '0.73rem', color: '#f8fafc', mb: 1, lineHeight: 1.4 }}>{details?.desc}</Typography>
                          <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', mb: 0.5, fontWeight: 700 }}>TRADING STRATEGY</Typography>
                          <Typography sx={{ fontSize: '0.73rem', color: '#f8fafc', mb: 1, lineHeight: 1.4 }}>{details?.strategy}</Typography>
                          <Typography sx={{ fontSize: '0.73rem', color: v.c, fontWeight: 600, lineHeight: 1.4 }}>
                            {detailContextStr}
                          </Typography>
                        </Box>
                      </Collapse>
                    </Box>
                  );
                })}
                {filteredVolatility.length === 0 && (
                  <Typography sx={{ py: 3, textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', fontFamily: "'Space Grotesk',sans-serif" }}>
                    No matching volatility metrics found
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default IndicatorsTab;
