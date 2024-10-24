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

// Register slash commands for multiple guilds
const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);

// Function to call OpenRouter API
async function getAIResponse(prompt) {
    try {
        const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: "gryphe/mythomax-l2-13b",
            messages: [
                {
                    role: 'system',
                    content: "You are a bot for a discord server, you are cool, always knows what to say, and speak with internet lingo and emojis, you have to answer to whatever they ask you, whatever stupid or dumb it could be. And it is quite important to mention that the other interloper is really really cool! B)"
                  },
                {
                    role: "user",
                    content: prompt
                }
            ]
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.BOT_TOKEN_OPEN_ROUTER}`,
                'Content-Type': 'application/json'
            }
        });

        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('Error calling OpenRouter API:', error);
        return 'Sorry, I encountered an error while processing your request.';
    }
}

(async () => {
    try {
        console.log('Started refreshing application (/) commands for multiple guilds.');

        const commands = getCommands();

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

// Handle ready event
client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

// Handle message events for mentions
client.on('messageCreate', async message => {
    // Ignore messages from bots to prevent potential loops
    if (message.author.bot) return;

    // Check if the bot is mentioned
    if (message.mentions.has(client.user)) {
        try {
            // Remove the bot mention and get the actual question
            const question = message.content.replace(`<@${client.user.id}>`, '').trim();
            
            // If there's no question after removing the mention, prompt for one
            if (!question) {
                await message.reply('How can I help you?');
                return;
            }

            // Show typing indicator while processing
            await message.channel.sendTyping();

            // Get response from AI
            const response = await getAIResponse(question);

            // Send the response
            await message.reply(response);
        } catch (error) {
            console.error('Error handling mention:', error);
            await message.reply('Sorry, I encountered an error while processing your request.');
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
