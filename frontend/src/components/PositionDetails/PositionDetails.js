import React from 'react';
import { Paper, Typography, Divider, Box } from '@mui/material';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import PaidIcon from '@mui/icons-material/Paid';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PercentIcon from '@mui/icons-material/Percent';
import LocalAtmIcon from '@mui/icons-material/LocalAtm';
import './PositionDetails.css';

function PositionDetails({
    entryAmount,
    leverage,
    entryPrice,
    exitPrice,
    makerFee,
    takerFee,
    selectedCoin,
    positionType,
    marketType,
    orderType,
    currentPrice,
    pnl,
    roi,
    liquidationPrice,
    totalValue,
    margin,
    entryFee,
    exitFee,
    totalFees,
    feeDescription
}) {
    // Format numbers to show 8 decimal places for prices, 2 decimal places for dollar amounts
    const formatNumber = (number, isPrice = false) => {
        if (number === null || number === undefined || isNaN(number)) return isPrice ? '0.00000000' : '0.00';
        return parseFloat(number).toFixed(isPrice ? 8 : 2);
    };

    // Calculate live unrealized PNL in real-time
    const calculateLivePNL = () => {
        if (!entryPrice || !currentPrice || !entryAmount) return null;
        const entryPriceVal = parseFloat(entryPrice);
        const entryAmountVal = parseFloat(entryAmount);
        if (isNaN(entryPriceVal) || isNaN(entryAmountVal) || entryPriceVal <= 0) return null;

        const priceDiff = positionType === 'long'
            ? currentPrice - entryPriceVal
            : entryPriceVal - currentPrice;
        
        const grossLive = (priceDiff / entryPriceVal) * entryAmountVal * leverage;
        const orderVal = entryAmountVal * leverage;
        const entryFeeVal = orderVal * takerFee;
        const exitFeeVal = orderVal * takerFee;
        const totalFeesVal = entryFeeVal + exitFeeVal;

        return grossLive - totalFeesVal;
    };

    const livePnl = calculateLivePNL();
    const liveRoi = (livePnl !== null && entryAmount && parseFloat(entryAmount) > 0) 
        ? (livePnl / parseFloat(entryAmount)) * 100 
        : null;

    return (
        <Paper className="details-paper" sx={{ p: 3, borderRadius: 1, height: '100%', boxShadow: '0px 2px 8px rgba(0,0,0,0.1)' }}>
            <Typography className="details-title" variant="h6" sx={{
                mb: 3,
                pb: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                borderBottom: '1px solid rgba(0,0,0,0.1)'
            }}>
                <ShowChartIcon className="details-icon" />
                Position Details
            </Typography>

            <div className="details-content" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Position Overview */}
                <div className="details-section">
                    <Typography variant="subtitle1" fontWeight="medium" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ShowChartIcon fontSize="small" />
                        Position Overview
                    </Typography>

                    <Box className="details-grid" sx={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                        gap: 2
                    }}>
                        <div className="details-item">
                            <Typography variant="body2" color="textSecondary">Position Type</Typography>
                            <Typography variant="body1" fontWeight="medium"
                                sx={{
                                    color: positionType === 'long' ? '#2e7d32' : '#d32f2f',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5
                                }}
                            >
                                {positionType === 'long' ?
                                    <><TrendingUpIcon fontSize="small" /> Long</> :
                                    <><TrendingDownIcon fontSize="small" /> Short</>
                                }
                            </Typography>
                        </div>

                        <div className="details-item">
                            <Typography variant="body2" color="textSecondary">Market Type</Typography>
                            <Typography variant="body1" fontWeight="medium">
                                {marketType.charAt(0).toUpperCase() + marketType.slice(1)}
                            </Typography>
                        </div>

                        <div className="details-item">
                            <Typography variant="body2" color="textSecondary">Order Type</Typography>
                            <Typography variant="body1" fontWeight="medium">
                                {orderType.charAt(0).toUpperCase() + orderType.slice(1)}
                            </Typography>
                        </div>

                        {marketType === 'futures' && (
                            <div className="details-item">
                                <Typography variant="body2" color="textSecondary">Leverage</Typography>
                                <Typography variant="body1" fontWeight="medium">{leverage}x</Typography>
                            </div>
                        )}

                        <div className="details-item">
                            <Typography variant="body2" color="textSecondary">Entry Price</Typography>
                            <Typography variant="body1" fontWeight="medium" sx={{
                                color: orderType === 'market' ? '#ff9800' : 'inherit'
                            }}>
                                ${formatNumber(entryPrice, true)}
                                {orderType === 'market' && <span style={{ fontSize: '0.75rem', marginLeft: '4px' }}>(Market)</span>}
                            </Typography>
                        </div>

                        <div className="details-item">
                            <Typography variant="body2" color="textSecondary">Exit Price</Typography>
                            <Typography variant="body1" fontWeight="medium">${formatNumber(exitPrice, true)}</Typography>
                        </div>
                    </Box>
                </div>

                <Divider />

                {/* Trade Value */}
                <div className="details-section">
                    <Typography variant="subtitle1" fontWeight="medium" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AccountBalanceWalletIcon fontSize="small" />
                        Trade Value
                    </Typography>

                    <Box className="details-grid" sx={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                        gap: 2
                    }}>
                        <div className="details-item">
                            <Typography variant="body2" color="textSecondary">Entry Amount</Typography>
                            <Typography variant="body1" fontWeight="medium">${formatNumber(entryAmount)}</Typography>
                        </div>

                        {marketType === 'futures' && (
                            <div className="details-item">
                                <Typography variant="body2" color="textSecondary">Margin Used</Typography>
                                <Typography variant="body1" fontWeight="medium">${formatNumber(margin)}</Typography>
                            </div>
                        )}

                        <div className="details-item">
                            <Typography variant="body2" color="textSecondary">Total Position Value</Typography>
                            <Typography variant="body1" fontWeight="medium">${formatNumber(totalValue)}</Typography>
                        </div>
                    </Box>
                </div>

                <Divider />

                {/* Profit/Loss */}
                <div className="details-section">
                    <Typography variant="subtitle1" fontWeight="medium" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PaidIcon fontSize="small" />
                        Profit & Loss
                    </Typography>

                    <Box className="details-grid" sx={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                        gap: 2
                    }}>
                        <div className="details-item">
                            <Typography variant="body2" color="textSecondary">Target PNL</Typography>
                            <Typography
                                variant="body1"
                                fontWeight="bold"
                                sx={{ color: pnl >= 0 ? '#2e7d32' : '#d32f2f' }}
                            >
                                ${formatNumber(pnl)} {pnl >= 0 ? '(Profit)' : '(Loss)'}
                            </Typography>
                        </div>

                        <div className="details-item">
                            <Typography variant="body2" color="textSecondary">Target ROI</Typography>
                            <Typography
                                variant="body1"
                                fontWeight="bold"
                                sx={{
                                    color: roi >= 0 ? '#2e7d32' : '#d32f2f',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5
                                }}
                            >
                                <PercentIcon fontSize="small" />
                                {formatNumber(roi)}%
                            </Typography>
                        </div>

                        {marketType === 'futures' && (
                            <div className="details-item">
                                <Typography variant="body2" color="textSecondary">Liquidation Price</Typography>
                                <Typography
                                    variant="body1"
                                    fontWeight="medium"
                                    sx={{ color: '#ff9800' }}
                                >
                                    ${formatNumber(liquidationPrice, true)}
                                </Typography>
                            </div>
                        )}

                        {livePnl !== null && (
                            <div className="details-item" style={{ 
                                gridColumn: '1 / -1', 
                                background: 'rgba(0, 229, 255, 0.03)', 
                                border: '1px dashed rgba(0, 229, 255, 0.15)', 
                                padding: '12px', 
                                borderRadius: '8px', 
                                marginTop: '4px' 
                            }}>
                                <Typography variant="caption" color="textSecondary" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700, letterSpacing: '0.5px' }}>
                                    <span style={{ 
                                        display: 'inline-block', 
                                        width: 8, 
                                        height: 8, 
                                        borderRadius: '50%', 
                                        backgroundColor: '#00e5ff', 
                                        boxShadow: '0 0 8px #00e5ff',
                                        animation: 'pulse 1.5s infinite' 
                                    }} />
                                    LIVE UNREALIZED PNL (MARKET: ${formatNumber(currentPrice, true)})
                                </Typography>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1.5 }}>
                                    <Typography
                                        variant="body1"
                                        fontWeight="bold"
                                        sx={{ color: livePnl >= 0 ? '#2e7d32' : '#d32f2f', fontSize: '1.05rem' }}
                                    >
                                        ${formatNumber(livePnl)} {livePnl >= 0 ? '(Profit)' : '(Loss)'}
                                    </Typography>
                                    <Typography
                                        variant="body1"
                                        fontWeight="bold"
                                        sx={{
                                            color: liveRoi >= 0 ? '#2e7d32' : '#d32f2f',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 0.5,
                                            fontSize: '1.05rem'
                                        }}
                                    >
                                        <PercentIcon fontSize="small" />
                                        {formatNumber(liveRoi)}%
                                    </Typography>
                                </Box>
                            </div>
                        )}
                    </Box>
                </div>

                <Divider />

                {/* Fees */}
                <div className="details-section">
                    <Typography variant="subtitle1" fontWeight="medium" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocalAtmIcon fontSize="small" />
                        Trading Fees
                    </Typography>

                    <Box className="details-grid" sx={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                        gap: 2
                    }}>
                        <div className="details-item">
                            <Typography variant="body2" color="textSecondary">Entry Fee</Typography>
                            <Typography variant="body1" fontWeight="medium">${formatNumber(entryFee)}</Typography>
                        </div>

                        <div className="details-item">
                            <Typography variant="body2" color="textSecondary">Exit Fee</Typography>
                            <Typography variant="body1" fontWeight="medium">${formatNumber(exitFee)}</Typography>
                        </div>

                        <div className="details-item">
                            <Typography variant="body2" color="textSecondary">Total Fees</Typography>
                            <Typography variant="body1" fontWeight="medium">${formatNumber(totalFees)}</Typography>
                        </div>

                        <div className="details-item" style={{ gridColumn: '1 / -1' }}>
                            <Typography variant="body2" color="textSecondary">Fee Structure</Typography>
                            <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'text.secondary', mt: 0.5 }}>
                                {feeDescription}
                            </Typography>
                        </div>
                    </Box>
                </div>
            </div>
        </Paper>
    );
}

export default PositionDetails; 