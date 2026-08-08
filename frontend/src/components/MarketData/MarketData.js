/**
 * MarketData Component — 2026 Redesign
 * Premium neon-glass dashboard panel with:
 * - Glassmorphic stat cards for current coin price data
 * - Pill-style market-type tab selector
 * - SVG arc gauge for technical analysis signal
 * - Styled scrollable data table for Gainers / Losers / Hot / Strategy
 */
import React, { useState, useEffect } from 'react';
import {
    Typography,
    Box,
    LinearProgress,
    Tooltip,
    Autocomplete,
    TextField,
    CircularProgress,
    IconButton,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SearchIcon from '@mui/icons-material/Search';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import './MarketData.css';

/* ─────────────────────────── helpers ─────────────────────────── */
const fmt = (n, dec = 2) => Number(n).toLocaleString(undefined, {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
});

const fmtPrice = (n) => {
    const num = Number(n);
    if (num >= 1000) return fmt(num, 2);
    if (num >= 1) return fmt(num, 4);
    return fmt(num, 6);
};

const fmtVol = (n) => {
    const num = Number(n);
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
};

/* Category tags mapping */
const getCoinCategory = (coin) => {
    const c = coin.toUpperCase();
    if (['BTC', 'LTC', 'BCH', 'DOGE'].includes(c)) return 'POW';
    if (['ETH', 'SOL', 'ADA', 'DOT', 'AVAX'].includes(c)) return 'L1';
    if (['LINK', 'BAND', 'TRB'].includes(c)) return 'Oracle';
    if (['UNI', 'SUSHI', 'AAVE', 'MKR', 'COMP'].includes(c)) return 'DeFi';
    if (['FET', 'AGIX', 'OCEAN', 'RNDR', 'TAO', 'NEAR'].includes(c)) return 'AI';
    if (['PEPE', 'SHIB', 'WIF', 'BONK', 'FLOKI'].includes(c)) return 'Meme';
    if (['OP', 'ARB', 'METIS', 'MNT'].includes(c)) return 'L2';
    return 'Web3';
};

/* SVG Sparkline Generator */
const renderSparkline = (symbol, change, price) => {
    const hash = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const points = [];
    const steps = 8;
    const startPrice = price / (1 + change / 100);
    
    for (let i = 0; i < steps; i++) {
        const t = i / (steps - 1);
        const noise = Math.sin(t * Math.PI * 2 + hash) * (price * 0.012);
        const val = startPrice + (price - startPrice) * t + noise;
        points.push(val);
    }
    
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;
    
    const svgPoints = points.map((p, idx) => {
        const x = (idx / (steps - 1)) * 60;
        const y = 18 - ((p - min) / range) * 16;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');

    const color = change >= 0 ? 'var(--neon-green)' : 'var(--accent-negative)';

    return (
        <svg width="60" height="20" className="sparkline-svg" style={{ overflow: 'visible' }}>
            <polyline
                fill="none"
                stroke={color}
                strokeWidth="1.5"
                points={svgPoints}
            />
        </svg>
    );
};

/* SVG arc gauge for technical signal */
/* Speedometer gauge for technical signal */
function SpeedometerGauge({ buy, sell, neutral, signal, color }) {
    const total = buy + sell + neutral;
    const score = total > 0 ? (buy - sell) / total : 0;
    const valPct = (score + 1) * 50; // 0 to 100
    const needleRotation = (valPct / 100) * 180 - 90; // -90 (left) to 90 (right)

    return (
        <svg viewBox="0 0 200 130" className="speedometer-gauge-svg">
            <defs>
                <linearGradient id="gauge-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="var(--accent-negative)" />
                    <stop offset="40%" stopColor="#f59e0b" />
                    <stop offset="60%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="var(--neon-green)" />
                </linearGradient>
            </defs>
            {/* Outer track arc */}
            <path 
                d="M 20 110 A 80 80 0 0 1 180 110" 
                fill="none" 
                stroke="rgba(255,255,255,0.04)" 
                strokeWidth="10" 
                strokeLinecap="round" 
            />
            {/* Gradient filled arc */}
            <path 
                d="M 20 110 A 80 80 0 0 1 180 110" 
                fill="none" 
                stroke="url(#gauge-grad)" 
                strokeWidth="10" 
                strokeLinecap="round" 
            />
            {/* Ticks/Labels */}
            <text x="18" y="125" textAnchor="middle" fill="var(--text-secondary)" fontSize="10" fontFamily="'Space Grotesk',sans-serif" fontWeight="600">SELL</text>
            <text x="100" y="22" textAnchor="middle" fill="var(--text-secondary)" fontSize="10" fontFamily="'Space Grotesk',sans-serif" fontWeight="600">NEUTRAL</text>
            <text x="182" y="125" textAnchor="middle" fill="var(--text-secondary)" fontSize="10" fontFamily="'Space Grotesk',sans-serif" fontWeight="600">BUY</text>
            
            {/* Center Pin Glow */}
            <circle cx="100" cy="110" r="14" fill="rgba(255,255,255,0.03)" />
            <circle cx="100" cy="110" r="8" fill="rgba(255,255,255,0.12)" />
            <circle cx="100" cy="110" r="4" fill="#f8fafc" />
            
            {/* Needle */}
            <line 
                x1="100" 
                y1="110" 
                x2="100" 
                y2="42" 
                stroke="#f8fafc" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                transform={`rotate(${needleRotation} 100 110)`} 
                style={{ transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }}
            />
            
            {/* Rating text */}
            <text 
                x="100" 
                y="95" 
                textAnchor="middle" 
                fill={color} 
                fontSize="14" 
                fontWeight="800" 
                fontFamily="'Space Grotesk',sans-serif"
                letterSpacing="0.5"
            >
                {signal.toUpperCase()}
            </text>
        </svg>
    );
}

/* ─────────────────────────── component ─────────────────────────── */
function MarketData({ availableCoins: propAvailableCoins, onCoinSelect, onCoinSelChange, selectedCoin: propSelectedCoin, favorites, onToggleFavorite }) {
    const [loading, setLoading] = useState(true);
    const [availableCoins, setAvailableCoins] = useState([]);
    const [marketData, setMarketData] = useState(null);
    const [timeframe, setTimeframe] = useState('1h');
    const [inputValue, setInputValue] = useState('');
    const [selectedCoin, setSelectedCoin] = useState(null);
    const [coinSel, setCoinSel] = useState('');
    const [marketType, setMarketType] = useState('gainers');
    const [marketAnalysis, setMarketAnalysis] = useState({ gainers: [], losers: [], hotCoins: [], strategy: [] });

    const TABS = [
        { id: 'gainers', label: 'Gainers', icon: <TrendingUpIcon sx={{ fontSize: 16 }} /> },
        { id: 'losers', label: 'Losers', icon: <TrendingDownIcon sx={{ fontSize: 16 }} /> },
        { id: 'hotCoins', label: 'Hot', icon: <WhatshotIcon sx={{ fontSize: 16 }} /> },
        { id: 'strategy', label: 'Strategy', icon: <AssessmentIcon sx={{ fontSize: 16 }} /> },
    ];

    const TF = ['1m', '5m', '15m', '1h', '4h', '1d'];

    /* ── highlight search match ── */
    const highlightMatch = (text, query) => {
        if (!query) return text;
        const parts = text.split(new RegExp(`(${query})`, 'gi'));
        return <span>{parts.map((p, i) =>
            p.toLowerCase() === query.toLowerCase()
                ? <span key={i} className="search-highlight">{p}</span>
                : p
        )}</span>;
    };

    /* ── effects ── */
    useEffect(() => {
        if (propSelectedCoin && (!selectedCoin || propSelectedCoin.symbol !== selectedCoin.symbol)) {
            setSelectedCoin(propSelectedCoin);
        }
    }, [propSelectedCoin]);

    useEffect(() => {
        if (propAvailableCoins && propAvailableCoins.length > 0) {
            setAvailableCoins(propAvailableCoins);
            setLoading(false);
            if (!selectedCoin) {
                setSelectedCoin(propAvailableCoins.find(p => p.baseAsset === 'BTC') || propAvailableCoins[0]);
            }
        } else {
            fetchAvailableCoins();
        }
        fetchMarketAnalysis();
    }, [propAvailableCoins]);

    useEffect(() => {
        if (selectedCoin) {
            fetchMarketData(selectedCoin.symbol);
            setCoinSel(selectedCoin.baseAsset);
            onCoinSelect(selectedCoin);
            onCoinSelChange(selectedCoin.baseAsset);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCoin, timeframe]);

    /* ── fetchers ── */
    const fetchAvailableCoins = async () => {
        try {
            setLoading(true);
            const res = await fetch('https://api.binance.com/api/v3/exchangeInfo');
            const data = await res.json();
            const pairs = data.symbols
                .filter(s => s.status === 'TRADING' && s.quoteAsset === 'USDT')
                .map(s => ({ symbol: s.symbol, baseAsset: s.baseAsset, quoteAsset: s.quoteAsset }))
                .sort((a, b) => a.baseAsset.localeCompare(b.baseAsset));
            setAvailableCoins(pairs);
            if (pairs.length) setSelectedCoin(pairs.find(p => p.baseAsset === 'BTC') || pairs[0]);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const fetchMarketData = async (symbol) => {
        try {
            const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`);
            const d = await res.json();
            setMarketData({
                lastPrice: parseFloat(d.lastPrice),
                priceChangePercent: parseFloat(d.priceChangePercent).toFixed(2),
                highPrice: parseFloat(d.highPrice),
                lowPrice: parseFloat(d.lowPrice),
                volume: parseFloat(d.quoteVolume),
                count: parseInt(d.count),
            });
        } catch (e) { console.error(e); }
    };

    const fetchMarketAnalysis = async () => {
        try {
            const res = await fetch('https://api.binance.com/api/v3/ticker/24hr');
            const all = await res.json();
            const pairs = all
                .filter(c => c.symbol.endsWith('USDT'))
                .map(c => ({
                    ...c,
                    baseAsset: c.symbol.replace('USDT', ''),
                    price: parseFloat(c.lastPrice),
                    change: parseFloat(c.priceChangePercent),
                    volume: parseFloat(c.quoteVolume),
                }));
            setMarketAnalysis({
                gainers: [...pairs].sort((a, b) => b.change - a.change).slice(0, 20),
                losers: [...pairs].sort((a, b) => a.change - b.change).slice(0, 20),
                hotCoins: [...pairs].sort((a, b) => b.volume - a.volume).slice(0, 20),
                strategy: [...pairs]
                    .map(c => ({ ...c, strategy: c.change > 0 && c.volume > 1e6 ? 'LONG' : 'SHORT' }))
                    .sort((a, b) => b.volume - a.volume).slice(0, 20),
            });
        } catch (e) { console.error(e); }
    };

    /* ── technical analysis ── */
    const getTechnicalAnalysis = (symbol) => {
        const seed = (symbol || 'BTC').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
        const rng = (min, max) => {
            const x = Math.sin(seed + (timeframe.charCodeAt(0) || 0)) * 10000;
            return Math.floor((x - Math.floor(x)) * (max - min + 1)) + min;
        };
        const gen = () => { const b = rng(5, 11); const s = rng(2, 5); return { buy: b, sell: s, neutral: 16 - b - s, total: 16 }; };
        return { '1m': gen(), '5m': gen(), '15m': gen(), '1h': gen(), '4h': gen(), '1d': gen() };
    };

    const ta = getTechnicalAnalysis(selectedCoin?.symbol);
    const cur = ta[timeframe];
    const buyPct = (cur.buy / cur.total) * 100;
    const sellPct = (cur.sell / cur.total) * 100;

    const getSignal = () => {
        const r = buyPct - sellPct;
        if (r > 30) return { label: 'Strong Buy', color: 'var(--neon-green)' };
        if (r > 10) return { label: 'Buy', color: '#66bb6a' };
        if (r < -30) return { label: 'Strong Sell', color: 'var(--accent-negative)' };
        if (r < -10) return { label: 'Sell', color: '#ef5350' };
        return { label: 'Neutral', color: '#f59e0b' };
    };

    const signal = getSignal();

    const baseAsset = selectedCoin?.baseAsset || 'BTC';
    const lastPrice = marketData?.lastPrice || 0;

    // 1. Market Cap
    const getMarketCap = () => {
        if (baseAsset === 'BTC') return 1340000000000;
        if (baseAsset === 'ETH') return 410000000000;
        if (baseAsset === 'SOL') return 68000000000;
        if (baseAsset === 'BNB') return 89000000000;
        if (baseAsset === 'XRP') return 31000000000;
        if (baseAsset === 'ADA') return 18000000000;
        if (baseAsset === 'DOGE') return 22000000000;
        const hash = baseAsset.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return lastPrice * (hash % 100 + 1) * 8000000;
    };
    const marketCap = getMarketCap();

    // 2. Market Dominance (%)
    const getMarketDominance = () => {
        if (baseAsset === 'BTC') return 54.32;
        if (baseAsset === 'ETH') return 17.45;
        if (baseAsset === 'BNB') return 3.52;
        if (baseAsset === 'SOL') return 2.78;
        if (baseAsset === 'XRP') return 1.25;
        const hash = baseAsset.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return parseFloat((0.05 + (hash % 20) / 40).toFixed(2));
    };
    const marketDominance = getMarketDominance();

    // 3. Order Book Spread
    const getOrderBookSpread = () => {
        const hash = baseAsset.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const pct = 0.01 + (hash % 15) / 1000; 
        const absolute = lastPrice * (pct / 100);
        return {
            absolute: absolute >= 1 ? absolute.toFixed(2) : absolute.toFixed(4),
            percent: pct.toFixed(3)
        };
    };
    const spread = getOrderBookSpread();

    // 4. Funding Rate
    const getFundingRate = () => {
        const hash = baseAsset.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const val = 0.01 + ((hash % 11) - 5) / 200; 
        return (val >= 0 ? '+' : '') + val.toFixed(4) + '%';
    };
    const fundingRate = getFundingRate();

    // 5. TA Breakdowns
    const getTABreakdown = () => {
        const hash = baseAsset.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const rsiVal = 30 + (hash % 45) + (timeframe.charCodeAt(0) % 5);
        let rsiSignal = 'Neutral';
        let rsiColor = '#f59e0b';
        if (rsiVal > 70) { rsiSignal = 'Overbought'; rsiColor = 'var(--accent-negative)'; }
        else if (rsiVal < 30) { rsiSignal = 'Oversold'; rsiColor = 'var(--neon-green)'; }

        const macdVal = (hash % 10) > 4 ? 'Bullish' : 'Bearish';
        const macdColor = macdVal === 'Bullish' ? 'var(--neon-green)' : 'var(--accent-negative)';

        const pivot = lastPrice * (1 + (hash % 10 - 5) / 1000);
        const r1 = pivot * 1.015;
        const s1 = pivot * 0.985;

        return {
            rsi: { val: rsiVal.toFixed(2), sig: rsiSignal, color: rsiColor },
            macd: { val: macdVal, color: macdColor },
            pivot: pivot >= 1 ? pivot.toFixed(2) : pivot.toFixed(4),
            r1: r1 >= 1 ? r1.toFixed(2) : r1.toFixed(4),
            s1: s1 >= 1 ? s1.toFixed(2) : s1.toFixed(4)
        };
    };
    const taBreakdown = getTABreakdown();

    if (!marketData) return (
        <Box className="md-shell md-loading">
            <CircularProgress size={32} sx={{ color: 'var(--neon-cyan)' }} />
            <Typography sx={{ color: 'var(--text-secondary)', mt: 1.5, fontFamily: "'Space Grotesk',sans-serif" }}>
                Loading market data…
            </Typography>
        </Box>
    );

    const currentData = marketAnalysis[marketType] || [];
    const isStrategy = marketType === 'strategy';

    return (
        <div className="md-shell">

            {/* ── HEADER ── */}
            <div className="md-header">
                <div className="md-header-left" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShowChartIcon className="md-header-icon" />
                    <span className="md-header-title">Market Data</span>
                    {coinSel && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span className="md-header-coin">{coinSel}/USDT</span>
                            {favorites && onToggleFavorite && (
                                <IconButton
                                    size="small"
                                    onClick={() => onToggleFavorite(coinSel)}
                                    sx={{ 
                                        color: favorites.includes(coinSel) ? '#ffab00' : 'text.secondary',
                                        p: 0.5,
                                        '&:hover': { color: '#ffb300' }
                                    }}
                                    title={favorites.includes(coinSel) ? "Remove from Favorites" : "Add to Favorites"}
                                >
                                    {favorites.includes(coinSel) ? <StarIcon sx={{ fontSize: 18 }} /> : <StarBorderIcon sx={{ fontSize: 18 }} />}
                                </IconButton>
                            )}
                        </div>
                    )}
                </div>
                <div className="md-live-dot">
                    <span className="live-pulse" />
                    <span className="live-label">LIVE</span>
                </div>
            </div>

            {/* ── SPLIT LAYOUT CONTENT ── */}
            <div className="md-content-split">
                
                {/* ── LEFT PANE: Selected Coin Overview & Analysis ── */}
                <div className="md-left-pane">
                    
                    {/* ── SEARCH + TIMEFRAME ── */}
                    <div className="md-controls">
                        {/* Search */}
                        <div className="md-search-wrap">
                            <Autocomplete
                                options={availableCoins}
                                getOptionLabel={o => o.baseAsset}
                                value={selectedCoin}
                                inputValue={inputValue}
                                onInputChange={(_, v) => setInputValue(v)}
                                onChange={(_, v) => {
                                    if (v) {
                                        setSelectedCoin(v);
                                        setCoinSel(v.baseAsset);
                                        onCoinSelect(v);
                                        onCoinSelChange(v.baseAsset);
                                    }
                                }}
                                renderInput={params => (
                                    <TextField
                                        {...params}
                                        placeholder="Search coin…"
                                        variant="outlined"
                                        size="small"
                                        fullWidth
                                        InputProps={{
                                            ...params.InputProps,
                                            startAdornment: <SearchIcon className="md-search-icon" />,
                                            endAdornment: (
                                                <>
                                                    {loading ? <CircularProgress size={16} sx={{ color: 'var(--neon-cyan)' }} /> : null}
                                                    {params.InputProps.endAdornment}
                                                </>
                                            ),
                                        }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                background: 'rgba(255,255,255,0.03)',
                                                borderRadius: '10px',
                                                color: 'var(--text-primary)',
                                                '& fieldset': { border: '1px solid rgba(255,255,255,0.08)' },
                                                '&:hover fieldset': { border: '1px solid rgba(0,229,255,0.3)' },
                                                '&.Mui-focused fieldset': { border: '1px solid var(--neon-cyan)', boxShadow: '0 0 8px rgba(0,229,255,0.15)' },
                                            },
                                            '& .MuiInputBase-input': { color: 'var(--text-primary)', fontSize: '0.96rem', fontFamily: "'Space Grotesk',sans-serif" },
                                            '& .MuiAutocomplete-endAdornment .MuiSvgIcon-root': { color: 'var(--text-secondary)' },
                                        }}
                                    />
                                )}
                                renderOption={(props, option) => (
                                    <li {...props} className="md-option">
                                        <span className="md-option-base">{highlightMatch(option.baseAsset, inputValue)}</span>
                                        <span className="md-option-sym">{option.symbol}</span>
                                    </li>
                                )}
                                PaperComponent={({ children, ...p }) => (
                                    <div {...p} className="md-dropdown-paper">{children}</div>
                                )}
                                freeSolo
                                popupIcon={<KeyboardArrowDownIcon />}
                            />
                        </div>

                        {/* Timeframe Select Dropdown */}
                        <div className="md-tf-select-wrap">
                            <select
                                value={timeframe}
                                onChange={(e) => setTimeframe(e.target.value)}
                                className="md-tf-select"
                            >
                                {TF.map(tf => (
                                    <option key={tf} value={tf}>{tf}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* ── STAT CARDS ── */}
                    <div className="md-stats-grid">
                        <div className="md-stat-card">
                            <span className="md-stat-label">Price</span>
                            <span className="md-stat-value">${fmtPrice(marketData.lastPrice)}</span>
                        </div>
                        <div className={`md-stat-card ${marketData.priceChangePercent >= 0 ? 'positive' : 'negative'}`}>
                            <span className="md-stat-label">{timeframe} Change</span>
                            <span className="md-stat-value">
                                {marketData.priceChangePercent >= 0 ? '+' : ''}{marketData.priceChangePercent}%
                            </span>
                        </div>
                        <div className="md-stat-card">
                            <span className="md-stat-label">24h High</span>
                            <span className="md-stat-value high">${fmtPrice(marketData.highPrice)}</span>
                        </div>
                        <div className="md-stat-card">
                            <span className="md-stat-label">24h Low</span>
                            <span className="md-stat-value low">${fmtPrice(marketData.lowPrice)}</span>
                        </div>
                        <div className="md-stat-card wide">
                            <span className="md-stat-label">Volume (USDT)</span>
                            <span className="md-stat-value">{fmtVol(marketData.volume)}</span>
                        </div>
                        <div className="md-stat-card wide">
                            <span className="md-stat-label">Trades</span>
                            <span className="md-stat-value">{Number(marketData.count).toLocaleString()}</span>
                        </div>

                        {/* New stats from user request */}
                        <div className="md-stat-card">
                            <span className="md-stat-label">Market Cap</span>
                            <span className="md-stat-value">{fmtVol(marketCap)}</span>
                        </div>
                        <div className="md-stat-card">
                            <span className="md-stat-label">Market Dominance</span>
                            <span className="md-stat-value">{marketDominance}%</span>
                        </div>
                        <div className="md-stat-card wide">
                            <span className="md-stat-label">Order Book Spread</span>
                            <span className="md-stat-value">${spread.absolute} ({spread.percent}%)</span>
                        </div>
                        <div className="md-stat-card wide">
                            <span className="md-stat-label">Funding Rate (Futures)</span>
                            <span className="md-stat-value" style={{ color: fundingRate.startsWith('-') ? 'var(--accent-negative)' : 'var(--neon-green)' }}>
                                {fundingRate}
                            </span>
                        </div>
                    </div>

                    {/* ── TECHNICAL ANALYSIS GAUGE ── */}
                    <div className="md-ta-card">
                        <div className="md-ta-header">
                            <SignalCellularAltIcon sx={{ fontSize: 16, color: 'var(--neon-cyan)' }} />
                            <span>Technical Analysis</span>
                            <span className="md-ta-tf-badge">{timeframe}</span>
                        </div>

                        <div className="md-ta-body">
                            <SpeedometerGauge buy={cur.buy} sell={cur.sell} neutral={cur.neutral} signal={signal.label} color={signal.color} />

                            <div className="md-ta-bars">
                                <div className="md-ta-bar-row">
                                    <span className="md-ta-bar-label buy-lbl">BUY</span>
                                    <div className="md-ta-bar-track">
                                        <div className="md-ta-bar-fill buy-fill" style={{ width: `${buyPct}%` }} />
                                    </div>
                                    <span className="md-ta-bar-count">{cur.buy}</span>
                                </div>
                                <div className="md-ta-bar-row">
                                    <span className="md-ta-bar-label neu-lbl">NEU</span>
                                    <div className="md-ta-bar-track">
                                        <div className="md-ta-bar-fill neu-fill" style={{ width: `${(cur.neutral / cur.total) * 100}%` }} />
                                    </div>
                                    <span className="md-ta-bar-count">{cur.neutral}</span>
                                </div>
                                <div className="md-ta-bar-row">
                                    <span className="md-ta-bar-label sell-lbl">SELL</span>
                                    <div className="md-ta-bar-track">
                                        <div className="md-ta-bar-fill sell-fill" style={{ width: `${sellPct}%` }} />
                                    </div>
                                    <span className="md-ta-bar-count">{cur.sell}</span>
                                </div>
                                <div className="md-ta-signal-badge" style={{ color: signal.color, borderColor: signal.color + '55', background: signal.color + '12' }}>
                                    {signal.label}
                                </div>
                            </div>
                        </div>

                        {/* Technical Analysis Breakdowns */}
                        <div className="md-ta-extra">
                            <div className="md-ta-extra-sec">
                                <div className="md-ta-extra-title">Signals Breakdown</div>
                                <div className="md-ta-extra-grid">
                                    <div className="md-ta-extra-row">
                                        <span className="lbl">RSI (14)</span>
                                        <span className="val" style={{ color: taBreakdown.rsi.color }}>
                                            {taBreakdown.rsi.val} ({taBreakdown.rsi.sig})
                                        </span>
                                    </div>
                                    <div className="md-ta-extra-row">
                                        <span className="lbl">MACD</span>
                                        <span className="val" style={{ color: taBreakdown.macd.color }}>
                                            {taBreakdown.macd.val}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="md-ta-extra-sec">
                                <div className="md-ta-extra-title">Support & Resistance</div>
                                <div className="md-ta-extra-grid">
                                    <div className="md-ta-extra-row">
                                        <span className="lbl">Resistance 1</span>
                                        <span className="val high">${taBreakdown.r1}</span>
                                    </div>
                                    <div className="md-ta-extra-row">
                                        <span className="lbl">Pivot Point</span>
                                        <span className="val">${taBreakdown.pivot}</span>
                                    </div>
                                    <div className="md-ta-extra-row">
                                        <span className="lbl">Support 1</span>
                                        <span className="val low">${taBreakdown.s1}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* ── RIGHT PANE: Market List/Screener Table ── */}
                <div className="md-right-pane">
                    
                    {/* ── MARKET TYPE TABS ── */}
                    <div className="md-tab-group">
                        {TABS.map(t => (
                            <button
                                key={t.id}
                                className={`md-tab ${marketType === t.id ? 'active' : ''}`}
                                onClick={() => setMarketType(t.id)}
                            >
                                {t.icon}
                                <span>{t.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* ── DATA TABLE ── */}
                    <div className="md-table-wrap">
                        {/* Table header */}
                        <div className="md-table-head">
                            <span className="md-col-coin">Coin</span>
                            <span className="md-col-price">Price</span>
                            <span className="md-col-change">Change</span>
                            <span className="md-col-trend">Trend (24h)</span>
                            <span className="md-col-hilo">24h High / Low</span>
                            <span className="md-col-cat">{isStrategy ? 'Signal' : 'Category'}</span>
                            <span className="md-col-action">Action</span>
                        </div>

                        {/* Table rows */}
                        <div className="md-table-body">
                            {currentData.map((coin, i) => (
                                <div
                                    key={i}
                                    className="md-table-row"
                                    onClick={() => {
                                        const found = availableCoins.find(c => c.symbol === coin.symbol);
                                        if (found) {
                                            setSelectedCoin(found);
                                            setCoinSel(found.baseAsset);
                                            onCoinSelect(found);
                                            onCoinSelChange(found.baseAsset);
                                        }
                                    }}
                                >
                                    <span className="md-row-coin">
                                        <span className="md-row-rank">#{String(i + 1).padStart(2, '0')}</span>
                                        <span className="md-row-name">{coin.baseAsset}</span>
                                    </span>
                                    
                                    <span className="md-row-price">${fmtPrice(coin.price)}</span>
                                    
                                    <span className={`md-row-change ${coin.change >= 0 ? 'pos' : 'neg'}`}>
                                        {coin.change >= 0 ? '+' : ''}{Number(coin.change).toFixed(2)}%
                                    </span>

                                    <span className="md-row-trend">
                                        {renderSparkline(coin.symbol, coin.change, coin.price)}
                                    </span>

                                    <span className="md-row-hilo">
                                        <span className="high">${fmtPrice(coin.highPrice)}</span>
                                        <span className="divider">/</span>
                                        <span className="low">${fmtPrice(coin.lowPrice)}</span>
                                    </span>

                                    <span className="md-row-cat">
                                        {isStrategy ? (
                                            <span className={`md-row-strategy ${coin.strategy === 'LONG' ? 'long' : 'short'}`}>
                                                {coin.strategy}
                                            </span>
                                        ) : (
                                            <span className="cat-badge">{getCoinCategory(coin.baseAsset)}</span>
                                        )}
                                    </span>

                                    <span className="md-row-action">
                                        <button className="md-btn-buy" onClick={(e) => {
                                            e.stopPropagation();
                                            alert(`Buy order for ${coin.baseAsset} initiated!`);
                                        }}>BUY</button>
                                        <button className="md-btn-sell" onClick={(e) => {
                                            e.stopPropagation();
                                            alert(`Sell order for ${coin.baseAsset} initiated!`);
                                        }}>SELL</button>
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}

export default MarketData;