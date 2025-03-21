import { ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';

export interface PermissionConfig {
  requireAdmin?: boolean;
  requireManageServer?: boolean;
  customCheck?: (interaction: ChatInputCommandInteraction) => Promise<boolean>;
}

export async function checkPermissions(interaction: ChatInputCommandInteraction, config: PermissionConfig): Promise<boolean> {
  // Commands moeten in een server gebruikt worden
  if (!interaction.guild || !interaction.member) {
    throw new Error('Dit commando kan alleen in een server gebruikt worden');
  }

  // Haal member permissions op
  const memberPermissions = interaction.memberPermissions;
  if (!memberPermissions) {
    throw new Error('Kon de gebruiker permissies niet ophalen');
  }

  // Check admin rechten
  if (config.requireAdmin && !memberPermissions.has(PermissionFlagsBits.Administrator)) {
    throw new Error('Je hebt administrator rechten nodig om dit commando te gebruiken');
  }

  // Check server management rechten
  if (config.requireManageServer && !memberPermissions.has(PermissionFlagsBits.ManageGuild)) {
    throw new Error('Je hebt server management rechten nodig om dit commando te gebruiken');
  }

  // Voer custom permissie check uit als die er is
  if (config.customCheck) {
    const hasPermission = await config.customCheck(interaction);
    if (!hasPermission) {
      throw new Error('Je hebt niet de juiste rechten om dit commando te gebruiken');
    }
  }

  return true;
}

// Hulp functies voor specifieke permissie checks
export async function checkCurrencyPermissions(interaction: ChatInputCommandInteraction): Promise<boolean> {
  const config: PermissionConfig = {
    requireManageServer: true,
    customCheck: async (interaction) => {
      // Hier kunnen we extra checks toevoegen zoals:
      // - Specifieke rollen die currency mogen beheren
      // - Maximum bedragen per rol
      // - Cooldown checks per gebruiker/rol
      return true;
    }
  };

  return checkPermissions(interaction, config);
}