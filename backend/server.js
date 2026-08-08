/**
 * Crypto Trading App Backend Server
 * 
 * This is the main backend server for the Crypto Trading App that:
 * - Provides API endpoints for accessing cryptocurrency market data
 * - Acts as a proxy between the frontend and external APIs (Binance)
 * - Handles error responses and data formatting
 */

// Import required dependencies
const express = require('express');  // Web server framework
const cors = require('cors');        // Cross-Origin Resource Sharing middleware
const axios = require('axios');      // HTTP client for making API requests
require('dotenv').config();          // Environment variable management

// Initialize Express application
const app = express();
const port = process.env.PORT || 5000;  // Use environment port or default to 5000

// Apply middleware
app.use(cors());                     // Enable CORS for all routes
app.use(express.json());             // Parse JSON request bodies

/**
 * GET /api/market-data/:symbol
 * 
 * Endpoint to fetch 24-hour market data for a specific cryptocurrency
 * Acts as a proxy to the Binance API to avoid CORS issues and add additional processing
 * 
 * @param {String} symbol - The cryptocurrency symbol (without USDT suffix)
 * @returns {Object} - Market data including price, volume, change percentage, etc.
 */
app.get('/api/market-data/:symbol', async (req, res) => {
    try {
        // Extract symbol from request parameters
        const { symbol } = req.params;
        
        // Make request to Binance API with USDT pair
        const response = await axios.get(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}USDT`);
        
        // Return the data directly to the client
        res.json(response.data);
    } catch (error) {
        // Handle errors and return appropriate status code
        res.status(500).json({ error: error.message });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
}); 