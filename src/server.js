import app from './index.js';
// import discordBot from './src/discord/bot.js';

// Initialisation du bot Discord
// discordBot.initialize();

app.listen(process.env.API_PORT || 3005, () => {
    console.log(
        `L'API est lancé sur le port ${process.env.API_PORT}`
    );
});