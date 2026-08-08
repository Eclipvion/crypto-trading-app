import React, { useState, useEffect } from 'react';
import { Box, Typography, Tooltip, CircularProgress } from '@mui/material';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import EqualizerIcon from '@mui/icons-material/Equalizer';
import './MarketSummary.css';

function MarketSummary() {
  const [data, setData] = useState({
    bullishPct: 50,
    advancers: 0,
    decliners: 0,
    total: 0,
    loading: true
  });

  useEffect(() => {
    const fetchMarketOverview = async () => {
      try {
        const res = await fetch('https://api.binance.com/api/v3/ticker/24hr');
        if (res.ok) {
          const allTickers = await res.json();
          const usdtPairs = allTickers.filter(t => t.symbol.endsWith('USDT'));
          
          let advancers = 0;
          let decliners = 0;
          
          usdtPairs.forEach(t => {
            const pct = parseFloat(t.priceChangePercent);
            if (pct > 0) advancers++;
            else if (pct < 0) decliners++;
          });
          
          const total = advancers + decliners;
          const bullishPct = total > 0 ? Math.round((advancers / total) * 100) : 50;
          
          setData({
            bullishPct,
            advancers,
            decliners,
            total,
            loading: false
          });
        }
      } catch (e) {
        console.warn('Error fetching market conditions:', e);
      }
    };

    fetchMarketOverview();
    const interval = setInterval(fetchMarketOverview, 30000); // refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getMarketMood = () => {
    if (data.bullishPct > 53) return { label: 'BULLISH', color: 'var(--neon-green)', desc: 'Buyers are dominating the market volume.' };
    if (data.bullishPct < 47) return { label: 'BEARISH', color: 'var(--neon-red)', desc: 'Sellers are pushing asset valuations down.' };
    return { label: 'NEUTRAL', color: '#f59e0b', desc: 'Market consolidating with mixed buy/sell orders.' };
  };

  const mood = getMarketMood();

  return (
    <Box className="market-summary-container">
      <Box className="summary-header">
        <ShowChartIcon className="summary-icon" />
        <Typography variant="caption" className="summary-title">MARKET PULSE</Typography>
      </Box>

      {data.loading ? (
        <Box className="summary-loading">
          <CircularProgress size={20} sx={{ color: 'var(--neon-cyan)' }} />
          <Typography variant="caption" sx={{ color: 'text.secondary', ml: 1 }}>Analyzing feeds...</Typography>
        </Box>
      ) : (
        <Box className="summary-content">
          <Box className="mood-row">
            <Typography className="mood-label">SENTIMENT</Typography>
            <span className={`mood-badge ${mood.label.toLowerCase()}`}>
              {mood.label}
            </span>
          </Box>

          {/* SVG Gauge Bar */}
          <Box className="gauge-bar-wrapper">
            <Tooltip title={mood.desc} arrow placement="top">
              <Box className="gauge-container">
                <Box 
                  className="gauge-track" 
                  style={{ 
                    background: `linear-gradient(90deg, var(--neon-red) 0%, #f59e0b 50%, var(--neon-green) 100%)` 
                  }}
                >
                  <Box 
                    className="gauge-mask" 
                    style={{ 
                      left: `${data.bullishPct}%` 
                    }} 
                  />
                </Box>
                <Box className="gauge-needle" style={{ left: `${data.bullishPct}%` }} />
              </Box>
            </Tooltip>
            <Box className="gauge-labels">
              <span className="gauge-lbl-bear" style={{ color: 'var(--neon-red)' }}>
                {100 - data.bullishPct}% Bearish
              </span>
              <span className="gauge-lbl-bull" style={{ color: 'var(--neon-green)' }}>
                {data.bullishPct}% Bullish
              </span>
            </Box>
          </Box>

          <Box className="metrics-grid">
            <Box className="metric-box advancers-box">
              <TrendingUpIcon className="metric-icon positive" />
              <Box className="metric-data">
                <Typography className="metric-val">{data.advancers}</Typography>
                <Typography className="metric-lbl">Advancers</Typography>
              </Box>
            </Box>
            
            <Box className="metric-box decliners-box">
              <TrendingDownIcon className="metric-icon negative" />
              <Box className="metric-data">
                <Typography className="metric-val">{data.decliners}</Typography>
                <Typography className="metric-lbl">Decliners</Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}

export default MarketSummary;
