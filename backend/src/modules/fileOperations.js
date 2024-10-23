const fs = require('fs');
const {
    BETTING_STATE_FILE,
    HISTORY_FILE,
    COINS_FILE,
    MATCH_FILE,
    BETS_FILE
} = require('./constants');

// Load betting state
function loadBettingState() {
    if (fs.existsSync(BETTING_STATE_FILE)) {
        const data = fs.readFileSync(BETTING_STATE_FILE, 'utf8');
        const state = JSON.parse(data);
        console.log('Betting state loaded:', state);
        return state.isBettingOpen;
    }
    console.log('No betting state file found, initializing to false');
    return false;
}

// Save betting state
function saveBettingState(isBettingOpen) {
    fs.writeFileSync(BETTING_STATE_FILE, JSON.stringify({ isBettingOpen }, null, 2));
    console.log('Betting state saved:', { isBettingOpen });
}

// Load current match
function loadMatch() {
    if (fs.existsSync(MATCH_FILE)) {
        const data = fs.readFileSync(MATCH_FILE, 'utf8');
        const match = JSON.parse(data);
        console.log('Current match loaded:', match);
        return match;
    }
    console.log('No current match file found, initializing empty match');
    return {};
}

// Save current match
function saveMatch(match) {
    fs.writeFileSync(MATCH_FILE, JSON.stringify(match, null, 2));
    console.log('Current match saved:', match);
}

// Load current bets
function loadBets() {
    if (fs.existsSync(BETS_FILE)) {
        const data = fs.readFileSync(BETS_FILE, 'utf8');
        const bets = JSON.parse(data);
        console.log('Current bets loaded:', bets);
        return bets;
    }
    console.log('No current bets file found, initializing empty bets');
    return {};
}

// Save current bets
function saveBets(bets) {
    fs.writeFileSync(BETS_FILE, JSON.stringify(bets, null, 2));
    console.log('Current bets saved:', bets);
}

// Load bet history
function loadBetHistory() {
    if (fs.existsSync(HISTORY_FILE)) {
        const data = fs.readFileSync(HISTORY_FILE, 'utf8');
        const history = JSON.parse(data);
        console.log('Bet history loaded');
        return history;
    }
    console.log('No bet history file found, initializing empty history');
    return {};
}

// Save bet history
function saveBetHistory(history) {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
    console.log('Bet history saved');
}

// Load coins
function loadCoins() {
    try {
        if (fs.existsSync(COINS_FILE)) {
            const data = fs.readFileSync(COINS_FILE, 'utf8');
            const coins = JSON.parse(data);
            console.log('Coins loaded from file');
            return coins;
        }
        console.log('Coins file not found, initializing empty coins object');
        return {};
    } catch (error) {
        console.error('Error loading coins:', error);
        return {};
    }
}

// Save coins
function saveCoins(coins) {
    try {
        fs.writeFileSync(COINS_FILE, JSON.stringify(coins, null, 2));
        console.log('Coins saved to file');
    } catch (error) {
        console.error('Error saving coins:', error);
    }
}

module.exports = {
    loadBettingState,
    saveBettingState,
    loadMatch,
    saveMatch,
    loadBets,
    saveBets,
    loadBetHistory,
    saveBetHistory,
    loadCoins,
    saveCoins
};
