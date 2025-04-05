import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Répond avec Pong!');

export async function execute(interaction) {
    const sent = await interaction.reply({ content: 'Ping...', fetchReply: true });
    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    
    await interaction.editReply(`Pong! 🏓\nLatence: ${latency}ms\nLatence API: ${Math.round(interaction.client.ws.ping)}ms`);
} 