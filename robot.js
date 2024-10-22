require('dotenv').config();
const fs = require('fs');
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
const { clientId, guildIds } = require('./config.json');

console.log('Script started');

// Check for required environment variables
if (!process.env.BOT_TOKEN) {
    console.error('Missing BOT_TOKEN in environment variables. Please check your .env file.');
    process.exit(1);
}

console.log('BOT_TOKEN found');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Initialize global variables
let match = {};
let bets = {};
let coins = {};
let betHistory = {};

// File paths
const BETTING_STATE_FILE = 'betting_state.json';
const HISTORY_FILE = 'bet_history.json';
const COINS_FILE = 'coins.json';
const MATCH_FILE = 'current_match.json';
const BETS_FILE = 'current_bets.json';

// Function to load betting state
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

// Function to save betting state
function saveBettingState(isBettingOpen) {
    fs.writeFileSync(BETTING_STATE_FILE, JSON.stringify({ isBettingOpen }, null, 2));
    console.log('Betting state saved:', { isBettingOpen });
}

// Function to load current match
function loadMatch() {
    if (fs.existsSync(MATCH_FILE)) {
        const data = fs.readFileSync(MATCH_FILE, 'utf8');
        match = JSON.parse(data);
        console.log('Current match loaded:', match);
    } else {
        console.log('No current match file found, initializing empty match');
        match = {};
    }
}

// Function to save current match
function saveMatch() {
    fs.writeFileSync(MATCH_FILE, JSON.stringify(match, null, 2));
    console.log('Current match saved:', match);
}

// Function to load current bets
function loadBets() {
    if (fs.existsSync(BETS_FILE)) {
        const data = fs.readFileSync(BETS_FILE, 'utf8');
        bets = JSON.parse(data);
        console.log('Current bets loaded:', bets);
    } else {
        console.log('No current bets file found, initializing empty bets');
        bets = {};
    }
}

// Function to save current bets
function saveBets() {
    fs.writeFileSync(BETS_FILE, JSON.stringify(bets, null, 2));
    console.log('Current bets saved:', bets);
}

// Function to load bet history
function loadBetHistory() {
    if (fs.existsSync(HISTORY_FILE)) {
        const data = fs.readFileSync(HISTORY_FILE, 'utf8');
        betHistory = JSON.parse(data);
        console.log('Bet history loaded');
    } else {
        console.log('No bet history file found, initializing empty history');
    }
}

// Function to save bet history
function saveBetHistory() {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(betHistory, null, 2));
    console.log('Bet history saved');
}

// Function to load coins
function loadCoins() {
    try {
        if (fs.existsSync(COINS_FILE)) {
            const data = fs.readFileSync(COINS_FILE, 'utf8');
            coins = JSON.parse(data);
            console.log('Coins loaded from file');
        } else {
            console.log('Coins file not found, initializing empty coins object');
            coins = {};
        }
    } catch (error) {
        console.error('Error loading coins:', error);
        coins = {};
    }
}

// Function to save coins
function saveCoins() {
    try {
        fs.writeFileSync(COINS_FILE, JSON.stringify(coins, null, 2));
        console.log('Coins saved to file');
    } catch (error) {
        console.error('Error saving coins:', error);
    }
}

// Function to get user balance
function getUserBalance(userId) {
    if (!(userId in coins)) {
        coins[userId] = 500; // Initialize with 500 coins only for new users
        saveCoins();
    }
    return coins[userId];
}

// Function to update user balance
function updateUserBalance(userId, amount) {
    if (!(userId in coins)) {
        coins[userId] = 500; // Initialize with 500 coins only for new users
    }
    coins[userId] += amount;
    if (coins[userId] < 0) coins[userId] = 0; // Ensure balance doesn't go negative
    saveCoins();
    console.log(`Updated balance for user ${userId}: ${coins[userId]} coins`);
}

// Initialize isBettingOpen from file
let isBettingOpen = loadBettingState();

// Load current match
loadMatch();

// Load current bets
loadBets();

// Load bet history
loadBetHistory();

// Load coins
loadCoins();

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

// Register slash commands for multiple guilds
const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);

(async () => {
    try {
        console.log('Started refreshing application (/) commands for multiple guilds.');

        // Define the commands we want to register
        const commands = [
            new SlashCommandBuilder().setName('start').setDescription('Starts a betting round')
                .addStringOption(option => option.setName('wrestler1').setDescription('First wrestler').setRequired(true))
                .addStringOption(option => option.setName('wrestler2').setDescription('Second wrestler').setRequired(true)),
            new SlashCommandBuilder().setName('bet').setDescription('Place a bet')
                .addIntegerOption(option => 
                    option.setName('choice')
                        .setDescription('1 for first wrestler, 2 for second wrestler')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Wrestler 1', value: 1 },
                            { name: 'Wrestler 2', value: 2 }
                        )
                )
                .addIntegerOption(option => option.setName('amount').setDescription('Bet amount').setRequired(true)),
            new SlashCommandBuilder().setName('closebet').setDescription('Closes betting'),
            new SlashCommandBuilder().setName('result').setDescription('Declare the match result')
                .addIntegerOption(option => 
                    option.setName('winner')
                        .setDescription('Winning wrestler')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Wrestler 1', value: 1 },
                            { name: 'Wrestler 2', value: 2 }
                        )
                ),
            new SlashCommandBuilder().setName('balance').setDescription('Check your coin balance'),
            new SlashCommandBuilder().setName('betstate').setDescription('Check the current betting state'),
            new SlashCommandBuilder().setName('history').setDescription('View your betting history'),
            new SlashCommandBuilder().setName('addcoins').setDescription('Add coins to a user (Handler only)')
                .addUserOption(option => option.setName('user').setDescription('User to add coins to').setRequired(true))
                .addIntegerOption(option => option.setName('amount').setDescription('Amount of coins to add').setRequired(true)),
            new SlashCommandBuilder().setName('donate').setDescription('Donate coins to another user')
                .addUserOption(option => option.setName('user').setDescription('User to donate to').setRequired(true))
                .addIntegerOption(option => option.setName('amount').setDescription('Amount of coins to donate').setRequired(true))
        ];

        // Check if guildIds is an array and iterate
        if (Array.isArray(guildIds)) {
            for (const guildId of guildIds) {
                await rest.put(
                    Routes.applicationGuildCommands(clientId, guildId),
                    { body: commands }
                );
                console.log(`Registered commands for guild ${guildId}`);
            }
        } else {
            console.error('guildIds is not an array.');
        }

        console.log('Successfully registered application (/) commands for all guilds.');
    } catch (error) {
        console.error('Error registering commands:', error);
    }
})();

// Handling slash commands
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    console.log(`Received command: ${interaction.commandName}`);

    const { commandName, options } = interaction;
    const user = interaction.user.id;

    // Load current match state and bets
    loadMatch();
    loadBets();

    try {
        if (commandName === 'start') {
            if (!interaction.member.roles.cache.some(role => role.name === 'Handler')) {
                await interaction.reply('You do not have permission to start a bet.', { ephemeral: true });
                return;
            }

            const wrestler1 = options.getString('wrestler1');
            const wrestler2 = options.getString('wrestler2');

            match = { wrestler1, wrestler2 };
            saveMatch();
            isBettingOpen = true;
            saveBettingState(isBettingOpen);
            bets = {}; // Clear previous bets
            saveBets();

            await interaction.reply(`Betting is now open!\n1: **${wrestler1}**\n2: **${wrestler2}**\nUse \`/bet\` to place your bet.`);
        }

        if (commandName === 'bet') {
            if (!isBettingOpen) {
                await interaction.reply('There is no active betting right now.', { ephemeral: true });
                return;
            }

            const choice = options.getInteger('choice');
            const amount = options.getInteger('amount');

            console.log('Bet command received:', { choice, amount, match });

            if (!match.wrestler1 || !match.wrestler2) {
                await interaction.reply('Error: No active match found. Please start a new bet.', { ephemeral: true });
                return;
            }

            const chosenWrestler = choice === 1 ? match.wrestler1 : match.wrestler2;

            console.log('Chosen wrestler:', chosenWrestler);

            const userBalance = getUserBalance(user);
            if (amount <= 0 || amount > userBalance) {
                await interaction.reply(`Invalid bet amount. You currently have ${userBalance} coins.`, { ephemeral: true });
                return;
            }

            // Store the bet
            bets[user] = { wrestler: chosenWrestler, amount: amount };
            saveBets();
            updateUserBalance(user, -amount); // Deduct coins from user

            // Add to bet history
            if (!betHistory[user]) betHistory[user] = [];
            betHistory[user].push({
                match: `${match.wrestler1} vs ${match.wrestler2}`,
                bet: { wrestler: chosenWrestler, amount: amount },
                result: 'Pending'
            });
            saveBetHistory();

            await interaction.reply({ content: `Bet placed successfully on **${chosenWrestler}** (Wrestler ${choice}) with ${amount} coins.`, ephemeral: true });
        }

        if (commandName === 'closebet') {
            console.log('Closebet command received. Current betting state:', isBettingOpen);
            if (!isBettingOpen) {
                await interaction.reply('There is no active bet to close.', { ephemeral: true });
                return;
            }

            isBettingOpen = false;
            saveBettingState(isBettingOpen);
            await interaction.reply('Betting is now closed! No more bets can be placed.');
        }

        if (commandName === 'result') {
            if (!interaction.member.roles.cache.some(role => role.name === 'Handler')) {
                await interaction.reply('You do not have permission to submit the result.', { ephemeral: true });
                return;
            }

            const winnerChoice = options.getInteger('winner');
            const winner = winnerChoice === 1 ? match.wrestler1 : match.wrestler2;

            console.log('Result command received:', { winnerChoice, winner, match });
            console.log('Current bets:', bets);

            // Defer the reply to give us more time to process
            await interaction.deferReply();

            try {
                // Process bets and generate messages
                const messages = [];
                for (let userId in bets) {
                    const bet = bets[userId];
                    console.log(`Processing bet for user ${userId}:`, bet);
                    if (bet.wrestler === winner) {
                        const payout = bet.amount * 2; // Simple 2x payout
                        updateUserBalance(userId, payout);
                        messages.push(`<@${userId}> Congratulations! You won ${payout} coins by betting on ${winner}!`);
                        // Update bet history
                        betHistory[userId][betHistory[userId].length - 1].result = `Won ${payout} coins`;
                    } else {
                        messages.push(`<@${userId}> Unfortunately, you lost your bet of ${bet.amount} coins on ${bet.wrestler}. Better luck next time!`);
                        // Update bet history
                        betHistory[userId][betHistory[userId].length - 1].result = `Lost ${bet.amount} coins`;
                    }
                }

                // Save bet history and reset state
                saveBetHistory();
                bets = {};
                saveBets();
                match = {};
                saveMatch();
                isBettingOpen = false;
                saveBettingState(isBettingOpen);

                console.log('Payout messages:', messages);

                // Send individual messages for each user
                if (messages.length > 0) {
                    for (const message of messages) {
                        await interaction.channel.send(message);
                    }
                    await interaction.editReply('Results processed and sent to all participants.');
                } else {
                    await interaction.editReply('No bets were placed for this match.');
                }

                // Delete the "thinking" message after a short delay
                setTimeout(async () => {
                    try {
                        await interaction.deleteReply();
                    } catch (error) {
                        console.error('Error deleting reply:', error);
                    }
                }, 3000);

            } catch (error) {
                console.error('Error processing results:', error);
                await interaction.editReply('An error occurred while processing the results. Please try again.');
            }

            console.log('Result command processing completed');
        }

        if (commandName === 'balance') {
            const balance = getUserBalance(user);
            await interaction.reply(`Your current balance is ${balance} coins.`, { ephemeral: true });
        }

        if (commandName === 'betstate') {
            await interaction.reply(`Current betting state: ${isBettingOpen ? 'Open' : 'Closed'}`, { ephemeral: true });
        }

        if (commandName === 'history') {
            if (!betHistory[user] || betHistory[user].length === 0) {
                await interaction.reply({ content: 'You have no betting history.', ephemeral: true });
                return;
            }

            const recentBets = betHistory[user].slice(-5).reverse(); // Get last 5 bets in reverse order
            let historyMessage = 'Your last 5 bets:\n\n';
            
            recentBets.forEach((bet, index) => {
                historyMessage += `${index + 1}. Match: ${bet.match}\n   Bet: ${bet.bet.amount} coins on ${bet.bet.wrestler}\n   Result: ${bet.result}\n\n`;
            });

            await interaction.reply({ content: historyMessage, ephemeral: true });
        }

        if (commandName === 'addcoins') {
            if (!interaction.member.roles.cache.some(role => role.name === 'Handler')) {
                await interaction.reply('You do not have permission to add coins.', { ephemeral: true });
                return;
            }

            const targetUser = options.getUser('user');
            const amount = options.getInteger('amount');

            if (amount <= 0) {
                await interaction.reply('Please specify a positive amount of coins to add.', { ephemeral: true });
                return;
            }

            updateUserBalance(targetUser.id, amount);
            await interaction.reply(`Added ${amount} coins to <@${targetUser.id}>'s balance.`);
        }

        if (commandName === 'donate') {
            const targetUser = options.getUser('user');
            const amount = options.getInteger('amount');

            if (amount <= 0) {
                await interaction.reply('Please specify a positive amount of coins to donate.', { ephemeral: true });
                return;
            }

            const donorBalance = getUserBalance(user);
            if (amount > donorBalance) {
                await interaction.reply(`You don't have enough coins. Your current balance is ${donorBalance} coins.`, { ephemeral: true });
                return;
            }

            updateUserBalance(user, -amount);
            updateUserBalance(targetUser.id, amount);

            await interaction.reply(`Successfully donated ${amount} coins to <@${targetUser.id}>.`);
        }
    } catch (error) {
        console.error('Error handling command:', error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        } else if (interaction.deferred) {
            await interaction.editReply({ content: 'There was an error while executing this command!' });
        }
    }
});

// Log the bot in using your token
client.login(process.env.BOT_TOKEN).then(() => {
    console.log('Bot logged in successfully');
}).catch(error => {
    console.error('Error logging in:', error);
});

console.log('Script finished loading');
