const express = require('express');
const cors = require('cors');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Import Discord bot functionality
require('./robot');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
const constants = require('./modules/constants');

// Get constants
app.get('/api/constants', (req, res) => {
    try {
        // Always return fresh values
        res.json(constants);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching constants' });
    }
});

// Helper function to format value for .env file
function formatEnvValue(value) {
    const stringValue = String(value);
    
    // If the value contains newlines or quotes
    if (stringValue.includes('\n') || stringValue.includes('"') || stringValue.includes("'")) {
        // Escape double quotes and wrap in double quotes
        return `"${stringValue.replace(/"/g, '\\"')}"`;
    }
    
    // If the value contains spaces but no newlines or quotes
    if (stringValue.includes(' ')) {
        return `"${stringValue}"`;
    }
    
    return stringValue;
}

// Update constants
app.put('/api/constants', (req, res) => {
    try {
        const updatedConstants = req.body;
        const envPath = path.join(__dirname, '..', '.env');
        
        // Define which constants can be updated via this endpoint
        const allowedConstants = [
            'AI_SYSTEM_MESSAGE',
            'AI_USER_MESSAGE_FIRST',
            'AI_USER_MESSAGE_SECOND',
            'AI_CHARACTER',
            'AI_ASSISTANT_MESSAGE',
            'AI_ERROR_MESSAGE'
        ];

        // Get the bot tokens from current .env
        let botTokens = {};
        if (fs.existsSync(envPath)) {
            const currentEnvContent = fs.readFileSync(envPath, 'utf8');
            currentEnvContent.split('\n').forEach(line => {
                if (line.startsWith('BOT_TOKEN')) {
                    const [key, ...valueParts] = line.split('=');
                    botTokens[key.trim()] = valueParts.join('=').trim();
                }
            });
        }

        // Start with bot tokens
        const newEnvLines = Object.entries(botTokens)
            .map(([key, value]) => `${key}=${value}`);

        // Add updated constants
        Object.entries(updatedConstants)
            .filter(([key]) => allowedConstants.includes(key))
            .forEach(([key, value]) => {
                const formattedValue = formatEnvValue(value);
                newEnvLines.push(`${key}=${formattedValue}`);
                process.env[key] = value;
            });

        // Write the new .env content
        fs.writeFileSync(envPath, newEnvLines.join('\n'));

        // Refresh the constants module to reflect new values
        constants.refresh();

        res.json({ message: 'Constants updated successfully', constants: updatedConstants });
    } catch (error) {
        console.error('Error updating constants:', error);
        res.status(500).json({ message: 'Error updating constants' });
    }
});

// Get current match
app.get('/api/match', (req, res) => {
    try {
        const matchData = fs.readFileSync(path.join(__dirname, 'current_match.json'), 'utf8');
        res.json(JSON.parse(matchData));
    } catch (error) {
        res.status(404).json({ message: 'No active match found' });
    }
});

// Get betting state
app.get('/api/betting-state', (req, res) => {
    try {
        const stateData = fs.readFileSync(path.join(__dirname, 'betting_state.json'), 'utf8');
        res.json(JSON.parse(stateData));
    } catch (error) {
        res.status(404).json({ message: 'Betting state not found' });
    }
});

// Get user coins
app.get('/api/coins/:userId', (req, res) => {
    try {
        const coinsData = fs.readFileSync(path.join(__dirname, 'coins.json'), 'utf8');
        const coins = JSON.parse(coinsData);
        const userCoins = coins[req.params.userId] || 0;
        res.json({ coins: userCoins });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user coins' });
    }
});

// Get user bet history
app.get('/api/history/:userId', (req, res) => {
    try {
        const historyData = fs.readFileSync(path.join(__dirname, 'bet_history.json'), 'utf8');
        const history = JSON.parse(historyData);
        const userHistory = history[req.params.userId] || [];
        res.json(userHistory);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching bet history' });
    }
});

// Get current bets
app.get('/api/bets', (req, res) => {
    try {
        const betsData = fs.readFileSync(path.join(__dirname, 'current_bets.json'), 'utf8');
        res.json(JSON.parse(betsData));
    } catch (error) {
        res.status(404).json({ message: 'No active bets found' });
    }
});

// Get ranking
app.get('/api/ranking', (req, res) => {
    try {
        const coinsData = fs.readFileSync(path.join(__dirname, 'coins.json'), 'utf8');
        const coins = JSON.parse(coinsData);
        
        // Sort users by coin balance
        const ranking = Object.entries(coins)
            .map(([userId, balance]) => ({ userId, balance }))
            .sort((a, b) => b.balance - a.balance);
        
        res.json(ranking);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching ranking' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
