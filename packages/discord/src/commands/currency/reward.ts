import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandSubcommandBuilder } from 'discord.js';
import { SubCommand } from '../types';
import { DiscordClient } from '../../types';
import { CurrencyReward } from '../../types/api';
import { checkCurrencyPermissions } from '../../utils';

export const reward: SubCommand = {
  data: new SlashCommandSubcommandBuilder()
    .setName('reward')
    .setDescription('Beloon een gebruiker met credits')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('De gebruiker die je wilt belonen')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName('amount')
        .setDescription('Aantal credits (1-1000)')
        .setMinValue(1)
        .setMaxValue(1000)
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('Reden voor de beloning')
        .setRequired(true)
        .setMinLength(3)
        .setMaxLength(100)
    ),

  async execute(interaction: ChatInputCommandInteraction, client: DiscordClient) {
    await interaction.deferReply();

    try {
      // Check permissions
      await checkCurrencyPermissions(interaction);

      // Check if required services are available
      if (!client.services.api || !client.services.monitoring) {
        throw new Error('Vereiste services zijn niet beschikbaar');
      }

      if (!client.services.rateLimiter) {
        throw new Error('Rate limiter service is niet beschikbaar');
      }

      const serverId = interaction.guildId;
      if (!serverId) {
        throw new Error('Dit commando kan alleen in een server gebruikt worden');
      }

      // Check rate limit
      const userId = interaction.user.id;
      const canAttempt = client.services.rateLimiter.attempt(userId, serverId, 'reward');
      
      if (!canAttempt) {
        const resetTime = client.services.rateLimiter.getResetTime(userId, serverId, 'reward');
        const timeLeft = resetTime ? Math.ceil((resetTime - Date.now()) / 1000) : 60;
        throw new Error(`Je hebt de limiet bereikt voor het geven van beloningen. Probeer het over ${timeLeft} seconden opnieuw.`);
      }

      // Get command options
      const targetUser = interaction.options.getUser('user', true);
      const amount = interaction.options.getInteger('amount', true);
      const reason = interaction.options.getString('reason', true);

      // Check if user is trying to reward themselves
      if (targetUser.id === interaction.user.id) {
        throw new Error('Je kunt jezelf geen beloning geven');
      }

      // Create reward
      const rewardData: CurrencyReward = {
        amount,
        description: reason
      };

      const response = await client.services.api.addReward(
        targetUser.id,
        serverId,
        rewardData
      );
if (!response.success || !response.data) {
  client.services.monitoring.trackCurrencyOperation('REWARD', false);
  throw new Error(response.error || 'Kon geen beloning toevoegen');
}

// Track successful operation
client.services.monitoring.trackCurrencyOperation('REWARD', true);


      const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('Beloning Toegekend')
        .setDescription(`${targetUser} heeft ${amount} credits ontvangen!`)
        .addFields(
          { 
            name: 'Reden', 
            value: reason 
          },
          { 
            name: 'Nieuw Saldo', 
            value: `${response.data.balance} credits` 
          }
        )
        .setTimestamp()
        .setFooter({ 
          text: `Toegekend door ${interaction.user.username}` 
        });

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('Reward command error:', error);
      
      const errorMessage = error instanceof Error ? error.message :
        'Er is een fout opgetreden bij het toekennen van de beloning.';

      // Als er een rate limit is, toon ook de resterende pogingen
      let extraInfo = '';
      if (error instanceof Error && error.message.includes('limiet bereikt')) {
        const remaining = client.services.rateLimiter?.getRemainingAttempts(
          interaction.user.id,
          interaction.guildId!,
          'reward'
        );
        if (remaining !== undefined) {
          extraInfo = `\nJe hebt nog ${remaining} pogingen over in dit tijdsvenster.`;
        }
      }

      await interaction.editReply({
        content: `${errorMessage}${extraInfo}`
      });
    }
  }
};