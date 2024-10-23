const { SlashCommandBuilder } = require('discord.js');
const {
    startMatch,
    placeBet,
    closeBetting,
    processMatchResult,
    getUserHistory,
    getMatchState
} = require('./matchOperations');
const {
    getUserBalance,
    updateUserBalance,
    getSortedBalances,
    validateBetAmount
} = require('./userOperations');

// Create dynamic choices for bet and result commands
const createWrestlerChoices = (maxWrestlers) => {
    const choices = [];
    for (let i = 1; i <= maxWrestlers; i++) {
        choices.push({ name: `Wrestler ${i}`, value: i });
    }
    return choices;
};

// Define commands
function getCommands() {
    // Create the start command with up to 8 optional wrestlers
    const startCommand = new SlashCommandBuilder()
        .setName('start')
        .setDescription('Starts a betting round')
        .addStringOption(option => option.setName('wrestler1').setDescription('First wrestler').setRequired(true))
        .addStringOption(option => option.setName('wrestler2').setDescription('Second wrestler').setRequired(true));

    // Add optional wrestlers 3-8
    for (let i = 3; i <= 8; i++) {
        startCommand.addStringOption(option => 
            option.setName(`wrestler${i}`).setDescription(`Wrestler ${i} (optional)`).setRequired(false)
        );
    }

    const commands = [
        startCommand,
        new SlashCommandBuilder()
            .setName('bet')
            .setDescription('Place a bet')
            .addIntegerOption(option => 
                option.setName('choice')
                    .setDescription('Choose wrestler number (1-8)')
                    .setRequired(true)
                    .addChoices(...createWrestlerChoices(8))
            )
            .addIntegerOption(option => 
                option.setName('amount')
                    .setDescription('Bet amount')
                    .setRequired(true)
            ),
        new SlashCommandBuilder()
            .setName('closebet')
            .setDescription('Closes betting'),
        new SlashCommandBuilder()
            .setName('result')
            .setDescription('Declare the match result')
            .addIntegerOption(option => 
                option.setName('winner')
                    .setDescription('Winning wrestler')
                    .setRequired(true)
                    .addChoices(...createWrestlerChoices(8))
            ),
        new SlashCommandBuilder()
            .setName('balance')
            .setDescription('Check your coin balance'),
        new SlashCommandBuilder()
            .setName('betstate')
            .setDescription('Check the current betting state'),
        new SlashCommandBuilder()
            .setName('history')
            .setDescription('View your betting history'),
        new SlashCommandBuilder()
            .setName('addcoins')
            .setDescription('Add coins to a user (Handler only)')
            .addUserOption(option => 
                option.setName('user')
                    .setDescription('User to add coins to')
                    .setRequired(true)
            )
            .addIntegerOption(option => 
                option.setName('amount')
                    .setDescription('Amount of coins to add')
                    .setRequired(true)
            ),
        new SlashCommandBuilder()
            .setName('donate')
            .setDescription('Donate coins to another user')
            .addUserOption(option => 
                option.setName('user')
                    .setDescription('User to donate to')
                    .setRequired(true)
            )
            .addIntegerOption(option => 
                option.setName('amount')
                    .setDescription('Amount of coins to donate')
                    .setRequired(true)
            ),
        new SlashCommandBuilder()
            .setName('ranking')
            .setDescription('Show the ranking of users based on their coin balance')
    ];

    return commands;
}

// Command handlers
async function handleStart(interaction) {
    if (!interaction.member.roles.cache.some(role => role.name === 'Handler')) {
        await interaction.reply('You do not have permission to start a bet.');
        return;
    }

    const wrestlers = [];
    for (let i = 1; i <= 8; i++) {
        const wrestler = interaction.options.getString(`wrestler${i}`);
        if (wrestler) wrestlers.push(wrestler);
    }

    try {
        const match = startMatch(wrestlers);
        let message = 'Betting is now open!\n';
        match.wrestlers.forEach((wrestler, index) => {
            message += `${index + 1}: **${wrestler}**\n`;
        });
        message += '\nUse `/bet` to place your bet.';
        await interaction.reply(message);
    } catch (error) {
        await interaction.reply(error.message);
    }
}

async function handleBet(interaction) {
    const user = interaction.user.id;
    const choice = interaction.options.getInteger('choice');
    const amount = interaction.options.getInteger('amount');
    const state = getMatchState();

    try {
        if (!validateBetAmount(user, amount)) {
            throw new Error(`Invalid bet amount. You currently have ${getUserBalance(user)} coins.`);
        }

        const wrestler = state.match.wrestlers[choice - 1];
        const bet = placeBet(user, wrestler, amount);
        updateUserBalance(user, -amount);

        await interaction.reply({
            content: `Bet placed successfully on **${bet.wrestler}** (Wrestler ${choice}) with ${bet.amount} coins.`,
            ephemeral: true
        });
    } catch (error) {
        await interaction.reply({
            content: error.message,
            ephemeral: true
        });
    }
}

async function handleCloseBet(interaction) {
    try {
        closeBetting();
        await interaction.reply('Betting is now closed! No more bets can be placed.');
    } catch (error) {
        await interaction.reply(error.message);
    }
}

async function handleResult(interaction) {
    if (!interaction.member.roles.cache.some(role => role.name === 'Handler')) {
        await interaction.reply('You do not have permission to submit the result.');
        return;
    }

    const winnerChoice = interaction.options.getInteger('winner');
    const state = getMatchState();

    try {
        const winner = state.match.wrestlers[winnerChoice - 1];
        await interaction.deferReply();

        const result = processMatchResult(winner);
        await interaction.channel.send(`**${winner}** has won the match!`);

        // Process payouts
        for (const betResult of result.results) {
            if (betResult.won) {
                const payout = betResult.originalBet.amount * result.payoutMultiplier;
                updateUserBalance(betResult.userId, payout);
            }
        }

        await interaction.editReply('Results processed and payouts distributed.');
    } catch (error) {
        if (interaction.deferred) {
            await interaction.editReply(error.message);
        } else {
            await interaction.reply(error.message);
        }
    }
}

async function handleBalance(interaction) {
    const balance = getUserBalance(interaction.user.id);
    await interaction.reply({
        content: `Your current balance is ${balance} coins.`,
        ephemeral: true
    });
}

async function handleBetState(interaction) {
    const state = getMatchState();
    let message = `Current betting state: ${state.isBettingOpen ? 'Open' : 'Closed'}`;
    
    if (state.isBettingOpen && state.match.wrestlers) {
        message += '\nCurrent wrestlers:\n';
        state.match.wrestlers.forEach((wrestler, index) => {
            message += `${index + 1}: **${wrestler}**\n`;
        });
    }
    
    await interaction.reply({
        content: message,
        ephemeral: true
    });
}

async function handleHistory(interaction) {
    const history = getUserHistory(interaction.user.id);
    
    if (!history || history.length === 0) {
        await interaction.reply({
            content: 'You have no betting history.',
            ephemeral: true
        });
        return;
    }

    let historyMessage = 'Your last 5 bets:\n\n';
    history.forEach((bet, index) => {
        historyMessage += `${index + 1}. Match: ${bet.match}\n   Bet: ${bet.bet.amount} coins on ${bet.bet.wrestler}\n   Result: ${bet.result}\n\n`;
    });

    await interaction.reply({
        content: historyMessage,
        ephemeral: true
    });
}

async function handleAddCoins(interaction) {
    if (!interaction.member.roles.cache.some(role => role.name === 'Handler')) {
        await interaction.reply('You do not have permission to add coins.');
        return;
    }

    const targetUser = interaction.options.getUser('user');
    const amount = interaction.options.getInteger('amount');

    if (amount <= 0) {
        await interaction.reply('Please specify a positive amount of coins to add.');
        return;
    }

    updateUserBalance(targetUser.id, amount);
    await interaction.reply(`Added ${amount} coins to <@${targetUser.id}>'s balance.`);
}

async function handleDonate(interaction) {
    const targetUser = interaction.options.getUser('user');
    const amount = interaction.options.getInteger('amount');
    const donorId = interaction.user.id;

    if (amount <= 0) {
        await interaction.reply('Please specify a positive amount of coins to donate.');
        return;
    }

    const donorBalance = getUserBalance(donorId);
    if (amount > donorBalance) {
        await interaction.reply(`You don't have enough coins. Your current balance is ${donorBalance} coins.`);
        return;
    }

    updateUserBalance(donorId, -amount);
    updateUserBalance(targetUser.id, amount);
    await interaction.reply(`Successfully donated ${amount} coins to <@${targetUser.id}>.`);
}

async function handleRanking(interaction) {
    const rankings = getSortedBalances();
    let rankingMessage = '**Coin Balance Ranking**\n\n';

    // Fetch user data for each user ID
    const userPromises = rankings.map(async ({ userId, balance }, index) => {
        try {
            const user = await interaction.client.users.fetch(userId);
            return `${index + 1}. ${user.username}: ${balance} coins`;
        } catch (error) {
            console.error(`Error fetching user ${userId}:`, error);
            return `${index + 1}. Unknown User (${userId}): ${balance} coins`;
        }
    });

    const userRankings = await Promise.all(userPromises);
    rankingMessage += userRankings.join('\n');
    await interaction.reply(rankingMessage);
}

// Command handler map
const handlers = {
    start: handleStart,
    bet: handleBet,
    closebet: handleCloseBet,
    result: handleResult,
    balance: handleBalance,
    betstate: handleBetState,
    history: handleHistory,
    addcoins: handleAddCoins,
    donate: handleDonate,
    ranking: handleRanking
};

module.exports = {
    getCommands,
    handlers
};
