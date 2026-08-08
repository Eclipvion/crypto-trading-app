import React, { useState } from 'react';
import {
    Typography, TextField, Box, Divider, Slider, Chip, Stack, Alert
} from '@mui/material';
import ShieldIcon from '@mui/icons-material/Shield';
import CalculatorSummaryCard from './CalculatorSummaryCard';
import './RiskPositionSizeTab.css';

function RiskPositionSizeTab({
    selectedCoin,
    currentPrice,
    entryPrice: sharedEntryPrice,
    setEntryPrice: setSharedEntryPrice,
    positionType: sharedPositionType,
    setPositionType: setSharedPositionType
}) {
    const [accountCapital, setAccountCapital] = useState('10000');
    const [riskPercent, setRiskPercent] = useState(2); // default 2% risk
    const [entryPrice, setEntryPrice] = useState(sharedEntryPrice || currentPrice ? (sharedEntryPrice || currentPrice.toString()) : '95000');
    const [stopLossPrice, setStopLossPrice] = useState('93100'); // 2% SL default
    const [targetExitPrice, setTargetExitPrice] = useState('100700'); // 6% gain default (1:3 RR)
    const [leverage, setLeverage] = useState(5);

    const handleNumberInput = (val, setter) => {
        const sanitized = val.replace(/[^0-9.]/g, '');
        const parts = sanitized.split('.');
        const formatted = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : sanitized;
        setter(formatted);
    };

    // Auto set SL percentage
    const handleQuickSL = (slPct) => {
        const entry = parseFloat(entryPrice || currentPrice || 0);
        if (!entry) return;
        let sl = 0;
        if (sharedPositionType === 'long') {
            sl = entry * (1 - slPct / 100);
        } else {
            sl = entry * (1 + slPct / 100);
        }
        setStopLossPrice(sl.toFixed(entry < 1 ? 6 : 2));
    };

    // Calculations
    const capitalNum = parseFloat(accountCapital) || 0;
    const riskPctNum = parseFloat(riskPercent) || 0;
    const entryNum = parseFloat(entryPrice) || 0;
    const slNum = parseFloat(stopLossPrice) || 0;
    const targetNum = parseFloat(targetExitPrice) || 0;
    const levNum = parseFloat(leverage) || 1;

    // Dollar amount at risk
    const riskDollars = (capitalNum * riskPctNum) / 100;

    // Price difference per coin to Stop Loss
    const priceDiffToSL = Math.abs(entryNum - slNum);

    // Calculated max units (coins)
    const positionUnits = (priceDiffToSL > 0 && entryNum > 0) ? riskDollars / priceDiffToSL : 0;

    // Calculated position notional value
    const positionNotionalUSDT = positionUnits * entryNum;

    // Required Margin
    const requiredMargin = levNum > 0 ? positionNotionalUSDT / levNum : positionNotionalUSDT;

    // Projected Profit if Target Exit is reached
    const priceDiffToTarget = Math.abs(targetNum - entryNum);
    const projectedProfitUSDT = positionUnits * priceDiffToTarget;

    // Projected ROI % on Margin
    const projectedROI = requiredMargin > 0 ? (projectedProfitUSDT / requiredMargin) * 100 : 0;

    // Check if margin requirement exceeds account balance
    const isMarginExcessive = requiredMargin > capitalNum;

    return (
        <Box sx={{ display: 'flex', gap: '28px', flexDirection: { xs: 'column', lg: 'row' } }}>
            {/* Input Form Column */}
            <Box sx={{ flex: 1.2 }}>
                <Box sx={{ mb: 2.5, display: 'flex', alignItems: 'center', gap: 1, pb: 1.5, borderBottom: '1px solid rgba(57, 255, 20, 0.1)' }}>
                    <ShieldIcon sx={{ color: '#39ff14', fontSize: 18 }} />
                    <Typography sx={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: '0.8rem', color: '#39ff14', textTransform: 'uppercase', letterSpacing: '1.2px' }}>
                        Risk Management &amp; Position Sizing
                    </Typography>
                </Box>

                <Stack spacing={2.5}>
                        
                        {/* Account Capital Input */}
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                fullWidth
                                label="Total Account Capital (USDT)"
                                value={accountCapital}
                                onChange={(e) => handleNumberInput(e.target.value, setAccountCapital)}
                                variant="outlined"
                            />
                        </Box>

                        {/* Risk Percentage Presets */}
                        <Box>
                            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: { xs: 1, sm: 0 }, mb: 0.5 }}>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                                    Risk Tolerance Per Trade: <strong style={{ color: '#ff3d00' }}>{riskPercent}%</strong> (${riskDollars.toFixed(2)} USDT)
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap' }}>
                                    {[0.5, 1, 2, 3, 5].map(r => (
                                        <Chip
                                            key={r}
                                            label={`${r}%`}
                                            size="small"
                                            onClick={() => setRiskPercent(r)}
                                            clickable
                                            sx={{
                                                bgcolor: riskPercent === r ? 'rgba(255, 61, 0, 0.2)' : 'rgba(255,255,255,0.04)',
                                                color: riskPercent === r ? '#ff3d00' : 'text.secondary',
                                                border: `1px solid ${riskPercent === r ? '#ff3d00' : 'transparent'}`,
                                                fontWeight: 600,
                                                fontSize: '0.7rem'
                                            }}
                                        />
                                    ))}
                                </Box>
                            </Box>
                            <Slider
                                value={riskPercent}
                                onChange={(e, val) => setRiskPercent(val)}
                                min={0.25}
                                max={10}
                                step={0.25}
                            />
                        </Box>

                        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.06)' }} />

                        {/* Entry Price, Stop Loss & Target Exit */}
                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                            <Box sx={{ flex: 1, minWidth: '140px' }}>
                                <Typography variant="caption" color="textSecondary" sx={{ mb: 0.5, display: 'block' }}>Entry Price ($)</Typography>
                                <TextField
                                    fullWidth
                                    value={entryPrice}
                                    onChange={(e) => {
                                        handleNumberInput(e.target.value, setEntryPrice);
                                        if (setSharedEntryPrice) setSharedEntryPrice(e.target.value);
                                    }}
                                    variant="outlined"
                                />
                            </Box>

                            <Box sx={{ flex: 1, minWidth: '140px' }}>
                                <Typography variant="caption" color="textSecondary" sx={{ mb: 0.5, display: 'block' }}>Stop Loss Price ($)</Typography>
                                <TextField
                                    fullWidth
                                    value={stopLossPrice}
                                    onChange={(e) => handleNumberInput(e.target.value, setStopLossPrice)}
                                    variant="outlined"
                                />
                            </Box>

                            <Box sx={{ flex: 1, minWidth: '140px' }}>
                                <Typography variant="caption" color="textSecondary" sx={{ mb: 0.5, display: 'block' }}>Target Take Profit ($)</Typography>
                                <TextField
                                    fullWidth
                                    value={targetExitPrice}
                                    onChange={(e) => handleNumberInput(e.target.value, setTargetExitPrice)}
                                    variant="outlined"
                                />
                            </Box>
                        </Box>

                        {/* Quick SL distance presets */}
                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, gap: 1 }}>
                            <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>Quick Stop Loss Distance:</Typography>
                            <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap' }}>
                                {[1, 2, 3, 5, 10].map(pct => (
                                    <Chip
                                        key={pct}
                                        label={`${pct}% SL`}
                                        size="small"
                                        onClick={() => handleQuickSL(pct)}
                                        clickable
                                        sx={{ bgcolor: 'rgba(255, 61, 0, 0.1)', color: '#ff3d00', border: '1px solid rgba(255, 61, 0, 0.3)', fontSize: '0.7rem', fontWeight: 600 }}
                                    />
                                ))}
                            </Box>
                        </Box>

                        {/* Leverage */}
                        <Box>
                            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: { xs: 1, sm: 0 }, mb: 0.5 }}>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                                    Planned Leverage: <strong style={{ color: '#00e5ff' }}>{leverage}x</strong>
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap' }}>
                                    {[1, 2, 5, 10, 20, 50].map(lev => (
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

                        {/* Excess Margin Warning */}
                        {isMarginExcessive && (
                            <Alert severity="warning" sx={{ bgcolor: 'rgba(255, 152, 0, 0.1)', color: '#ff9800', border: '1px solid rgba(255, 152, 0, 0.3)' }}>
                                Required margin (${requiredMargin.toFixed(2)}) exceeds total account capital (${capitalNum.toFixed(2)}). Consider widening your Stop Loss distance or increasing leverage safely.
                            </Alert>
                        )}

                </Stack>
            </Box>

            {/* Results Output Summary Column */}
            <Box sx={{ flex: 1 }}>
                <CalculatorSummaryCard
                    entryAmount={requiredMargin}
                    leverage={levNum}
                    entryPrice={entryPrice}
                    exitPrice={targetExitPrice}
                    stopLossPrice={stopLossPrice}
                    selectedCoin={selectedCoin}
                    positionType={sharedPositionType}
                    marketType="futures"
                    currentPrice={currentPrice}
                    pnl={projectedProfitUSDT}
                    roi={projectedROI}
                    totalValue={positionNotionalUSDT}
                    margin={requiredMargin}
                    customTitle="Risk & Position Sizing Output"
                />
            </Box>
        </Box>
    );
}

export default RiskPositionSizeTab;
