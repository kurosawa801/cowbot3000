# Wrestling Betting Discord Bot

This Discord bot allows users to place bets on wrestling matches using a virtual currency system.

## Features

- Start betting rounds for wrestling matches
- Place bets on wrestlers
- Close betting rounds
- Declare match results and distribute payouts
- Check user balances
- Persistent coin balances across bot restarts
- View betting history
- Check current betting state

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

- `/start wrestler1 wrestler2`: Starts a new betting round (Handler role only)
- `/bet choice amount`: Place a bet on a wrestler (choice: 1 for wrestler1, 2 for wrestler2)
- `/closebet`: Closes the current betting round (Handler role only)
- `/result winner`: Declare the match result and distribute payouts (Handler role only, winner: 1 for wrestler1, 2 for wrestler2)
- `/balance`: Check your current coin balance
- `/betstate`: Check if betting is currently open or closed
- `/history`: View your last 5 bets

## Notes

- Users start with 500 coins if they have no balance.
- Bets pay out 2x the bet amount for correct predictions.
- Coin balances are saved to a `coins.json` file and persist across bot restarts.
- Bet history is saved and can be viewed using the `/history` command.
- Only users with the "Handler" role can start bets, close bets, and declare results.

## Contributing

Feel free to fork this project and submit pull requests with any improvements or additional features!

## License

This project is open source and available under the [MIT License](LICENSE).
