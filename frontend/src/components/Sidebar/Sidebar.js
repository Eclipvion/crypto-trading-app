import React, { useState, useEffect } from 'react';
import { Box, Typography, List, ListItem, ListItemIcon, ListItemText, IconButton } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import AssessmentIcon from '@mui/icons-material/Assessment';
import TerminalIcon from '@mui/icons-material/Terminal';
import CloseIcon from '@mui/icons-material/Close';
import WatchlistPanel from './WatchlistPanel/WatchlistPanel';
import MarketSummary from './MarketSummary/MarketSummary';
import './Sidebar.css';

function Sidebar({ viewMode, onViewModeChange, availableCoins, onCoinSelect, onCoinSelChange, currentSymbol, favorites, mobileMenuOpen, onMobileMenuClose }) {
  const [isCollapsed, setIsCollapsed] = useState(window.innerWidth < 900);
  const [latency, setLatency] = useState(12);

  useEffect(() => {
    const handleResize = () => {
      setIsCollapsed(window.innerWidth < 900);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const checkLatency = async () => {
      const start = performance.now();
      try {
        await fetch('https://api.binance.com/api/v3/ping');
        const duration = Math.round(performance.now() - start);
        setLatency(duration);
      } catch (err) {
        console.warn('Ping failed, using fallback latency:', err);
      }
    };
    
    checkLatency();
    const interval = setInterval(checkLatency, 10000);
    return () => clearInterval(interval);
  }, []);

  const menuItems = [
    { name: 'Dashboard', icon: <DashboardIcon />, view: 'market' },
    { name: 'Analytics', icon: <AssessmentIcon />, view: 'analysis' },
    { name: 'Trade', icon: <CompareArrowsIcon />, view: 'calculator' },
  ];

  return (
    <Box className={`sidebar-container ${isCollapsed ? 'collapsed' : ''} ${mobileMenuOpen ? 'mobile-open' : ''}`}>
      <Box className="sidebar-header" sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        width: '100%',
        px: { xs: 2, md: 3 },
        mb: { xs: 2, md: 4 }
      }}>
        <Box 
          className="sidebar-logo"
          onClick={() => {
            if (window.innerWidth >= 900) {
              setIsCollapsed(!isCollapsed);
            }
          }}
          style={{ cursor: window.innerWidth >= 900 ? 'pointer' : 'default', display: 'flex', alignItems: 'center', gap: '12px' }}
          title={window.innerWidth >= 900 ? (isCollapsed ? "Expand Sidebar" : "Collapse Sidebar") : ""}
        >
          <TerminalIcon 
            className="logo-icon-svg" 
            sx={{ 
              fontSize: '1.6rem',
              color: '#00e5ff',
              filter: 'drop-shadow(0 0 6px rgba(0, 229, 255, 0.4))',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }} 
          />
          <Typography variant="h6" className="logo-text">
            TERMINAL
          </Typography>
        </Box>

        <IconButton 
          onClick={onMobileMenuClose}
          sx={{ 
            display: { xs: 'flex', md: 'none' }, 
            color: 'text.secondary',
            p: 0.5,
            '&:hover': { color: '#00e5ff' }
          }}
        >
          <CloseIcon sx={{ fontSize: '1.5rem' }} />
        </IconButton>
      </Box>

      <List className="sidebar-menu" sx={{ flexGrow: 0, mb: 2 }}>
        {menuItems.map((item) => {
          const isActive = viewMode === item.view;
          return (
            <ListItem
              component="div"
              key={item.name}
              className={`sidebar-item ${isActive ? 'active' : ''}`}
              onClick={() => {
                onViewModeChange(item.view);
                if (onMobileMenuClose) onMobileMenuClose();
              }}
              sx={{ cursor: 'pointer' }}
            >
              <ListItemIcon className="sidebar-item-icon">
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.name}
                primaryTypographyProps={{
                  className: 'sidebar-item-text',
                }}
              />
              {isActive && <Box className="active-glow-bar" />}
            </ListItem>
          );
        })}
      </List>

      {(!isCollapsed || window.innerWidth < 900) && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2, overflow: 'hidden', width: '100%', px: { xs: 2, md: 3 } }}>
          <MarketSummary />
          <WatchlistPanel 
            availableCoins={availableCoins} 
            onCoinSelect={onCoinSelect} 
            onCoinSelChange={onCoinSelChange} 
            currentSymbol={currentSymbol}
            favorites={favorites}
          />
        </Box>
      )}
      
      <Box className="sidebar-footer" sx={{ mx: { xs: 2, md: 3 } }}>
        <Typography variant="caption" className="footer-label">
          NETWORK STATUS
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
          <Box className="pulse-dot" />
          <Typography variant="caption" className="footer-status">
            CONNECTED ({latency}ms)
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

export default Sidebar;
