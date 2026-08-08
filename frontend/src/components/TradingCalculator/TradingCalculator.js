import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  TextField,
  FormControl,
  Select,
  MenuItem,
  Button,
  Tooltip
} from '@mui/material';

import ShieldIcon from '@mui/icons-material/Shield';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import LayersIcon from '@mui/icons-material/Layers';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import BoltIcon from '@mui/icons-material/Bolt';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import RefreshIcon from '@mui/icons-material/Refresh';

import PnlCalculatorTab from './PnlCalculatorTab';
import RiskPositionSizeTab from './RiskPositionSizeTab';
import TargetPriceTab from './TargetPriceTab';
import DcaCalculatorTab from './DcaCalculatorTab';
import CompoundGrowthTab from './CompoundGrowthTab';
import ScaleOutCalculatorTab from './ScaleOutCalculatorTab';

import './TradingCalculator.css';

// ─── Constants — matches TradingAnalysis.js theme exactly ────────────────────
const NEON_GREEN = '#39ff14';   // exact same as TradingAnalysis
const NEON_RED   = '#ff3d00';
const NEON_CYAN  = '#00f0ff';
const AMBER      = '#ffab00';

const fmtPrice = (val) => {
  if (val === null || val === undefined || isNaN(val)) return '...';
  if (val < 0.0001) return val.toFixed(8);
  if (val < 1)      return val.toFixed(6);
  if (val < 10)     return val.toFixed(4);
  return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

/* ═══════════════════════════════════════════════════════════
   TRADING CALCULATOR — 1:1 PARITY WITH TRADING ANALYSIS
═══════════════════════════════════════════════════════════ */
const TradingCalculator = ({
  selectedCoin,
  coinSel,
  availableCoins,
  onCoinSelect,
  onCoinSelChange,
  calcEntryPrice,
  setCalcEntryPrice,
  calcExitPrice,
  setCalcExitPrice,
  calcPositionType,
  setCalcPositionType,
}) => {
  // ── Tab & UI state ──────────────────────────────────────
  const [activeTab, setActiveTab]         = useState(0);
  const [watchlistQuery, setWatchlistQuery] = useState('');
  const [allTickers, setAllTickers]       = useState({});
  const [coinData, setCoinData]           = useState(null);
  const [isRefreshing, setIsRefreshing]   = useState(false);

  // ── Shared form state forwarded to PnlCalculatorTab ────
  const [entryPrice,       setEntryPrice]       = useState(calcEntryPrice || '');
  const [exitPrice,        setExitPrice]        = useState(calcExitPrice  || '');
  const [positionType,     setPositionType]     = useState(calcPositionType || 'long');
  const [marketType,       setMarketType]       = useState('futures');
  const [exchangeName,     setExchangeName]     = useState('binance');
  const [orderType,        setOrderType]        = useState('limit');
  const [leverage,         setLeverage]         = useState(10);
  const [walletBalance,    setWalletBalance]    = useState('1000');
  const [entryAmount,      setEntryAmount]      = useState('');
  const [walletPercent,    setWalletPercent]    = useState(25);
  const [hasTokenDiscount, setHasTokenDiscount] = useState(false);
  const [stopLossPrice,    setStopLossPrice]    = useState('');

  // ── Sync with parent state ──────────────────────────────
  useEffect(() => {
    if (calcEntryPrice  && calcEntryPrice  !== entryPrice)  setEntryPrice(calcEntryPrice);
    if (calcExitPrice   && calcExitPrice   !== exitPrice)   setExitPrice(calcExitPrice);
    if (calcPositionType && calcPositionType !== positionType) setPositionType(calcPositionType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calcEntryPrice, calcExitPrice, calcPositionType]);

  useEffect(() => {
    if (setCalcEntryPrice  && entryPrice   !== calcEntryPrice)  setCalcEntryPrice(entryPrice);
    if (setCalcExitPrice   && exitPrice    !== calcExitPrice)   setCalcExitPrice(exitPrice);
    if (setCalcPositionType && positionType !== calcPositionType) setCalcPositionType(positionType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entryPrice, exitPrice, positionType]);

  // ── Live watchlist tickers (15s interval — same as TradingAnalysis) ────────
  const fetchAllTickers = useCallback(async () => {
    try {
      const res  = await fetch('https://api.binance.com/api/v3/ticker/24hr');
      if (!res.ok) return;
      const data = await res.json();
      const map  = {};
      data.forEach(item => {
        if (item.symbol.endsWith('USDT')) {
          map[item.symbol] = {
            price:              parseFloat(item.lastPrice),
            priceChangePercent: parseFloat(item.priceChangePercent),
          };
        }
      });
      setAllTickers(map);
    } catch (e) {
      console.error('Watchlist ticker fetch failed:', e);
    }
  }, []);

  useEffect(() => {
    fetchAllTickers();
    const id = setInterval(fetchAllTickers, 15000);
    return () => clearInterval(id);
  }, [fetchAllTickers]);

  // ── Active coin symbol / base asset ────────────────────
  const activeSymbol = selectedCoin
    ? selectedCoin.symbol
    : coinSel ? `${coinSel}USDT` : 'BTCUSDT';

  const baseAsset = selectedCoin
    ? selectedCoin.baseAsset
    : coinSel || 'BTC';

  // ── Detailed live data for active coin (1.5s — same as TradingAnalysis) ────
  const fetchCoinData = useCallback(async (symbol, isSilent = false) => {
    if (!isSilent) setIsRefreshing(true);
    try {
      const res  = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`);
      if (!res.ok) return;
      const data = await res.json();

      const last   = parseFloat(data.lastPrice);
      const high   = parseFloat(data.highPrice);
      const low    = parseFloat(data.lowPrice);
      const open   = parseFloat(data.openPrice);
      const vol    = parseFloat(data.quoteVolume);
      const pcp    = parseFloat(data.priceChangePercent);

      setCoinData({
        price:             last,
        priceChangePercent: pcp,
        highPrice:         high,
        lowPrice:          low,
        openPrice:         open,
        quoteVolume:       vol,
        pivotPoint:        (high + low + last) / 3,
        supportLevel:      low  * 0.985,
        resistanceLevel:   high * 1.015,
      });

      // Auto-populate entry price if empty
      if (!entryPrice) setEntryPrice(last.toString());
    } catch (e) {
      console.error('CoinData fetch failed:', e);
    } finally {
      if (!isSilent) setTimeout(() => setIsRefreshing(false), 500);
    }
  }, [entryPrice]);

  useEffect(() => {
    fetchCoinData(activeSymbol, false);
    const id = setInterval(() => fetchCoinData(activeSymbol, true), 1500);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSymbol]);

  // ── Tab definitions ──────────────────────────────────────
  const TABS = [
    { label: 'PnL & Futures',       icon: <BoltIcon        sx={{ fontSize: 15 }} /> },
    { label: 'Risk & Position',     icon: <ShieldIcon      sx={{ fontSize: 15 }} /> },
    { label: 'Target Exit Price',   icon: <TrackChangesIcon sx={{ fontSize: 15 }} /> },
    { label: 'DCA Grid Averager',   icon: <LayersIcon      sx={{ fontSize: 15 }} /> },
    { label: 'Compound Growth',     icon: <AutoGraphIcon   sx={{ fontSize: 15 }} /> },
    { label: 'Scaling Targets',     icon: <TrackChangesIcon sx={{ fontSize: 15 }} /> },
  ];

  // ── Filtered watchlist ────────────────────────────────────
  const filteredCoins = (availableCoins || []).filter(c =>
    c.baseAsset.toLowerCase().includes(watchlistQuery.toLowerCase()) ||
    c.symbol.toLowerCase().includes(watchlistQuery.toLowerCase())
  );

  return (
    <Box sx={{
      height:        { xs: 'auto', md: '100%' },
      display:       'flex',
      flexDirection: { xs: 'column', md: 'row' },
      bgcolor:       '#08090d',
      overflow:      { xs: 'visible', md: 'hidden' },
      width:         '100%',
      minWidth:      0,
    }}>

      {/* ─── LEFT WATCHLIST SIDEBAR — identical to TradingAnalysis ─── */}
      <Box sx={{
        width:         { xs: '100%', md: '280px', lg: '300px' },
        borderRight:   { xs: 'none',  md: `1px solid rgba(57, 255, 20, 0.12)` },
        borderBottom:  { xs: `1px solid rgba(57, 255, 20, 0.12)`, md: 'none' },
        display:       'flex',
        flexDirection: 'column',
        bgcolor:       'rgba(8, 10, 18, 0.95)',
        backdropFilter:'blur(20px)',
        flexShrink:    0,
        height:        { xs: '220px', md: '100%' },
        overflow:      'hidden',
      }}>
        {/* Header */}
        <Box sx={{ p: 2, borderBottom: '1px solid rgba(57, 255, 20, 0.08)' }}>
          <Typography sx={{
            fontFamily:    "'Space Grotesk', sans-serif",
            fontWeight:    800,
            fontSize:      '0.85rem',
            color:         NEON_GREEN,
            letterSpacing: '1.5px',
            mb:            1.5,
            textTransform: 'uppercase',
            display:       'flex',
            alignItems:    'center',
            gap:           1,
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
                height:     '32px',
                bgcolor:    'rgba(0,0,0,0.3)',
                borderRadius:'7px',
                color:      '#f8fafc',
                fontSize:   '0.78rem',
                fontFamily: "'Space Grotesk', sans-serif",
                '& fieldset':          { border: `1px solid rgba(57,255,20,0.2)` },
                '&:hover fieldset':    { border: `1px solid rgba(57,255,20,0.5)` },
                '&.Mui-focused fieldset': {
                  border:    `1px solid ${NEON_GREEN}`,
                  boxShadow: '0 0 8px rgba(57,255,20,0.2)',
                },
              },
              '& .MuiInputBase-input': { padding: '4px 6px !important', color: '#f8fafc' },
            }}
          />
        </Box>

        {/* Coin List */}
        <Box sx={{
          flex:          1,
          overflowY:     'auto',
          p:             1.5,
          display:       'flex',
          flexDirection: 'column',
          gap:           0.75,
          '&::-webkit-scrollbar':       { width: '4px' },
          '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
          '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(57,255,20,0.15)', borderRadius: '4px' },
        }}>
          {filteredCoins.map((coin) => {
            const ticker       = allTickers[coin.symbol];
            const isSelected   = activeSymbol === coin.symbol;
            const priceVal     = ticker ? ticker.price : null;
            const changePct    = ticker ? ticker.priceChangePercent : null;
            const isPos        = changePct >= 0;

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
                  display:         'flex',
                  alignItems:      'center',
                  justifyContent:  'space-between',
                  px:              1.5,
                  py:              1,
                  borderRadius:    '8px',
                  cursor:          'pointer',
                  border:  isSelected ? `1px solid ${NEON_GREEN}` : '1px solid rgba(255,255,255,0.03)',
                  bgcolor: isSelected ? 'rgba(57, 255, 20, 0.06)' : 'rgba(255,255,255,0.01)',
                  transition:      'all 0.2s ease',
                  '&:hover': {
                    bgcolor:   isSelected ? 'rgba(57, 255, 20, 0.08)' : 'rgba(255,255,255,0.04)',
                    transform: 'translateX(3px)',
                  },
                }}
              >
                <Box>
                  <Typography sx={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontWeight: 700,
                    fontSize:   '0.8rem',
                    color:      isSelected ? NEON_GREEN : '#f8fafc',
                  }}>
                    {coin.baseAsset}
                    <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', marginLeft: '4px' }}>/USDT</span>
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography sx={{
                    fontFamily: "'Space Grotesk', monospace, sans-serif",
                    fontWeight: 700,
                    fontSize:   '0.78rem',
                    color:      '#f8fafc',
                  }}>
                    {priceVal !== null ? fmtPrice(priceVal) : '...'}
                  </Typography>
                  {changePct !== null && (
                    <Typography sx={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontWeight: 700,
                      fontSize:   '0.68rem',
                      color:      isPos ? NEON_GREEN : NEON_RED,
                    }}>
                      {isPos ? '+' : ''}{changePct.toFixed(2)}%
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

      {/* ─── RIGHT PANEL ─── */}
      <Box sx={{
        flex:          1,
        display:       'flex',
        flexDirection: 'column',
        overflow:      'hidden',
        minWidth:      0,
        width:         '100%',
        height:        { xs: 'auto', md: '100%' },
      }}>

        {/* ── TOP HEADER BAR — identical to TradingAnalysis ── */}
        <Box sx={{
          display:        'flex',
          flexDirection:  { xs: 'column', sm: 'row' },
          alignItems:     { xs: 'stretch', sm: 'center' },
          justifyContent: 'space-between',
          gap:            { xs: 1.5, sm: 1 },
          px:             { xs: 2, sm: 2.5 },
          py:             { xs: 1, sm: 0.75 },
          borderBottom:   '1px solid rgba(57, 255, 20, 0.1)',
          bgcolor:        'rgba(8, 10, 18, 0.92)',
          backdropFilter: 'blur(20px)',
          flexShrink:     0,
          zIndex:         10,
        }}>

          {/* Mobile Tab Select */}
          <FormControl size="small" sx={{
            display: { xs: 'flex', sm: 'none' },
            width:   '100%',
            '& .MuiOutlinedInput-root': {
              bgcolor:    'rgba(0,0,0,0.35)',
              borderRadius:'8px',
              color:      NEON_GREEN,
              fontSize:   '0.8rem',
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              '& fieldset':              { border: `1px solid rgba(57,255,20,0.3)` },
              '&:hover fieldset':        { border: `1px solid rgba(57,255,20,0.5)` },
              '&.Mui-focused fieldset':  { border: `1px solid ${NEON_GREEN}` },
            },
            '& .MuiSelect-select': { display: 'flex', alignItems: 'center', gap: 1, py: '6px' },
            '& .MuiSvgIcon-root':  { color: NEON_GREEN },
          }}>
            <Select value={activeTab} onChange={(e) => setActiveTab(e.target.value)}>
              {TABS.map((t, i) => (
                <MenuItem key={i} value={i} sx={{ fontSize: '0.8rem', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, gap: 1.5, color: '#f8fafc' }}>
                  {t.icon} {t.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Desktop Tabs — matching TradingAnalysis style */}
          <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 1.5, minWidth: 0, flex: 1, overflow: 'hidden' }}>
            <Box sx={{ color: NEON_GREEN, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              <BoltIcon sx={{ fontSize: 20 }} />
            </Box>
            <Tabs
              value={activeTab}
              onChange={(_, v) => setActiveTab(v)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                minHeight: '36px',
                '& .MuiTab-root': {
                  minHeight:     '36px',
                  px:            1.8,
                  py:            0.5,
                  fontWeight:    600,
                  fontSize:      '0.8rem',
                  textTransform: 'none',
                  color:         'rgba(255,255,255,0.45)',
                  fontFamily:    "'Space Grotesk', sans-serif",
                  transition:    'all 0.2s ease',
                  minWidth:      'auto',
                  '&:hover':      { color: NEON_GREEN, bgcolor: 'rgba(57,255,20,0.05)' },
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

          {/* Right: Symbol badge + live price capsule + refresh */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              px: 1.2, height: '28px', display: 'flex', alignItems: 'center',
              borderRadius: '6px',
              bgcolor: 'rgba(57, 255, 20, 0.08)',
              border:  '1px solid rgba(57, 255, 20, 0.2)',
              fontFamily:    "'Space Grotesk', sans-serif",
              fontSize:      '0.75rem',
              fontWeight:    700,
              color:         NEON_GREEN,
              letterSpacing: '0.5px',
            }}>
              {baseAsset}/USDT
            </Box>

            {coinData && (
              <Box sx={{
                px: 1.2, height: '28px', display: 'flex', alignItems: 'center', gap: 0.8,
                borderRadius: '6px',
                bgcolor: coinData.priceChangePercent >= 0
                  ? 'rgba(57, 255, 20, 0.06)'
                  : 'rgba(255, 61, 0, 0.08)',
                border: `1px solid ${coinData.priceChangePercent >= 0
                  ? 'rgba(57, 255, 20, 0.25)'
                  : 'rgba(255, 61, 0, 0.25)'}`,
              }}>
                <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.78rem', fontWeight: 700, color: '#f8fafc' }}>
                  ${fmtPrice(coinData.price)}
                </Typography>
                {coinData.priceChangePercent >= 0
                  ? <TrendingUpIcon   sx={{ fontSize: 12, color: NEON_GREEN }} />
                  : <TrendingDownIcon sx={{ fontSize: 12, color: NEON_RED   }} />}
                <Typography sx={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize:   '0.72rem',
                  fontWeight: 700,
                  color: coinData.priceChangePercent >= 0 ? NEON_GREEN : NEON_RED,
                }}>
                  {coinData.priceChangePercent >= 0 ? '+' : ''}{coinData.priceChangePercent.toFixed(2)}%
                </Typography>
              </Box>
            )}

            <Tooltip title="Refresh Price">
              <Button
                size="small"
                onClick={() => fetchCoinData(activeSymbol, false)}
                sx={{ minWidth: 28, height: 28, p: 0, color: NEON_GREEN }}
              >
                <RefreshIcon sx={{ fontSize: 16 }} className={isRefreshing ? 'spin-icon' : ''} />
              </Button>
            </Tooltip>
          </Box>
        </Box>

        {/* ── LIVE PRICE TICKER STRIP — identical to TradingAnalysis ── */}
        {coinData && (
          <Box sx={{
            display:        'flex',
            alignItems:     'center',
            flexShrink:     0,
            borderBottom:   '1px solid rgba(255,255,255,0.05)',
            bgcolor:        'rgba(8, 10, 18, 0.7)',
            backdropFilter: 'blur(12px)',
            overflowX:      'auto',
            '&::-webkit-scrollbar': { display: 'none' },
            width:          '100%',
            minWidth:       0,
          }}>
            {[
              { label: 'Price',       value: `$${fmtPrice(coinData.price)}`,                          color: '#f8fafc'  },
              { label: '24h High',    value: `$${fmtPrice(coinData.highPrice)}`,                      color: NEON_GREEN },
              { label: '24h Low',     value: `$${fmtPrice(coinData.lowPrice)}`,                       color: NEON_RED   },
              { label: 'Open',        value: `$${fmtPrice(coinData.openPrice)}`,                      color: NEON_CYAN  },
              { label: 'Volume',      value: `$${(coinData.quoteVolume / 1e6).toFixed(2)}M`,          color: '#f8fafc'  },
              { label: 'Pivot',       value: `$${fmtPrice(coinData.pivotPoint)}`,                     color: AMBER      },
              { label: 'Support',     value: `$${fmtPrice(coinData.supportLevel)}`,                   color: NEON_GREEN },
              { label: 'Resistance',  value: `$${fmtPrice(coinData.resistanceLevel)}`,                color: NEON_RED   },
              { label: 'Change',      value: `${coinData.priceChangePercent >= 0 ? '+' : ''}${coinData.priceChangePercent.toFixed(2)}%`, color: coinData.priceChangePercent >= 0 ? NEON_GREEN : NEON_RED },
            ].map((item, i) => (
              <Box key={i} sx={{
                display:        'flex',
                flexDirection:  'column',
                alignItems:     'center',
                justifyContent: 'center',
                px:             2.5,
                py:             0.8,
                flexShrink:     0,
                borderRight:    '1px solid rgba(255,255,255,0.05)',
                minWidth:       '90px',
              }}>
                <Typography sx={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', mb: 0.2 }}>
                  {item.label}
                </Typography>
                <Typography sx={{ fontSize: '0.78rem', color: item.color, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>
                  {item.value}
                </Typography>
              </Box>
            ))}
          </Box>
        )}

        {/* ── CALCULATOR WORKSPACE ── */}
        <Box sx={{
          flex:      1,
          overflowY: 'auto',
          p:         { xs: 2, sm: 2.5 },
          '&::-webkit-scrollbar':       { width: '6px' },
          '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(57,255,20,0.15)', borderRadius: '4px' },
        }}>
          {activeTab === 0 && (
            <PnlCalculatorTab
              selectedCoin={selectedCoin}
              coinSel={coinSel}
              entryPrice={entryPrice}       setEntryPrice={setEntryPrice}
              exitPrice={exitPrice}         setExitPrice={setExitPrice}
              positionType={positionType}   setPositionType={setPositionType}
              marketType={marketType}       setMarketType={setMarketType}
              exchangeName={exchangeName}   setExchangeName={setExchangeName}
              orderType={orderType}         setOrderType={setOrderType}
              leverage={leverage}           setLeverage={setLeverage}
              walletBalance={walletBalance} setWalletBalance={setWalletBalance}
              entryAmount={entryAmount}     setEntryAmount={setEntryAmount}
              walletPercent={walletPercent} setWalletPercent={setWalletPercent}
              hasTokenDiscount={hasTokenDiscount} setHasTokenDiscount={setHasTokenDiscount}
              stopLossPrice={stopLossPrice} setStopLossPrice={setStopLossPrice}
              currentPrice={coinData ? coinData.price : null}
            />
          )}

          {activeTab === 1 && (
            <RiskPositionSizeTab
              selectedCoin={selectedCoin}
              coinSel={coinSel}
              entryPrice={entryPrice}     setEntryPrice={setEntryPrice}
              positionType={positionType} setPositionType={setPositionType}
              currentPrice={coinData ? coinData.price : null}
            />
          )}

          {activeTab === 2 && (
            <TargetPriceTab
              selectedCoin={selectedCoin}
              coinSel={coinSel}
              entryPrice={entryPrice}     setEntryPrice={setEntryPrice}
              positionType={positionType} setPositionType={setPositionType}
              currentPrice={coinData ? coinData.price : null}
            />
          )}

          {activeTab === 3 && (
            <DcaCalculatorTab
              selectedCoin={selectedCoin}
              coinSel={coinSel}
              currentPrice={coinData ? coinData.price : null}
            />
          )}

          {activeTab === 4 && (
            <CompoundGrowthTab />
          )}

          {activeTab === 5 && (
            <ScaleOutCalculatorTab
              selectedCoin={selectedCoin}
              coinSel={coinSel}
              currentPrice={coinData ? coinData.price : null}
              entryPrice={entryPrice}
              setEntryPrice={setEntryPrice}
              positionType={positionType}
              setPositionType={setPositionType}
            />
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default TradingCalculator;