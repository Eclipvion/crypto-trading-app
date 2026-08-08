import React from 'react';
import { Paper, Typography } from '@mui/material';
import './TradingInputs.css';

function TradingInputs() {
    return (
        <Paper className="input-group">
            <Typography className="input-group-title">
                Trading Inputs
            </Typography>
            <div className="input-section">
                {/* Empty for now - will add other inputs later */}
            </div>
        </Paper>
    );
}

export default TradingInputs; 