require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes } = require('discord.js');
const { clientId, guildIds } = require('./config.json');
const { getCommands, handlers } = require('./modules/commandHandlers');

console.log('Script started');

// Check for required environment variables
if (!process.env.BOT_TOKEN) {
    console.error('Missing BOT_TOKEN in environment variables. Please check your .env file.');
    process.exit(1);
}

console.log('BOT_TOKEN found');

// Initialize Discord client
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Register slash commands for multiple guilds
const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);

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
