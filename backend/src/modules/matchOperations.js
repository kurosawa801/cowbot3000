const {
    loadMatch,
    saveMatch,
    loadBets,
    saveBets,
    loadBetHistory,
    saveBetHistory,
    loadBettingState,
    saveBettingState
} = require('./fileOperations');

let match = loadMatch();
let bets = loadBets();
let betHistory = loadBetHistory();
let isBettingOpen = loadBettingState();

// Start new match
function startMatch(wrestlers) {
    if (wrestlers.length < 2) {
        throw new Error('Must specify at least 2 wrestlers');
    }
    match = { wrestlers };
    saveMatch(match);
    bets = {};
    saveBets(bets);
    isBettingOpen = true;
    saveBettingState(isBettingOpen);
    
    return match;
}

// Place bet
function placeBet(userId, wrestler, amount) {
    if (!isBettingOpen) {
        throw new Error('There is no active betting right now.');
    }

    if (!match.wrestlers || match.wrestlers.length < 2) {
        throw new Error('No active match found.');
    }

    if (!match.wrestlers.includes(wrestler)) {
        throw new Error('Invalid wrestler choice.');
    }

    // Store the bet
    bets[userId] = { wrestler, amount };
    saveBets(bets);

    // Add to bet history
    if (!betHistory[userId]) betHistory[userId] = [];
    betHistory[userId].push({
        match: match.wrestlers.join(' vs '),
        bet: { wrestler, amount },
        result: 'Pending'
    });
    saveBetHistory(betHistory);

    return { wrestler, amount };
}

// Close betting
function closeBetting() {
    if (!isBettingOpen) {
        throw new Error('There is no active bet to close.');
    }
    isBettingOpen = false;
    saveBettingState(isBettingOpen);
}

// Process match result
function processMatchResult(winner) {
    if (!match.wrestlers || !match.wrestlers.includes(winner)) {
        throw new Error('Invalid winner.');
    }

    const payoutMultiplier = match.wrestlers.length;
    const results = [];

    // Process each bet
    for (const [userId, bet] of Object.entries(bets)) {
        const isWinner = bet.wrestler === winner;
        const result = {
            userId,
            originalBet: bet,
            won: isWinner,
            payoutMultiplier: isWinner ? payoutMultiplier : 0
        };
        results.push(result);

        // Update bet history
        if (betHistory[userId] && betHistory[userId].length > 0) {
            const lastBet = betHistory[userId][betHistory[userId].length - 1];
            lastBet.result = isWinner ? 
                `Won ${bet.amount * payoutMultiplier} coins` : 
                `Lost ${bet.amount} coins`;
        }
    }

    // Reset match state
    match = {};
    bets = {};
    isBettingOpen = false;

    // Save all states
    saveMatch(match);
    saveBets(bets);
    saveBetHistory(betHistory);
    saveBettingState(isBettingOpen);

    return {
        winner,
        payoutMultiplier,
        results
    };
}

// Get user betting history
function getUserHistory(userId, limit = 5) {
    return (betHistory[userId] || [])
        .slice(-limit)
        .reverse();
}

// Get current match state
function getMatchState() {
    return {
        isBettingOpen,
        match,
        bets
    };
}

module.exports = {
    startMatch,
    placeBet,
    closeBetting,
    processMatchResult,
    getUserHistory,
    getMatchState
};
