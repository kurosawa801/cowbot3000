# Wrestling Betting Discord Bot

This Discord bot allows users to place bets on wrestling matches using a virtual currency system.

## Features

- Start betting rounds for wrestling matches
- Place bets on wrestlers
- Close betting rounds
- Declare match results and distribute payouts
- Check user balances
- Persistent coin balances across bot restarts

## Setup

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the root directory and add your Discord bot token:
   ```
   BOT_TOKEN=your_bot_token_here
   ```
4. Update the `config.json` file with your bot's client ID and the guild IDs where you want the bot to be active:
   ```json
   {
     "clientId": "your_client_id_here",
     "guildIds": ["guild_id_1", "guild_id_2"]
   }
   ```
5. Run the bot:
   ```
   node robot.js
   ```

## Commands

- `/start wrestler1 wrestler2`: Starts a new betting round (Admin only)
- `/bet wrestler amount`: Place a bet on a wrestler
- `/closebet`: Closes the current betting round (Admin only)
- `/result winner`: Declare the match result and distribute payouts (Admin only)
- `/balance`: Check your current coin balance

## Notes

- Users start with 500 coins if they have no balance.
- Bets pay out 2x the bet amount for correct predictions.
- Coin balances are saved to a `coins.json` file and persist across bot restarts.

## Contributing

Feel free to fork this project and submit pull requests with any improvements or additional features!

## License

This project is open source and available under the [MIT License](LICENSE).
