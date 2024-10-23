const { INITIAL_COINS } = require('./constants');
const { loadCoins, saveCoins } = require('./fileOperations');

let coins = loadCoins();

// Get user balance
function getUserBalance(userId) {
    if (!(userId in coins)) {
        coins[userId] = INITIAL_COINS; // Initialize with default coins for new users
        saveCoins(coins);
    }
    return coins[userId];
}

// Update user balance
function updateUserBalance(userId, amount) {
    if (!(userId in coins)) {
        coins[userId] = INITIAL_COINS; // Initialize with default coins for new users
    }
    coins[userId] += amount;
    if (coins[userId] < 0) coins[userId] = 0; // Ensure balance doesn't go negative
    saveCoins(coins);
    console.log(`Updated balance for user ${userId}: ${coins[userId]} coins`);
    return coins[userId];
}

// Get all user balances sorted by amount
function getSortedBalances() {
    return Object.entries(coins)
        .sort((a, b) => b[1] - a[1])
        .map(([userId, balance]) => ({ userId, balance }));
}

// Validate bet amount
function validateBetAmount(userId, amount) {
    const balance = getUserBalance(userId);
    return amount > 0 && amount <= balance;
}

// Process bet result
function processBetResult(userId, bet, isWinner, payoutMultiplier) {
    if (isWinner) {
        const payout = bet.amount * payoutMultiplier;
        updateUserBalance(userId, payout);
        return `Won ${payout} coins`;
    } else {
        return `Lost ${bet.amount} coins`;
    }
}

module.exports = {
    getUserBalance,
    updateUserBalance,
    getSortedBalances,
    validateBetAmount,
    processBetResult
};
