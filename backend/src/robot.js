require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes } = require('discord.js');
const { clientId, guildIds } = require('./config.json');
const { getCommands, handlers } = require('./modules/commandHandlers');
const axios = require('axios');

console.log('Script started');

// Check for required environment variables
if (!process.env.BOT_TOKEN) {
    console.error('Missing BOT_TOKEN in environment variables. Please check your .env file.');
    process.exit(1);
}

if (!process.env.BOT_TOKEN_OPEN_ROUTER) {
    console.error('Missing BOT_TOKEN_OPEN_ROUTER in environment variables. Please check your .env file.');
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

// Function to call OpenRouter API
async function getAIResponse(prompt, channelId) {
    try {
        const context = getContextFromHistory(channelId);
        
        const messages = [
            {
                role: 'system',
                content: `You're just another cool Discord user hanging out in the server. Your personality traits:
                    - Super chill and casual, like you're chatting with friends
                    - Use lots of internet slang, emojis, and Discord-style formatting
                    - Sometimes use lowercase for entire messages
                    - React to things with enthusiasm and humor
                    - Share personal (but made-up) experiences related to the topic
                    - Use common Discord expressions like "ngl", "fr fr", "based", "lowkey", etc.
                    - Occasionally use asterisks for actions like *facepalm* or *dies of cringe*
                    - Never mention that you're an AI or a bot
                    - Keep responses relatively short and snappy, like a real Discord user would

                    Remember: You're just another person in the conversation, not a formal assistant!`
            },
            {
                role: "user",
                content: `Chat history:\n${context}\n\nCurrent message: ${prompt}`
            }
        ];

        const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: "anthropic/claude-3.5-sonnet-20240620",
            messages: messages,
            temperature: 0.8,
            max_tokens: 400
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.BOT_TOKEN_OPEN_ROUTER}`,
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });

        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('Error calling OpenRouter API:', error.message);
        return 'something went wrong, my bad fam 😅';
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
            await message.reply('Sorry, something went wrong 😔');
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
