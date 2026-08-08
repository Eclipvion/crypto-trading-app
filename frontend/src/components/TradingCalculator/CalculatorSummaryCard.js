import React, { useState } from 'react';
import { Typography, Box, Divider, Chip, Tooltip } from '@mui/material';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import ShieldIcon from '@mui/icons-material/Shield';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import './CalculatorSummaryCard.css';

/**
 * CalculatorSummaryCard Component
 * Displays visual metrics for PnL, ROI, Position Value, Fees, Liquidation Price, R:R Ratio, and Break-Even Price.
 */
function CalculatorSummaryCard({
    entryAmount,
    leverage = 1,
    entryPrice,
    exitPrice,
    stopLossPrice,
    makerFee = 0.0002,
    takerFee = 0.0005,
    selectedCoin,
    positionType = 'long',
    marketType = 'spot',
    orderType = 'limit',
    currentPrice,
    pnl = 0,
    roi = 0,
    liquidationPrice = 0,
    totalValue = 0,
    margin = 0,
    entryFee = 0,
    exitFee = 0,
    totalFees = 0,
    exchangeName = 'binance',
    feeDescription = '',
    customTitle = 'Position Details & Summary'
}) {
    const [copied, setCopied] = useState(false);

    // Format numbers
    const formatPrice = (val) => {
        if (val === null || val === undefined || isNaN(val) || val === '') return '0.00';
        const num = parseFloat(val);
        if (num < 0.0001) return num.toFixed(8);
        if (num < 1) return num.toFixed(6);
        if (num < 10) return num.toFixed(4);
        return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const formatCurrency = (val) => {
        if (val === null || val === undefined || isNaN(val) || val === '') return '$0.00';
        const num = parseFloat(val);
        return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    // Calculate Break-Even Price considering round-trip fees
    const calculateBreakEven = () => {
        const entry = parseFloat(entryPrice);
        if (!entry || isNaN(entry) || entry <= 0) return 0;
        const feeFactor = (takerFee * 2); // approximate round-trip fee factor
        if (positionType === 'long') {
            return entry * (1 + feeFactor);
        } else {
            return entry * (1 - feeFactor);
        }
    };

    // Calculate Risk-to-Reward Ratio (R:R)
    const calculateRiskReward = () => {
        const entry = parseFloat(entryPrice);
        const exit = parseFloat(exitPrice);
        const sl = parseFloat(stopLossPrice);
        if (!entry || !exit || !sl || isNaN(entry) || isNaN(exit) || isNaN(sl)) return null;

        let reward = 0;
        let risk = 0;
        if (positionType === 'long') {
            reward = exit - entry;
            risk = entry - sl;
        } else {
            reward = entry - exit;
            risk = sl - entry;
        }

        if (risk <= 0 || reward <= 0) return null;
        return (reward / risk).toFixed(2);
    };

    // Calculate Liquidation Risk Level
    const getLiquidationRisk = () => {
        if (marketType !== 'futures' || !liquidationPrice || !currentPrice || liquidationPrice <= 0) return null;
        const curr = parseFloat(currentPrice);
        const liq = parseFloat(liquidationPrice);
        if (isNaN(curr) || isNaN(liq)) return null;

        const distancePct = Math.abs((curr - liq) / curr) * 100;
        if (distancePct < 5) return { label: 'CRITICAL RISK', color: '#ff3d00', pct: distancePct };
        if (distancePct < 15) return { label: 'HIGH RISK', color: '#ff9100', pct: distancePct };
        if (distancePct < 30) return { label: 'MODERATE RISK', color: '#ffea00', pct: distancePct };
        return { label: 'LOW RISK', color: '#00e676', pct: distancePct };
    };

    const breakEvenPrice = calculateBreakEven();
    const riskRewardRatio = calculateRiskReward();
    const liqRisk = getLiquidationRisk();

    // Copy formatted summary to clipboard
    const handleCopySummary = () => {
        const coinSymbol = selectedCoin ? selectedCoin.symbol : 'USDT Pair';
        const summaryText = `
=== ECLIPVION TRADE SIMULATION SUMMARY ===
Pair: ${coinSymbol}
Market: ${marketType.toUpperCase()} | Exchange: ${exchangeName.toUpperCase()}
Side: ${positionType.toUpperCase()} | Leverage: ${leverage}x
Entry Price: $${formatPrice(entryPrice)}
Exit Target: $${formatPrice(exitPrice)}
Stop Loss: ${stopLossPrice ? `$${formatPrice(stopLossPrice)}` : 'N/A'}
-------------------------------------------
Entry Amount: $${parseFloat(entryAmount || 0).toFixed(2)} USDT
Total Position Value: ${formatCurrency(totalValue)}
Margin Required: ${formatCurrency(margin)}
Est. Fees (Entry + Exit): ${formatCurrency(totalFees)}
Break-Even Exit Price: $${formatPrice(breakEvenPrice)}
${marketType === 'futures' ? `Est. Liquidation Price: $${formatPrice(liquidationPrice)}` : ''}
${riskRewardRatio ? `Risk:Reward Ratio: 1:${riskRewardRatio}` : ''}
-------------------------------------------
Projected Net PnL: ${pnl >= 0 ? '+' : ''}${formatCurrency(pnl)}
Projected ROI: ${roi >= 0 ? '+' : ''}${parseFloat(roi || 0).toFixed(2)}%
===========================================
        `.trim();

        navigator.clipboard.writeText(summaryText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {/* Header Title with Copy Action */}
            <Box className="summary-card-header" sx={{ mb: 2, pb: 1.5, borderBottom: '1px solid rgba(57, 255, 20, 0.1)' }}>
                <Typography className="summary-card-title">
                    <ShowChartIcon sx={{ color: 'var(--neon-cyan)', fontSize: '1.1rem' }} />
                    {customTitle}
                </Typography>
                <Tooltip title={copied ? "Copied!" : "Copy Trade Summary"}>
                    <Chip
                        icon={copied ? <CheckIcon fontSize="small" style={{ color: '#00e676' }} /> : <ContentCopyIcon fontSize="small" style={{ color: '#00f0ff' }} />}
                        label={copied ? "Copied" : "Copy Summary"}
                        onClick={handleCopySummary}
                        size="small"
                        clickable
                        className="preset-chip-action"
                        sx={{
                            bgcolor: copied ? 'rgba(0, 230, 118, 0.15)' : 'rgba(0, 240, 255, 0.1)',
                            color: copied ? '#00e676' : '#00f0ff',
                            border: `1px solid ${copied ? 'rgba(0, 230, 118, 0.3)' : 'rgba(0, 240, 255, 0.3)'}`,
                            fontWeight: 700,
                            fontSize: '0.7rem'
                        }}
                    />
                </Tooltip>
            </Box>

            {/* Projected PnL & ROI Hero Highlight Banner */}
            <Box className={`summary-pnl-hero ${pnl >= 0 ? 'profit' : 'loss'}`}>
                <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 700, fontSize: '0.68rem' }}>
                        Estimated Net PnL (After Fees)
                    </Typography>
                    <Typography className={`summary-pnl-value ${pnl >= 0 ? 'positive' : 'negative'}`}>
                        {pnl >= 0 ? '+' : ''}{formatCurrency(pnl)}
                    </Typography>
                </Box>

                <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 700, fontSize: '0.68rem' }}>
                        Return on Investment (ROI)
                    </Typography>
                    <Typography className={`summary-roi-value ${roi >= 0 ? 'positive' : 'negative'}`}>
                        {roi >= 0 ? '+' : ''}{parseFloat(roi || 0).toFixed(2)}%
                    </Typography>
                </Box>
            </Box>

            <div className="details-content" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                
                {/* 1. Trade Key Metrics Grid */}
                <Box className="details-grid" sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 1.8 }}>
                    
                    <div className="details-item">
                        <Typography variant="caption" color="textSecondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>Position Side</Typography>
                        <Typography variant="body1" fontWeight="bold" sx={{ color: positionType === 'long' ? '#00e676' : '#ff3d00', display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.3 }}>
                            {positionType === 'long' ? <><TrendingUpIcon fontSize="small" /> LONG</> : <><TrendingDownIcon fontSize="small" /> SHORT</>}
                        </Typography>
                    </div>

                    <div className="details-item">
                        <Typography variant="caption" color="textSecondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>Market & Leverage</Typography>
                        <Typography variant="body1" fontWeight="bold" sx={{ mt: 0.3 }}>
                            {marketType.toUpperCase()} ({leverage}x)
                        </Typography>
                    </div>

                    <div className="details-item">
                        <Typography variant="caption" color="textSecondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>Entry Price</Typography>
                        <Typography variant="body1" fontWeight="bold" sx={{ color: '#00e5ff', mt: 0.3 }}>
                            ${formatPrice(entryPrice)}
                        </Typography>
                    </div>

                    <div className="details-item">
                        <Typography variant="caption" color="textSecondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>Target Exit Price</Typography>
                        <Typography variant="body1" fontWeight="bold" sx={{ color: '#f8fafc', mt: 0.3 }}>
                            ${formatPrice(exitPrice)}
                        </Typography>
                    </div>

                </Box>

                <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.06)' }} />

                {/* 2. Position Financial Breakdown */}
                <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 0.8, color: 'var(--neon-cyan)', fontWeight: 700 }}>
                        <AccountBalanceWalletIcon fontSize="small" />
                        Capital & Margin Allocation
                    </Typography>

                    <Box className="details-grid" sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 1.8 }}>
                        <div className="details-item">
                            <Typography variant="caption" color="textSecondary">Required Margin</Typography>
                            <Typography variant="body1" fontWeight="bold" sx={{ mt: 0.2 }}>
                                {formatCurrency(margin)}
                            </Typography>
                        </div>

                        <div className="details-item">
                            <Typography variant="caption" color="textSecondary">Total Position Notional</Typography>
                            <Typography variant="body1" fontWeight="bold" sx={{ mt: 0.2 }}>
                                {formatCurrency(totalValue)}
                            </Typography>
                        </div>

                        <div className="details-item">
                            <Typography variant="caption" color="textSecondary">Break-Even Exit Price</Typography>
                            <Typography variant="body1" fontWeight="bold" sx={{ color: '#ffb74d', mt: 0.2 }}>
                                ${formatPrice(breakEvenPrice)}
                            </Typography>
                        </div>

                        {riskRewardRatio && (
                            <div className="details-item">
                                <Typography variant="caption" color="textSecondary">Risk : Reward Ratio</Typography>
                                <Typography variant="body1" fontWeight="bold" sx={{ color: parseFloat(riskRewardRatio) >= 2 ? '#00e676' : '#ff9100', mt: 0.2 }}>
                                    1 : {riskRewardRatio}
                                </Typography>
                            </div>
                        )}
                    </Box>
                </Box>

                {/* Futures Liquidation Proximity (If Futures Market) */}
                {marketType === 'futures' && (
                    <>
                        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.06)' }} />
                        <Box sx={{
                            p: 2,
                            borderRadius: 2,
                            bgcolor: 'rgba(13, 17, 26, 0.8)',
                            border: `1px solid ${liqRisk ? liqRisk.color + '40' : 'rgba(255, 255, 255, 0.08)'}`
                        }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.8, fontWeight: 700, color: 'text.secondary' }}>
                                    <ShieldIcon fontSize="small" sx={{ color: liqRisk ? liqRisk.color : '#ff9800' }} />
                                    ESTIMATED LIQUIDATION PRICE
                                </Typography>
                                {liqRisk && (
                                    <Chip
                                        label={liqRisk.label}
                                        size="small"
                                        sx={{
                                            bgcolor: `${liqRisk.color}20`,
                                            color: liqRisk.color,
                                            border: `1px solid ${liqRisk.color}50`,
                                            fontWeight: 700,
                                            fontSize: '0.65rem'
                                        }}
                                    />
                                )}
                            </Box>
                            <Typography sx={{ fontSize: '1.15rem', fontWeight: 800, color: '#ff3d00', fontFamily: '"JetBrains Mono", "Space Grotesk", monospace' }}>
                                ${formatPrice(liquidationPrice)}
                            </Typography>
                            {liqRisk && (
                                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.3, fontSize: '0.75rem' }}>
                                    Distance from live price: <strong>{liqRisk.pct.toFixed(2)}%</strong>
                                </Typography>
                            )}
                        </Box>
                    </>
                )}

                {/* 3. Exchange Fee Breakdown */}
                <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.06)' }} />
                <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.8, color: 'text.secondary', fontWeight: 600 }}>
                        <ReceiptLongIcon fontSize="small" />
                        Fee Structure ({exchangeName.toUpperCase()})
                    </Typography>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                        <Typography variant="caption" color="textSecondary">Entry Order Fee:</Typography>
                        <Typography variant="caption" fontWeight="bold">{formatCurrency(entryFee)} ({(takerFee * 100).toFixed(3)}%)</Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', mt: 0.5 }}>
                        <Typography variant="caption" color="textSecondary">Exit Order Fee:</Typography>
                        <Typography variant="caption" fontWeight="bold">{formatCurrency(exitFee)} ({(takerFee * 100).toFixed(3)}%)</Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', mt: 0.5 }}>
                        <Typography variant="caption" color="textSecondary" fontWeight="bold">Total Exchange Fees:</Typography>
                        <Typography variant="caption" fontWeight="bold" sx={{ color: '#ff9800' }}>{formatCurrency(totalFees)}</Typography>
                    </Box>

                    {feeDescription && (
                        <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary', fontStyle: 'italic', fontSize: '0.75rem' }}>
                            * {feeDescription}
                        </Typography>
                    )}
                </Box>
            </div>
        </Box>
    );
}

export default CalculatorSummaryCard;
