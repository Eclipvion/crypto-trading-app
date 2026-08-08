/**
 * Main Application Component
 * This is the root component of the crypto trading application that sets up:
 * - Theme configuration (Material UI dark theme with custom styling)
 * - Main layout structure
 * - State management for selected coin across components
 * - Horizontal live price ticker banner
 */
import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Typography, AppBar, Toolbar, IconButton } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import MarketData from './components/MarketData/MarketData';
import TradingCalculator from './components/TradingCalculator/TradingCalculator';
import TradingAnalysis from './components/TradingAnalysis/TradingAnalysis';
import Sidebar from './components/Sidebar/Sidebar';
import './App.css';

/**
 * Custom Material UI Theme Configuration
 * Defines a dark crypto trading theme with:
 * - Primary color: Neon Cyan (#00e5ff)
 * - Secondary color: Neon Red (#ff3d00)
 * - Dark background with custom component styling
 * - Enhanced hover effects and animations
 */
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00e5ff',
      light: '#33ebff',
      dark: '#00a0b2',
      contrastText: '#06090e',
    },
    secondary: {
      main: '#ff3d00',
      light: '#ff6333',
      dark: '#b22a00',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#08090d',
      paper: 'rgba(18, 22, 33, 0.65)',
    },
    text: {
      primary: '#f8fafc',
      secondary: '#94a3b8',
    },
    success: {
      main: '#00e676',
      light: '#33eb91',
      dark: '#00a152',
    },
    error: {
      main: '#ff3d00',
      light: '#ff6333',
      dark: '#b22a00',
    },
    divider: 'rgba(255, 255, 255, 0.05)',
  },
  typography: {
    fontFamily: '"Outfit", "Space Grotesk", "Inter", sans-serif',
    h4: {
      fontWeight: 700,
      letterSpacing: '0.5px',
      fontFamily: '"Space Grotesk", sans-serif',
    },
    h5: {
      fontWeight: 800,
      letterSpacing: '1px',
      fontFamily: '"Space Grotesk", sans-serif',
    },
    h6: {
      fontWeight: 600,
      letterSpacing: '0.25px',
      fontFamily: '"Space Grotesk", sans-serif',
    },
    subtitle1: {
      fontWeight: 500,
    },
    body1: {
      fontSize: '0.95rem',
      lineHeight: 1.5,
    },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    // Paper component styling (cards, dialogs, etc.)
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: 'rgba(18, 22, 33, 0.65)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
          '&:hover': {
            borderColor: 'rgba(255, 255, 255, 0.08)',
            boxShadow: '0 12px 40px 0 rgba(0, 0, 0, 0.45)',
          },
        },
      },
    },
    // Button component styling
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          padding: '10px 20px',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          borderRadius: 12,
        },
        containedPrimary: {
          backgroundColor: '#00e5ff',
          color: '#06090e',
          boxShadow: '0 4px 15px rgba(0, 229, 255, 0.2)',
          '&:hover': {
            backgroundColor: '#33ebff',
            transform: 'translateY(-2px)',
            boxShadow: '0 6px 20px rgba(0, 229, 255, 0.35)',
          },
        },
        containedSecondary: {
          backgroundColor: '#ff3d00',
          color: '#FFFFFF',
          boxShadow: '0 4px 15px rgba(255, 61, 0, 0.2)',
          '&:hover': {
            backgroundColor: '#ff6333',
            transform: 'translateY(-2px)',
            boxShadow: '0 6px 20px rgba(255, 61, 0, 0.35)',
          },
        },
        outlined: {
          borderColor: 'rgba(255, 255, 255, 0.1)',
          color: '#f8fafc',
          '&:hover': {
            borderColor: '#00e5ff',
            backgroundColor: 'rgba(0, 229, 255, 0.05)',
          },
        },
      },
    },
    // Text field styling
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: 'rgba(8, 10, 15, 0.4)',
            transition: 'all 0.3s ease',
            borderRadius: 12,
            '& fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.05)',
              transition: 'all 0.3s ease',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.12)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#00e5ff',
              borderWidth: '1px',
              boxShadow: '0 0 12px rgba(0, 229, 255, 0.15)',
            },
            '& input': {
              padding: '12px 14px',
            },
          },
        },
      },
    },
    // Toggle button styling
    MuiToggleButton: {
      styleOverrides: {
        root: {
          border: '1px solid rgba(255, 255, 255, 0.05)',
          color: '#94a3b8',
          textTransform: 'none',
          fontWeight: 500,
          borderRadius: 8,
          transition: 'all 0.3s ease',
          '&.Mui-selected': {
            backgroundColor: 'rgba(0, 229, 255, 0.08)',
            color: '#00e5ff',
            borderColor: 'rgba(0, 229, 255, 0.2)',
            fontWeight: 600,
            '&:hover': {
              backgroundColor: 'rgba(0, 229, 255, 0.12)',
            },
          },
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            color: '#f8fafc',
          },
        },
      },
    },
    // Table cell styling
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: 'rgba(255, 255, 255, 0.05)',
          padding: '12px 16px',
        },
        head: {
          fontWeight: 600,
          backgroundColor: 'rgba(8, 10, 15, 0.3)',
          color: '#94a3b8',
          fontFamily: '"Space Grotesk", sans-serif',
          textTransform: 'uppercase',
          fontSize: '0.75rem',
          letterSpacing: '0.5px',
        },
      },
    },
    // Chip component styling
    MuiChip: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: 8,
          fontWeight: 600,
          fontSize: '0.8rem',
          '&.positive': {
            backgroundColor: 'rgba(0, 230, 118, 0.08)',
            color: '#00e676',
            borderColor: 'rgba(0, 230, 118, 0.15)',
          },
          '&.negative': {
            backgroundColor: 'rgba(255, 61, 0, 0.08)',
            color: '#ff3d00',
            borderColor: 'rgba(255, 61, 0, 0.15)',
          },
        },
      },
    },
  },
});

/**
 * PriceTicker Component
 * Renders a horizontal marquee scrolling live price banner.
 */
function PriceTicker() {
  const [tickers, setTickers] = useState([
    { symbol: 'BTCUSDT', name: 'BTC', price: 0, change: 0 },
    { symbol: 'ETHUSDT', name: 'ETH', price: 0, change: 0 },
    { symbol: 'SOLUSDT', name: 'SOL', price: 0, change: 0 },
    { symbol: 'BNBUSDT', name: 'BNB', price: 0, change: 0 },
    { symbol: 'XRPUSDT', name: 'XRP', price: 0, change: 0 },
    { symbol: 'ADAUSDT', name: 'ADA', price: 0, change: 0 },
    { symbol: 'DOGEUSDT', name: 'DOGE', price: 0, change: 0 }
  ]);

  useEffect(() => {
    const fetchTickers = async () => {
      try {
        const response = await fetch('https://api.binance.com/api/v3/ticker/24hr');
        const data = await response.json();

        setTickers(prev => prev.map(ticker => {
          const coinData = data.find(c => c.symbol === ticker.symbol);
          if (coinData) {
            return {
              ...ticker,
              price: parseFloat(coinData.lastPrice),
              change: parseFloat(coinData.priceChangePercent)
            };
          }
          return ticker;
        }));
      } catch (err) {
        console.error('Error fetching ticker prices:', err);
      }
    };

    fetchTickers();
    const interval = setInterval(fetchTickers, 10000); // update every 10 seconds
    return () => clearInterval(interval);
  }, []);

  // Duplicate tickers to create a seamless scrolling loop
  const doubleTickers = [...tickers, ...tickers, ...tickers];

  return (
    <Box className="ticker-wrap">
      <Box className="ticker-move">
        {doubleTickers.map((ticker, index) => (
          <Box key={index} className="ticker-item">
            <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', fontFamily: '"Space Grotesk", sans-serif' }}>
              {ticker.name}/USDT
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: '"Space Grotesk", sans-serif', color: 'primary.light' }}>
              ${ticker.price > 0 ? (ticker.price > 1 ? ticker.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ticker.price.toFixed(4)) : '...'}
            </Typography>
            <Typography variant="caption" className={ticker.change >= 0 ? 'positive-change' : 'negative-change'} sx={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center' }}>
              {ticker.change >= 0 ? '+' : ''}{ticker.change.toFixed(2)}%
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

/**
 * App Component
 * Main application component that sets up the overall structure and maintains shared state
 */
function App() {
  // State for the selected coin (full object)
  const [selectedCoin, setSelectedCoin] = useState(null);

  // State for just the coin name (for display purposes)
  const [coinSel, setCoinSel] = useState('');

  // Shared states for position lines between calculator and chart
  const [calcEntryPrice, setCalcEntryPrice] = useState('');
  const [calcExitPrice, setCalcExitPrice] = useState('');
  const [calcPositionType, setCalcPositionType] = useState('long');

  // State for mobile menu sliding drawer
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // View mode state: 'market', 'analysis', 'calculator'
  const [viewMode, setViewMode] = useState('market');

  // Shared state for all available coins (USDT pairs)
  const [availableCoins, setAvailableCoins] = useState([]);

  // Favorites list backed by localStorage with fallback and format validation
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('fav_coins');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.every(x => typeof x === 'string')) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error loading favorites from localStorage:', e);
    }
    return ['BTC', 'ETH', 'SOL', 'BNB'];
  });

  const toggleFavorite = (coinName) => {
    if (!coinName) return;
    setFavorites(prev => {
      const next = prev.includes(coinName)
        ? prev.filter(c => c !== coinName)
        : [...prev, coinName];
      localStorage.setItem('fav_coins', JSON.stringify(next));
      return next;
    });
  };

  // Live navbar stats state
  const [globalStats, setGlobalStats] = useState({ mcap: '$2.54T', change: 1.8, loading: true });
  const [fearGreed, setFearGreed] = useState({ value: 68, classification: 'Greed', loading: true });
  const [gasFees, setGasFees] = useState({ value: 18, loading: true });

  // Fetch real-time statistics for the navbar
  useEffect(() => {
    const fetchNavbarData = async () => {
      // 1. Fetch Global Market Cap (from Coinlore API, fallback to CoinGecko, or keep default)
      try {
        const res = await fetch('https://api.coinlore.net/api/global/');
        if (res.ok) {
          const data = await res.json();
          if (data && data[0]) {
            const mcapTrillion = (data[0].total_mcap / 1e12).toFixed(2);
            const change = parseFloat(data[0].mcap_change);
            setGlobalStats({ mcap: `$${mcapTrillion}T`, change, loading: false });
          }
        }
      } catch (e) {
        console.warn('Error fetching global mcap from Coinlore:', e);
      }

      // 2. Fetch Fear & Greed Index
      try {
        const res = await fetch('https://api.alternative.me/fng/');
        if (res.ok) {
          const data = await res.json();
          if (data && data.data && data.data[0]) {
            const value = parseInt(data.data[0].value, 10);
            const classification = data.data[0].value_classification;
            setFearGreed({ value, classification, loading: false });
          }
        }
      } catch (e) {
        console.warn('Error fetching fear & greed:', e);
      }

      // 3. Fetch ETH Gas Fee (using Cloudflare public RPC node)
      try {
        const res = await fetch('https://cloudflare-eth.com', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'eth_gasPrice',
            params: []
          })
        });
        if (res.ok) {
          const json = await res.json();
          if (json && json.result) {
            const gasPriceWei = parseInt(json.result, 16);
            const gasPriceGwei = Math.round(gasPriceWei / 1e9);
            setGasFees({ value: gasPriceGwei, loading: false });
          }
        }
      } catch (e) {
        console.warn('Error fetching ETH gas price:', e);
      }
    };

    fetchNavbarData();
    const interval = setInterval(fetchNavbarData, 30000); // refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Fetch exchangeInfo once on mount
  useEffect(() => {
    const fetchAvailableCoins = async () => {
      try {
        const res = await fetch('https://api.binance.com/api/v3/exchangeInfo');
        const data = await res.json();
        const pairs = data.symbols
          .filter(s => s.status === 'TRADING' && s.quoteAsset === 'USDT')
          .map(s => ({ symbol: s.symbol, baseAsset: s.baseAsset, quoteAsset: s.quoteAsset }))
          .sort((a, b) => a.baseAsset.localeCompare(b.baseAsset));
        setAvailableCoins(pairs);
        if (pairs.length) {
          const defaultCoin = pairs.find(p => p.baseAsset === 'BTC') || pairs[0];
          setSelectedCoin(defaultCoin);
          setCoinSel(defaultCoin.baseAsset);
        }
      } catch (e) {
        console.error('Error fetching exchange info:', e);
      }
    };
    fetchAvailableCoins();
  }, []);

  // Add viewport meta tag for proper mobile responsiveness
  useEffect(() => {
    let viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.name = 'viewport';
      viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0';
      document.head.appendChild(viewport);
    } else {
      viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0';
    }
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      {/* App Header - Glassmorphic Toolbar */}
      <AppBar position="static" sx={{
        background: 'rgba(8, 10, 15, 0.7) !important',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        boxShadow: 'none',
        py: 0.5
      }}>
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', px: { xs: 2, sm: 3 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={() => setMobileMenuOpen(true)}
              sx={{ display: { md: 'none' }, mr: 1, color: 'var(--neon-cyan)', p: 0.5 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h5" component="div" sx={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 800,
              letterSpacing: '1.5px',
              display: 'flex',
              alignItems: 'center',
              gap: 1.5
            }}>
              <Box component="span" sx={{
                background: 'linear-gradient(135deg, #00e5ff 0%, #7c4dff 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textTransform: 'uppercase'
              }}>
                Eclipvion
              </Box>
              <Box component="span" sx={{
                color: 'text.secondary',
                fontSize: '0.8rem',
                fontWeight: 700,
                letterSpacing: '1.5px',
                px: 1.2,
                py: 0.3,
                borderRadius: '6px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'rgba(255, 255, 255, 0.02)',
                fontFamily: "'Space Grotesk', sans-serif"
              }}>
                TRADE
              </Box>
            </Typography>
            <Box sx={{
              bgcolor: 'rgba(0, 229, 255, 0.1)',
              color: '#00e5ff',
              fontSize: '0.75rem',
              px: 1.5,
              py: 0.2,
              borderRadius: '99px',
              border: '1px solid rgba(0, 229, 255, 0.2)',
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 600,
              letterSpacing: '0.5px'
            }}>
              v2026.1
            </Box>
          </Box>

          {/* Global Navbar Stats (Global Market Cap, Fear & Greed Index, Network Gas Fees) */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 3, mx: 'auto' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '0.5px' }}>
                GLOBAL MCAP:
              </Typography>
              <Typography variant="caption" sx={{ color: '#f8fafc', fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>
                {globalStats.mcap}
              </Typography>
              <Typography variant="caption" sx={{ color: globalStats.change >= 0 ? 'success.main' : 'error.main', fontWeight: 700, fontSize: '0.7rem', fontFamily: "'Space Grotesk', sans-serif" }}>
                {globalStats.change >= 0 ? '+' : ''}{globalStats.change.toFixed(1)}%
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '0.5px' }}>
                FEAR & GREED:
              </Typography>
              <Typography variant="caption" sx={{ 
                color: fearGreed.value >= 75 ? 'success.main' : fearGreed.value >= 55 ? '#ffab00' : '#ff3d00', 
                fontWeight: 700, 
                fontFamily: "'Space Grotesk', sans-serif" 
              }}>
                {fearGreed.value} ({fearGreed.classification})
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '0.5px' }}>
                GAS FEES:
              </Typography>
              <Typography variant="caption" sx={{ color: '#00e5ff', fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>
                {gasFees.value} Gwei
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box className="breathing-glow-green" sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: '#00e676',
              boxShadow: '0 0 10px #00e676',
            }} />
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '0.5px' }}>
              EcliFeed Live
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Horizontal Price Ticker Carousel */}
      <PriceTicker />

      {/* Main application container */}
      <Box className="app-container">
        {/* Dashboard Wrapper: Sidebar + Main Content */}
        <Box className="dashboard-wrapper">
          {/* Mobile backdrop blur overlay */}
          {mobileMenuOpen && (
            <Box 
              onClick={() => setMobileMenuOpen(false)}
              sx={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                bgcolor: 'rgba(5, 7, 10, 0.6)',
                backdropFilter: 'blur(6px)',
                zIndex: 9999,
                transition: 'all 0.3s ease'
              }}
            />
          )}

          {/* Left Sidebar Navigation */}
          <Sidebar 
            viewMode={viewMode} 
            onViewModeChange={setViewMode} 
            availableCoins={availableCoins}
            onCoinSelect={setSelectedCoin}
            onCoinSelChange={setCoinSel}
            currentSymbol={coinSel}
            favorites={favorites}
            mobileMenuOpen={mobileMenuOpen}
            onMobileMenuClose={() => setMobileMenuOpen(false)}
          />

          {/* Main Content Area */}
          <Box className="main-content-area">

            {/* Trading layout with market data, analysis and calculator sections */}
            <Box className={`trading-layout ${viewMode}-view`}>
              {/* Market data section */}
              {viewMode === 'market' && (
                <Box className="market-data-section">
                  <MarketData 
                    availableCoins={availableCoins}
                    onCoinSelect={setSelectedCoin} 
                    onCoinSelChange={setCoinSel}
                    selectedCoin={selectedCoin}
                    favorites={favorites}
                    onToggleFavorite={toggleFavorite}
                  />
                </Box>
              )}
              
              {/* Trading Analysis section */}
              {viewMode === 'analysis' && (
                <Box className="analysis-section">
                  <TradingAnalysis 
                    selectedCoin={selectedCoin} 
                    coinSel={coinSel}
                    availableCoins={availableCoins}
                    onCoinSelect={setSelectedCoin}
                    onCoinSelChange={setCoinSel}
                    calcEntryPrice={calcEntryPrice}
                    calcExitPrice={calcExitPrice}
                    calcPositionType={calcPositionType}
                  />
                </Box>
              )}
              
              {/* Trading calculator section */}
              {viewMode === 'calculator' && (
                <Box className="calculator-section">
                  <TradingCalculator 
                    selectedCoin={selectedCoin} 
                    coinSel={coinSel}
                    availableCoins={availableCoins}
                    onCoinSelect={setSelectedCoin}
                    onCoinSelChange={setCoinSel}
                    calcEntryPrice={calcEntryPrice}
                    setCalcEntryPrice={setCalcEntryPrice}
                    calcExitPrice={calcExitPrice}
                    setCalcExitPrice={setCalcExitPrice}
                    calcPositionType={calcPositionType}
                    setCalcPositionType={setCalcPositionType}
                  />
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;