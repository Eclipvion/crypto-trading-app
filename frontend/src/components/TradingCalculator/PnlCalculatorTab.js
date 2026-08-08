import React from 'react';
import {
    Typography, TextField, FormControl, InputLabel, Select, MenuItem,
    ToggleButtonGroup, ToggleButton, Box, Divider, Slider, Chip, Stack, Button
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import BoltIcon from '@mui/icons-material/Bolt';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import CalculatorSummaryCard from './CalculatorSummaryCard';
import './PnlCalculatorTab.css';

// Exchange fee table — defined here so it is never undefined
const EXCHANGE_FEES = {
    binance: {
        spot:    { maker: 0.001,  taker: 0.001,  description: 'Binance Spot: 0.1% flat' },
        futures: { maker: 0.0002, taker: 0.0005, description: 'Binance Futures: 0.02% maker / 0.05% taker' },
    },
    bybit: {
        spot:    { maker: 0.001,  taker: 0.001,  description: 'Bybit Spot: 0.1% flat' },
        futures: { maker: 0.0001, taker: 0.0006, description: 'Bybit Futures: 0.01% maker / 0.06% taker' },
    },
    okx: {
        spot:    { maker: 0.0008, taker: 0.001,  description: 'OKX Spot: 0.08% maker / 0.1% taker' },
        futures: { maker: 0.0002, taker: 0.0005, description: 'OKX Futures: 0.02% maker / 0.05% taker' },
    },
    mexc: {
        spot:    { maker: 0.0,    taker: 0.0,    description: 'MEXC Spot: 0% fees (promo)' },
        futures: { maker: 0.0,    taker: 0.0001, description: 'MEXC Futures: 0% maker / 0.01% taker' },
    },
};

function PnlCalculatorTab({
    selectedCoin,
    coinSel,
    entryPrice,
    setEntryPrice,
    exitPrice,
    setExitPrice,
    positionType,
    setPositionType,
    marketType,
    setMarketType,
    exchangeName,
    setExchangeName,
    orderType,
    setOrderType,
    leverage,
    setLeverage,
    walletBalance,
    setWalletBalance,
    entryAmount,
    setEntryAmount,
    walletPercent,
    setWalletPercent,
    currentPrice,
    hasTokenDiscount,
    setHasTokenDiscount,
    stopLossPrice,
    setStopLossPrice
}) {
    // Quick wallet % setter
    const setQuickPercent = (pct) => {
        setWalletPercent(pct);
        if (walletBalance && parseFloat(walletBalance) > 0) {
            const calculated = (parseFloat(walletBalance) * pct) / 100;
            setEntryAmount(calculated.toFixed(2));
        }
    };

    // Quick leverage setter
    const setQuickLeverage = (lev) => {
        setLeverage(lev);
    };

    // Auto fill current price
    const handleUseLivePrice = () => {
        if (currentPrice) {
            setEntryPrice(currentPrice.toString());
        }
    };

    // Auto set quick exit targets (+2%, +5%, +10%, +20%)
    const setQuickExitTarget = (gainPct) => {
        const entry = parseFloat(entryPrice || currentPrice || 0);
        if (!entry || entry <= 0) return;

        let target = 0;
        if (positionType === 'long') {
            target = entry * (1 + gainPct / 100);
        } else {
            target = entry * (1 - gainPct / 100);
        }
        setExitPrice(target.toFixed(entry < 1 ? 6 : 2));
    };

    // Auto set quick stop loss (-1%, -2%, -3%, -5%)
    const setQuickStopLoss = (lossPct) => {
        const entry = parseFloat(entryPrice || currentPrice || 0);
        if (!entry || entry <= 0) return;

        let sl = 0;
        if (positionType === 'long') {
            sl = entry * (1 - lossPct / 100);
        } else {
            sl = entry * (1 + lossPct / 100);
        }
        setStopLossPrice(sl.toFixed(entry < 1 ? 6 : 2));
    };

    // Number sanitation handler
    const handleNumberInput = (val, setter) => {
        const sanitized = val.replace(/[^0-9.]/g, '');
        const parts = sanitized.split('.');
        const formatted = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : sanitized;
        setter(formatted);
    };

    // Calculate current rates considering discount
    const rawFeeObj = EXCHANGE_FEES[exchangeName]?.[marketType] || { maker: 0.0002, taker: 0.0005 };
    const discountMultiplier = hasTokenDiscount ? 0.9 : 1.0; // 10% discount if active
    const effectiveMaker = rawFeeObj.maker * discountMultiplier;
    const effectiveTaker = rawFeeObj.taker * discountMultiplier;

    // Calculations
    const numEntry = parseFloat(entryPrice) || 0;
    const numExit = parseFloat(exitPrice) || 0;
    const numAmount = parseFloat(entryAmount) || 0;
    const numLeverage = marketType === 'futures' ? (parseInt(leverage, 10) || 1) : 1;

    // Entry & Exit fees
    const orderNotional = numAmount * numLeverage;
    const entryFeeVal = orderNotional * effectiveTaker;
    const exitFeeVal = orderNotional * effectiveTaker;
    const totalFeesVal = entryFeeVal + exitFeeVal;

    // Gross and Net PnL
    const calculateGrossPnL = () => {
        if (!numEntry || !numExit || !numAmount) return 0;
        const diff = positionType === 'long' ? (numExit - numEntry) : (numEntry - numExit);
        return (diff / numEntry) * numAmount * numLeverage;
    };

    const grossPnL = calculateGrossPnL();
    const netPnL = grossPnL - totalFeesVal;
    const roi = numAmount > 0 ? (netPnL / numAmount) * 100 : 0;

    // Liquidation Price calculation
    const calculateLiquidation = () => {
        if (!numEntry || !numLeverage || !numAmount || marketType !== 'futures') return 0;
        const margin = numAmount / numLeverage;
        const maintMargin = margin * 0.004; // 0.4% maintenance margin rate
        if (positionType === 'long') {
            return numEntry * (1 - (1 / numLeverage) + (maintMargin / numAmount));
        } else {
            return numEntry * (1 + (1 / numLeverage) - (maintMargin / numAmount));
        }
    };

    const liqPrice = calculateLiquidation();
    const marginReq = marketType === 'futures' ? numAmount / numLeverage : numAmount;

    return (
        <Box sx={{ display: 'flex', gap: '28px', flexDirection: { xs: 'column', lg: 'row' } }}>
            {/* Input Form Column */}
            <Box sx={{ flex: 1.2 }}>
                <Box sx={{ mb: 2.5, display: 'flex', alignItems: 'center', gap: 1, pb: 1.5, borderBottom: '1px solid rgba(57, 255, 20, 0.1)' }}>
                    <BoltIcon sx={{ color: '#39ff14', fontSize: 18 }} />
                    <Typography sx={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: '0.8rem', color: '#39ff14', textTransform: 'uppercase', letterSpacing: '1.2px' }}>
                        PnL &amp; Futures Parameters
                    </Typography>
                </Box>

                    <Stack spacing={2.5}>

                        {/* Market, Exchange & Order Type Selectors */}
                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                            <FormControl fullWidth variant="outlined" sx={{ flex: 1, minWidth: '130px' }}>
                                <InputLabel>Market Type</InputLabel>
                                <Select
                                    value={marketType}
                                    onChange={(e) => {
                                        setMarketType(e.target.value);
                                        if (e.target.value === 'spot') setLeverage(1);
                                    }}
                                    label="Market Type"
                                >
                                    <MenuItem value="spot">Spot Trading</MenuItem>
                                    <MenuItem value="futures">USDT Futures</MenuItem>
                                </Select>
                            </FormControl>

                            <FormControl fullWidth variant="outlined" sx={{ flex: 1, minWidth: '130px' }}>
                                <InputLabel>Exchange</InputLabel>
                                <Select
                                    value={exchangeName}
                                    onChange={(e) => setExchangeName(e.target.value)}
                                    label="Exchange"
                                >
                                    <MenuItem value="binance">Binance</MenuItem>
                                    <MenuItem value="bybit">Bybit</MenuItem>
                                    <MenuItem value="okx">OKX</MenuItem>
                                    <MenuItem value="mexc">MEXC</MenuItem>
                                </Select>
                            </FormControl>

                            <FormControl fullWidth variant="outlined" sx={{ flex: 1, minWidth: '130px' }}>
                                <InputLabel>Order Type</InputLabel>
                                <Select
                                    value={orderType}
                                    onChange={(e) => {
                                        const type = e.target.value;
                                        setOrderType(type);
                                        if (type === 'market' && currentPrice) setEntryPrice(currentPrice.toString());
                                    }}
                                    label="Order Type"
                                >
                                    <MenuItem value="limit">Limit Order</MenuItem>
                                    <MenuItem value="market">Market Order</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>

                        {/* Fee Discount Toggle */}
                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, gap: { xs: 1.5, sm: 0 }, bgcolor: 'rgba(255,255,255,0.02)', p: 1.5, borderRadius: 2, border: '1px solid rgba(255,255,255,0.05)' }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.8, fontWeight: 600 }}>
                                <LocalOfferIcon fontSize="small" sx={{ color: '#00e5ff' }} />
                                Exchange Fee Discount Active (BNB / Token Tier)
                            </Typography>
                            <Button
                                size="small"
                                variant={hasTokenDiscount ? "contained" : "outlined"}
                                onClick={() => setHasTokenDiscount(!hasTokenDiscount)}
                                className="preset-chip-action"
                                sx={{
                                    py: 0.4,
                                    px: 1.8,
                                    fontSize: '0.75rem',
                                    borderRadius: 99,
                                    background: hasTokenDiscount ? 'linear-gradient(135deg, #00f0ff 0%, #00e676 100%)' : 'transparent',
                                    color: hasTokenDiscount ? '#06090e' : '#00f0ff',
                                    borderColor: '#00f0ff',
                                    boxShadow: hasTokenDiscount ? '0 0 16px rgba(0, 240, 255, 0.35)' : 'none'
                                }}
                            >
                                {hasTokenDiscount ? '10% Discount ON' : 'Enable Discount'}
                            </Button>
                        </Box>

                        {/* Position Type Selector (Long / Short) */}
                        <Box>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', mb: 1, display: 'block' }}>
                                Trade Direction (Position Side)
                            </Typography>
                            <ToggleButtonGroup
                                value={positionType}
                                exclusive
                                onChange={(e, val) => val && setPositionType(val)}
                                sx={{ width: '100%' }}
                            >
                                <ToggleButton value="long" className="long-button" sx={{ flex: 1, py: 1.2 }}>
                                    <TrendingUpIcon sx={{ mr: 1 }} /> LONG (Bullish)
                                </ToggleButton>
                                <ToggleButton value="short" className="short-button" sx={{ flex: 1, py: 1.2 }}>
                                    <TrendingDownIcon sx={{ mr: 1 }} /> SHORT (Bearish)
                                </ToggleButton>
                            </ToggleButtonGroup>
                        </Box>

                        {/* Wallet Balance & Entry Amount */}
                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                            <TextField
                                fullWidth
                                label="Wallet Balance (USDT)"
                                value={walletBalance}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/[^0-9.]/g, '');
                                    setWalletBalance(val);
                                    if (val && walletPercent > 0) {
                                        setEntryAmount(((parseFloat(val) * walletPercent) / 100).toFixed(2));
                                    }
                                }}
                                variant="outlined"
                                sx={{ flex: 1, minWidth: '150px' }}
                            />

                            <TextField
                                fullWidth
                                label="Entry Position (USDT)"
                                value={entryAmount}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/[^0-9.]/g, '');
                                    setEntryAmount(val);
                                    if (walletBalance && parseFloat(walletBalance) > 0 && val) {
                                        const pct = (parseFloat(val) / parseFloat(walletBalance)) * 100;
                                        setWalletPercent(Math.min(Math.round(pct), 100));
                                    }
                                }}
                                variant="outlined"
                                sx={{ flex: 1, minWidth: '150px' }}
                            />
                        </Box>

                        {/* Wallet Allocation Quick Presets */}
                        <Box>
                            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: { xs: 1, sm: 0 }, mb: 0.5 }}>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                                    Wallet Allocation: <strong>{walletPercent}%</strong>
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap' }}>
                                    {[10, 25, 50, 75, 100].map(pct => (
                                        <Chip
                                            key={pct}
                                            label={`${pct}%`}
                                            size="small"
                                            onClick={() => setQuickPercent(pct)}
                                            clickable
                                            className="preset-chip-action"
                                            sx={{
                                                bgcolor: walletPercent === pct ? 'rgba(0, 240, 255, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                                                color: walletPercent === pct ? '#00f0ff' : 'text.secondary',
                                                border: `1px solid ${walletPercent === pct ? '#00f0ff' : 'rgba(255, 255, 255, 0.08)'}`,
                                                boxShadow: walletPercent === pct ? '0 0 12px rgba(0, 240, 255, 0.3)' : 'none',
                                                fontWeight: 700,
                                                fontSize: '0.72rem'
                                            }}
                                        />
                                    ))}
                                </Box>
                            </Box>
                            <Slider
                                value={walletPercent}
                                onChange={(e, val) => setQuickPercent(val)}
                                min={0}
                                max={100}
                                step={1}
                            />
                        </Box>

                        {/* Leverage Slider & Presets (Futures Only) */}
                        {marketType === 'futures' && (
                            <Box>
                                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: { xs: 1, sm: 0 }, mb: 0.5 }}>
                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                                        Leverage Multiplier: <strong style={{ color: '#00f0ff' }}>{leverage}x</strong>
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap' }}>
                                        {[1, 5, 10, 25, 50, 75, 100].map(lev => (
                                            <Chip
                                                key={lev}
                                                label={`${lev}x`}
                                                size="small"
                                                onClick={() => setQuickLeverage(lev)}
                                                clickable
                                                className="preset-chip-action"
                                                sx={{
                                                    bgcolor: leverage === lev ? 'rgba(0, 240, 255, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                                                    color: leverage === lev ? '#00f0ff' : 'text.secondary',
                                                    border: `1px solid ${leverage === lev ? '#00f0ff' : 'rgba(255, 255, 255, 0.08)'}`,
                                                    boxShadow: leverage === lev ? '0 0 12px rgba(0, 240, 255, 0.3)' : 'none',
                                                    fontWeight: 700,
                                                    fontSize: '0.72rem'
                                                }}
                                            />
                                        ))}
                                    </Box>
                                </Box>
                                <Slider
                                    value={leverage}
                                    onChange={(e, val) => setQuickLeverage(val)}
                                    min={1}
                                    max={100}
                                    step={1}
                                />
                            </Box>
                        )}

                        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.06)' }} />

                        {/* Price Inputs: Entry, Exit Target & Stop Loss */}
                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                            <Box sx={{ flex: 1, minWidth: '150px' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                    <Typography variant="caption" color="textSecondary">Entry Price ($)</Typography>
                                    {currentPrice && (
                                        <Typography variant="caption" onClick={handleUseLivePrice} sx={{ color: '#00e5ff', cursor: 'pointer', fontWeight: 600 }}>
                                            Use Live (${currentPrice.toFixed(2)})
                                        </Typography>
                                    )}
                                </Box>
                                <TextField
                                    fullWidth
                                    value={entryPrice}
                                    onChange={(e) => handleNumberInput(e.target.value, setEntryPrice)}
                                    disabled={orderType === 'market'}
                                    variant="outlined"
                                    placeholder="e.g. 95000"
                                />
                            </Box>

                            <Box sx={{ flex: 1, minWidth: '150px' }}>
                                <Typography variant="caption" color="textSecondary" sx={{ mb: 0.5, display: 'block' }}>Target Exit Price ($)</Typography>
                                <TextField
                                    fullWidth
                                    value={exitPrice}
                                    onChange={(e) => handleNumberInput(e.target.value, setExitPrice)}
                                    variant="outlined"
                                    placeholder="e.g. 100000"
                                />
                            </Box>

                            <Box sx={{ flex: 1, minWidth: '150px' }}>
                                <Typography variant="caption" color="textSecondary" sx={{ mb: 0.5, display: 'block' }}>Stop Loss Price ($)</Typography>
                                <TextField
                                    fullWidth
                                    value={stopLossPrice}
                                    onChange={(e) => handleNumberInput(e.target.value, setStopLossPrice)}
                                    variant="outlined"
                                    placeholder="e.g. 92000"
                                />
                            </Box>
                        </Box>

                        {/* Target Preset Quick Chips */}
                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2 }}>
                            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, gap: 1 }}>
                                <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>Quick Exit Target:</Typography>
                                <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap' }}>
                                    {[2, 5, 10, 20].map(gain => (
                                        <Chip
                                            key={gain}
                                            label={`+${gain}%`}
                                            size="small"
                                            onClick={() => setQuickExitTarget(gain)}
                                            clickable
                                            sx={{ bgcolor: 'rgba(0, 230, 118, 0.1)', color: '#00e676', border: '1px solid rgba(0, 230, 118, 0.3)', fontSize: '0.7rem', fontWeight: 600 }}
                                        />
                                    ))}
                                </Box>
                            </Box>

                            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, gap: 1 }}>
                                <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>Quick Stop Loss:</Typography>
                                <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap' }}>
                                    {[1, 2, 3, 5].map(loss => (
                                        <Chip
                                            key={loss}
                                            label={`-${loss}%`}
                                            size="small"
                                            onClick={() => setQuickStopLoss(loss)}
                                            clickable
                                            sx={{ bgcolor: 'rgba(255, 61, 0, 0.1)', color: '#ff3d00', border: '1px solid rgba(255, 61, 0, 0.3)', fontSize: '0.7rem', fontWeight: 600 }}
                                        />
                                    ))}
                                </Box>
                            </Box>
                        </Box>

                    </Stack>
            </Box>

            {/* Results Output Summary Column */}
            <Box sx={{ flex: 1 }}>
                <CalculatorSummaryCard
                    entryAmount={entryAmount}
                    leverage={numLeverage}
                    entryPrice={entryPrice}
                    exitPrice={exitPrice}
                    stopLossPrice={stopLossPrice}
                    makerFee={effectiveMaker}
                    takerFee={effectiveTaker}
                    selectedCoin={selectedCoin}
                    positionType={positionType}
                    marketType={marketType}
                    orderType={orderType}
                    currentPrice={currentPrice}
                    pnl={netPnL}
                    roi={roi}
                    liquidationPrice={liqPrice}
                    totalValue={orderNotional}
                    margin={marginReq}
                    entryFee={entryFeeVal}
                    exitFee={exitFeeVal}
                    totalFees={totalFeesVal}
                    exchangeName={exchangeName}
                    feeDescription={rawFeeObj.description}
                    customTitle="PnL & Liquidation Overview"
                />
            </Box>
        </Box>
    );
}

export default PnlCalculatorTab;
