# Discord Betting Bot with Angular Frontend

A comprehensive Discord bot system that combines betting management for wrestling matches with an AI-powered chat assistant. Features a modern Angular web interface for real-time monitoring and interaction.

## Core Features

### Betting System
- Support for matches with up to 8 wrestlers
- Real-time bet placement and tracking
- Dynamic payout calculations
- User balance management
- Comprehensive betting history
- Coin donation system between users
- Global user rankings

### AI Chat Assistant
- Powered by Claude 3 Sonnet
- Context-aware conversations with memory
- Image processing capabilities
- Reply chain tracking
- Persistent chat history
- Emoji recognition and handling

### Web Interface
- Real-time match status monitoring
- Live betting state updates
- Current bets visualization
- User statistics and rankings
- 30-second auto-refresh
- Responsive design

## Project Structure

### Backend (`/backend`)
- Discord bot for user interactions
- Express API server
- Claude AI integration
- Memory system for chat persistence
- File-based data storage

### Frontend (`/discordbot-angular`)
- Angular 17 web application
- Standalone component architecture
- Real-time data synchronization
- TypeScript/SCSS implementation

## Discord Commands

### Betting Commands
- `/start <wrestler1> <wrestler2> [wrestler3-8]` - Start a new match (Handler only)
- `/bet <choice> <amount>` - Place a bet on a wrestler
- `/closebet` - Close betting for current match (Handler only)
- `/result <winner>` - Declare match result (Handler only)
- `/balance` - Check your coin balance
- `/betstate` - Check current betting state
- `/history` - View betting history
- `/ranking` - Show global rankings

### Economy Commands
- `/addcoins <user> <amount>` - Add coins to user (Handler only)
- `/donate <user> <amount>` - Donate coins to another user

### Chat Features
- Mention or reply to the bot for AI conversation
- Image sharing support
- Context-aware responses
- Memory of past interactions

## Setup Instructions

1. Install dependencies:
```bash
# Backend setup
cd backend
npm install

# Frontend setup
cd ../discordbot-angular
npm install
```

2. Configure environment variables:
Create `.env` in `/backend`:
```env
BOT_TOKEN=your_discord_bot_token
BOT_TOKEN_CLAUDE=your_claude_api_key
PORT=3000
```

3. Configure Discord bot:
Create/update `config.json` in `/backend/src`:
```json
{
  "clientId": "your_bot_client_id",
  "guildIds": ["your_discord_server_ids"]
}
```

## Running the Application

### Development Mode
Start both services:
```bash
cd backend
npm run dev:all
```

This launches:
- Backend API (Port 3000)
- Angular frontend (Port 4200)
- Discord bot service

### Separate Component Launch
Backend only:
```bash
cd backend
npm run dev
```

Frontend only:
```bash
cd discordbot-angular
npm start
```

## Technical Details

### Backend Architecture
- Node.js with Express
- Discord.js for bot functionality
- Claude AI integration
- Memory management system
- File-based persistent storage
- Real-time data synchronization

### Frontend Architecture
- Angular 17
- Standalone components
- TypeScript/SCSS
- HTTP client services
- Auto-refresh mechanism
- Responsive design

### Data Management
- JSON-based storage system
- Memory persistence for chat
- Real-time state tracking
- User balance management
- Betting history logging

## Security & Permissions

- Handler role required for administrative commands:
  - Starting matches
  - Closing bets
  - Declaring results
  - Adding coins
- User authentication for betting
- Balance verification for bets
- Secure API endpoints

## Notes
- Web interface refreshes automatically every 30 seconds
- Images shared with the bot are processed through Claude AI
- Chat context is maintained across conversations
- Betting transactions are logged and traceable
- System maintains state across restarts
