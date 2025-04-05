import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class DiscordBot {
    constructor() {
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.DirectMessages,
                GatewayIntentBits.GuildMessageReactions,
                GatewayIntentBits.GuildEmojisAndStickers,
                GatewayIntentBits.GuildPresences
            ]
        });

        this.commands = new Collection();
        this.cooldowns = new Collection();
    }

    async initialize() {
        try {
            // Chargement des commandes
            await this.loadCommands();
            
            // Gestion des événements
            this.handleEvents();

            // Connexion du bot
            await this.client.login(process.env.DISCORD_BOT_TOKEN);
            
            console.log('Bot Discord connecté avec succès !');
        } catch (error) {
            console.error('Erreur lors de l\'initialisation du bot Discord:', error);
        }
    }

    async loadCommands() {
        const commandsPath = join(__dirname, 'commands');
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

        for (const file of commandFiles) {
            const filePath = join(commandsPath, file);
            const command = await import(filePath);

            if ('data' in command && 'execute' in command) {
                this.commands.set(command.data.name, command);
            } else {
                console.warn(`[ATTENTION] La commande ${filePath} n'a pas de propriété "data" ou "execute" requise.`);
            }
        }
    }

    handleEvents() {
        // Événement ready
        this.client.once('ready', () => {
            console.log(`Bot connecté en tant que ${this.client.user.tag}`);
        });

        // Événement messageCreate
        this.client.on('messageCreate', async message => {
            // Ignorer les messages des bots
            if (message.author.bot) return;

            // Vérifier si le message commence par le préfixe
            const prefix = process.env.DISCORD_PREFIX || '!';
            if (!message.content.startsWith(prefix)) return;

            // Séparer la commande et les arguments
            const args = message.content.slice(prefix.length).trim().split(/ +/);
            const commandName = args.shift().toLowerCase();

            // Vérifier si la commande existe
            const command = this.commands.get(commandName);
            if (!command) return;

            try {
                // Vérifier les cooldowns
                if (!this.cooldowns.has(command.data.name)) {
                    this.cooldowns.set(command.data.name, new Collection());
                }

                const now = Date.now();
                const timestamps = this.cooldowns.get(command.data.name);
                const cooldownAmount = (command.cooldown || 0) * 1000;

                if (timestamps.has(message.author.id)) {
                    const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

                    if (now < expirationTime) {
                        const timeLeft = (expirationTime - now) / 1000;
                        return message.reply(`Veuillez attendre ${timeLeft.toFixed(1)} seconde(s) avant de réutiliser la commande \`${command.data.name}\`.`);
                    }
                }

                timestamps.set(message.author.id, now);
                setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

                // Exécuter la commande
                await command.execute(message, args);
            } catch (error) {
                console.error(error);
                message.reply('Une erreur est survenue lors de l\'exécution de la commande.');
            }
        });

        // Événement interactionCreate (pour les slash commands)
        this.client.on('interactionCreate', async interaction => {
            if (!interaction.isChatInputCommand()) return;

            const command = this.commands.get(interaction.commandName);
            if (!command) return;

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                const reply = {
                    content: 'Une erreur est survenue lors de l\'exécution de la commande.',
                    ephemeral: true,
                };

                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(reply);
                } else {
                    await interaction.reply(reply);
                }
            }
        });
    }
}

export default new DiscordBot(); 