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
        res.json(constants);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching constants' });
    }
});

// Update constants
app.put('/api/constants', (req, res) => {
    try {
        const updatedConstants = req.body;
        // Update the constants object
        Object.assign(constants, updatedConstants);
        
        // Write the updated constants to the file
        fs.writeFileSync(
            path.join(__dirname, 'modules', 'constants.js'),
            `module.exports = ${JSON.stringify(constants, null, 4)};`
        );

        res.json({ message: 'Constants updated successfully', constants: constants });
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
