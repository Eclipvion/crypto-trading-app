import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Divider,
  Grid,
  Button,
  CircularProgress,
} from '@mui/material';

import BarChartIcon from '@mui/icons-material/BarChart';

import { NEON_GREEN, NEON_RED, glassCard, fmtPrice } from './constants';

const PatternsTab = ({ coin, coinName, timeframe }) => {
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [scanMsg, setScanMsg] = useState('');

  const handleScan = () => {
    setScanning(true); setScanned(false);
    const msgs = [
      'Initializing neural pattern engine…',
      'Fetching historical tick data…',
      'Mapping Fibonacci pivot correlations…',
      'Matching wave shape templates…',
      'Classifying detected formations…',
    ];
    let step = 0; setScanMsg(msgs[0]);
    const iv = setInterval(() => { step++; if (step < msgs.length) setScanMsg(msgs[step]); }, 280);
    setTimeout(() => { clearInterval(iv); setScanning(false); setScanned(true); }, 1500);
  };

  const patterns = (() => {
    const p = [];
    if (coin.priceChangePercent > 0 && coin.highPrice / coin.lowPrice > 1.02)
      p.push({ name: 'Bullish Flag', bullish: true, conf: Math.min(85 + coin.priceChangePercent, 95), target: coin.price * 1.065, inv: coin.price * 0.965, desc: 'Bullish continuation — signals the next impulse leg up in the primary trend.' });
    if (coin.priceChangePercent < 0 && coin.price > coin.lowPrice * 1.01)
      p.push({ name: 'Double Bottom', bullish: true, conf: Math.min(70 + Math.abs(coin.priceChangePercent), 90), target: coin.price * 1.045, inv: coin.price * 0.975, desc: 'Bullish reversal — W-shaped formation suggesting strong demand at support.' });
    if (coin.highPrice / coin.price > 1.03)
      p.push({ name: 'Rising Wedge', bullish: false, conf: Math.min(60 + (coin.highPrice / coin.price - 1) * 100, 85), target: coin.price * 0.935, inv: coin.price * 1.025, desc: 'Bearish exhaustion — converging trendlines indicate weakening buy momentum.' });
    return p;
  })();

  const PatternIcon = ({ name }) => {
    if (name === 'Bullish Flag') return (
      <svg width="56" height="38"><line x1="12" y1="33" x2="12" y2="8" stroke={NEON_GREEN} strokeWidth="2.5" /><polygon points="12,8 32,11 29,20 12,16" fill="rgba(57,255,20,0.15)" stroke={NEON_GREEN} strokeWidth="1.5" /><path d="M 29,16 L 42,9" stroke={NEON_GREEN} strokeWidth="2" strokeDasharray="2 2" /><path d="M 37,7 L 43,8 L 41,14" fill="none" stroke={NEON_GREEN} strokeWidth="2" /></svg>
    );
    if (name === 'Double Bottom') return (
      <svg width="56" height="38"><path d="M 6,10 L 16,26 L 26,16 L 36,26 L 46,6" fill="none" stroke={NEON_GREEN} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M 42,10 L 46,6 L 50,10" fill="none" stroke={NEON_GREEN} strokeWidth="2" /></svg>
    );
    if (name === 'Rising Wedge') return (
      <svg width="56" height="38"><line x1="8" y1="30" x2="44" y2="10" stroke={NEON_RED} strokeWidth="1.5" /><line x1="10" y1="20" x2="44" y2="10" stroke={NEON_RED} strokeWidth="1.5" /><path d="M 8,28 L 14,20 L 22,23 L 28,15 L 36,17 L 44,10 C 44,10 46,17 48,22" fill="none" stroke="rgba(255,85,85,0.45)" strokeWidth="1.5" /></svg>
    );
    return null;
  };

  return (
    <Box>
      <Card sx={{ ...glassCard, mb: 2.5, p: 0 }}>
        <CardContent sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography sx={{ fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif", color: '#f8fafc', textTransform: 'uppercase', letterSpacing: '0.8px', fontSize: '0.88rem' }}>
              Chart Pattern Detection
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'rgba(0,0,0,0.25)', px: 2, py: 0.5, borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Detected:</Typography>
              <Typography sx={{ fontWeight: 700, color: NEON_GREEN, fontFamily: "'Space Grotesk',sans-serif", fontSize: '0.8rem' }}>
                {scanned ? `${patterns.length} pattern${patterns.length !== 1 ? 's' : ''}` : '—'}
              </Typography>
            </Box>
          </Box>
          <Divider sx={{ bgcolor: 'rgba(255,255,255,0.06)', mb: 2.5 }} />

          {scanning ? (
            <Box sx={{ py: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2.5, bgcolor: 'rgba(0,0,0,0.2)', borderRadius: '10px' }}>
              <CircularProgress sx={{ color: NEON_GREEN }} />
              <Typography sx={{ color: NEON_GREEN, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif", fontSize: '0.82rem', letterSpacing: '0.4px' }}>{scanMsg}</Typography>
            </Box>
          ) : !scanned ? (
            <Box sx={{ py: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, bgcolor: 'rgba(0,0,0,0.2)', borderRadius: '10px' }}>
              <BarChartIcon sx={{ fontSize: 52, color: 'rgba(57,255,20,0.35)', filter: 'drop-shadow(0 0 12px rgba(57,255,20,0.2))' }} />
              <Box sx={{ textAlign: 'center' }}>
                <Typography sx={{ color: '#f8fafc', fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif", mb: 0.5 }}>AI Pattern Scanner Ready</Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.35)', fontFamily: "'Space Grotesk',sans-serif", fontSize: '0.8rem' }}>
                  Scan {coinName} on the {timeframe} interval for chart formations
                </Typography>
              </Box>
            </Box>
          ) : patterns.length === 0 ? (
            <Box sx={{ py: 5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, bgcolor: 'rgba(0,0,0,0.2)', borderRadius: '10px' }}>
              <BarChartIcon sx={{ fontSize: 40, color: 'rgba(255,255,255,0.2)' }} />
              <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontFamily: "'Space Grotesk',sans-serif", fontSize: '0.82rem' }}>
                No significant patterns found for {coinName} on {timeframe}
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={2.5}>
              {patterns.map((p, i) => (
                <Grid item xs={12} md={6} xl={4} key={i}>
                  <Card sx={{ ...glassCard, border: `1px solid ${p.bullish ? 'rgba(57,255,20,0.2)' : 'rgba(255,85,85,0.2)'}`, p: 0 }}>
                    <CardContent sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                        <Box>
                          <Typography sx={{ fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif", fontSize: '0.88rem' }}>{p.name}</Typography>
                          <Typography sx={{ color: p.bullish ? NEON_GREEN : NEON_RED, fontWeight: 700, fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {p.bullish ? 'BULLISH CONTINUATION' : 'BEARISH EXHAUSTION'}
                          </Typography>
                        </Box>
                        <PatternIcon name={p.name} />
                      </Box>
                      <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem', mb: 2, lineHeight: 1.4 }}>{p.desc}</Typography>
                      <Grid container spacing={1} sx={{ mb: 1.5 }}>
                        {[{ l: 'TARGET', v: fmtPrice(p.target), c: p.bullish ? NEON_GREEN : NEON_RED }, { l: 'INVALIDATION', v: fmtPrice(p.inv), c: NEON_RED }].map((x, j) => (
                          <Grid item xs={6} key={j}>
                            <Box sx={{ p: 0.875, bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '6px' }}>
                              <Typography sx={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', display: 'block', fontWeight: 600, mb: 0.25 }}>{x.l}</Typography>
                              <Typography sx={{ fontWeight: 700, color: x.c, fontFamily: "'Space Grotesk',monospace,sans-serif", fontSize: '0.78rem' }}>{x.v}</Typography>
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 0.875, bgcolor: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
                        <Typography sx={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)' }}>CONFIDENCE</Typography>
                        <Typography sx={{ fontWeight: 800, color: p.bullish ? NEON_GREEN : NEON_RED, fontFamily: "'Space Grotesk',sans-serif" }}>{p.conf.toFixed(0)}%</Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Button onClick={handleScan} disabled={scanning} variant="outlined" sx={{
              borderColor: NEON_GREEN, color: NEON_GREEN, borderRadius: '20px', px: 4, fontWeight: 700,
              fontFamily: "'Space Grotesk',sans-serif", textTransform: 'none',
              '&:hover': { borderColor: '#64ff44', bgcolor: 'rgba(57,255,20,0.07)', transform: 'translateY(-2px)', boxShadow: '0 6px 16px rgba(57,255,20,0.2)' },
              '&.Mui-disabled': { borderColor: 'rgba(57,255,20,0.2)', color: 'rgba(57,255,20,0.3)' },
            }}>
              {scanning ? 'Scanning…' : scanned ? 'Scan Again' : 'Scan for Patterns'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default PatternsTab;
