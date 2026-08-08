import React, { useState, useEffect } from 'react';
import {
    Typography, TextField, Box, Divider, Button, Stack, Chip, IconButton, Slider, ToggleButtonGroup, ToggleButton, Alert
} from '@mui/material';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import CalculatorSummaryCard from './CalculatorSummaryCard';
import './ScaleOutCalculatorTab.css';

function ScaleOutCalculatorTab({
    selectedCoin,
    currentPrice,
    entryPrice: sharedEntryPrice,
    setEntryPrice: setSharedEntryPrice,
    positionType: sharedPositionType,
    setPositionType: setSharedPositionType
}) {
    const [entryPrice, setEntryPrice] = useState(sharedEntryPrice || (currentPrice ? currentPrice.toString() : '95000'));
    const [entryAmount, setEntryAmount] = useState('1000');
    const [leverage, setLeverage] = useState(10);
    const [positionType, setPositionType] = useState(sharedPositionType || 'long');

    // Default 2 scale-out targets
    const [targets, setTargets] = useState([
        { id: 1, exitPrice: currentPrice ? (currentPrice * 1.05).toFixed(2) : '99750', portionPercent: 50 },
        { id: 2, exitPrice: currentPrice ? (currentPrice * 1.10).toFixed(2) : '104500', portionPercent: 50 }
    ]);

    // Sync entry price when currentPrice is available and entryPrice is empty/default
    useEffect(() => {
        if (currentPrice && (!sharedEntryPrice && entryPrice === '95000')) {
            setEntryPrice(currentPrice.toString());
        }
    }, [currentPrice]);

    const handleNumberInput = (val, setter) => {
        const sanitized = val.replace(/[^0-9.]/g, '');
        const parts = sanitized.split('.');
        const formatted = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : sanitized;
        setter(formatted);
    };

    // Add new Target Level
    const handleAddTarget = () => {
        if (targets.length >= 4) return;
        const entryNum = parseFloat(entryPrice) || 0;
        const lastTarget = targets[targets.length - 1];
        const lastPrice = parseFloat(lastTarget?.exitPrice || entryPrice);

        // Auto calculate a reasonable next price
        let nextPrice = lastPrice;
        if (positionType === 'long') {
            nextPrice = lastPrice * 1.05;
        } else {
            nextPrice = lastPrice * 0.95;
        }

        // Split remaining percentage or just assign 25%
        const currentSum = targets.reduce((sum, t) => sum + t.portionPercent, 0);
        const remaining = Math.max(0, 100 - currentSum);
        const nextPortion = remaining > 0 ? remaining : 25;

        setTargets([
            ...targets,
            {
                id: Date.now(),
                exitPrice: nextPrice.toFixed(entryNum < 1 ? 6 : 2),
                portionPercent: nextPortion
            }
        ]);
    };

    // Remove Target Level
    const handleRemoveTarget = (id) => {
        if (targets.length <= 1) return;
        setTargets(targets.filter(t => t.id !== id));
    };

    // Update target parameters
    const handleUpdateTarget = (id, field, val) => {
        setTargets(targets.map(t => {
            if (t.id === id) {
                if (field === 'portionPercent') {
                    const parsed = parseInt(val.replace(/[^0-9]/g, ''), 10) || 0;
                    return { ...t, portionPercent: Math.min(parsed, 100) };
                } else {
                    const sanitized = val.replace(/[^0-9.]/g, '');
                    return { ...t, [field]: sanitized };
                }
            }
            return t;
        }));
    };

    // Set standard equal weights to targets
    const handleDistributeEqually = () => {
        const count = targets.length;
        if (count === 0) return;
        const basePortion = Math.floor(100 / count);
        const remainder = 100 - (basePortion * count);

        setTargets(targets.map((t, idx) => ({
            ...t,
            portionPercent: idx === 0 ? basePortion + remainder : basePortion
        })));
    };

    // Calculations
    const entryNum = parseFloat(entryPrice) || 0;
    const amountNum = parseFloat(entryAmount) || 0;
    const levNum = parseInt(leverage, 10) || 1;
    const notionalValue = amountNum * levNum;

    // Portion validation
    const totalPortionPercent = targets.reduce((sum, t) => sum + t.portionPercent, 0);
    const isPortionValid = totalPortionPercent === 100;

    // Calculate weighted average exit price
    let weightedExitPrice = 0;
    let totalGrossPnL = 0;

    if (entryNum > 0 && amountNum > 0) {
        let weightedExitSum = 0;
        targets.forEach(t => {
            const exitNum = parseFloat(t.exitPrice) || 0;
            const portionFactor = t.portionPercent / 100;
            weightedExitSum += exitNum * portionFactor;

            // PnL of this specific target portion
            const portionNotional = notionalValue * portionFactor;
            const portionUnits = portionNotional / entryNum;
            const portionPriceDiff = positionType === 'long' ? (exitNum - entryNum) : (entryNum - exitNum);
            const portionPnL = portionPriceDiff * portionUnits;
            totalGrossPnL += portionPnL;
        });
        weightedExitPrice = weightedExitSum;
    }

    // Estimate Taker fees (Binance Futures taker fee 0.05% = 0.0005)
    const takerFeeRate = 0.0005;
    // Entry fee + Exit fee (roundtrip for scaled out portions)
    const entryFee = notionalValue * takerFeeRate;
    const exitFee = notionalValue * takerFeeRate * (totalPortionPercent / 100);
    const totalFeesVal = entryFee + exitFee;
    const netPnL = totalGrossPnL - totalFeesVal;
    const projectedROI = amountNum > 0 ? (netPnL / amountNum) * 100 : 0;

    return (
        <Box sx={{ display: 'flex', gap: '28px', flexDirection: { xs: 'column', lg: 'row' } }}>
            {/* Input Form Column */}
            <Box sx={{ flex: 1.2 }}>
                <Box sx={{ mb: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1.5, borderBottom: '1px solid rgba(57, 255, 20, 0.1)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TrackChangesIcon sx={{ color: '#39ff14', fontSize: 18 }} />
                        <Typography sx={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: '0.8rem', color: '#39ff14', textTransform: 'uppercase', letterSpacing: '1.2px' }}>
                            Scale-Out (Multi-Target Exit) Grid
                        </Typography>
                    </Box>
                    <Stack direction="row" spacing={1}>
                        <Button
                            size="small"
                            variant="outlined"
                            onClick={handleDistributeEqually}
                            sx={{ borderRadius: 99, borderColor: 'rgba(0, 240, 255, 0.4)', color: '#00f0ff', fontSize: '0.68rem', px: 1.5 }}
                        >
                            Equal Portions
                        </Button>
                        <Button
                            size="small"
                            variant="outlined"
                            startIcon={<AddIcon />}
                            onClick={handleAddTarget}
                            disabled={targets.length >= 4}
                            sx={{ borderRadius: 99, borderColor: '#39ff14', color: '#39ff14', fontSize: '0.72rem' }}
                        >
                            Add Target
                        </Button>
                    </Stack>
                </Box>

                <Stack spacing={2.5}>
                    {/* Position Type Selector (Long / Short) */}
                    <Box>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', mb: 1, display: 'block' }}>
                            Trade Direction
                        </Typography>
                        <ToggleButtonGroup
                            value={positionType}
                            exclusive
                            onChange={(e, val) => {
                                if (val) {
                                    setPositionType(val);
                                    if (setSharedPositionType) setSharedPositionType(val);
                                }
                            }}
                            sx={{ width: '100%' }}
                        >
                            <ToggleButton value="long" className="long-button" sx={{ flex: 1, py: 1.2 }}>
                                <TrendingUpIcon sx={{ mr: 1 }} /> LONG Position
                            </ToggleButton>
                            <ToggleButton value="short" className="short-button" sx={{ flex: 1, py: 1.2 }}>
                                <TrendingDownIcon sx={{ mr: 1 }} /> SHORT Position
                            </ToggleButton>
                        </ToggleButtonGroup>
                    </Box>

                    {/* Entry Capital, Leverage & Entry Price */}
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                        <TextField
                            fullWidth
                            label="Margin / Capital (USDT)"
                            value={entryAmount}
                            onChange={(e) => handleNumberInput(e.target.value, setEntryAmount)}
                            variant="outlined"
                            sx={{ flex: 1 }}
                        />

                        <TextField
                            fullWidth
                            label="Entry Price ($)"
                            value={entryPrice}
                            onChange={(e) => {
                                handleNumberInput(e.target.value, setEntryPrice);
                                if (setSharedEntryPrice) setSharedEntryPrice(e.target.value);
                            }}
                            variant="outlined"
                            sx={{ flex: 1 }}
                        />
                    </Box>

                    {/* Leverage Slider */}
                    <Box>
                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: { xs: 1, sm: 0 }, mb: 0.5 }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                                Leverage Multiplier: <strong style={{ color: '#00e5ff' }}>{leverage}x</strong> (Notional: ${(amountNum * levNum).toLocaleString()})
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap' }}>
                                {[1, 5, 10, 20, 50, 100].map(lev => (
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
                            step={1}
                        />
                    </Box>

                    <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.06)' }} />

                    {/* Targets Form List */}
                    <Stack spacing={2}>
                        {targets.map((target, idx) => (
                            <Box key={target.id} sx={{
                                p: 2,
                                borderRadius: 2,
                                bgcolor: 'rgba(13, 17, 26, 0.7)',
                                border: '1px solid rgba(255, 255, 255, 0.06)',
                                display: 'flex',
                                flexDirection: { xs: 'column', sm: 'row' },
                                alignItems: { xs: 'stretch', sm: 'center' },
                                gap: 2
                            }}>
                                <Chip
                                    label={`Target Exit #${idx + 1}`}
                                    size="small"
                                    sx={{ bgcolor: 'rgba(0, 240, 255, 0.1)', color: '#00f0ff', fontWeight: 700, fontFamily: '"Space Grotesk", sans-serif' }}
                                />

                                <TextField
                                    label="Exit Price ($)"
                                    value={target.exitPrice}
                                    onChange={(e) => handleUpdateTarget(target.id, 'exitPrice', e.target.value)}
                                    size="small"
                                    sx={{ flex: 1 }}
                                />

                                <TextField
                                    label="Portion of Position (%)"
                                    value={target.portionPercent}
                                    onChange={(e) => handleUpdateTarget(target.id, 'portionPercent', e.target.value)}
                                    size="small"
                                    placeholder="e.g. 50"
                                    sx={{ flex: 0.8 }}
                                />

                                {targets.length > 1 && (
                                    <IconButton
                                        onClick={() => handleRemoveTarget(target.id)}
                                        size="small"
                                        sx={{ color: '#ff3d00', '&:hover': { bgcolor: 'rgba(255, 61, 0, 0.1)' }, alignSelf: { xs: 'flex-end', sm: 'center' } }}
                                    >
                                        <DeleteOutlineIcon />
                                    </IconButton>
                                )}
                            </Box>
                        ))}
                    </Stack>

                    {/* Portion Allocation Validation Warning */}
                    {!isPortionValid && (
                        <Alert severity="warning" sx={{ bgcolor: 'rgba(255, 152, 0, 0.1)', color: '#ff9800', border: '1px solid rgba(255, 152, 0, 0.3)' }}>
                            Scale-out target portions sum to <strong>{totalPortionPercent}%</strong>. For accurate profit calculations, the total exit portions must sum to exactly <strong>100%</strong>. (Use the "Equal Portions" button above to distribute equally).
                        </Alert>
                    )}
                </Stack>
            </Box>

            {/* Results Output Summary Column */}
            <Box sx={{ flex: 1 }}>
                <CalculatorSummaryCard
                    entryAmount={amountNum}
                    leverage={levNum}
                    entryPrice={entryPrice}
                    exitPrice={weightedExitPrice}
                    selectedCoin={selectedCoin}
                    positionType={positionType}
                    marketType="futures"
                    currentPrice={currentPrice}
                    pnl={netPnL}
                    roi={projectedROI}
                    totalValue={notionalValue}
                    margin={amountNum}
                    entryFee={entryFee}
                    exitFee={exitFee}
                    totalFees={totalFeesVal}
                    customTitle="Weighted Exit & Position Summary"
                />
            </Box>
        </Box>
    );
}

export default ScaleOutCalculatorTab;
