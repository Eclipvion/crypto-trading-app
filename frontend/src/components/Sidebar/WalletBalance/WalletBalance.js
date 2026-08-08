import React from 'react';
import { Box, Typography } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import './WalletBalance.css';

function WalletBalance() {
  return (
    <Box className="wallet-balance-container">
      <Box className="wallet-header">
        <Box className="wallet-header-left">
          <AccountBalanceWalletIcon className="wallet-icon" />
          <Typography variant="caption" className="wallet-title">ESTIMATED ASSETS</Typography>
        </Box>
      </Box>

      <Typography className="balance-amount">$14,845.50 <span className="balance-currency">USDT</span></Typography>

      <Box className="pnl-row">
        <Typography variant="caption" className="pnl-label">24H PNL:</Typography>
        <Box className="pnl-chip">
          <TrendingUpIcon className="pnl-icon" />
          <span>+$284.12 (+1.95%)</span>
        </Box>
      </Box>

      {/* SVG Sparkline asset growth chart */}
      <Box className="sparkline-chart">
        <svg viewBox="0 0 100 28" width="100%" height="28" style={{ display: 'block' }}>
          <defs>
            <linearGradient id="walletGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00e676" stopOpacity="0.25"/>
              <stop offset="100%" stopColor="#00e676" stopOpacity="0"/>
            </linearGradient>
          </defs>
          <path 
            d="M 0 20 C 10 22, 20 12, 30 15 C 40 18, 50 8, 60 12 C 70 16, 80 4, 90 6 C 95 7, 100 2, 100 2" 
            fill="none" 
            stroke="#00e676" 
            strokeWidth="1.5" 
            strokeLinecap="round"
          />
          <path 
            d="M 0 20 C 10 22, 20 12, 30 15 C 40 18, 50 8, 60 12 C 70 16, 80 4, 90 6 C 95 7, 100 2, 100 2 L 100 28 L 0 28 Z" 
            fill="url(#walletGrad)" 
          />
        </svg>
      </Box>
    </Box>
  );
}

export default WalletBalance;
