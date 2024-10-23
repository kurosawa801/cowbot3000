# Discord Betting Bot with Angular Frontend

A Discord bot for managing betting on wrestling matches, now with a web interface built in Angular.

## Project Structure

The project is split into two main parts:

### Backend (`/backend`)
- Discord bot functionality
- Express API server
- Data storage and management
- Betting system logic

### Frontend (`/discordbot-angular`)
- Angular web interface
- Real-time match monitoring
- Betting status display
- User statistics

## Setup Instructions

1. Install dependencies for both backend and frontend:
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../discordbot-angular
npm install
```

2. Configure environment variables:
- Create a `.env` file in the `/backend` directory
- Add your Discord bot token:
```
BOT_TOKEN=your_bot_token_here
```

3. Configure Discord bot:
- Update `config.json` in `/backend/src` with your Discord server details:
```json
{
  "clientId": "your_client_id",
  "guildIds": ["your_guild_ids"]
}
```

## Running the Application

Start both backend and frontend with a single command:
```bash
cd backend
npm run dev:all
```

This will start:
- Backend server on port 3000
- Angular frontend on port 4200
- Discord bot service

## Features

### Discord Bot Commands
- `/start` - Start a new betting round
- `/bet` - Place a bet on a wrestler
- `/closebet` - Close betting for current match
- `/result` - Declare match result
- `/balance` - Check your coin balance
- `/betstate` - Check current betting state
- `/history` - View betting history
- `/ranking` - Show user rankings
- `/addcoins` - Add coins (Handler only)
- `/donate` - Donate coins to another user

### Web Interface
- Real-time match status display
- Current betting status
- Active bets visualization
- User statistics and rankings
- Responsive design for mobile and desktop

## Development

### Backend Development
```bash
cd backend
npm run dev
```

### Frontend Development
```bash
cd discordbot-angular
npm start
```

## Technologies Used

- Backend:
  - Node.js
  - Express
  - Discord.js
  - File-based data storage

- Frontend:
  - Angular 17
  - TypeScript
  - SCSS
  - Standalone Components

## Notes

- The web interface updates every 30 seconds to show the latest match and betting information
- All Discord bot functionality remains unchanged
- Data is synchronized between Discord bot and web interface
- Handler role is required for administrative commands
