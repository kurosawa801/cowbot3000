require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes } = require('discord.js');
const { clientId, guildIds } = require('./config.json');
const { getCommands, handlers } = require('./modules/commandHandlers');
const { AI_SYSTEM_MESSAGE, AI_USER_MESSAGE, AI_ASSISTANT_MESSAGE, AI_ERROR_MESSAGE } = require('./modules/constants');
const axios = require('axios');

console.log('Script started');

// Check for required environment variables
if (!process.env.BOT_TOKEN) {
    console.error('Missing BOT_TOKEN in environment variables. Please check your .env file.');
    process.exit(1);
}

if (!process.env.BOT_TOKEN_CLAUDE) {
    console.error('Missing BOT_TOKEN_CLAUDE in environment variables. Please check your .env file.');
    process.exit(1);
}

console.log('Environment variables found');

// Initialize Discord client with additional intents
const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ] 
});

// Message history cache: channelId -> array of last messages
const messageHistory = new Map();
const MAX_HISTORY = 10;

// Function to store message in history
function addToHistory(channelId, message) {
    if (!messageHistory.has(channelId)) {
        messageHistory.set(channelId, []);
    }
    
    const history = messageHistory.get(channelId);
    const messageContent = {
        author: message.author.username,
        content: message.content,
        timestamp: message.createdTimestamp
    };
    
    history.push(messageContent);
    if (history.length > MAX_HISTORY) {
        history.shift();
    }
}

// Function to get formatted context from history
function getContextFromHistory(channelId) {
    if (!messageHistory.has(channelId)) {
        return '';
    }

    const history = messageHistory.get(channelId);
    return history.map(msg => `${msg.author}: ${msg.content}`).join('\n');
}

// Register slash commands for multiple guilds
const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);

// Function to call Claude API
async function getAIResponse(prompt, channelId) {
    try {
        const context = getContextFromHistory(channelId);
        console.log(context);
        
        const response = await axios.post('https://api.anthropic.com/v1/messages', {
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 400,
            temperature: 0.8,            
            top_p: 1,
            top_k: 25,
            system: AI_SYSTEM_MESSAGE,
            messages: [
                {
                    role: 'user',
                    content: AI_USER_MESSAGE
                },
                {
                    role: 'assistant',
                    content: AI_ASSISTANT_MESSAGE
                },
                {
                    role: "user",
                    content: `Chat history:\n${context}\n\nCurrent message: ${prompt}`
                }
            ]
        }, {
            headers: {
                'x-api-key': process.env.BOT_TOKEN_CLAUDE,
                'anthropic-version': '2023-06-01',
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });

        return response.data.content[0].text;
    } catch (error) {
        console.error('Error calling Claude API:', error.message);
        return AI_ERROR_MESSAGE;
    }
}

(async () => {
    try {
        console.log('Started refreshing application (/) commands for multiple guilds.');

        const commands = getCommands();

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

// Handle ready event
client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

// Handle message events for mentions and history
client.on('messageCreate', async message => {
    if (message.author.bot) return;

    addToHistory(message.channelId, message);

    if (message.mentions.has(client.user)) {
        try {
            const question = message.content.replace(`<@${client.user.id}>`, '').trim();
            if (!question) {
                await message.reply('How can I help you?');
                return;
            }

            await message.channel.sendTyping();
            const response = await getAIResponse(question, message.channelId);
            await message.reply(response);
        } catch (error) {
            console.error('Error handling message:', error);
            await message.reply(AI_ERROR_MESSAGE);
        }
    }
});

// Handle interactions
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    console.log(`Received command: ${interaction.commandName}`);

    try {
        const handler = handlers[interaction.commandName];
        if (handler) {
            await handler(interaction);
        }
    } catch (error) {
        console.error('Error handling command:', error);
        const reply = {
            content: 'There was an error while executing this command!',
            ephemeral: true
        };

        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply(reply);
        } else if (interaction.deferred) {
            await interaction.editReply(reply);
        }
    }
});

// Log the bot in
client.login(process.env.BOT_TOKEN)
    .then(() => {
        console.log('Bot logged in successfully');
    })
    .catch(error => {
        console.error('Error logging in:', error);
    });

console.log('Script finished loading');
