require('dotenv').config();

const {
    AI_SYSTEM_MESSAGE,
    AI_USER_MESSAGE_FIRST,
    AI_USER_MESSAGE_SECOND,
    AI_CHARACTER,
    AI_ASSISTANT_MESSAGE,
} = process.env; 

// Validate required AI environment variables
if (!AI_SYSTEM_MESSAGE || !AI_USER_MESSAGE_FIRST || !AI_USER_MESSAGE_SECOND || 
    !AI_CHARACTER || !AI_ASSISTANT_MESSAGE) {
    throw new Error('Missing required AI environment variables');
}

module.exports = {
    "BETTING_STATE_FILE": "src/betting_state.json",
    "HISTORY_FILE": "src/bet_history.json",
    "COINS_FILE": "src/coins.json",
    "MATCH_FILE": "src/current_match.json",
    "BETS_FILE": "src/current_bets.json",
    "INITIAL_COINS": 500,
    "AI_SYSTEM_MESSAGE": AI_SYSTEM_MESSAGE,
    "AI_USER_MESSAGE_FIRST": AI_USER_MESSAGE_FIRST,
    "AI_USER_MESSAGE_SECOND": AI_USER_MESSAGE_SECOND,
    "AI_CHARACTER": AI_CHARACTER,
    "AI_ASSISTANT_MESSAGE": AI_ASSISTANT_MESSAGE,
    "AI_ERROR_MESSAGE": "uhh can you say that again?"
};