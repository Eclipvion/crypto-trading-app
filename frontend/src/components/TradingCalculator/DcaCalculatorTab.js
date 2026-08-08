import React, { useState } from 'react';
import {
    Typography, TextField, Box, Divider, Button, Stack, Chip, IconButton
} from '@mui/material';
import LayersIcon from '@mui/icons-material/Layers';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CalculatorSummaryCard from './CalculatorSummaryCard';
import './DcaCalculatorTab.css';

function DcaCalculatorTab({
    selectedCoin,
    currentPrice
}) {
    // Array of DCA order tiers
    const [orders, setOrders] = useState([
        { id: 1, price: currentPrice ? (currentPrice * 1.0).toFixed(2) : '95000', amount: '500' },
        { id: 2, price: currentPrice ? (currentPrice * 0.95).toFixed(2) : '90250', amount: '750' },
        { id: 3, price: currentPrice ? (currentPrice * 0.90).toFixed(2) : '85500', amount: '1000' }
    ]);

    const [targetExit, setTargetExit] = useState(currentPrice ? (currentPrice * 1.15).toFixed(2) : '109250');

    // Add new DCA order tier
    const handleAddOrder = () => {
        if (orders.length >= 6) return;
        const lastOrder = orders[orders.length - 1];
        const lastPrice = parseFloat(lastOrder?.price || currentPrice || 95000);
        const lastAmount = parseFloat(lastOrder?.amount || 500);

        setOrders([
            ...orders,
            {
                id: Date.now(),
                price: (lastPrice * 0.95).toFixed(2),
                amount: (lastAmount * 1.25).toFixed(0)
            }
        ]);
    };

    // Remove DCA order tier
    const handleRemoveOrder = (id) => {
        if (orders.length <= 1) return;
        setOrders(orders.filter(o => o.id !== id));
    };

    // Update DCA order tier
    const handleUpdateOrder = (id, field, val) => {
        const sanitized = val.replace(/[^0-9.]/g, '');
        setOrders(orders.map(o => o.id === id ? { ...o, [field]: sanitized } : o));
    };

    // Calculations
    let totalSpentUSDT = 0;
    let totalCryptoUnits = 0;

    orders.forEach(o => {
        const p = parseFloat(o.price) || 0;
        const a = parseFloat(o.amount) || 0;
        if (p > 0 && a > 0) {
            totalSpentUSDT += a;
            totalCryptoUnits += (a / p);
        }
    });

    const averageEntryPrice = totalCryptoUnits > 0 ? totalSpentUSDT / totalCryptoUnits : 0;
    const initialPrice = parseFloat(orders[0]?.price || 0);

    // Savings compared to buying 100% at initial price
    const dcaDiscountPct = (initialPrice > 0 && averageEntryPrice > 0)
        ? ((initialPrice - averageEntryPrice) / initialPrice) * 100
        : 0;

    // Projected Profit at target exit
    const targetExitNum = parseFloat(targetExit) || 0;
    const projectedProfitUSDT = (targetExitNum > 0 && averageEntryPrice > 0)
        ? (totalCryptoUnits * targetExitNum) - totalSpentUSDT
        : 0;

    const projectedROI = totalSpentUSDT > 0 ? (projectedProfitUSDT / totalSpentUSDT) * 100 : 0;

    return (
        <Box sx={{ display: 'flex', gap: '28px', flexDirection: { xs: 'column', lg: 'row' } }}>
            {/* Input Form Column */}
            <Box sx={{ flex: 1.2 }}>
                <Box sx={{ mb: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1.5, borderBottom: '1px solid rgba(57, 255, 20, 0.1)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LayersIcon sx={{ color: '#39ff14', fontSize: 18 }} />
                        <Typography sx={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: '0.8rem', color: '#39ff14', textTransform: 'uppercase', letterSpacing: '1.2px' }}>
                            Multi-Order DCA Entry Grid
                        </Typography>
                    </Box>
                    <Button
                        size="small"
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={handleAddOrder}
                        disabled={orders.length >= 6}
                        sx={{ borderRadius: 99, borderColor: '#39ff14', color: '#39ff14', fontSize: '0.72rem' }}
                    >
                        Add Tier
                    </Button>
                </Box>

                    <Stack spacing={2}>
                        {orders.map((order, idx) => (
                            <Box key={order.id} sx={{
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
                                    label={`Tier #${idx + 1}`}
                                    size="small"
                                    sx={{ bgcolor: 'rgba(0, 229, 255, 0.1)', color: '#00e5ff', fontWeight: 700, fontFamily: '"Space Grotesk", sans-serif' }}
                                />

                                <TextField
                                    label="Buy Price ($)"
                                    value={order.price}
                                    onChange={(e) => handleUpdateOrder(order.id, 'price', e.target.value)}
                                    size="small"
                                    sx={{ flex: 1, minWidth: '130px' }}
                                />

                                <TextField
                                    label="Amount (USDT)"
                                    value={order.amount}
                                    onChange={(e) => handleUpdateOrder(order.id, 'amount', e.target.value)}
                                    size="small"
                                    sx={{ flex: 1, minWidth: '130px' }}
                                />

                                {orders.length > 1 && (
                                    <IconButton
                                        onClick={() => handleRemoveOrder(order.id)}
                                        size="small"
                                        sx={{ color: '#ff3d00', '&:hover': { bgcolor: 'rgba(255, 61, 0, 0.1)' } }}
                                    >
                                        <DeleteOutlineIcon />
                                    </IconButton>
                                )}
                            </Box>
                        ))}

                        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.06)' }} />

                        {/* Target Exit Price */}
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                            <TextField
                                fullWidth
                                label="Target Exit Price ($)"
                                value={targetExit}
                                onChange={(e) => setTargetExit(e.target.value.replace(/[^0-9.]/g, ''))}
                                variant="outlined"
                            />
                        </Box>

                        {/* DCA Advantage Summary Chip */}
                        {dcaDiscountPct > 0 && (
                            <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(0, 230, 118, 0.08)', border: '1px solid rgba(0, 230, 118, 0.2)' }}>
                                <Typography variant="caption" sx={{ color: '#00e676', fontWeight: 700, display: 'block' }}>
                                    🎯 DCA Advantage: Average Entry is {dcaDiscountPct.toFixed(2)}% lower than Tier #1 entry price!
                                </Typography>
                            </Box>
                        )}
                    </Stack>
            </Box>

            {/* Results Output Summary Column */}
            <Box sx={{ flex: 1 }}>
                <CalculatorSummaryCard
                    entryAmount={totalSpentUSDT}
                    leverage={1}
                    entryPrice={averageEntryPrice}
                    exitPrice={targetExitNum}
                    selectedCoin={selectedCoin}
                    positionType="long"
                    marketType="spot"
                    currentPrice={currentPrice}
                    pnl={projectedProfitUSDT}
                    roi={projectedROI}
                    totalValue={totalSpentUSDT}
                    margin={totalSpentUSDT}
                    customTitle="DCA Weighted Average Summary"
                />
            </Box>
        </Box>
    );
}

export default DcaCalculatorTab;
