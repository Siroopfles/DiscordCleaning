import { Client, GatewayIntentBits, Collection, Events } from 'discord.js';
import { loadCommands } from './commands';
import { config } from '../config/discord';

class DiscordBot {
  private client: Client;
  private commands: Collection<string, any>;

  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers
      ]
    });
    this.commands = new Collection();
  }

  async start() {
    // Load commands
    this.commands = await loadCommands();
    
    // Register event handlers
    this.client.on(Events.InteractionCreate, async (interaction) => {
      if (!interaction.isChatInputCommand()) return;

      const command = this.commands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(error);
        const content = 'Er is een fout opgetreden bij het uitvoeren van dit commando.';
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ content, ephemeral: true });
        } else {
          await interaction.reply({ content, ephemeral: true });
        }
      }
    });

    // Login
    await this.client.login(config.token);
    console.log('Discord bot is online!');
  }
}

export const bot = new DiscordBot();