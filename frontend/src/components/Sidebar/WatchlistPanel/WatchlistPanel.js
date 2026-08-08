import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import './WatchlistPanel.css';

function WatchlistPanel({ availableCoins, onCoinSelect, onCoinSelChange, currentSymbol, favorites }) {
  const [watchlistData, setWatchlistData] = useState([]);

  useEffect(() => {
    // 1. Optimistic update: instantly populate the watchlist container with placeholder cards
    setWatchlistData(prev => {
      return favorites.map(favName => {
        const existing = prev.find(w => w.name === favName);
        return existing || {
          symbol: `${favName}USDT`,
          name: favName,
          price: 0,
          change: 0
        };
      });
    });

    const fetchWatchlist = async () => {
      if (!favorites || favorites.length === 0) {
        setWatchlistData([]);
        return;
      }
      try {
        const res = await fetch('https://api.binance.com/api/v3/ticker/24hr');
        if (res.ok) {
          const data = await res.json();
          
          // Map and order based on the user's favorites array
          const orderedData = favorites.map(favName => {
            const symbol = `${favName}USDT`;
            const coinData = Array.isArray(data) ? data.find(d => d.symbol === symbol) : null;
            return {
              symbol,
              name: favName,
              price: coinData ? parseFloat(coinData.lastPrice) : 0,
              change: coinData ? parseFloat(coinData.priceChangePercent) : 0
            };
          });
          setWatchlistData(orderedData);
        } else {
          console.warn('Watchlist fetch failed with status:', res.status);
        }
      } catch (e) {
        console.warn('Error fetching watchlist data:', e);
      }
    };

    fetchWatchlist();
    const interval = setInterval(fetchWatchlist, 10000); // refresh every 10 seconds
    return () => clearInterval(interval);
  }, [favorites]);

  const handleSelect = (name) => {
    if (!availableCoins || !availableCoins.length) return;
    const matchedCoin = availableCoins.find(c => c.baseAsset === name);
    if (matchedCoin) {
      onCoinSelect(matchedCoin);
      onCoinSelChange(name);
    }
  };

  return (
    <Box className="watchlist-panel-container">
      <Typography variant="caption" className="panel-title">
        FAVORITES WATCHLIST
      </Typography>
      
      <Box className="watchlist-items-list">
        {watchlistData.length === 0 ? (
          <Typography variant="caption" sx={{ color: 'text.secondary', px: 1.5, py: 1, fontStyle: 'italic' }}>
            No starred favorites.
          </Typography>
        ) : (
          watchlistData.map((item) => {
            const isSelected = currentSymbol === item.name;
            const isPositive = item.change >= 0;
            
            return (
              <Box 
                key={item.symbol} 
                className={`watchlist-item ${isSelected ? 'selected' : ''}`}
                onClick={() => handleSelect(item.name)}
              >
                <Box className="item-left">
                  <Typography className="item-name">{item.name}</Typography>
                  <Typography className="item-pair">/USDT</Typography>
                </Box>
                
                <Box className="item-right">
                  <Typography className="item-price">
                    {item.price > 0 
                      ? item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) 
                      : '...'}
                  </Typography>
                  <Box className={`item-change ${isPositive ? 'positive' : 'negative'}`}>
                    {isPositive ? <TrendingUpIcon className="change-icon" /> : <TrendingDownIcon className="change-icon" />}
                    <span>{isPositive ? '+' : ''}{item.change.toFixed(2)}%</span>
                  </Box>
                </Box>
              </Box>
            );
          })
        )}
      </Box>
    </Box>
  );
}

export default WatchlistPanel;
