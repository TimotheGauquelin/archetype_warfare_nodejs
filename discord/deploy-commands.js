import { REST, Routes } from 'discord.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const commands = [];
const commandsPath = join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = join(commandsPath, file);
    const command = await import(filePath);
    if ('data' in command) {
        commands.push(command.data.toJSON());
    } else {
        console.log(`[ATTENTION] La commande ${filePath} n'a pas de propriété "data" requise.`);
    }
}

const rest = new REST().setToken(process.env.DISCORD_BOT_TOKEN);

try {
    console.log(`Début du déploiement de ${commands.length} commandes (/)...`);

    const data = await rest.put(
        Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
        { body: commands },
    );

    console.log(`Déploiement réussi de ${data.length} commandes (/)!`);
} catch (error) {
    console.error(error);
} 