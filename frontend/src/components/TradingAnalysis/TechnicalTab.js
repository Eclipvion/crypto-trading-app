import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Box,
  Typography,
  Divider,
  CircularProgress,
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

const TechnicalTab = ({ coin, coinName, timeframe, chartMode, calcEntryPrice, calcExitPrice, calcPositionType }) => {
  const [klineData, setKlineData] = useState([]);
  const [loadingKlines, setLoadingKlines] = useState(true);

  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const legendRef = useRef(null);
  const klineDataRef = useRef([]);
  const coinNameRef = useRef(coinName);
  const isFirstLoadRef = useRef(true);
  const entryLineRef = useRef(null);
  const exitLineRef = useRef(null);

  // Keep references updated for hover event listeners to avoid stale closures
  useEffect(() => {
    klineDataRef.current = klineData;
  }, [klineData]);

  useEffect(() => {
    coinNameRef.current = coinName;
  }, [coinName]);

  // Reset first load fitContent flag on coin or timeframe changes
  useEffect(() => {
    isFirstLoadRef.current = true;
  }, [coin.symbol, timeframe]);

  // Fetch real candlestick history from Binance API
  useEffect(() => {
    let active = true;
    if (!coin || !coin.symbol) return;

    const loadCandles = async (isInitial = false) => {
      if (isInitial) setLoadingKlines(true);
      try {
        const url = `https://api.binance.com/api/v3/klines?symbol=${coin.symbol}&interval=${timeframe}&limit=120`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch klines');
        const data = await res.json();

        if (!active) return;

        const formatted = data.map(item => ({
          time: Math.floor(item[0] / 1000), // in seconds
          open: parseFloat(item[1]),
          high: parseFloat(item[2]),
          low: parseFloat(item[3]),
          close: parseFloat(item[4]),
          volume: parseFloat(item[5]),
        }));

        setKlineData(formatted);
        setLoadingKlines(false);
      } catch (err) {
        console.error('Error fetching real kline data:', err);
        if (active) {
          setLoadingKlines(false);
        }
      }
    };

    loadCandles(true); // initial load
    const interval = setInterval(() => loadCandles(false), 15000); // live update every 15 seconds

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [coin, timeframe]);

  // Compute EMA 9 on real close prices
  const emaData = useMemo(() => {
    if (klineData.length === 0) return [];
    const ema = [];
    const period = 9;
    const k = 2 / (period + 1);

    let sum = 0;
    for (let i = 0; i < Math.min(period, klineData.length); i++) {
      sum += klineData[i].close;
    }
    let prevEma = sum / Math.min(period, klineData.length);

    for (let i = 0; i < Math.min(period - 1, klineData.length); i++) {
      let partialSum = 0;
      for (let j = 0; j <= i; j++) {
        partialSum += klineData[j].close;
      }
      ema.push({ time: klineData[i].time, value: partialSum / (i + 1) });
    }

    if (klineData.length >= period) {
      ema.push({ time: klineData[period - 1].time, value: prevEma });
      for (let i = period; i < klineData.length; i++) {
        const curEma = klineData[i].close * k + prevEma * (1 - k);
        ema.push({ time: klineData[i].time, value: curEma });
        prevEma = curEma;
      }
    }
    return ema;
  }, [klineData]);

  // Compute Volume series data with conditional colors
  const volumeData = useMemo(() => {
    return klineData.map(item => ({
      time: item.time,
      value: item.volume,
      color: item.close >= item.open ? 'rgba(57, 255, 20, 0.18)' : 'rgba(255, 85, 85, 0.18)',
    }));
  }, [klineData]);

  // Initialize Lightweight Chart container and event listeners once
  useEffect(() => {
    if (chartMode !== 'tradingview') return;
    if (!chartContainerRef.current) return;
    if (!window.LightweightCharts) {
      console.warn('LightweightCharts is not loaded from CDN yet.');
      return;
    }

    const { createChart, CrosshairMode } = window.LightweightCharts;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth || 500,
      height: 380, // Increased height to make it prominent and highly readable
      layout: {
        background: { type: 'solid', color: 'transparent' },
        textColor: 'rgba(248, 250, 252, 0.75)', // Slate-50 glowing color
        fontFamily: "'Space Grotesk', sans-serif", // Matches terminal typography
      },
      grid: {
        vertLines: { color: 'rgba(57, 255, 20, 0.04)' }, // Neon green gridlines matching theme
        horzLines: { color: 'rgba(57, 255, 20, 0.04)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: 'rgba(0, 229, 255, 0.35)', // Cyberpunk Neon Cyan dashed vertical line
          width: 1.2,
          style: 3, // dashed
          labelBackgroundColor: 'rgba(10, 14, 23, 0.95)',
        },
        horzLine: {
          color: 'rgba(0, 229, 255, 0.35)', // Cyberpunk Neon Cyan dashed horizontal line
          width: 1.2,
          style: 3, // dashed
          labelBackgroundColor: 'rgba(10, 14, 23, 0.95)',
        },
      },
      rightPriceScale: {
        borderColor: 'rgba(57, 255, 20, 0.15)', // Neon green borders matching theme
        textColor: 'rgba(248, 250, 252, 0.7)',
        axisLineVisible: true,
      },
      timeScale: {
        borderColor: 'rgba(57, 255, 20, 0.15)', // Neon green borders matching theme
        textColor: 'rgba(248, 250, 252, 0.7)',
        timeVisible: true,
        secondsVisible: false,
        axisLineVisible: true,
      },
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: NEON_GREEN,
      downColor: NEON_RED,
      borderUpColor: NEON_GREEN,
      borderDownColor: NEON_RED,
      wickUpColor: NEON_GREEN,
      wickDownColor: NEON_RED,
    });

    const emaSeries = chart.addLineSeries({
      color: NEON_CYAN,
      lineWidth: 2,
      priceLineVisible: false,
    });

    const volumeSeries = chart.addHistogramSeries({
      color: 'rgba(57, 255, 20, 0.15)',
      priceFormat: { type: 'volume' },
      priceScaleId: '', // overlay mode
    });

    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.75, // volume in bottom 25% of chart
        bottom: 0,
      },
    });

    chartRef.current = {
      chart,
      candlestickSeries,
      emaSeries,
      volumeSeries,
    };

    // Hover event update legend
    const legend = legendRef.current;
    const updateLegend = (param) => {
      if (!legend) return;
      let ohlcv = null;

      if (param && param.time) {
        const candle = param.seriesData.get(candlestickSeries);
        const volume = param.seriesData.get(volumeSeries);
        if (candle) {
          ohlcv = {
            open: candle.open,
            high: candle.high,
            low: candle.low,
            close: candle.close,
            volume: volume ? volume.value : null,
          };
        }
      }

      if (!ohlcv && klineDataRef.current.length > 0) {
        const lastCandle = klineDataRef.current[klineDataRef.current.length - 1];
        ohlcv = {
          open: lastCandle.open,
          high: lastCandle.high,
          low: lastCandle.low,
          close: lastCandle.close,
          volume: lastCandle.volume,
        };
      }

      if (ohlcv) {
        const { open, high, low, close, volume } = ohlcv;
        const color = close >= open ? NEON_GREEN : NEON_RED;
        const changePct = ((close - open) / open) * 100;
        legend.innerHTML = `
          <div style="display: flex; flex-wrap: wrap; gap: 10px; font-family: 'Space Grotesk', sans-serif; font-size: 11px; align-items: center; color: rgba(255, 255, 255, 0.5);">
            <span style="font-weight: 700; color: #fff; margin-right: 2px;">${coinNameRef.current}/USDT</span>
            <span>O: <span style="color: ${color}; font-weight: 600;">${fmtPrice(open)}</span></span>
            <span>H: <span style="color: ${color}; font-weight: 600;">${fmtPrice(high)}</span></span>
            <span>L: <span style="color: ${color}; font-weight: 600;">${fmtPrice(low)}</span></span>
            <span>C: <span style="color: ${color}; font-weight: 600;">${fmtPrice(close)}</span></span>
            <span style="color: ${color}; font-weight: 600;">${changePct >= 0 ? '+' : ''}${changePct.toFixed(2)}%</span>
            ${volume ? `<span>Vol: <span style="color: #fff; font-weight: 600;">${volume > 1000 ? (volume / 1000).toFixed(2) + 'K' : volume.toFixed(2)}</span></span>` : ''}
          </div>
        `;
      } else {
        legend.innerHTML = '';
      }
    };

    chart.subscribeCrosshairMove(updateLegend);

    // Resize handling
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    let resizeObserver;
    if (window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        handleResize();
      });
      resizeObserver.observe(chartContainerRef.current);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeObserver) resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, [chartMode]);

  // Update chart series data when live history ticks
  useEffect(() => {
    if (!chartRef.current || klineData.length === 0 || chartMode !== 'tradingview') return;

    const { candlestickSeries, emaSeries, volumeSeries, chart } = chartRef.current;

    candlestickSeries.setData(klineData.map(({ time, open, high, low, close }) => ({ time, open, high, low, close })));
    emaSeries.setData(emaData);
    volumeSeries.setData(volumeData);

    if (isFirstLoadRef.current) {
      chart.timeScale().fitContent();
      isFirstLoadRef.current = false;
    }

    // Trigger initial legend update using current tick
    if (legendRef.current) {
      const lastCandle = klineData[klineData.length - 1];
      const color = lastCandle.close >= lastCandle.open ? NEON_GREEN : NEON_RED;
      const changePct = ((lastCandle.close - lastCandle.open) / lastCandle.open) * 100;
      legendRef.current.innerHTML = `
        <div style="display: flex; flex-wrap: wrap; gap: 10px; font-family: 'Space Grotesk', sans-serif; font-size: 11px; align-items: center; color: rgba(255, 255, 255, 0.5);">
          <span style="font-weight: 700; color: #fff; margin-right: 2px;">${coinName}/USDT</span>
          <span>O: <span style="color: ${color}; font-weight: 600;">${fmtPrice(lastCandle.open)}</span></span>
          <span>H: <span style="color: ${color}; font-weight: 600;">${fmtPrice(lastCandle.high)}</span></span>
          <span>L: <span style="color: ${color}; font-weight: 600;">${fmtPrice(lastCandle.low)}</span></span>
          <span>C: <span style="color: ${color}; font-weight: 600;">${fmtPrice(lastCandle.close)}</span></span>
          <span style="color: ${color}; font-weight: 600;">${changePct >= 0 ? '+' : ''}${changePct.toFixed(2)}%</span>
          <span>Vol: <span style="color: #fff; font-weight: 600;">${lastCandle.volume > 1000 ? (lastCandle.volume / 1000).toFixed(2) + 'K' : lastCandle.volume.toFixed(2)}</span></span>
        </div>
      `;
    }
  }, [klineData, emaData, volumeData, coinName, chartMode]);

  // Update the latest candle's close price in real-time as the coin price ticks in the app
  useEffect(() => {
    if (!chartRef.current || klineData.length === 0 || !coin || !coin.price || chartMode !== 'tradingview') return;

    const { candlestickSeries } = chartRef.current;
    const lastCandle = klineData[klineData.length - 1];

    const updatedClose = coin.price;
    const updatedHigh = Math.max(lastCandle.high, updatedClose);
    const updatedLow = Math.min(lastCandle.low, updatedClose);

    const updatedCandle = {
      time: lastCandle.time,
      open: lastCandle.open,
      high: updatedHigh,
      low: updatedLow,
      close: updatedClose,
    };

    try {
      candlestickSeries.update(updatedCandle);

      // Dynamically update the legend to show the live ticking price
      if (legendRef.current) {
        const color = updatedClose >= lastCandle.open ? NEON_GREEN : NEON_RED;
        const changePct = ((updatedClose - lastCandle.open) / lastCandle.open) * 100;
        legendRef.current.innerHTML = `
          <div style="display: flex; flex-wrap: wrap; gap: 10px; font-family: 'Space Grotesk', sans-serif; font-size: 11px; align-items: center; color: rgba(255, 255, 255, 0.5);">
            <span style="font-weight: 700; color: #fff; margin-right: 2px;">${coinName}/USDT</span>
            <span>O: <span style="color: ${color}; font-weight: 600;">${fmtPrice(lastCandle.open)}</span></span>
            <span>H: <span style="color: ${color}; font-weight: 600;">${fmtPrice(updatedHigh)}</span></span>
            <span>L: <span style="color: ${color}; font-weight: 600;">${fmtPrice(updatedLow)}</span></span>
            <span>C: <span style="color: ${color}; font-weight: 600;">${fmtPrice(updatedClose)}</span></span>
            <span style="color: ${color}; font-weight: 600;">${changePct >= 0 ? '+' : ''}${changePct.toFixed(2)}%</span>
            <span>Vol: <span style="color: #fff; font-weight: 600;">${lastCandle.volume > 1000 ? (lastCandle.volume / 1000).toFixed(2) + 'K' : lastCandle.volume.toFixed(2)}</span></span>
          </div>
        `;
      }
    } catch (err) {
      console.warn('Error performing real-time tick update:', err);
    }
  }, [coin, klineData, chartMode, coinName]);

  // Update calculator position price lines on TradingView chart in real-time
  useEffect(() => {
    if (!chartRef.current || chartMode !== 'tradingview') return;

    const { candlestickSeries } = chartRef.current;

    // Clear old lines safely
    if (entryLineRef.current) {
      try {
        candlestickSeries.removePriceLine(entryLineRef.current);
      } catch(e) {}
      entryLineRef.current = null;
    }
    if (exitLineRef.current) {
      try {
        candlestickSeries.removePriceLine(exitLineRef.current);
      } catch(e) {}
      exitLineRef.current = null;
    }

    // Add entry price line
    if (calcEntryPrice && !isNaN(calcEntryPrice) && parseFloat(calcEntryPrice) > 0) {
      const price = parseFloat(calcEntryPrice);
      entryLineRef.current = candlestickSeries.createPriceLine({
        price,
        color: '#00e5ff', // Neon Cyan for entry
        lineWidth: 2,
        lineStyle: 2, // dashed
        axisLabelVisible: true,
        title: `ENTRY: $${price.toFixed(2)}`,
      });
    }

    // Add exit price line
    if (calcExitPrice && !isNaN(calcExitPrice) && parseFloat(calcExitPrice) > 0) {
      const price = parseFloat(calcExitPrice);
      const isProfit = calcPositionType === 'long' 
        ? price > parseFloat(calcEntryPrice || 0)
        : price < parseFloat(calcEntryPrice || 99999999);
      
      exitLineRef.current = candlestickSeries.createPriceLine({
        price,
        color: isProfit ? '#39ff14' : '#ff5555', // Neon green for profit target, Neon red for stop loss
        lineWidth: 2,
        lineStyle: 2, // dashed
        axisLabelVisible: true,
        title: `EXIT: $${price.toFixed(2)}`,
      });
    }
  }, [calcEntryPrice, calcExitPrice, calcPositionType, chartMode, klineData]);

  /* speedometer calc */
  const change = coin.priceChangePercent;
  const baseBuy  = change > 0 ? Math.min(Math.floor(8 + change * 2), 14) : Math.max(Math.floor(6 + change * 2), 2);
  const baseSell = change < 0 ? Math.min(Math.floor(8 + Math.abs(change) * 2), 14) : Math.max(Math.floor(6 - change * 2), 2);
  const buy = baseBuy; const sell = baseSell; const neutral = 18 - buy - sell;
  let label = 'NEUTRAL'; let sColor = AMBER;
  const net = buy - sell;
  if (net > 4) { label = 'STRONG BUY'; sColor = NEON_GREEN; }
  else if (net > 1) { label = 'BUY'; sColor = '#10b981'; }
  else if (net < -4) { label = 'STRONG SELL'; sColor = NEON_RED; }
  else if (net < -1) { label = 'SELL'; sColor = '#ef5350'; }
  const needleRot = ((buy - sell) / 18) * 90;

  /* fib */
  const fibRange = coin.highPrice - coin.lowPrice;
  const fibs = [
    { level: '0% (High)', price: coin.highPrice, desc: 'Major Resistance', color: NEON_RED },
    { level: '23.6%', price: coin.highPrice - 0.236 * fibRange, desc: 'Minor Resistance', color: '#ff7733' },
    { level: '38.2%', price: coin.highPrice - 0.382 * fibRange, desc: 'Turn Zone', color: AMBER },
    { level: '50.0%', price: coin.highPrice - 0.500 * fibRange, desc: 'Median', color: NEON_CYAN },
    { level: '61.8%', price: coin.highPrice - 0.618 * fibRange, desc: 'Golden Pocket', color: NEON_GREEN },
    { level: '78.6%', price: coin.highPrice - 0.786 * fibRange, desc: 'Deep Support', color: '#10b981' },
    { level: '100% (Low)', price: coin.lowPrice, desc: 'Major Support', color: '#10b981' },
  ];

  const buyP  = coin.sentiment === 'Bullish' ? 50 + coin.sentimentStrength / 2 : 50 - coin.sentimentStrength / 2;
  const sellP = 100 - buyP;

  /* ── candle builder (uses real klineData when available, fallbacks to mock) ── */
  const N = 28, cW = 14, sp = 5;
  let candles = [];
  if (klineData && klineData.length > 0) {
    const sliced = klineData.slice(-N);
    candles = sliced.map(d => ({
      open: d.open,
      close: d.close,
      high: d.high,
      low: d.low,
      vol: d.volume
    }));
  } else {
    const hash = (coin.symbol || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    let cur = coin.price * (1 - coin.priceChangePercent / 150);
    for (let i = 0; i < N; i++) {
      const isLast = i === N - 1;
      const ch = isLast ? coin.priceChangePercent / 5 : Math.sin(i * 1.5 + hash) * 0.9 + coin.priceChangePercent / 15;
      const open  = cur;
      const close = isLast ? coin.price : cur * (1 + ch / 100);
      const high  = Math.max(open, close) * (1 + Math.abs(Math.cos(i + hash)) * 0.6 / 100);
      const low   = Math.min(open, close) * (1 - Math.abs(Math.sin(i * 2 + hash)) * 0.6 / 100);
      const vol   = 35 + Math.abs(Math.sin(i * 3 + hash)) * 130;
      candles.push({ open, close, high, low, vol });
      cur = close;
    }
  }
  const cPrices = candles.flatMap(c => [c.high, c.low]);
  const cMin = Math.min(...cPrices); const cMax = Math.max(...cPrices);
  const cRange = cMax - cMin || 1;
  const maxVol = Math.max(...candles.map(c => c.vol)) || 1;
  const CH = 180, CW = N * (cW + sp) - sp;
  const gX = i => i * (cW + sp);
  const gY = p => CH - ((p - cMin) / cRange) * (CH - 55) - 30;
  const maLine = candles.map((c, i) => `${gX(i) + cW / 2},${gY((c.open + c.close + c.high + c.low) / 4)}`).join(' ');
  const yLabels = [0.15, 0.45, 0.75].map(f => ({ y: CH * f, p: cMax - f * cRange }));

  /* ── additional indicators ── */
  const rsi = Math.min(Math.max(50 + change * 2.5, 5), 95);
  const maList = [
    { p: 'MA 20',  v: coin.ma20  },
    { p: 'MA 50',  v: coin.ma50  },
    { p: 'MA 100', v: coin.ma100 },
    { p: 'MA 200', v: coin.ma200 },
  ].map(m => ({ ...m, act: coin.price > m.v ? 'BUY' : 'SELL' }));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
      {/* ══ ROW 1: Chart (fluid) + Gauge (fixed 320px) ══ */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 320px' }, gap: 2, width: '100%' }}>
        {/* ─ TradingView Chart fills remaining width ─ */}
        <Box sx={{ ...glassCard, p: 2, display: 'flex', flexDirection: 'column', minHeight: chartMode === 'tradingview' ? '480px' : '320px' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Typography sx={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.7px' }}>
              {chartMode === 'tradingview' ? 'Real-time Price Action' : 'Simulated Price Action'} · {timeframe} · {coinName}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              {[{ c: NEON_GREEN, l: 'Bullish' }, { c: NEON_RED, l: 'Bearish' }, { c: NEON_CYAN, l: 'EMA(9)' }].map((x, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box sx={{ width: i === 2 ? 12 : 7, height: i === 2 ? 2 : 7, bgcolor: x.c, borderRadius: i === 2 ? 0 : '50%' }} />
                  <Typography sx={{ fontSize: '0.63rem', color: 'rgba(255,255,255,0.35)', fontFamily: "'Space Grotesk',sans-serif" }}>{x.l}</Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Real-time floating legend */}
          {chartMode === 'tradingview' && (
            <Box ref={legendRef} sx={{ mb: 1, minHeight: '18px' }} />
          )}

          {/* Chart element container */}
          <Box sx={{ flex: 1, position: 'relative', width: '100%', minHeight: chartMode === 'tradingview' ? '380px' : '180px' }}>
            {chartMode === 'tradingview' && (
              <>
                {loadingKlines && klineData.length === 0 ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '380px' }}>
                    <CircularProgress size={24} sx={{ color: NEON_GREEN }} />
                  </Box>
                ) : null}

                <Box ref={chartContainerRef} style={{ width: '100%', height: '380px', display: klineData.length > 0 ? 'block' : 'none' }} />

                {!loadingKlines && klineData.length === 0 && (
                  <Box sx={{ width: '100%', overflowX: 'auto', '&::-webkit-scrollbar': { height: '3px' }, '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(57,255,20,0.2)' } }}>
                    <svg viewBox={`-30 0 ${CW + 38} ${CH}`} preserveAspectRatio="xMidYMid meet"
                      style={{ display: 'block', width: '100%', height: `${CH}px` }}>
                      {yLabels.map((yl, i) => (
                        <g key={i}>
                          <line x1={-30} y1={yl.y} x2={CW + 8} y2={yl.y} stroke="rgba(255,255,255,0.04)" strokeDasharray="4 4" />
                          <text x={-4} y={yl.y + 4} textAnchor="end" fill="rgba(255,255,255,0.18)" fontSize="7.5" fontFamily="'Space Grotesk',sans-serif">{fmtPrice(yl.p)}</text>
                        </g>
                      ))}
                      {candles.map((c, i) => {
                        const x = gX(i);
                        const yO = gY(c.open), yC = gY(c.close), yH = gY(c.high), yL = gY(c.low);
                        const bH = Math.max(Math.abs(yC - yO), 2);
                        const bY = Math.min(yO, yC);
                        const green = c.close >= c.open;
                        const col = green ? NEON_GREEN : NEON_RED;
                        const vH = (c.vol / maxVol) * 26;
                        return (
                          <g key={i}>
                            <rect x={x + 1} y={CH - vH} width={cW - 2} height={vH}
                              fill={green ? 'rgba(57,255,20,0.09)' : 'rgba(255,85,85,0.09)'}
                              stroke={green ? 'rgba(57,255,20,0.18)' : 'rgba(255,85,85,0.18)'} strokeWidth="0.8" rx="1" />
                            <line x1={x + cW / 2} y1={yH} x2={x + cW / 2} y2={yL} stroke={col} strokeWidth="1.2" />
                            <rect x={x} y={bY} width={cW} height={bH}
                              fill={green ? 'rgba(57, 255, 20, 0.18)' : 'rgba(255, 85, 85, 0.18)'}
                              stroke={col} strokeWidth="1.2" rx="1.2"
                              style={{ filter: `drop-shadow(0 0 2px ${green ? 'rgba(57,255,20,0.3)' : 'rgba(255,85,85,0.3)'})` }} />
                          </g>
                        );
                      })}
                      <polyline fill="none" stroke={NEON_CYAN} strokeWidth="1.6" points={maLine}
                        style={{ filter: 'drop-shadow(0 0 3px rgba(0,229,255,0.4))' }} />

                      {/* Position lines on fallback Simulated Chart */}
                      {calcEntryPrice && !isNaN(calcEntryPrice) && parseFloat(calcEntryPrice) >= cMin && parseFloat(calcEntryPrice) <= cMax && (
                        <g>
                          <line x1={-30} y1={gY(parseFloat(calcEntryPrice))} x2={CW + 8} y2={gY(parseFloat(calcEntryPrice))} stroke={NEON_CYAN} strokeWidth="1.5" strokeDasharray="3 3" />
                          <text x={CW + 10} y={gY(parseFloat(calcEntryPrice)) + 2.5} fill={NEON_CYAN} fontSize="6.5" fontFamily="'Space Grotesk',sans-serif" fontWeight="700">ENT</text>
                        </g>
                      )}
                      {calcExitPrice && !isNaN(calcExitPrice) && parseFloat(calcExitPrice) >= cMin && parseFloat(calcExitPrice) <= cMax && (
                        <g>
                          <line x1={-30} y1={gY(parseFloat(calcExitPrice))} x2={CW + 8} y2={gY(parseFloat(calcExitPrice))} stroke={parseFloat(calcExitPrice) >= parseFloat(calcEntryPrice || 0) ? NEON_GREEN : NEON_RED} strokeWidth="1.5" strokeDasharray="3 3" />
                          <text x={CW + 10} y={gY(parseFloat(calcExitPrice)) + 2.5} fill={parseFloat(calcExitPrice) >= parseFloat(calcEntryPrice || 0) ? NEON_GREEN : NEON_RED} fontSize="6.5" fontFamily="'Space Grotesk',sans-serif" fontWeight="700">EXT</text>
                        </g>
                      )}
                    </svg>
                  </Box>
                )}
              </>
            )}

            {chartMode === 'simulated' && (
              <Box sx={{ width: '100%', overflowX: 'auto', '&::-webkit-scrollbar': { height: '3px' }, '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(57,255,20,0.2)' } }}>
                <svg viewBox={`-30 0 ${CW + 38} ${CH}`} preserveAspectRatio="xMidYMid meet"
                  style={{ display: 'block', width: '100%', height: `${CH}px` }}>
                  {yLabels.map((yl, i) => (
                    <g key={i}>
                      <line x1={-30} y1={yl.y} x2={CW + 8} y2={yl.y} stroke="rgba(255,255,255,0.04)" strokeDasharray="4 4" />
                      <text x={-4} y={yl.y + 4} textAnchor="end" fill="rgba(255,255,255,0.18)" fontSize="7.5" fontFamily="'Space Grotesk',sans-serif">{fmtPrice(yl.p)}</text>
                    </g>
                  ))}
                  {candles.map((c, i) => {
                    const x = gX(i);
                    const yO = gY(c.open), yC = gY(c.close), yH = gY(c.high), yL = gY(c.low);
                    const bH = Math.max(Math.abs(yC - yO), 2);
                    const bY = Math.min(yO, yC);
                    const green = c.close >= c.open;
                    const col = green ? NEON_GREEN : NEON_RED;
                    const vH = (c.vol / maxVol) * 26;
                    return (
                      <g key={i}>
                        <rect x={x + 1} y={CH - vH} width={cW - 2} height={vH}
                          fill={green ? 'rgba(57,255,20,0.09)' : 'rgba(255,85,85,0.09)'}
                          stroke={green ? 'rgba(57,255,20,0.18)' : 'rgba(255,85,85,0.18)'} strokeWidth="0.8" rx="1" />
                        <line x1={x + cW / 2} y1={yH} x2={x + cW / 2} y2={yL} stroke={col} strokeWidth="1.2" />
                        <rect x={x} y={bY} width={cW} height={bH}
                          fill={green ? 'rgba(57, 255, 20, 0.18)' : 'rgba(255, 85, 85, 0.18)'}
                          stroke={col} strokeWidth="1.2" rx="1.2"
                          style={{ filter: `drop-shadow(0 0 2px ${green ? 'rgba(57,255,20,0.3)' : 'rgba(255,85,85,0.3)'})` }} />
                      </g>
                    );
                  })}
                  <polyline fill="none" stroke={NEON_CYAN} strokeWidth="1.6" points={maLine}
                    style={{ filter: 'drop-shadow(0 0 3px rgba(0,229,255,0.4))' }} />

                  {/* Position lines on Simulated Chart */}
                  {calcEntryPrice && !isNaN(calcEntryPrice) && parseFloat(calcEntryPrice) >= cMin && parseFloat(calcEntryPrice) <= cMax && (
                    <g>
                      <line x1={-30} y1={gY(parseFloat(calcEntryPrice))} x2={CW + 8} y2={gY(parseFloat(calcEntryPrice))} stroke={NEON_CYAN} strokeWidth="1.5" strokeDasharray="3 3" />
                      <text x={CW + 10} y={gY(parseFloat(calcEntryPrice)) + 2.5} fill={NEON_CYAN} fontSize="6.5" fontFamily="'Space Grotesk',sans-serif" fontWeight="700">ENT</text>
                    </g>
                  )}
                  {calcExitPrice && !isNaN(calcExitPrice) && parseFloat(calcExitPrice) >= cMin && parseFloat(calcExitPrice) <= cMax && (
                    <g>
                      <line x1={-30} y1={gY(parseFloat(calcExitPrice))} x2={CW + 8} y2={gY(parseFloat(calcExitPrice))} stroke={parseFloat(calcExitPrice) >= parseFloat(calcEntryPrice || 0) ? NEON_GREEN : NEON_RED} strokeWidth="1.5" strokeDasharray="3 3" />
                      <text x={CW + 10} y={gY(parseFloat(calcExitPrice)) + 2.5} fill={parseFloat(calcExitPrice) >= parseFloat(calcEntryPrice || 0) ? NEON_GREEN : NEON_RED} fontSize="6.5" fontFamily="'Space Grotesk',sans-serif" fontWeight="700">EXT</text>
                    </g>
                  )}
                </svg>
              </Box>
            )}
          </Box>
        </Box>

        {/* ─ Signal gauge ─ */}
        <Box sx={{ ...glassCard, p: 2.5, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.7px', mb: 1.5, alignSelf: 'flex-start' }}>
            Technical Signal Gauge
          </Typography>
          <Box sx={{ width: '100%', maxWidth: '200px', mb: 0.5 }}>
            <svg viewBox="0 0 200 120" style={{ width: '100%', overflow: 'visible' }}>
              <defs>
                <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%"   stopColor={NEON_RED} />
                  <stop offset="50%"  stopColor={AMBER} />
                  <stop offset="100%" stopColor={NEON_GREEN} />
                </linearGradient>
              </defs>
              <path d="M 20 110 A 80 80 0 0 1 180 110" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="14" strokeLinecap="round" />
              <path d="M 20 110 A 80 80 0 0 1 180 110" fill="none" stroke="url(#gaugeGrad)" strokeWidth="14" strokeLinecap="round" />
              <line x1="100" y1="110" x2="100" y2="38" stroke="#f8fafc" strokeWidth="2.5" strokeLinecap="round"
                transform={`rotate(${needleRot} 100 110)`} style={{ transition: 'transform 0.7s cubic-bezier(.4,0,.2,1)' }} />
              <circle cx="100" cy="110" r="6" fill="#f8fafc" />
              <circle cx="100" cy="110" r="11" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
              <text x="18"  y="128" textAnchor="middle" fill={NEON_RED}   fontSize="8" fontFamily="'Space Grotesk',sans-serif" fontWeight="700">SELL</text>
              <text x="100" y="18"  textAnchor="middle" fill={AMBER}      fontSize="8" fontFamily="'Space Grotesk',sans-serif" fontWeight="700">NEUTRAL</text>
              <text x="182" y="128" textAnchor="middle" fill={NEON_GREEN} fontSize="8" fontFamily="'Space Grotesk',sans-serif" fontWeight="700">BUY</text>
            </svg>
          </Box>
          <Box sx={{ px: 2.5, py: 0.5, borderRadius: '20px', bgcolor: `${sColor}18`, border: `1px solid ${sColor}55`, color: sColor, fontWeight: 800, fontSize: '0.85rem', fontFamily: "'Space Grotesk',sans-serif", letterSpacing: '1.2px', mb: 2, boxShadow: `0 0 14px ${sColor}22` }}>
            {label}
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0.75, width: '100%', mb: 2 }}>
            {[{ l: 'BUY', v: buy, c: NEON_GREEN }, { l: 'NEUTRAL', v: neutral, c: AMBER }, { l: 'SELL', v: sell, c: NEON_RED }].map((x, i) => (
              <Box key={i} sx={{ p: 0.875, bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '7px', textAlign: 'center' }}>
                <Typography sx={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.35)', fontWeight: 600, display: 'block', mb: 0.25 }}>{x.l}</Typography>
                <Typography sx={{ fontWeight: 800, color: x.c, fontSize: '1rem' }}>{x.v}</Typography>
              </Box>
            ))}
          </Box>
          {/* Quick MA signals */}
          <Typography sx={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', mb: 1, alignSelf: 'flex-start' }}>MA Signals</Typography>
          {maList.map((m, i) => (
            <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', mb: 0.6, px: 0.5 }}>
              <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{m.p}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Typography sx={{ fontWeight: 700, color: '#f8fafc', fontFamily: "'Space Grotesk',monospace,sans-serif", fontSize: '0.72rem' }}>{fmtPrice(m.v)}</Typography>
                <Box sx={{ px: 0.7, py: 0.15, borderRadius: '4px', bgcolor: m.act === 'BUY' ? 'rgba(57,255,20,0.12)' : 'rgba(255,85,85,0.12)', border: `1px solid ${m.act === 'BUY' ? 'rgba(57,255,20,0.3)' : 'rgba(255,85,85,0.3)'}` }}>
                  <Typography sx={{ fontSize: '0.58rem', color: m.act === 'BUY' ? NEON_GREEN : NEON_RED, fontWeight: 800 }}>{m.act}</Typography>
                </Box>
              </Box>
            </Box>
          ))}
          <Divider sx={{ bgcolor: 'rgba(255,255,255,0.05)', width: '100%', mt: 1, mb: 1.5 }} />
          {/* RSI zone */}
          <Typography sx={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', mb: 0.75, alignSelf: 'flex-start' }}>RSI (14) Zone</Typography>
          <Box sx={{ width: '100%', mb: 0.5 }}>
            <Box sx={{ height: '9px', borderRadius: '5px', background: 'linear-gradient(90deg, #39FF14 0%, #f59e0b 35%, #f59e0b 65%, #FF5555 100%)', position: 'relative' }}>
              <Box sx={{ position: 'absolute', top: '-3px', width: '15px', height: '15px', bgcolor: '#f8fafc', border: `2px solid ${rsi > 70 ? NEON_RED : rsi < 30 ? NEON_GREEN : AMBER}`, borderRadius: '50%', left: `calc(${rsi}% - 7px)`, boxShadow: `0 0 6px rgba(57,255,20,0.4)`, transition: 'left 0.5s ease' }} />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <Typography sx={{ fontSize: '0.58rem', color: NEON_GREEN, fontWeight: 700 }}>Oversold (30)</Typography>
            <Typography sx={{ fontWeight: 800, color: rsi > 70 ? NEON_RED : rsi < 30 ? NEON_GREEN : AMBER, fontSize: '0.88rem', fontFamily: "'Space Grotesk',monospace,sans-serif" }}>{rsi.toFixed(1)}</Typography>
            <Typography sx={{ fontSize: '0.58rem', color: NEON_RED, fontWeight: 700 }}>OB (70)</Typography>
          </Box>
        </Box>
      </Box>

      {/* ══ ROW 2: 3 equal columns — Sentiment+Vol | Key Levels | Fibonacci ══ */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2, width: '100%' }}>
        {/* ─ Sentiment + Volatility ─ */}
        <Box sx={{ ...glassCard, p: 2.5 }}>
          <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.7px', mb: 1.75 }}>
            Market Sentiment
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.6 }}>
            <Typography sx={{ fontSize: '0.68rem', color: NEON_GREEN, fontWeight: 700 }}>BUY PRESSURE</Typography>
            <Typography sx={{ fontSize: '0.68rem', color: NEON_RED, fontWeight: 700 }}>SELL PRESSURE</Typography>
          </Box>
          <Box sx={{ height: '12px', bgcolor: 'rgba(255,85,85,0.12)', borderRadius: '99px', overflow: 'hidden', mb: 0.6 }}>
            <Box sx={{ width: `${buyP}%`, height: '100%', background: 'linear-gradient(90deg,#10b981,#39FF14)', boxShadow: `0 0 10px ${NEON_GREEN}55`, borderRadius: '99px', transition: 'width 0.5s ease' }} />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
            <Typography sx={{ fontWeight: 700, color: NEON_GREEN, fontFamily: "'Space Grotesk',monospace,sans-serif", fontSize: '0.82rem' }}>{buyP.toFixed(0)}%</Typography>
            <Typography sx={{ fontWeight: 700, color: NEON_RED, fontFamily: "'Space Grotesk',monospace,sans-serif", fontSize: '0.82rem' }}>{sellP.toFixed(0)}%</Typography>
          </Box>
          <Box sx={{ p: 1.25, borderRadius: '8px', bgcolor: coin.sentiment === 'Bullish' ? 'rgba(57,255,20,0.07)' : 'rgba(255,85,85,0.07)', border: `1px solid ${coin.sentiment === 'Bullish' ? 'rgba(57,255,20,0.18)' : 'rgba(255,85,85,0.18)'}`, textAlign: 'center', mb: 2 }}>
            <Typography sx={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '0.82rem' }}>
              Overall Bias: <span style={{ color: coin.sentiment === 'Bullish' ? NEON_GREEN : NEON_RED, fontWeight: 800 }}>{coin.sentiment.toUpperCase()}</span>
            </Typography>
          </Box>
          <Divider sx={{ bgcolor: 'rgba(255,255,255,0.05)', mb: 1.75 }} />
          <Typography sx={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', mb: 1 }}>Volatility & Volume</Typography>
          {[
            { l: `Volatility (${timeframe})`, v: `${coin.volatility.toFixed(2)}%  (${coin.volatility > 5 ? 'HIGH' : 'LOW'})`, c: coin.volatility > 5 ? NEON_RED : NEON_GREEN },
            { l: 'Quote Volume', v: `$${(coin.quoteVolume / 1e6).toFixed(2)}M`,   c: '#f8fafc' },
            { l: 'Trades (24h)', v: coin.count ? Math.floor(coin.count).toLocaleString() : 'N/A', c: '#f8fafc' },
            { l: 'ATR (est.)',   v: `$${(coin.price * coin.volatility / 100).toFixed(4)}`, c: AMBER },
          ].map((x, i) => (
            <Box key={i} sx={{ ...statRow, mb: 0.5 }}>
              <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{x.l}</Typography>
              <Typography sx={{ fontWeight: 700, color: x.c, fontFamily: "'Space Grotesk',monospace,sans-serif", fontSize: '0.75rem' }}>{x.v}</Typography>
            </Box>
          ))}
        </Box>

        {/* ─ Key Price Levels + Pivot Points ─ */}
        <Box sx={{ ...glassCard, p: 2.5 }}>
          <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.7px', mb: 1.75 }}>
            Key Price Levels
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 2 }}>
            {[
              { l: 'Resistance', v: coin.resistanceLevel, c: NEON_RED },
              { l: 'Pivot Point', v: coin.pivotPoint,     c: NEON_CYAN },
              { l: 'Support',    v: coin.supportLevel,   c: NEON_GREEN },
              { l: 'Stop Loss',  v: coin.stopLoss,        c: '#ef5350' },
            ].map((x, i) => (
              <Box key={i} sx={{ p: 1.25, bgcolor: 'rgba(255,255,255,0.02)', border: `1px solid ${x.c}22`, borderRadius: '8px', textAlign: 'center', transition: 'all 0.2s', '&:hover': { borderColor: `${x.c}55`, bgcolor: `${x.c}07`, transform: 'translateY(-2px)' } }}>
                <Typography sx={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.35)', fontWeight: 600, display: 'block', mb: 0.3, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{x.l}</Typography>
                <Typography sx={{ fontWeight: 700, color: x.c, fontFamily: "'Space Grotesk',monospace,sans-serif", fontSize: '0.8rem' }}>{fmtPrice(x.v)}</Typography>
              </Box>
            ))}
          </Box>
          <Divider sx={{ bgcolor: 'rgba(255,255,255,0.05)', mb: 1.75 }} />
          <Typography sx={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', mb: 1 }}>Pivot Points (Classic)</Typography>
          {[
            { l: 'R2 — Resistance 2', v: coin.resistanceLevel * 1.012, c: '#ff4444' },
            { l: 'R1 — Resistance 1', v: coin.resistanceLevel,          c: NEON_RED },
            { l: 'PP — Pivot',         v: coin.pivotPoint,              c: NEON_CYAN },
            { l: 'S1 — Support 1',     v: coin.supportLevel,            c: NEON_GREEN },
            { l: 'S2 — Support 2',     v: coin.supportLevel * 0.988,    c: '#00c853' },
          ].map((x, i) => (
            <Box key={i} sx={{ ...statRow, mb: 0.5, borderLeft: `3px solid ${x.c}` }}>
              <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{x.l}</Typography>
              <Typography sx={{ fontWeight: 700, color: x.c, fontFamily: "'Space Grotesk',monospace,sans-serif", fontSize: '0.76rem' }}>{fmtPrice(x.v)}</Typography>
            </Box>
          ))}
        </Box>

        {/* ─ Fibonacci Retracement ─ */}
        <Box sx={{ ...glassCard, p: 2.5 }}>
          <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.7px', mb: 1.75 }}>
            Fibonacci Retracement
          </Typography>
          {fibs.map((f, i) => (
            <Box key={i} sx={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              px: 1.25, py: 0.9, borderRadius: '7px', borderLeft: `3px solid ${f.color}`,
              bgcolor: 'rgba(255,255,255,0.015)', mb: 0.65,
              transition: 'all 0.2s ease',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.03)', transform: 'translateX(3px)' },
            }}>
              <Box>
                <Typography sx={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.76rem', fontFamily: "'Space Grotesk',sans-serif" }}>{f.level}</Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.28)', fontSize: '0.62rem', fontStyle: 'italic' }}>{f.desc}</Typography>
              </Box>
              <Typography sx={{ fontWeight: 700, color: f.color, fontFamily: "'Space Grotesk',monospace,sans-serif", fontSize: '0.8rem' }}>{fmtPrice(f.price)}</Typography>
            </Box>
          ))}
          <Divider sx={{ bgcolor: 'rgba(255,255,255,0.05)', my: 1.5 }} />
          {/* Order book spread + funding rate mini stats */}
          <Typography sx={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', mb: 1 }}>Market Microstructure</Typography>
          {[
            { l: 'Order Book Spread', v: `$${(coin.resistanceLevel - coin.supportLevel).toFixed(4)}`, c: AMBER },
            { l: 'High/Low Range',    v: `$${(coin.highPrice - coin.lowPrice).toFixed(4)}`,           c: NEON_CYAN },
            { l: 'Funding Rate (est)',v: `${(coin.priceChangePercent * 0.0025).toFixed(4)}%`,         c: coin.priceChangePercent > 0 ? NEON_GREEN : NEON_RED },
          ].map((x, i) => (
            <Box key={i} sx={{ ...statRow, mb: 0.5 }}>
              <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{x.l}</Typography>
              <Typography sx={{ fontWeight: 700, color: x.c, fontFamily: "'Space Grotesk',monospace,sans-serif", fontSize: '0.75rem' }}>{x.v}</Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default TechnicalTab;
