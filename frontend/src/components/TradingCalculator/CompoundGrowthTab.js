import React, { useState } from 'react';
import {
    Typography, TextField, Box, Slider, Stack, Chip, Table, TableBody, TableCell, TableHead, TableRow
} from '@mui/material';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import PaidIcon from '@mui/icons-material/Paid';
import './CompoundGrowthTab.css';

function CompoundGrowthTab() {
    const [initialBalance, setInitialBalance] = useState('5000');
    const [winRate, setWinRate] = useState(60); // 60% win rate
    const [riskPerTrade, setRiskPerTrade] = useState(2); // 2% risk
    const [rewardRatio, setRewardRatio] = useState(2.0); // 1:2 R:R ratio
    const [totalTrades, setTotalTrades] = useState(30); // 30 trades simulation

    const handleNumberInput = (val, setter) => {
        const sanitized = val.replace(/[^0-9.]/g, '');
        const parts = sanitized.split('.');
        const formatted = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : sanitized;
        setter(formatted);
    };

    // Calculations
    const initBal = parseFloat(initialBalance) || 0;
    const winRatePct = (parseFloat(winRate) || 0) / 100;
    const lossRatePct = 1 - winRatePct;
    const riskPct = (parseFloat(riskPerTrade) || 0) / 100;
    const rrRatio = parseFloat(rewardRatio) || 1;
    const tradesCount = parseInt(totalTrades, 10) || 1;

    // Expected Gain % per trade = (Win Rate * (Risk % * R:R)) - (Loss Rate * Risk %)
    const expectedGainPerTradePct = (winRatePct * (riskPct * rrRatio)) - (lossRatePct * riskPct);

    // Compound simulation array
    const milestones = [];
    let currentBal = initBal;
    const stepSize = Math.max(1, Math.floor(tradesCount / 6));

    for (let i = 1; i <= tradesCount; i++) {
        currentBal = currentBal * (1 + expectedGainPerTradePct);
        if (i % stepSize === 0 || i === tradesCount) {
            milestones.push({
                trade: i,
                balance: currentBal,
                profit: currentBal - initBal,
                growthPct: initBal > 0 ? ((currentBal - initBal) / initBal) * 100 : 0
            });
        }
    }

    const finalBalance = currentBal;
    const totalProfit = finalBalance - initBal;
    const totalGrowthPct = initBal > 0 ? (totalProfit / initBal) * 100 : 0;

    return (
        <Box sx={{ display: 'flex', gap: '28px', flexDirection: { xs: 'column', lg: 'row' } }}>
            {/* Input Form Column */}
            <Box sx={{ flex: 1.2 }}>
                <Box sx={{ mb: 2.5, display: 'flex', alignItems: 'center', gap: 1, pb: 1.5, borderBottom: '1px solid rgba(57, 255, 20, 0.1)' }}>
                    <AutoGraphIcon sx={{ color: '#39ff14', fontSize: 18 }} />
                    <Typography sx={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: '0.8rem', color: '#39ff14', textTransform: 'uppercase', letterSpacing: '1.2px' }}>
                        Compound Growth &amp; EV Simulator
                    </Typography>
                </Box>

                <Stack spacing={2.5}>
                        
                        {/* Starting Balance */}
                        <TextField
                            fullWidth
                            label="Starting Capital (USDT)"
                            value={initialBalance}
                            onChange={(e) => handleNumberInput(e.target.value, setInitialBalance)}
                            variant="outlined"
                        />

                        {/* Win Rate Slider */}
                        <Box>
                            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: { xs: 1, sm: 0 }, mb: 0.5 }}>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                                    Estimated Win Rate: <strong style={{ color: '#00e676' }}>{winRate}%</strong>
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap' }}>
                                    {[40, 50, 60, 70, 80].map(w => (
                                        <Chip
                                            key={w}
                                            label={`${w}%`}
                                            size="small"
                                            onClick={() => setWinRate(w)}
                                            clickable
                                            sx={{
                                                bgcolor: winRate === w ? 'rgba(0, 230, 118, 0.2)' : 'rgba(255,255,255,0.04)',
                                                color: winRate === w ? '#00e676' : 'text.secondary',
                                                border: `1px solid ${winRate === w ? '#00e676' : 'transparent'}`,
                                                fontWeight: 600,
                                                fontSize: '0.7rem'
                                            }}
                                        />
                                    ))}
                                </Box>
                            </Box>
                            <Slider
                                value={winRate}
                                onChange={(e, val) => setWinRate(val)}
                                min={10}
                                max={95}
                            />
                        </Box>

                        {/* Risk Per Trade Slider */}
                        <Box>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', mb: 0.5 }}>
                                Risk Per Trade: <strong style={{ color: '#ff3d00' }}>{riskPerTrade}%</strong>
                            </Typography>
                            <Slider
                                value={riskPerTrade}
                                onChange={(e, val) => setRiskPerTrade(val)}
                                min={0.5}
                                max={10}
                                step={0.5}
                            />
                        </Box>

                        {/* Risk:Reward & Total Trades */}
                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                            <Box sx={{ flex: 1, minWidth: '140px' }}>
                                <Typography variant="caption" color="textSecondary" sx={{ mb: 0.5, display: 'block' }}>Risk : Reward Ratio (1 : X)</Typography>
                                <TextField
                                    fullWidth
                                    value={rewardRatio}
                                    onChange={(e) => handleNumberInput(e.target.value, setRewardRatio)}
                                    variant="outlined"
                                    placeholder="e.g. 2.0"
                                />
                            </Box>

                            <Box sx={{ flex: 1, minWidth: '140px' }}>
                                <Typography variant="caption" color="textSecondary" sx={{ mb: 0.5, display: 'block' }}>Total Executed Trades</Typography>
                                <TextField
                                    fullWidth
                                    value={totalTrades}
                                    onChange={(e) => handleNumberInput(e.target.value, setTotalTrades)}
                                    variant="outlined"
                                    placeholder="e.g. 30"
                                />
                            </Box>
                        </Box>

                </Stack>
            </Box>

            {/* Results Projection Summary Column */}
            <Box sx={{ flex: 1 }}>
                <Box sx={{ mb: 2.5, display: 'flex', alignItems: 'center', gap: 1, pb: 1.5, borderBottom: '1px solid rgba(0, 230, 118, 0.15)' }}>
                    <PaidIcon sx={{ color: '#00e676', fontSize: 18 }} />
                    <Typography sx={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: '0.8rem', color: '#00e676', textTransform: 'uppercase', letterSpacing: '1.2px' }}>
                        Compounded Portfolio Projection
                    </Typography>
                </Box>

                    {/* Projected Growth Hero Banner */}
                    <Box sx={{
                        p: 2.5,
                        mb: 3,
                        borderRadius: 2.5,
                        background: 'linear-gradient(135deg, rgba(0, 230, 118, 0.15) 0%, rgba(0, 229, 255, 0.05) 100%)',
                        border: '1px solid rgba(0, 230, 118, 0.3)',
                        boxShadow: '0 0 20px rgba(0, 230, 118, 0.15)'
                    }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
                            Projected Portfolio Balance (After {tradesCount} Trades)
                        </Typography>
                        <Typography variant="h4" sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 800, color: '#00e676', mt: 0.5 }}>
                            ${finalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Typography>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1.5, pt: 1.5, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                            <Box>
                                <Typography variant="caption" color="textSecondary">Total Net Profit</Typography>
                                <Typography variant="body1" fontWeight="bold" sx={{ color: '#00e5ff' }}>
                                    +${totalProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </Typography>
                            </Box>
                            <Box sx={{ textAlign: 'right' }}>
                                <Typography variant="caption" color="textSecondary">Total Growth</Typography>
                                <Typography variant="body1" fontWeight="bold" sx={{ color: '#00e676' }}>
                                    +{totalGrowthPct.toFixed(2)}%
                                </Typography>
                            </Box>
                        </Box>
                    </Box>

                    {/* Milestone Growth Table */}
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, color: 'var(--neon-cyan)' }}>
                        Growth Milestone Roadmap
                    </Typography>
                    <Box sx={{ overflowX: 'auto', width: '100%' }}>
                        <Table size="small" sx={{ '& .MuiTableCell-root': { borderColor: 'rgba(255,255,255,0.06)', py: 1 }, minWidth: '400px' }}>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>Trade #</TableCell>
                                <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>Balance ($)</TableCell>
                                <TableCell sx={{ color: 'text.secondary', fontWeight: 700, textAlign: 'right' }}>Profit ($)</TableCell>
                                <TableCell sx={{ color: 'text.secondary', fontWeight: 700, textAlign: 'right' }}>Growth (%)</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {milestones.map((m) => (
                                <TableRow key={m.trade}>
                                    <TableCell sx={{ fontWeight: 600 }}>Trade {m.trade}</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#f8fafc' }}>${m.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                    <TableCell sx={{ color: '#00e5ff', fontWeight: 600, textAlign: 'right' }}>+${m.profit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                    <TableCell sx={{ color: '#00e676', fontWeight: 700, textAlign: 'right' }}>+{m.growthPct.toFixed(1)}%</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                        </Table>
                    </Box>

            </Box>
        </Box>
    );
}

export default CompoundGrowthTab;
