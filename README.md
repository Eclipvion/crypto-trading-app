# Crypto Trading App

A fully interactive crypto trading application with real-time market data, trading calculator, position sizing, and technical analysis.

## Project Structure

This project consists of a React frontend and Node.js backend:

```
crypto-trading-app/
├── frontend/              # React frontend application
│   ├── src/               # Source code
│   │   ├── components/    # React components
│   │   │   ├── MarketData/        # Market data display
│   │   │   ├── TradingCalculator/ # Trading calculator
│   │   │   ├── TradingInputs/     # Trading form inputs
│   │   │   └── PositionDetails/   # Position details
│   │   ├── App.js         # Main application component
│   │   └── index.js       # Entry point
│   └── public/            # Static assets
└── backend/               # Node.js backend
    ├── server.js          # Express server
    └── package.json       # Dependencies
```

## Key Components

### App.js
Main application component that:
- Sets up the Material UI theme configuration
- Manages the overall layout
- Handles state for selected coin across components

### MarketData Component
Displays market-related information including:
- Coin search with dropdown
- Market type selection (Gainers, Losers, Hot Coins, Strategy)
- Timeframe selection for technical analysis
- Current price and market data
- Technical analysis signals
- Market analysis tables

### TradingCalculator Component
Handles trading calculations including:
- Position size based on wallet balance
- PnL (Profit and Loss) calculations
- ROI (Return on Investment)
- Fee calculations for different exchanges
- Support for spot and futures trading with leverage
- Liquidation prices for leveraged trades

### Backend Server
Node.js Express server that:
- Provides API endpoints for cryptocurrency market data
- Acts as a proxy between frontend and external APIs (Binance)
- Handles error responses and data formatting

## API Integration

The application integrates with the following Binance APIs:
- Exchange Info API: To fetch available trading pairs
- Ticker API: To get 24hr market data and current prices
- Price API: To get real-time price updates

## Features

### Market Data
- Real-time price updates
- Searchable list of all Binance trading pairs
- Market analysis (Top Gainers, Top Losers, Hot Coins)
- Trading signals based on technical indicators
- Multiple timeframe analysis (1m, 5m, 15m, 1h, 4h, 1d)

### Trading Calculator
- Position sizing based on wallet balance and risk
- PnL and ROI calculations
- Support for long and short positions
- Spot and futures trading with leverage
- Fee calculations for major exchanges (Binance, Bybit, OKX, MEXC)
- Liquidation price calculator

## Getting Started

### Prerequisites
- Node.js and npm

### Installation

1. Clone the repository:
```
git clone https://github.com/your-username/crypto-trading-app.git
```

2. Install backend dependencies:
```
cd crypto-trading-app/backend
npm install
```

3. Install frontend dependencies:
```
cd ../frontend
npm install
```

4. Start the backend server:
```
cd ../backend
npm start
```

5. In a new terminal, start the frontend:
```
cd ../frontend
npm start
```

6. Open your browser and navigate to `http://localhost:3000`

## Technologies Used

- React
- Material UI
- Node.js
- Express
- Binance API 