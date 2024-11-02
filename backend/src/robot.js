require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes } = require('discord.js');
const { clientId, guildIds } = require('./config.json');
const { getCommands, handlers } = require('./modules/commandHandlers');
const { AI_SYSTEM_MESSAGE, AI_ERROR_MESSAGE, AI_CHARACTER, AI_USER_MESSAGE_SECOND, AI_ASSISTANT_MESSAGE, AI_USER_MESSAGE_FIRST } = require('./modules/constants');
const axios = require('axios');
const { addMemory, getUserMemories } = require('./modules/memoryOperations');

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
        author: message.member?.displayName || message.author.username,
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

// Add this new function to convert image URL to base64
async function imageUrlToBase64(imageUrl) {
    try {
        const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const base64 = Buffer.from(response.data, 'binary').toString('base64');
        return base64;
    } catch (error) {
        console.error('Error converting image to base64:', error);
        throw error;
    }
}

// Function to get clean file extension from Discord URL
function getFileExtensionFromUrl(url) {
    // Extract the filename before query parameters
    const baseUrl = url.split('?')[0];
    // Get the extension
    const extension = baseUrl.split('.').pop().toLowerCase();
    return extension;
}

// Register slash commands for multiple guilds
const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);

// Add a new function to get reply chain context
async function getReplyChainContext(message) {
    let contextMessages = [];
    let currentMessage = message;

    // Traverse up the reply chain
    while (currentMessage.reference) {
        try {
            // Fetch the message that was replied to
            const repliedTo = await message.channel.messages.fetch(currentMessage.reference.messageId);
            
            // Add message to context
            contextMessages.unshift({
                author: repliedTo.member?.displayName || repliedTo.author.username,
                content: repliedTo.content,
                timestamp: repliedTo.createdTimestamp,
                isBot: repliedTo.author.bot
            });

            // Move up the chain
            currentMessage = repliedTo;
        } catch (error) {
            console.error('Error fetching replied message:', error);
            break;
        }
    }

    // Format the context
    return contextMessages
        .map(msg => `${msg.author}${msg.isBot ? ' (bot)' : ''}: ${msg.content}`)
        .join('\n');
}

// Function to call Claude API
async function getAIResponse(prompt, channelId, imageUrl = null, replyContext = '') {
    try {
        const chatHistory = getContextFromHistory(channelId);
        const userMemories = getUserMemories(channelId);
        const memoryContext = userMemories.length > 0 
            ? `\n\nPrevious interactions with this user:\n${userMemories.map(m => 
                `${new Date(m.timestamp).toISOString()}: ${m.content}`).join('\n')}`
            : '';

        const context = replyContext 
            ? `Reply chain:\n${replyContext}\nRecent chat history:\n${chatHistory}${memoryContext}`
            : `Chat history:\n${chatHistory}${memoryContext}`;
        
        console.log(context);
        let base64Image = null;
        let mediaType = null;
        
        if (imageUrl) {
            base64Image = await imageUrlToBase64(imageUrl);
            // Clean up the URL and get the proper extension
            const extension = getFileExtensionFromUrl(imageUrl);
            
            if (extension === 'png') {
                mediaType = 'image/png';
            } else if (extension === 'jpg' || extension === 'jpeg') {
                mediaType = 'image/jpeg';
            } else {
                // Default to JPEG if unable to determine
                mediaType = 'image/jpeg';
            }
        }
        
        const messages = [            
            {
                role: 'user',
                content: AI_USER_MESSAGE_FIRST
            },
            {
                role: 'user',
                content: AI_CHARACTER
            },
            {
                role: 'user',
                content: AI_USER_MESSAGE_SECOND
            },
            {
                role: 'assistant',
                content: AI_ASSISTANT_MESSAGE
            },
            {
                role: "user",
                content: imageUrl ? [
                    {
                        type: "image",
                        source: {
                            type: "base64",
                            media_type: mediaType,
                            data: base64Image
                        }
                    },
                    {
                        type: "text",
                        text: `${context}\n\nCurrent message: ${prompt}`
                    }
                ] : `${context}\n\nCurrent message: ${prompt}`
            }
        ];

        const response = await axios.post('https://api.anthropic.com/v1/messages', {
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 400,
            temperature: 0.8,            
            top_p: 1,
            top_k: 33,
            system: AI_SYSTEM_MESSAGE,
            messages: messages
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
        console.error('Error calling Claude API:', error.response?.data || error.message);
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

    // Check if the message is a mention of the bot or a reply to the bot's message
    let isReplyToBot = false;
    try {
        if (message.reference) {
            const repliedMessage = await message.channel.messages.fetch(message.reference.messageId);
            isReplyToBot = repliedMessage.author.id === client.user.id;
        }
    } catch (error) {
        console.error('Error fetching replied message:', error);
        // Continue execution without the reply context
    }

    if (message.mentions.has(client.user) || isReplyToBot) {
        try {
            // Clean and validate the message content
            let question = message.content.replace(`<@${client.user.id}>`, '').trim();
            
            // Handle empty or emoji-only messages
            if (!question && !message.attachments.size) {
                await message.reply('Nyaaaaaaaaaaa, how Cowie can help you?');
                return;
            }

            // If message only contains emojis, add some context
            if (question.match(/^\p{Emoji}+$/u)) {
                question = `User reacted with emoji: ${question}`;
            }

            let imageUrl = null;

            // Check for attachments
            if (message.attachments.size > 0) {
                const attachment = message.attachments.first();
                if (attachment.contentType?.startsWith('image/')) {
                    imageUrl = attachment.url;
                }
            }

            // Get reply chain context only if replying to bot
            let replyContext = '';
            if (isReplyToBot) {
                replyContext = await getReplyChainContext(message);
            }

            await message.channel.sendTyping();
            const response = await getAIResponse(question, message.channelId, imageUrl, replyContext);
            
            // Use channel.send instead of message.reply when the original message might be gone
            try {
                await message.reply(response);
            } catch (replyError) {
                if (replyError.code === 50035) {
                    // If reply fails, fall back to regular message
                    await message.channel.send({
                        content: response,
                        allowedMentions: { repliedUser: false }
                    });
                } else {
                    throw replyError;
                }
            }

            const userMemories = getUserMemories(message.author.id);
            const memoryContext = userMemories
                .map(m => `${new Date(m.timestamp).toISOString()}: ${m.content}`)
                .join('\n');

            addMemory(message.author.id, {
                user: message.content,
                bot: response
            });
        } catch (error) {
            console.error('Error handling message:', error);
            try {
                // Use channel.send instead of reply for error messages too
                await message.channel.send({
                    content: error.code === 50035 ? 
                        'Uhh can you say that again?' : 
                        AI_ERROR_MESSAGE,
                    allowedMentions: { repliedUser: false }
                });
            } catch (sendError) {
                console.error('Error sending error message:', sendError);
            }
        }
    }
});

// Handle interactions
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

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
