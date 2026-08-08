import React, { useState } from 'react';
import {
    Typography, TextField, FormControl, InputLabel, Select, MenuItem,
    ToggleButtonGroup, ToggleButton, Box, Divider, Slider, Chip, Stack
} from '@mui/material';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import CalculatorSummaryCard from './CalculatorSummaryCard';
import './TargetPriceTab.css';

function TargetPriceTab({
    selectedCoin,
    currentPrice,
    entryPrice: sharedEntryPrice,
    positionType: sharedPositionType
}) {
    const [positionType, setPositionType] = useState(sharedPositionType || 'long');
    const [entryPrice, setEntryPrice] = useState(sharedEntryPrice || (currentPrice ? currentPrice.toString() : '95000'));
    const [entryAmount, setEntryAmount] = useState('1000');
    const [leverage, setLeverage] = useState(10);
    const [targetMode, setTargetMode] = useState('roi'); // 'roi' or 'profit'
    const [targetValue, setTargetValue] = useState('50'); // 50% ROI or $500 profit

    const handleNumberInput = (val, setter) => {
        const sanitized = val.replace(/[^0-9.]/g, '');
        const parts = sanitized.split('.');
        const formatted = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : sanitized;
        setter(formatted);
    };

    // Calculations
    const entryNum = parseFloat(entryPrice) || 0;
    const amountNum = parseFloat(entryAmount) || 0;
    const levNum = parseFloat(leverage) || 1;
    const targetNum = parseFloat(targetValue) || 0;

    const notionalValue = amountNum * levNum;

    // Calculate required exit price
    const calculateRequiredExit = () => {
        if (!entryNum || !notionalValue) return 0;

        let requiredProfitDollars = 0;
        if (targetMode === 'roi') {
            requiredProfitDollars = (amountNum * targetNum) / 100;
        } else {
            requiredProfitDollars = targetNum;
        }

        const priceDelta = (requiredProfitDollars / notionalValue) * entryNum;

        if (positionType === 'long') {
            return entryNum + priceDelta;
        } else {
            return entryNum - priceDelta;
        }
    };

    const requiredExitPrice = calculateRequiredExit();
    const calculatedProfit = targetMode === 'roi' ? (amountNum * targetNum) / 100 : targetNum;
    const calculatedROI = targetMode === 'roi' ? targetNum : (amountNum > 0 ? (targetNum / amountNum) * 100 : 0);

    return (
        <Box sx={{ display: 'flex', gap: '28px', flexDirection: { xs: 'column', lg: 'row' } }}>
            {/* Input Form Column */}
            <Box sx={{ flex: 1.2 }}>
                <Box sx={{ mb: 2.5, display: 'flex', alignItems: 'center', gap: 1, pb: 1.5, borderBottom: '1px solid rgba(57, 255, 20, 0.1)' }}>
                    <TrackChangesIcon sx={{ color: '#39ff14', fontSize: 18 }} />
                    <Typography sx={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: '0.8rem', color: '#39ff14', textTransform: 'uppercase', letterSpacing: '1.2px' }}>
                        Target Exit Price Calculator
                    </Typography>
                </Box>

                    <Stack spacing={2.5}>
                        {/* Position Side */}
                        <Box>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', mb: 1, display: 'block' }}>
                                Trade Direction
                            </Typography>
                            <ToggleButtonGroup
                                value={positionType}
                                exclusive
                                onChange={(e, val) => val && setPositionType(val)}
                                sx={{ width: '100%' }}
                            >
                                <ToggleButton value="long" className="long-button" sx={{ flex: 1, py: 1.2 }}>
                                    <TrendingUpIcon sx={{ mr: 1 }} /> LONG Target
                                </ToggleButton>
                                <ToggleButton value="short" className="short-button" sx={{ flex: 1, py: 1.2 }}>
                                    <TrendingDownIcon sx={{ mr: 1 }} /> SHORT Target
                                </ToggleButton>
                            </ToggleButtonGroup>
                        </Box>

                        {/* Entry Price & Amount */}
                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                            <TextField
                                fullWidth
                                label="Entry Price ($)"
                                value={entryPrice}
                                onChange={(e) => handleNumberInput(e.target.value, setEntryPrice)}
                                variant="outlined"
                                sx={{ flex: 1, minWidth: '150px' }}
                            />

                            <TextField
                                fullWidth
                                label="Margin / Entry Capital (USDT)"
                                value={entryAmount}
                                onChange={(e) => handleNumberInput(e.target.value, setEntryAmount)}
                                variant="outlined"
                                sx={{ flex: 1, minWidth: '150px' }}
                            />
                        </Box>

                        {/* Leverage */}
                        <Box>
                            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: { xs: 1, sm: 0 }, mb: 0.5 }}>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                                    Leverage: <strong style={{ color: '#00e5ff' }}>{leverage}x</strong>
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap' }}>
                                    {[1, 5, 10, 25, 50, 100].map(lev => (
                                        <Chip
                                            key={lev}
                                            label={`${lev}x`}
                                            size="small"
                                            onClick={() => setLeverage(lev)}
                                            clickable
                                            sx={{
                                                bgcolor: leverage === lev ? 'rgba(0, 229, 255, 0.2)' : 'rgba(255,255,255,0.04)',
                                                color: leverage === lev ? '#00e5ff' : 'text.secondary',
                                                border: `1px solid ${leverage === lev ? '#00e5ff' : 'transparent'}`,
                                                fontWeight: 600,
                                                fontSize: '0.7rem'
                                            }}
                                        />
                                    ))}
                                </Box>
                            </Box>
                            <Slider
                                value={leverage}
                                onChange={(e, val) => setLeverage(val)}
                                min={1}
                                max={100}
                            />
                        </Box>

                        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.06)' }} />

                        {/* Target Mode Selector & Target Input */}
                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                            <FormControl fullWidth variant="outlined" sx={{ flex: 1, minWidth: '150px' }}>
                                <InputLabel>Target Goal Type</InputLabel>
                                <Select
                                    value={targetMode}
                                    onChange={(e) => setTargetMode(e.target.value)}
                                    label="Target Goal Type"
                                >
                                    <MenuItem value="roi">Desired ROI Percentage (%)</MenuItem>
                                    <MenuItem value="profit">Desired Profit Amount ($)</MenuItem>
                                </Select>
                            </FormControl>

                            <TextField
                                fullWidth
                                label={targetMode === 'roi' ? "Target ROI (%)" : "Target Profit ($ USDT)"}
                                value={targetValue}
                                onChange={(e) => handleNumberInput(e.target.value, setTargetValue)}
                                variant="outlined"
                                sx={{ flex: 1, minWidth: '150px' }}
                            />
                        </Box>

                        {/* Quick Presets for ROI % or Profit $ */}
                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, gap: 1 }}>
                            <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>Quick Targets:</Typography>
                            <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap' }}>
                                {targetMode === 'roi'
                                    ? [25, 50, 100, 200, 500].map(val => (
                                        <Chip
                                            key={val}
                                            label={`+${val}% ROI`}
                                            size="small"
                                            onClick={() => setTargetValue(val.toString())}
                                            clickable
                                            sx={{ bgcolor: 'rgba(0, 230, 118, 0.1)', color: '#00e676', border: '1px solid rgba(0, 230, 118, 0.3)', fontSize: '0.7rem', fontWeight: 600 }}
                                        />
                                    ))
                                    : [100, 250, 500, 1000, 2500].map(val => (
                                        <Chip
                                            key={val}
                                            label={`+$${val}`}
                                            size="small"
                                            onClick={() => setTargetValue(val.toString())}
                                            clickable
                                            sx={{ bgcolor: 'rgba(0, 229, 255, 0.1)', color: '#00e5ff', border: '1px solid rgba(0, 229, 255, 0.3)', fontSize: '0.7rem', fontWeight: 600 }}
                                        />
                                    ))
                                }  
                            </Box>
                        </Box>

                    </Stack>
            </Box>

            {/* Results Output Summary Column */}
            <Box sx={{ flex: 1 }}>
                <CalculatorSummaryCard
                    entryAmount={amountNum}
                    leverage={levNum}
                    entryPrice={entryPrice}
                    exitPrice={requiredExitPrice}
                    selectedCoin={selectedCoin}
                    positionType={positionType}
                    marketType="futures"
                    currentPrice={currentPrice}
                    pnl={calculatedProfit}
                    roi={calculatedROI}
                    totalValue={notionalValue}
                    margin={amountNum}
                    customTitle="Required Exit Price Calculation"
                />
            </Box>
        </Box>
    );
}

export default TargetPriceTab;
