require('dotenv').config();

// Create a function to get the latest values from process.env
function getConstants() {
    // Validate required AI environment variables
    const requiredVars = [
        'AI_SYSTEM_MESSAGE',
        'AI_USER_MESSAGE_FIRST',
        'AI_USER_MESSAGE_SECOND',
        'AI_CHARACTER',
        'AI_ASSISTANT_MESSAGE'
    ];

    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
        throw new Error(`Missing required AI environment variables: ${missingVars.join(', ')}`);
    }

    return {
        "BETTING_STATE_FILE": "src/betting_state.json",
        "HISTORY_FILE": "src/bet_history.json",
        "COINS_FILE": "src/coins.json",
        "MATCH_FILE": "src/current_match.json",
        "BETS_FILE": "src/current_bets.json",
        "INITIAL_COINS": 500,
        "AI_SYSTEM_MESSAGE": process.env.AI_SYSTEM_MESSAGE,
        "AI_USER_MESSAGE_FIRST": process.env.AI_USER_MESSAGE_FIRST,
        "AI_USER_MESSAGE_SECOND": process.env.AI_USER_MESSAGE_SECOND,
        "AI_CHARACTER": process.env.AI_CHARACTER,
        "AI_ASSISTANT_MESSAGE": process.env.AI_ASSISTANT_MESSAGE,
        "AI_ERROR_MESSAGE": "uhh can you say that again?"
    };
}

// Export a function that always returns fresh values
module.exports = getConstants();

// Also export the refresh function so it can be called after updates
module.exports.refresh = function() {
    Object.assign(module.exports, getConstants());
};
