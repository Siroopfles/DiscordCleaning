import { REST, Routes, Collection, Interaction } from 'discord.js';
import { Command, CommandHandlerOptions } from './types';
import { DiscordClient } from '../types';

export class CommandHandler {
  private client: DiscordClient;
  private commands: Collection<string, Command>;

  constructor({ commands, client }: CommandHandlerOptions) {
    this.client = client;
    this.commands = new Collection();
    
    commands.forEach((command) => {
      this.commands.set(command.data.name, command);
    });

    this.setupListeners();
  }

  private setupListeners(): void {
    this.client.on('interactionCreate', async (interaction: Interaction) => {
      if (!interaction.isChatInputCommand()) return;

      const command = this.commands.get(interaction.commandName);
      if (!command) return;

      try {
        const subcommandName = interaction.options.getSubcommand(false);
        
        if (subcommandName && command.subcommands && command.subcommands[subcommandName]) {
          // Execute subcommand
          await command.subcommands[subcommandName].execute(interaction, this.client);
        } else {
          // Execute main command
          await command.execute(interaction, this.client);
        }
      } catch (error) {
        this.client.services.logger?.error(
          `Error executing command ${interaction.commandName}${
            interaction.options.getSubcommand(false)
              ? ` (subcommand: ${interaction.options.getSubcommand()})`
              : ''
          }:`,
          error
        );

        const errorMessage = 'Er is een fout opgetreden bij het uitvoeren van dit commando.';
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ content: errorMessage, ephemeral: true });
        } else {
          await interaction.reply({ content: errorMessage, ephemeral: true });
        }
      }
    });
  }

  public async registerCommands(): Promise<void> {
    const rest = new REST({ version: '10' }).setToken(this.client.config.token);
    const commandsData = this.commands.map(command => command.data.toJSON());

    try {
      this.client.services.logger?.info('Started refreshing application commands...');

      if (this.client.config.guildId) {
        // Register commands for specific guild (faster updates during development)
        await rest.put(
          Routes.applicationGuildCommands(this.client.config.clientId, this.client.config.guildId),
          { body: commandsData }
        );
      } else {
        // Register global commands (takes up to 1 hour to update)
        await rest.put(
          Routes.applicationCommands(this.client.config.clientId),
          { body: commandsData }
        );
      }

      this.client.services.logger?.info('Successfully registered application commands.');
    } catch (error) {
      this.client.services.logger?.error('Error registering application commands:', error);
      throw error;
    }
  }

  public getCommands(): Collection<string, Command> {
    return this.commands;
  }
}

export function createCommandHandler(options: CommandHandlerOptions): CommandHandler {
  return new CommandHandler(options);
}