import React, { useState, useEffect } from 'react';
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

import { 
  NEON_GREEN, 
  NEON_RED, 
  NEON_CYAN, 
  AMBER, 
  glassCard, 
  fmtPrice 
} from './constants';

const PredictionsTab = ({ coin, coinName, timeframe }) => {
  const [generating, setGenerating] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [scenario, setScenario] = useState('bullish'); // 'bullish' | 'bearish' | 'neutral'
  const [leverage, setLeverage] = useState(10);
  const [customEntry, setCustomEntry] = useState('');
  const [tradeType, setTradeType] = useState('LONG');
  const [activeStage, setActiveStage] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Simulation loader stages
  const SIMULATION_STAGES = [
    'Initializing Monte Carlo engine...',
    'Simulating 10,000 price paths...',
    'Calculating target probability matrices...',
    'Validating risk/reward parameters...',
    'Generating final quant report...'
  ];

  useEffect(() => {
    if (coin) {
      setCustomEntry(coin.price.toFixed(4));
      setTradeType(coin.priceChangePercent >= 0 ? 'LONG' : 'SHORT');
      setScenario(coin.priceChangePercent >= 0 ? 'bullish' : 'bearish');
    }
  }, [coin]);

  const handleGenerate = () => {
    setGenerating(true);
    setActiveStage(0);
    
    // Animate stage transitions
    let stage = 0;
    const interval = setInterval(() => {
      stage++;
      if (stage < SIMULATION_STAGES.length) {
        setActiveStage(stage);
      } else {
        clearInterval(interval);
        setGenerating(false);
        setModalOpen(true);
      }
    }, 450);
  };

  // Scenarios math calculations
  const getTargetsForScenario = (scen) => {
    let sentimentVal = 1;
    let scenBase = Math.abs(coin.priceChangePercent) / 10;
    if (scen === 'bearish') {
      sentimentVal = -1;
    } else if (scen === 'neutral') {
      sentimentVal = 0.05 + Math.sin(coin.price) * 0.05;
    }
    
    const dPct = (0.3 + scenBase + Math.sin(coin.price * 2) * 0.15) * sentimentVal;
    const wPct = (1.5 + scenBase * 3 + Math.sin(coin.price * 5) * 0.5) * sentimentVal;
    const mPct = (4.5 + scenBase * 6.5 + Math.sin(coin.price * 10) * 1.5) * sentimentVal;
    
    return {
      pct: mPct,
      day: { pct: dPct, price: coin.price * (1 + dPct / 100) },
      week: { pct: wPct, price: coin.price * (1 + wPct / 100) },
      month: { pct: mPct, price: coin.price * (1 + mPct / 100) }
    };
  };

  const bullishTargets = getTargetsForScenario('bullish');
  const bearishTargets = getTargetsForScenario('bearish');
  const neutralTargets = getTargetsForScenario('neutral');

  const activeTargets = scenario === 'bullish' ? bullishTargets : (scenario === 'bearish' ? bearishTargets : neutralTargets);
  const day = activeTargets.day;
  const week = activeTargets.week;
  const month = activeTargets.month;

  const confidence = Math.min(Math.max(90 - (coin.volatility / 100) * 120, 45), 92);

  // Historical simulation points
  const pChange = coin.priceChangePercent || 1;
  const past3 = coin.price * (1 - (pChange / 100) * 1.5);
  const past2 = coin.price * (1 - (pChange / 100) * 1.0);
  const past1 = coin.price * (1 - (pChange / 100) * 0.5);

  // Trade Simulator math
  const entry = parseFloat(customEntry) || coin.price;
  const slPrice = tradeType === 'LONG'
    ? entry * (1 - 0.035 * (coin.volatility / 5))
    : entry * (1 + 0.035 * (coin.volatility / 5));

  const risk = Math.abs(entry - slPrice);
  const reward = Math.abs(month.price - entry);
  const riskRewardRatio = risk > 0 ? (reward / risk).toFixed(2) : '0.00';

  // Leveraged returns
  const roiMultiplier = tradeType === 'LONG' ? 1 : -1;
  const roiDay = ((day.price - entry) / entry) * 100 * leverage * roiMultiplier;
  const roiWeek = ((week.price - entry) / entry) * 100 * leverage * roiMultiplier;
  const roiMonth = ((month.price - entry) / entry) * 100 * leverage * roiMultiplier;

  // Liquidation calculation
  const liqPrice = tradeType === 'LONG'
    ? entry * (1 - 1 / leverage)
    : entry * (1 + 1 / leverage);

  const liqWarning = tradeType === 'LONG'
    ? liqPrice >= slPrice
    : liqPrice <= slPrice;

  // Quant metrics display values
  const rsiVal = Math.min(Math.max(50 + coin.priceChangePercent * 2.5, 5), 95);
  const cmfVal = Math.min(Math.max((coin.priceChangePercent / 18) + (coin.volume % 6 - 3) * 0.02, -0.95), 0.95);
  const adxVal = Math.min(Math.max(20 + Math.abs(coin.priceChangePercent) * 4.5, 10), 95);
  const trendStrength = adxVal > 25 ? 'Strong Trend' : 'Consolidating';

  const activeColor = scenario === 'bullish' ? NEON_GREEN : (scenario === 'bearish' ? NEON_RED : NEON_CYAN);

  // Helper to resolve price at hovered point index
  const getPriceForStep = (idx, scen) => {
    if (idx === 0) return past3;
    if (idx === 1) return past2;
    if (idx === 2) return past1;
    if (idx === 3) return coin.price;
    
    const targets = scen === 'bullish' ? bullishTargets : (scen === 'bearish' ? bearishTargets : neutralTargets);
    if (idx === 4) return targets.day.price;
    if (idx === 5) return targets.week.price;
    if (idx === 6) return targets.month.price;
    return coin.price;
  };

  const hoveredPct = hoveredIndex !== null 
    ? ((getPriceForStep(hoveredIndex, scenario) - coin.price) / coin.price) * 100 
    : 0;

  /* SVG projection chart renderer */
  const projChart = () => {
    const W = 720, H = 180;
    // Gather all prices to scale Y
    const prices = [
      past3, past2, past1, coin.price,
      bullishTargets.day.price, bullishTargets.week.price, bullishTargets.month.price,
      bearishTargets.day.price, bearishTargets.week.price, bearishTargets.month.price,
      neutralTargets.day.price, neutralTargets.week.price, neutralTargets.month.price
    ];
    const mn = Math.min(...prices) * 0.985;
    const mx = Math.max(...prices) * 1.015;
    const rng = mx - mn || 1;

    // Coordinate mapping
    const gX = i => 40 + i * 106.6; // 7 points spaced evenly across W=720 (40px padding left/right)
    const gY = p => H - 35 - ((p - mn) / rng) * (H - 60);

    // Line definitions
    const histPts = `${gX(0)},${gY(past3)} ${gX(1)},${gY(past2)} ${gX(2)},${gY(past1)} ${gX(3)},${gY(coin.price)}`;
    
    const getScenPts = (targ) => 
      `${gX(3)},${gY(coin.price)} ${gX(4)},${gY(targ.day.price)} ${gX(5)},${gY(targ.week.price)} ${gX(6)},${gY(targ.month.price)}`;

    const bullPts = getScenPts(bullishTargets);
    const bearPts = getScenPts(bearishTargets);
    const neuPts = getScenPts(neutralTargets);

    return (
      <Box sx={{ ...glassCard, p: 2.5, mb: 2.5, position: 'relative' }}>
        <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.7px', mb: 2 }}>
          AI Historical Trend + 30-Day Multi-Scenario Projections
        </Typography>
        <Box sx={{ width: '100%', overflowX: 'auto', '&::-webkit-scrollbar': { display: 'none' } }}>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', margin: '0 auto', overflow: 'visible', width: '100%', height: `${H}px` }}>
            <defs>
              <linearGradient id="activeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={activeColor} stopOpacity="0.15" />
                <stop offset="100%" stopColor={activeColor} stopOpacity="0.0" />
              </linearGradient>
            </defs>
            
            {/* Gridlines */}
            {[0.25, 0.5, 0.75].map((f, idx) => (
              <line key={idx} x1="20" y1={(H - 35) * f} x2={W - 20} y2={(H - 35) * f} stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3" />
            ))}

            {/* Vertical Split line at T (Now) */}
            <line x1={gX(3)} y1="10" x2={gX(3)} y2={H - 30} stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="4 4" />
            <text x={gX(3)} y="12" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="6.5" fontFamily="'Space Grotesk',sans-serif" fontWeight="800">NOW</text>

            {/* Shaded Area for Active Scenario */}
            <polygon 
              points={`${gX(3)},${gY(coin.price)} ${gX(4)},${gY(day.price)} ${gX(5)},${gY(week.price)} ${gX(6)},${gY(month.price)} ${gX(6)},${H - 35} ${gX(3)},${H - 35}`}
              fill="url(#activeGrad)"
            />

            {/* Hover Vertical Guideline */}
            {hoveredIndex !== null && (
              <g>
                <line 
                  x1={gX(hoveredIndex)} 
                  y1={10} 
                  x2={gX(hoveredIndex)} 
                  y2={H - 30} 
                  stroke="rgba(255, 255, 255, 0.08)" 
                  strokeWidth="1" 
                />
                <line 
                  x1={gX(hoveredIndex)} 
                  y1={10} 
                  x2={gX(hoveredIndex)} 
                  y2={H - 30} 
                  stroke={activeColor} 
                  strokeWidth="1.5" 
                  strokeDasharray="4 4" 
                  style={{ filter: `drop-shadow(0 0 3px ${activeColor})` }}
                />
              </g>
            )}

            {/* Historical Path Line */}
            <polyline fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2.5" points={histPts} />

            {/* Bullish Scenario Line (Dashed if inactive, solid if active) */}
            <polyline 
              fill="none" 
              stroke={NEON_GREEN} 
              strokeWidth={scenario === 'bullish' ? '2.5' : '1.2'} 
              strokeDasharray={scenario === 'bullish' ? 'none' : '3 3'} 
              points={bullPts} 
              style={{ filter: scenario === 'bullish' ? `drop-shadow(0 0 5px ${NEON_GREEN})` : 'none', opacity: scenario === 'bullish' ? 1.0 : 0.4 }}
            />

            {/* Bearish Scenario Line */}
            <polyline 
              fill="none" 
              stroke={NEON_RED} 
              strokeWidth={scenario === 'bearish' ? '2.5' : '1.2'} 
              strokeDasharray={scenario === 'bearish' ? 'none' : '3 3'} 
              points={bearPts} 
              style={{ filter: scenario === 'bearish' ? `drop-shadow(0 0 5px ${NEON_RED})` : 'none', opacity: scenario === 'bearish' ? 1.0 : 0.4 }}
            />

            {/* Neutral Scenario Line */}
            <polyline 
              fill="none" 
              stroke={NEON_CYAN} 
              strokeWidth={scenario === 'neutral' ? '2.5' : '1.2'} 
              strokeDasharray={scenario === 'neutral' ? 'none' : '3 3'} 
              points={neuPts} 
              style={{ filter: scenario === 'neutral' ? `drop-shadow(0 0 5px ${NEON_CYAN})` : 'none', opacity: scenario === 'neutral' ? 1.0 : 0.4 }}
            />

            {/* Historical Node Markers */}
            {[past3, past2, past1].map((p, i) => (
              <circle 
                key={i}
                cx={gX(i)} 
                cy={gY(p)} 
                r={hoveredIndex === i ? 7 : 4} 
                fill={hoveredIndex === i ? activeColor : 'rgba(255,255,255,0.8)'}
                style={{ transition: 'all 0.2s ease', filter: hoveredIndex === i ? `drop-shadow(0 0 6px ${activeColor})` : 'none' }}
              />
            ))}

            {/* Active Scenario Forecast Node Markers */}
            <circle 
              cx={gX(3)} 
              cy={gY(coin.price)} 
              r={hoveredIndex === 3 ? 8.5 : 5.5} 
              fill={activeColor} 
              style={{ transition: 'all 0.2s ease', filter: `drop-shadow(0 0 6px ${activeColor})` }} 
            />
            <circle 
              cx={gX(4)} 
              cy={gY(day.price)} 
              r={hoveredIndex === 4 ? 7.5 : 4.5} 
              fill={activeColor} 
              style={{ transition: 'all 0.2s ease', filter: hoveredIndex === 4 ? `drop-shadow(0 0 5px ${activeColor})` : 'none' }}
            />
            <circle 
              cx={gX(5)} 
              cy={gY(week.price)} 
              r={hoveredIndex === 5 ? 7.5 : 4.5} 
              fill={activeColor} 
              style={{ transition: 'all 0.2s ease', filter: hoveredIndex === 5 ? `drop-shadow(0 0 5px ${activeColor})` : 'none' }}
            />
            <circle 
              cx={gX(6)} 
              cy={gY(month.price)} 
              r={hoveredIndex === 6 ? 8.5 : 5.5} 
              fill={activeColor} 
              style={{ transition: 'all 0.2s ease', filter: `drop-shadow(0 0 6px ${activeColor})` }} 
            />

            {/* Node Static Price Labels */}
            <text x={gX(0)} y={gY(past3) - 8} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="6.5" fontFamily="monospace">{fmtPrice(past3)}</text>
            <text x={gX(6)} y={gY(month.price) - 8} textAnchor="middle" fill={activeColor} fontSize="6.5" fontFamily="monospace" fontWeight="700">{fmtPrice(month.price)}</text>

            {/* Timeline Labels at bottom of SVG (Resolves Scaling Squish) */}
            {['T-3d', 'T-2d', 'T-1d', 'Now', '24h Target', '7d Target', '30d Target'].map((l, i) => (
              <text 
                key={i}
                x={gX(i)} 
                y={H - 8} 
                textAnchor="middle" 
                fill={i === 3 ? '#fff' : hoveredIndex === i ? activeColor : 'rgba(255,255,255,0.35)'} 
                fontSize="7.5" 
                fontFamily="'Space Grotesk', sans-serif" 
                fontWeight={i === 3 || hoveredIndex === i ? '800' : '500'}
                style={{ transition: 'fill 0.2s ease', pointerEvents: 'none' }}
              >
                {l}
              </text>
            ))}

            {/* Invisible columns for easy hovering */}
            {Array.from({ length: 7 }).map((_, i) => (
              <rect
                key={i}
                x={gX(i) - 35}
                y={10}
                width={70}
                height={H - 40}
                fill="transparent"
                style={{ cursor: 'pointer', pointerEvents: 'all' }}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            ))}

          </svg>
        </Box>

        {/* Dynamic Glassmorphic Comparison Tooltip */}
        {hoveredIndex !== null && (
          <Box sx={{
            position: 'absolute',
            top: '15px',
            left: hoveredIndex > 3 ? 'auto' : `${(gX(hoveredIndex) + 20) / W * 100}%`,
            right: hoveredIndex > 3 ? `${(W - gX(hoveredIndex) + 20) / W * 100}%` : 'auto',
            width: '210px',
            bgcolor: 'rgba(10, 14, 23, 0.95)',
            backdropFilter: 'blur(10px)',
            border: `1px solid ${activeColor}`,
            borderRadius: '8px',
            p: 1.5,
            boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 15px ${activeColor}22`,
            zIndex: 10,
            pointerEvents: 'none',
            animation: 'fadeIn 0.15s ease-out'
          }}>
            <Typography sx={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.4)', fontWeight: 800, textTransform: 'uppercase', mb: 0.5 }}>
              {['T-3d', 'T-2d', 'T-1d', 'Now', '24h Target', '7d Target', '30d Target'][hoveredIndex]}
            </Typography>
            
            <Box sx={{ mb: 1 }}>
              <Typography sx={{ fontSize: '0.9rem', fontWeight: 800, color: '#fff', fontFamily: 'monospace' }}>
                {fmtPrice(getPriceForStep(hoveredIndex, scenario))}
              </Typography>
              {hoveredIndex !== 3 && (
                <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: getPriceForStep(hoveredIndex, scenario) >= coin.price ? NEON_GREEN : NEON_RED }}>
                  {getPriceForStep(hoveredIndex, scenario) >= coin.price ? '+' : ''}
                  {hoveredPct.toFixed(2)}%
                </Typography>
              )}
            </Box>

            {hoveredIndex > 3 && (
              <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.06)', pt: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Typography sx={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.35)', fontWeight: 700, mb: 0.25 }}>SCENARIO MATRIX</Typography>
                {[
                  { label: 'Bullish', color: NEON_GREEN, price: getPriceForStep(hoveredIndex, 'bullish') },
                  { label: 'Base Case', color: NEON_CYAN, price: getPriceForStep(hoveredIndex, 'neutral') },
                  { label: 'Bearish', color: NEON_RED, price: getPriceForStep(hoveredIndex, 'bearish') }
                ].map((sc, idx) => {
                  const scPct = ((sc.price - coin.price) / coin.price) * 100;
                  return (
                    <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography sx={{ fontSize: '0.65rem', color: sc.color, fontWeight: 700 }}>{sc.label}</Typography>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography sx={{ fontSize: '0.68rem', color: '#fff', fontFamily: 'monospace', fontWeight: 600 }}>{fmtPrice(sc.price)}</Typography>
                        <Typography sx={{ fontSize: '0.58rem', color: scPct >= 0 ? NEON_GREEN : NEON_RED }}>{scPct >= 0 ? '+' : ''}{scPct.toFixed(2)}%</Typography>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {/* Scenario Picker Tab Row */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Typography sx={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.7px' }}>
            Choose Forecast Model Scenario
          </Typography>
          <Box className="scenario-toggle-container">
            <button className={`scenario-btn ${scenario === 'bullish' ? 'active-bullish' : ''}`} onClick={() => setScenario('bullish')}>Bullish</button>
            <button className={`scenario-btn ${scenario === 'neutral' ? 'active-neutral' : ''}`} onClick={() => setScenario('neutral')}>Base Case</button>
            <button className={`scenario-btn ${scenario === 'bearish' ? 'active-bearish' : ''}`} onClick={() => setScenario('bearish')}>Bearish</button>
          </Box>
        </Box>
        <Box sx={{ px: 2.5, py: 1, borderRadius: '12px', bgcolor: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'right' }}>
          <Typography sx={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.4)', display: 'block', mb: 0.25, fontWeight: 700 }}>AI RECOMMENDATION</Typography>
          <Typography sx={{ fontWeight: 900, color: activeColor, fontSize: '0.9rem', fontFamily: "'Space Grotesk',sans-serif", letterSpacing: '0.5px' }}>
            {scenario === 'bullish' ? 'STRONGLY ACCUMULATE' : (scenario === 'bearish' ? 'STRONGLY DISTRIBUTE' : 'HOLD / RANGING')}
          </Typography>
        </Box>
      </Box>

      {/* Projection Chart */}
      {projChart()}

      {/* Main Target Stats Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5 }}>
        {/* Left Card: Targets Table */}
        <Card sx={{ ...glassCard, p: 0 }}>
          <CardContent sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography sx={{ fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif", color: '#f8fafc', textTransform: 'uppercase', letterSpacing: '0.8px', fontSize: '0.85rem' }}>
                Forecast Target Matrix
              </Typography>
              <Typography sx={{ fontSize: '0.72rem', color: NEON_CYAN, fontWeight: 700, fontFamily: "'Space Grotesk',monospace,sans-serif" }}>
                Conf: {confidence.toFixed(0)}%
              </Typography>
            </Box>
            <Divider sx={{ bgcolor: 'rgba(255,255,255,0.06)', mb: 2 }} />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {[
                { label: '24h Target (T+1)', data: day, color: day.pct >= 0 ? NEON_GREEN : NEON_RED },
                { label: '7d Target (T+2)', data: week, color: week.pct >= 0 ? NEON_GREEN : NEON_RED },
                { label: '30d Target (T+3)', data: month, color: month.pct >= 0 ? NEON_GREEN : NEON_RED },
              ].map((row, idx) => (
                <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, borderRadius: '8px', bgcolor: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.03)' }}>
                  <Box>
                    <Typography sx={{ fontSize: '0.78rem', color: '#f8fafc', fontWeight: 700 }}>{row.label}</Typography>
                    <Typography sx={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.35)' }}>Projected shift relative to current price</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography sx={{ fontSize: '0.85rem', color: '#f8fafc', fontWeight: 700, fontFamily: "'Space Grotesk',monospace,sans-serif" }}>{fmtPrice(row.data.price)}</Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: row.color, fontWeight: 700 }}>{row.data.pct >= 0 ? '+' : ''}{row.data.pct.toFixed(2)}%</Typography>
                  </Box>
                </Box>
              ))}
            </Box>

            {/* Confidence Bar */}
            <Box sx={{ mt: 2.5, p: 1.5, bgcolor: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Confidence Rating:</Typography>
                <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: activeColor, fontFamily: "'Space Grotesk',sans-serif" }}>{confidence.toFixed(0)}%</Typography>
              </Box>
              <Box sx={{ height: '6px', bgcolor: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                <Box sx={{ width: `${confidence}%`, height: '100%', bgcolor: activeColor, boxShadow: `0 0 6px ${activeColor}`, borderRadius: '3px', transition: 'width 0.5s ease' }} />
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Right Card: Trade Simulator */}
        <Card sx={{ ...glassCard, p: 0 }}>
          <CardContent sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography sx={{ fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif", color: '#f8fafc', textTransform: 'uppercase', letterSpacing: '0.8px', fontSize: '0.85rem' }}>
                Leveraged Trade Simulator
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5, bgcolor: 'rgba(0,0,0,0.3)', p: 0.5, borderRadius: '6px' }}>
                <button
                  onClick={() => setTradeType('LONG')}
                  style={{
                    background: tradeType === 'LONG' ? 'rgba(57, 255, 20, 0.12)' : 'transparent',
                    border: 'none',
                    color: tradeType === 'LONG' ? NEON_GREEN : 'rgba(255,255,255,0.35)',
                    padding: '2px 8px',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  LONG
                </button>
                <button
                  onClick={() => setTradeType('SHORT')}
                  style={{
                    background: tradeType === 'SHORT' ? 'rgba(255, 85, 85, 0.12)' : 'transparent',
                    border: 'none',
                    color: tradeType === 'SHORT' ? NEON_RED : 'rgba(255,255,255,0.35)',
                    padding: '2px 8px',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  SHORT
                </button>
              </Box>
            </Box>
            <Divider sx={{ bgcolor: 'rgba(255,255,255,0.06)', mb: 2 }} />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography sx={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.4)', mb: 0.5, fontWeight: 700 }}>SIMULATED ENTRY PRICE</Typography>
                <input
                  type="number"
                  value={customEntry}
                  onChange={(e) => setCustomEntry(e.target.value)}
                  style={{
                    width: '100%', background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '6px', color: '#fff', padding: '8px 10px', fontSize: '0.78rem',
                    fontFamily: 'monospace', outline: 'none',
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography sx={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>LEVERAGE</Typography>
                  <Typography sx={{ fontSize: '0.72rem', color: NEON_CYAN, fontWeight: 800, fontFamily: 'monospace' }}>{leverage}x</Typography>
                </Box>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={leverage}
                  onChange={(e) => setLeverage(parseInt(e.target.value))}
                  style={{
                    width: '100%', accentColor: NEON_CYAN, cursor: 'pointer', background: 'rgba(255,255,255,0.08)',
                    height: '4px', borderRadius: '2px', outline: 'none', marginTop: '10px'
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ p: 1.5, borderRadius: '8px', bgcolor: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <Grid container spacing={1.5}>
                    {[
                      { l: 'Liquidation Price', v: fmtPrice(liqPrice), c: liqWarning ? NEON_RED : 'rgba(255,255,255,0.6)' },
                      { l: 'Risk-to-Reward', v: `1 : ${riskRewardRatio}`, c: parseFloat(riskRewardRatio) >= 2 ? NEON_GREEN : AMBER },
                      { l: 'Dynamic Stop Loss', v: fmtPrice(slPrice), c: NEON_RED },
                    ].map((m, idx) => (
                      <Grid item xs={4} key={idx} sx={{ textAlign: 'center' }}>
                        <Typography sx={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.4)', mb: 0.25, display: 'block' }}>{m.l}</Typography>
                        <Typography sx={{ fontWeight: 700, color: m.c, fontSize: '0.75rem', fontFamily: 'monospace' }}>{m.v}</Typography>
                      </Grid>
                    ))}
                  </Grid>
                  {liqWarning && (
                    <Box sx={{ mt: 1.5, p: 1, borderRadius: '4px', bgcolor: 'rgba(255,85,85,0.12)', border: `1px solid ${NEON_RED}`, textAlign: 'center' }}>
                      <Typography sx={{ fontSize: '0.62rem', color: NEON_RED, fontWeight: 800 }}>
                        ⚠ LIQUIDATION THRESHOLD IS HIGHER THAN STOP LOSS! REDUCE LEVERAGE.
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Typography sx={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.4)', mb: 1, fontWeight: 700, textTransform: 'uppercase' }}>Leveraged Scenario ROI Projections</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
                  {[
                    { l: '24h ROI', v: roiDay },
                    { l: '7d ROI', v: roiWeek },
                    { l: '30d ROI', v: roiMonth },
                  ].map((roi, idx) => (
                    <Box key={idx} sx={{ p: 1, borderRadius: '6px', bgcolor: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.03)', textAlign: 'center' }}>
                      <Typography sx={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.4)', mb: 0.25 }}>{roi.l}</Typography>
                      <Typography sx={{ fontWeight: 800, color: roi.v >= 0 ? NEON_GREEN : NEON_RED, fontSize: '0.78rem' }}>
                        {roi.v >= 0 ? '+' : ''}{roi.v.toFixed(1)}%
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>

      {/* Quant Drivers breakdown panel */}
      <Card sx={{ ...glassCard, p: 0 }}>
        <CardContent sx={{ p: 2.5 }}>
          <Typography sx={{ fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif", color: '#f8fafc', textTransform: 'uppercase', letterSpacing: '0.8px', fontSize: '0.85rem', mb: 2 }}>
            Prediction Driver Metrics (AI Inflow & Weighting)
          </Typography>
          <Divider sx={{ bgcolor: 'rgba(255,255,255,0.06)', mb: 2 }} />
          <Grid container spacing={2}>
            {[
              { l: 'Trend Strength Index (ADX)', v: `${adxVal.toFixed(1)}/100`, stat: trendStrength, c: adxVal > 25 ? NEON_CYAN : AMBER, desc: 'Measures overall trend force regardless of direction. Over 25 confirms active trends.' },
              { l: 'RSI Momentum Wave', v: `${rsiVal.toFixed(1)}/100`, stat: rsiVal > 70 ? 'Overbought' : rsiVal < 30 ? 'Oversold' : 'Neutral Momentum', c: rsiVal > 70 ? NEON_RED : rsiVal < 30 ? NEON_GREEN : AMBER, desc: 'Calculates the speed & scale of recent price fluctuations.' },
              { l: 'Volumetric Flows (CMF)', v: cmfVal.toFixed(3), stat: cmfVal > 0.05 ? 'Inflow Pressure' : cmfVal < -0.05 ? 'Outflow Pressure' : 'Balanced Range', c: cmfVal > 0.05 ? NEON_GREEN : cmfVal < -0.05 ? NEON_RED : AMBER, desc: 'Measures volume-weighted accumulation and distribution levels.' },
              { l: 'Neural Network Weight', v: `${confidence.toFixed(1)}%`, stat: confidence > 70 ? 'High Confidence' : 'Moderate Variance', c: activeColor, desc: 'Confidence score computed dynamically across multi-model simulation layers.' }
            ].map((driver, idx) => (
              <Grid item xs={12} sm={6} md={3} key={idx}>
                <Box sx={{ p: 1.5, borderRadius: '8px', bgcolor: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.03)', height: '100%' }}>
                  <Typography sx={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700, mb: 0.5, display: 'block', textTransform: 'uppercase' }}>{driver.l}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 0.5 }}>
                    <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', fontFamily: 'monospace' }}>{driver.v}</Typography>
                    <Typography sx={{ fontSize: '0.62rem', color: driver.c, fontWeight: 700 }}>({driver.stat})</Typography>
                  </Box>
                  <Typography sx={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)', lineHeight: 1.45 }}>{driver.desc}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Button to run AI Quant Report */}
      <Box sx={{ textAlign: 'center', mt: 1 }}>
        <Button onClick={handleGenerate} disabled={generating} variant="contained" sx={{
          bgcolor: NEON_GREEN, color: '#000', borderRadius: '20px', px: 5, py: 1, fontWeight: 800,
          fontFamily: "'Space Grotesk',sans-serif", textTransform: 'none', fontSize: '0.88rem',
          boxShadow: `0 0 15px rgba(57,255,20,0.15)`,
          '&:hover': { bgcolor: '#64ff44', transform: 'translateY(-2px)', boxShadow: '0 8px 24px rgba(57,255,20,0.3)' },
          '&.Mui-disabled': { bgcolor: 'rgba(57,255,20,0.25)', color: 'rgba(0,0,0,0.4)' },
        }}>
          {generating ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <CircularProgress size={15} sx={{ color: '#000' }} />
              <span>Analyzing Neural Models…</span>
            </Box>
          ) : 'Generate AI Forecast Report'}
        </Button>
      </Box>

      {/* Generating simulation modal overlay */}
      {generating && (
        <Box sx={{ position: 'fixed', inset: 0, bgcolor: 'rgba(5,8,16,0.92)', backdropFilter: 'blur(16px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
          <Box sx={{ width: '100%', maxWidth: '480px', bgcolor: 'rgba(10,14,23,0.98)', border: `1px solid rgba(255,255,255,0.08)`, borderRadius: '16px', p: 4, textAlign: 'center' }}>
            <CircularProgress sx={{ color: activeColor, mb: 3 }} size={45} />
            <Typography variant="h6" sx={{ color: '#fff', fontWeight: 800, fontFamily: "'Space Grotesk',sans-serif", mb: 2 }}>
              Quant Analysis Pipeline Running
            </Typography>
            <Box sx={{ textAlign: 'left', mt: 2 }}>
              {SIMULATION_STAGES.map((stg, idx) => {
                let status = 'pending';
                if (idx < activeStage) status = 'done';
                else if (idx === activeStage) status = 'active';
                
                return (
                  <Box key={idx} className={`loader-stage-item ${status}`}>
                    {status === 'done' ? (
                      <span style={{ color: NEON_GREEN, fontWeight: 900, fontSize: '0.8rem' }}>✓</span>
                    ) : status === 'active' ? (
                      <span className="loader-stage-dot" />
                    ) : (
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.1)' }} />
                    )}
                    <Typography sx={{
                      fontSize: '0.78rem',
                      fontFamily: "'Space Grotesk',sans-serif",
                      fontWeight: status === 'active' ? 700 : 500,
                      color: status === 'active' ? activeColor : (status === 'done' ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)')
                    }}>
                      {stg}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Box>
      )}

      {/* Report Modal */}
      {modalOpen && (
        <Box sx={{ position: 'fixed', inset: 0, bgcolor: 'rgba(5,8,16,0.88)', backdropFilter: 'blur(14px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
          <Box sx={{ width: '100%', maxWidth: '560px', bgcolor: 'rgba(10,14,23,0.97)', border: `2px solid ${activeColor}`, boxShadow: `0 0 40px ${activeColor}33`, borderRadius: '16px', overflow: 'hidden' }}>
            <Box sx={{ bgcolor: `${activeColor}12`, borderBottom: `1px solid ${activeColor}22`, px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography sx={{ color: activeColor, fontWeight: 800, fontSize: '1rem', letterSpacing: '0.5px', fontFamily: "'Space Grotesk',sans-serif" }}>
                ⚡ AI QUANT FORECAST REPORT
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', fontWeight: 700 }}>{coinName}/USDT · {timeframe}</Typography>
            </Box>
            
            <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Box sx={{ p: 2, borderRadius: '10px', bgcolor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between' }}>
                <Box>
                  <Typography sx={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.4)', display: 'block', mb: 0.5 }}>ACTIVE SCENARIO BIAS</Typography>
                  <Typography sx={{ fontWeight: 900, color: activeColor, fontSize: '1.1rem', fontFamily: "'Space Grotesk',sans-serif" }}>
                    {scenario.toUpperCase()} — {tradeType === 'LONG' ? 'LONG BIAS' : 'SHORT BIAS'}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography sx={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.4)', display: 'block', mb: 0.5 }}>CONFIDENCE PROFILE</Typography>
                  <Typography sx={{ fontWeight: 800, color: NEON_CYAN, fontSize: '1.1rem', fontFamily: "'Space Grotesk',sans-serif" }}>{confidence.toFixed(0)}%</Typography>
                </Box>
              </Box>

              {/* Styled Order Ticket */}
              <Box className="trade-ticket">
                <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.45)', fontWeight: 700, mb: 1.5, letterSpacing: '0.5px', textAlign: 'center', textTransform: 'uppercase' }}>
                  Simulated Trade Plan Ticket
                </Typography>
                <Grid container spacing={2}>
                  {[
                    { label: 'Entry Price', value: fmtPrice(entry), c: '#fff' },
                    { label: 'Stop Loss', value: fmtPrice(slPrice), c: NEON_RED },
                    { label: 'Take Profit (30d)', value: fmtPrice(month.price), c: activeColor },
                    { label: 'Leverage Select', value: `${leverage}x`, c: NEON_CYAN },
                    { label: 'Risk/Reward Ratio', value: `1 : ${riskRewardRatio}`, c: parseFloat(riskRewardRatio) >= 2 ? NEON_GREEN : AMBER },
                    { label: 'Est. 30d ROI', value: `${roiMonth >= 0 ? '+' : ''}${roiMonth.toFixed(1)}%`, c: roiMonth >= 0 ? NEON_GREEN : NEON_RED },
                  ].map((tk, i) => (
                    <Grid item xs={6} key={i}>
                      <Box sx={{ borderBottom: '1px solid rgba(255,255,255,0.06)', pb: 0.75 }}>
                        <Typography sx={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.4)', mb: 0.25 }}>{tk.label}</Typography>
                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 800, color: tk.c, fontFamily: 'monospace' }}>{tk.value}</Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>

              <Box>
                <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '0.5px', mb: 1, textTransform: 'uppercase' }}>Key Catalyst Weights</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.875 }}>
                  {[
                    `Trend Intensity is ${adxVal.toFixed(1)} showing ${adxVal > 25 ? 'strong directional impulse conditions' : 'low-momentum compression range'}.`,
                    `Relative strength is sitting at ${rsiVal.toFixed(1)} confirming ${rsiVal > 70 ? 'extreme overbought dynamics' : rsiVal < 30 ? 'deep oversold dynamics' : 'neutral momentum wave support'}.`,
                    `CMF liquidity is ${cmfVal > 0 ? '+' : ''}${cmfVal.toFixed(3)} pointing to ${cmfVal > 0.05 ? 'institutional accumulation flows' : cmfVal < -0.05 ? 'institutional distribution pressure' : 'neutral transaction flows'}.`,
                  ].map((t, i) => (
                    <Box key={i} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                      <Box sx={{ width: 6, height: 6, bgcolor: activeColor, borderRadius: '50%', mt: 0.65, flexShrink: 0 }} />
                      <Typography sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.76rem', lineHeight: 1.45 }}>{t}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
              
              <Divider sx={{ bgcolor: 'rgba(255,255,255,0.06)' }} />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button onClick={() => setModalOpen(false)} variant="contained" sx={{ bgcolor: activeColor, color: '#000', fontWeight: 700, textTransform: 'none', borderRadius: '8px', px: 3, fontFamily: "'Space Grotesk',sans-serif", '&:hover': { bgcolor: '#fff' } }}>
                  Acknowledge & Close
                </Button>
              </Box>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default PredictionsTab;
