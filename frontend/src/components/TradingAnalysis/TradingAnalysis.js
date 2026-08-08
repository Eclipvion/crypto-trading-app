import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  TextField,
  CircularProgress,
  FormControl,
  Select,
  MenuItem,
} from '@mui/material';

import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import BarChartIcon from '@mui/icons-material/BarChart';
import AssessmentIcon from '@mui/icons-material/Assessment';
import TimelineIcon from '@mui/icons-material/Timeline';
import BoltIcon from '@mui/icons-material/Bolt';

import TechnicalTab from './TechnicalTab';
import PatternsTab from './PatternsTab';
import IndicatorsTab from './IndicatorsTab';
import PredictionsTab from './PredictionsTab';

import { 
  NEON_GREEN, 
  NEON_RED, 
  NEON_CYAN, 
  AMBER, 
  fmtPrice 
} from './constants';

/* ─────────────────────────────────────────────────────────
   ROOT TRADING ANALYSIS COMPONENT
───────────────────────────────────────────────────────── */
const TradingAnalysis = ({ selectedCoin, coinSel, availableCoins, onCoinSelect, onCoinSelChange, calcEntryPrice, calcExitPrice, calcPositionType }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [coinData, setCoinData] = useState(null);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState('1h');
  const [chartMode, setChartMode] = useState('tradingview');
  const [watchlistQuery, setWatchlistQuery] = useState('');
  const [allTickers, setAllTickers] = useState({});

  const handleTabChange = (_, newValue) => setActiveTab(newValue);

  const fetchAllTickers = async () => {
    try {
      const res = await fetch('https://api.binance.com/api/v3/ticker/24hr');
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      const map = {};
      data.forEach(item => {
        if (item.symbol.endsWith('USDT')) {
          map[item.symbol] = {
            price: parseFloat(item.lastPrice),
            priceChangePercent: parseFloat(item.priceChangePercent),
          };
        }
      });
      setAllTickers(map);
    } catch (e) {
      console.error('Watchlist tickers fetch failed:', e);
    }
  };

  useEffect(() => {
    fetchAllTickers();
    const interval = setInterval(fetchAllTickers, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedCoin) {
      fetchCoinData(selectedCoin.symbol, timeframe, false);
      const interval = setInterval(() => {
        fetchCoinData(selectedCoin.symbol, timeframe, true);
      }, 1500); // Refresh silently every 1.5 seconds
      return () => clearInterval(interval);
    }
  }, [selectedCoin, timeframe]);

  const fetchCoinData = async (symbol, tf, isSilent = false) => {
    if (!isSilent) setLoading(true);
    setError(null);
    try {
      const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`);
      if (!res.ok) throw new Error('API error');
      const data = await res.json();

      let scale = 1.0;
      switch (tf) {
        case '1m': scale = 0.15; break;
        case '5m': scale = 0.30; break;
        case '15m': scale = 0.45; break;
        case '1h': scale = 0.70; break;
        case '4h': scale = 0.90; break;
        case '1d': scale = 1.35; break;
        default: scale = 1.0;
      }

      const last = parseFloat(data.lastPrice);
      const origH = parseFloat(data.highPrice);
      const origL = parseFloat(data.lowPrice);
      const high = last * (1 + (origH / last - 1) * scale);
      const low  = last * (1 - (1 - origL / last) * scale);
      const pcp  = parseFloat(data.priceChangePercent) * scale;

      const sentimentStrength = Math.min(Math.max(Math.abs(pcp) * 4, 15), 90);
      const sentiment = pcp >= 0 ? 'Bullish' : 'Bearish';

      setCoinData({
        symbol: data.symbol, price: last,
        priceChange: last * (pcp / 100), priceChangePercent: pcp,
        volume: parseFloat(data.volume) * scale,
        quoteVolume: parseFloat(data.quoteVolume) * scale,
        openPrice: parseFloat(data.openPrice),
        highPrice: high, lowPrice: low,
        supportLevel: low * 0.985, resistanceLevel: high * 1.015,
        pivotPoint: (high + low + last) / 3,
        stopLoss: last * (1 - 0.035 * scale),
        ma20: last * (1 - 0.012 * scale), ma50: last * (1 - 0.025 * scale),
        ma100: last * (1 - 0.040 * scale), ma200: last * (1 - 0.065 * scale),
        sentiment, sentimentStrength,
        volatility: Math.abs((high - low) / last * 100),
        count: parseFloat(data.count),
      });
    } catch (err) {
      if (!isSilent) setError('Failed to load analysis. Please try again.');
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  const TABS = [
    { label: 'Technical', icon: <ShowChartIcon sx={{ fontSize: 15 }} /> },
    { label: 'Patterns', icon: <BarChartIcon sx={{ fontSize: 15 }} /> },
    { label: 'Indicators', icon: <AssessmentIcon sx={{ fontSize: 15 }} /> },
    { label: 'Predictions', icon: <TimelineIcon sx={{ fontSize: 15 }} /> },
  ];

  const filteredCoins = (availableCoins || []).filter(c =>
    c.baseAsset.toLowerCase().includes(watchlistQuery.toLowerCase()) ||
    c.symbol.toLowerCase().includes(watchlistQuery.toLowerCase())
  );

  return (
    <Box sx={{
      height: { xs: 'auto', md: '100%' },
      display: 'flex',
      flexDirection: { xs: 'column', md: 'row' },
      bgcolor: '#08090d',
      overflow: { xs: 'visible', md: 'hidden' },
      width: '100%',
      minWidth: 0,
    }}>
      {/* ── LEFT WATCHLIST SIDEBAR ── */}
      <Box sx={{
        width: { xs: '100%', md: '280px', lg: '300px' },
        borderRight: { xs: 'none', md: '1px solid rgba(57, 255, 20, 0.12)' },
        borderBottom: { xs: '1px solid rgba(57, 255, 20, 0.12)', md: 'none' },
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'rgba(8, 10, 18, 0.95)',
        backdropFilter: 'blur(20px)',
        flexShrink: 0,
        height: { xs: '220px', md: '100%' },
        overflow: 'hidden',
      }}>
        <Box sx={{ p: 2, borderBottom: '1px solid rgba(57, 255, 20, 0.08)' }}>
          <Typography sx={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 800,
            fontSize: '0.85rem',
            color: NEON_GREEN,
            letterSpacing: '1.5px',
            mb: 1.5,
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <BoltIcon sx={{ fontSize: 16 }} /> WATCHLIST
          </Typography>
          <TextField
            placeholder="Search coin…"
            variant="outlined"
            size="small"
            fullWidth
            value={watchlistQuery}
            onChange={(e) => setWatchlistQuery(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                height: '32px', bgcolor: 'rgba(0,0,0,0.3)', borderRadius: '7px',
                color: '#f8fafc', fontSize: '0.78rem',
                fontFamily: "'Space Grotesk', sans-serif",
                '& fieldset': { border: '1px solid rgba(57,255,20,0.2)' },
                '&:hover fieldset': { border: '1px solid rgba(57,255,20,0.5)' },
                '&.Mui-focused fieldset': { border: `1px solid ${NEON_GREEN}`, boxShadow: '0 0 8px rgba(57,255,20,0.2)' },
              },
              '& .MuiInputBase-input': { padding: '4px 6px !important', color: '#f8fafc' },
            }}
          />
        </Box>
        <Box sx={{
          flex: 1,
          overflowY: 'auto',
          p: 1.5,
          display: 'flex',
          flexDirection: 'column',
          gap: 0.75,
          '&::-webkit-scrollbar': { width: '4px' },
          '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
          '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(57,255,20,0.15)', borderRadius: '4px' },
        }}>
          {filteredCoins.map((coin) => {
            const ticker = allTickers[coin.symbol];
            const isSelected = selectedCoin?.symbol === coin.symbol;
            const priceVal = ticker ? ticker.price : null;
            const changePercent = ticker ? ticker.priceChangePercent : null;
            const isPos = changePercent >= 0;

            return (
              <Box
                key={coin.symbol}
                onClick={() => {
                  if (onCoinSelect) {
                    onCoinSelect(coin);
                    if (onCoinSelChange) onCoinSelChange(coin.baseAsset);
                  }
                }}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  px: 1.5,
                  py: 1,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  border: isSelected ? `1px solid ${NEON_GREEN}` : '1px solid rgba(255,255,255,0.03)',
                  bgcolor: isSelected ? 'rgba(57, 255, 20, 0.06)' : 'rgba(255,255,255,0.01)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: isSelected ? 'rgba(57, 255, 20, 0.08)' : 'rgba(255,255,255,0.04)',
                    transform: 'translateX(3px)',
                  },
                }}
              >
                <Box>
                  <Typography sx={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    color: isSelected ? NEON_GREEN : '#f8fafc',
                  }}>
                    {coin.baseAsset}
                    <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', marginLeft: '4px' }}>/USDT</span>
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography sx={{
                    fontFamily: "'Space Grotesk', monospace, sans-serif",
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    color: '#f8fafc',
                  }}>
                    {priceVal !== null ? fmtPrice(priceVal) : '...'}
                  </Typography>
                  {changePercent !== null && (
                    <Typography sx={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontWeight: 700,
                      fontSize: '0.68rem',
                      color: isPos ? NEON_GREEN : NEON_RED,
                    }}>
                      {isPos ? '+' : ''}{changePercent.toFixed(2)}%
                    </Typography>
                  )}
                </Box>
              </Box>
            );
          })}
          {filteredCoins.length === 0 && (
            <Typography sx={{ p: 2, color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', textAlign: 'center', fontFamily: "'Space Grotesk', sans-serif" }}>
              No matches found
            </Typography>
          )}
        </Box>
      </Box>

      {/* ── RIGHT PANEL: TECHNICAL ANALYSIS TERMINAL ── */}
      <Box sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        minWidth: 0,
        width: '100%',
        height: { xs: 'auto', md: '100%' },
      }}>
        {/* ── TOP HEADER BAR ── */}
        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' },
          justifyContent: 'space-between',
          gap: { xs: 1.5, sm: 1 },
          px: { xs: 2, sm: 2.5 },
          py: { xs: 1, sm: 0.75 },
          borderBottom: '1px solid rgba(57, 255, 20, 0.1)',
          bgcolor: 'rgba(8, 10, 18, 0.92)',
          backdropFilter: 'blur(20px)',
          flexShrink: 0,
          zIndex: 10,
        }}>
          {/* Row 1 for Mobile: Timeframe & Coin Badge */}
          {/* On Desktop, this matches the right side placement */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            order: { xs: 1, sm: 2 },
            width: { xs: '100%', sm: 'auto' },
            gap: 1.5
          }}>
            {coinData && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{
                  px: 1.2, height: '28px', display: 'flex', alignItems: 'center',
                  borderRadius: '6px', bgcolor: 'rgba(57,255,20,0.08)',
                  border: '1px solid rgba(57,255,20,0.2)',
                  fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.75rem',
                  fontWeight: 700, color: NEON_GREEN, letterSpacing: '0.5px',
                }}>
                  {coinSel}/USDT
                </Box>
                <Box sx={{
                  px: 1.2, height: '28px', display: 'flex', alignItems: 'center', gap: 0.5,
                  borderRadius: '6px',
                  bgcolor: coinData.priceChangePercent >= 0 ? 'rgba(57,255,20,0.06)' : 'rgba(255,85,85,0.06)',
                  border: `1px solid ${coinData.priceChangePercent >= 0 ? 'rgba(57,255,20,0.2)' : 'rgba(255,85,85,0.2)'}`,
                }}>
                  {coinData.priceChangePercent >= 0
                    ? <TrendingUpIcon sx={{ fontSize: 12, color: NEON_GREEN }} />
                    : <TrendingDownIcon sx={{ fontSize: 12, color: NEON_RED }} />}
                  <Typography sx={{
                    fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.75rem', fontWeight: 700,
                    color: coinData.priceChangePercent >= 0 ? NEON_GREEN : NEON_RED,
                  }}>
                    {coinData.priceChangePercent >= 0 ? '+' : ''}{coinData.priceChangePercent.toFixed(2)}%
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Chart Mode Dropdown Selector */}
            <select value={chartMode} onChange={(e) => setChartMode(e.target.value)} style={{
              background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(57,255,20,0.3)',
              color: NEON_GREEN, padding: '3px 8px', height: '28px', borderRadius: '6px',
              fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.75rem', fontWeight: 700,
              outline: 'none', cursor: 'pointer',
            }}>
              <option value="tradingview" style={{ background: '#0e121a', color: '#f8fafc' }}>TradingView</option>
              <option value="simulated" style={{ background: '#0e121a', color: '#f8fafc' }}>Simulated Chart</option>
            </select>

            <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)} style={{
              background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(57,255,20,0.3)',
              color: NEON_GREEN, padding: '3px 8px', height: '28px', borderRadius: '6px',
              fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.75rem', fontWeight: 700,
              outline: 'none', cursor: 'pointer',
            }}>
              {['1m','5m','15m','1h','4h','1d'].map(tf => (
                <option key={tf} value={tf} style={{ background: '#0e121a', color: '#f8fafc' }}>{tf}</option>
              ))}
            </select>
          </Box>

          {/* Row 2 for Mobile: Tabs */}
          {/* On Desktop, this matches the left side placement */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            minWidth: 0, 
            flex: 1, 
            order: { xs: 2, sm: 1 },
            width: { xs: '100%', sm: 'auto' },
          }}>
            {/* Mobile Tab Selector (Dropdown) */}
            <FormControl 
              size="small" 
              sx={{ 
                display: { xs: 'flex', sm: 'none' }, 
                width: '100%',
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'rgba(0,0,0,0.35)',
                  borderRadius: '8px',
                  color: NEON_GREEN,
                  fontSize: '0.8rem',
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 700,
                  '& fieldset': { border: '1px solid rgba(57,255,20,0.3)' },
                  '&:hover fieldset': { border: '1px solid rgba(57,255,20,0.5)' },
                  '&.Mui-focused fieldset': { border: `1px solid ${NEON_GREEN}` },
                },
                '& .MuiSelect-select': {
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  py: '6px'
                },
                '& .MuiSvgIcon-root': { color: NEON_GREEN }
              }}
            >
              <Select
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value)}
              >
                {TABS.map((t, i) => (
                  <MenuItem 
                    key={i} 
                    value={i}
                    sx={{
                      fontSize: '0.8rem',
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontWeight: 600,
                      gap: 1.5,
                      color: '#f8fafc',
                      '&.Mui-selected': {
                        bgcolor: 'rgba(57, 255, 20, 0.08) !important',
                        color: NEON_GREEN,
                        fontWeight: 700
                      },
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.03)'
                      }
                    }}
                  >
                    {t.icon}
                    {t.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Desktop Tabs */}
            <Box sx={{ 
              display: { xs: 'none', sm: 'flex' }, 
              alignItems: 'center', 
              gap: 1.5, 
              minWidth: 0, 
              flex: 1, 
              overflow: 'hidden' 
            }}>
              <Box sx={{ color: NEON_GREEN, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                <BoltIcon sx={{ fontSize: 20 }} />
              </Box>
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  minHeight: '36px',
                  '& .MuiTab-root': {
                    minHeight: '36px', px: 1.8, py: 0.5,
                    fontWeight: 600, fontSize: '0.8rem', textTransform: 'none',
                    color: 'rgba(255,255,255,0.45)',
                    fontFamily: "'Space Grotesk', sans-serif",
                    transition: 'all 0.2s ease',
                    minWidth: 'auto',
                    '&:hover': { color: NEON_GREEN, bgcolor: 'rgba(57,255,20,0.05)' },
                    '&.Mui-selected': { color: NEON_GREEN, bgcolor: 'rgba(57,255,20,0.08)' },
                  },
                  '& .MuiTabs-indicator': { bgcolor: NEON_GREEN, height: 2 },
                }}
              >
                {TABS.map((t, i) => (
                  <Tab key={i} icon={t.icon} iconPosition="start" label={t.label} />
                ))}
              </Tabs>
            </Box>
          </Box>
        </Box>

        {/* ── LIVE PRICE TICKER (only when data loaded) ── */}
        {coinData && (
          <Box sx={{
            display: 'flex', alignItems: 'center', gap: 0, flexShrink: 0,
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            bgcolor: 'rgba(8, 10, 18, 0.7)', backdropFilter: 'blur(12px)',
            overflowX: 'auto',
            '&::-webkit-scrollbar': { display: 'none' },
            width: '100%',
            minWidth: 0,
          }}>
            {[
              { label: 'Price', value: fmtPrice(coinData.price), color: '#f8fafc' },
              { label: '24h High', value: fmtPrice(coinData.highPrice), color: NEON_GREEN },
              { label: '24h Low', value: fmtPrice(coinData.lowPrice), color: NEON_RED },
              { label: 'Open', value: fmtPrice(coinData.openPrice), color: NEON_CYAN },
              { label: 'Volume', value: `$${(coinData.quoteVolume / 1e6).toFixed(2)}M`, color: '#f8fafc' },
              { label: 'Pivot', value: fmtPrice(coinData.pivotPoint), color: AMBER },
              { label: 'Support', value: fmtPrice(coinData.supportLevel), color: NEON_GREEN },
              { label: 'Resistance', value: fmtPrice(coinData.resistanceLevel), color: NEON_RED },
              { label: 'Volatility', value: `${coinData.volatility.toFixed(2)}%`, color: coinData.volatility > 5 ? NEON_RED : AMBER },
              { label: 'Sentiment', value: coinData.sentiment, color: coinData.sentiment === 'Bullish' ? NEON_GREEN : NEON_RED },
            ].map((item, i) => (
              <Box key={i} sx={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', px: 2.5, py: 0.8, flexShrink: 0,
                borderRight: '1px solid rgba(255,255,255,0.05)',
                minWidth: '90px',
              }}>
                <Typography sx={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', mb: 0.2 }}>
                  {item.label}
                </Typography>
                <Typography sx={{ fontSize: '0.78rem', color: item.color, fontFamily: "'Space Grotesk',monospace,sans-serif", fontWeight: 700 }}>
                  {item.value}
                </Typography>
              </Box>
            ))}
          </Box>
        )}

        {/* ── TAB CONTENT AREA ── */}
        <Box sx={{
          flex: 1, overflow: 'auto', p: 2.5,
          '&::-webkit-scrollbar': { width: '6px' },
          '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
          '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(57,255,20,0.25)', borderRadius: '6px' },
        }}>

          {loading && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '320px', gap: 2 }}>
              <CircularProgress sx={{ color: NEON_GREEN }} />
              <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontFamily: "'Space Grotesk',sans-serif", fontSize: '0.85rem' }}>
                Fetching market data…
              </Typography>
            </Box>
          )}

          {error && (
            <Box sx={{ p: 3, textAlign: 'center', bgcolor: 'rgba(255,85,85,0.08)', border: '1px solid rgba(255,85,85,0.25)', borderRadius: '12px' }}>
              <Typography color="error">{error}</Typography>
            </Box>
          )}

          {!selectedCoin && !loading && !error && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '360px', gap: 3 }}>
              <BoltIcon sx={{ fontSize: 56, color: 'rgba(57,255,20,0.3)', filter: 'drop-shadow(0 0 16px rgba(57,255,20,0.2))' }} />
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" sx={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, color: '#f8fafc', mb: 1 }}>
                  Technical Analysis Terminal
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontFamily: "'Space Grotesk',sans-serif", fontSize: '0.88rem' }}>
                  Search for a coin above to begin your analysis
                </Typography>
              </Box>
            </Box>
          )}

          {selectedCoin && coinData && !loading && !error && (
            <>
              {activeTab === 0 && <TechnicalTab coin={coinData} coinName={coinSel} timeframe={timeframe} chartMode={chartMode} calcEntryPrice={calcEntryPrice} calcExitPrice={calcExitPrice} calcPositionType={calcPositionType} />}
              {activeTab === 1 && <PatternsTab coin={coinData} coinName={coinSel} timeframe={timeframe} />}
              {activeTab === 2 && <IndicatorsTab coin={coinData} coinName={coinSel} timeframe={timeframe} />}
              {activeTab === 3 && <PredictionsTab coin={coinData} coinName={coinSel} timeframe={timeframe} />}
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default TradingAnalysis;