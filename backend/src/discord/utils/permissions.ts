import { ChatInputCommandInteraction, GuildMember } from 'discord.js';
import { Permission, PermissionLevel } from '../types/discord.types';
import { createPermissionError } from './commandErrors';

// Permission level hiërarchie
const PERMISSION_HIERARCHY: Record<PermissionLevel, number> = {
  USER: 0,
  MODERATOR: 1,
  ADMIN: 2,
  OWNER: 3,
};

// Helper functie om gebruiker permission level te bepalen
async function getUserPermissionLevel(
  member: GuildMember,
  guildId: string
): Promise<PermissionLevel> {
  // Server owner check
  if (member.id === member.guild.ownerId) {
    return 'OWNER';
  }

  // Admin rechten check
  if (member.permissions.has('Administrator')) {
    return 'ADMIN';
  }

  // Moderator rol check - kan aangepast worden per server
  const moderatorRoles = member.roles.cache.filter(role =>
    role.name.toLowerCase().includes('moderator')
  );
  if (moderatorRoles.size > 0) {
    return 'MODERATOR';
  }

  // Standaard gebruiker
  return 'USER';
}

// Check specifieke rol permissies
async function checkRolePermissions(
  member: GuildMember,
  requiredRoleIds?: string[]
): Promise<boolean> {
  if (!requiredRoleIds || requiredRoleIds.length === 0) {
    return true;
  }

  return member.roles.cache.some(role => requiredRoleIds.includes(role.id));
}

// Valideer alle permissies voor een command
export async function validatePermissions(
  interaction: ChatInputCommandInteraction,
  permissions?: Permission[]
): Promise<{ hasPermission: boolean; error?: Error }> {
  // Als geen permissies gespecificeerd, sta toe
  if (!permissions || permissions.length === 0) {
    return { hasPermission: true };
  }

  // Check of command in een guild wordt uitgevoerd
  if (!interaction.guild || !interaction.member) {
    return {
      hasPermission: false,
      error: createPermissionError(
        'Dit commando kan alleen in een server worden gebruikt'
      ),
    };
  }

  const member = interaction.member as GuildMember;
  const guildId = interaction.guildId!;

  // Check elke permission requirement
  for (const permission of permissions) {
    // Check guild specifieke permissies
    if (permission.guildId && permission.guildId !== guildId) {
      continue; // Sla over als niet voor deze guild
    }

    // Check gebruiker permission level
    const userLevel = await getUserPermissionLevel(member, guildId);
    const requiredLevel = PERMISSION_HIERARCHY[permission.level];
    const userLevelValue = PERMISSION_HIERARCHY[userLevel];

    if (userLevelValue < requiredLevel) {
      return {
        hasPermission: false,
        error: createPermissionError(
          `Je hebt ${permission.level} rechten nodig voor dit commando`
        ),
      };
    }

    // Check rol permissies
    if (permission.roleIds) {
      const hasRolePermission = await checkRolePermissions(
        member,
        permission.roleIds
      );
      if (!hasRolePermission) {
        return {
          hasPermission: false,
          error: createPermissionError(
            'Je hebt niet de juiste rol voor dit commando'
          ),
        };
      }
    }
  }

  return { hasPermission: true };
}

// Utility functie om permission arrays te maken
export function createPermission(
  level: PermissionLevel,
  guildId?: string,
  roleIds?: string[]
): Permission {
  return {
    level,
    guildId,
    roleIds,
  };
}

// Permission presets voor veel voorkomende scenarios
export const DEFAULT_PERMISSIONS = {
  USERS_ONLY: [createPermission('USER')],
  MODERATORS_ONLY: [createPermission('MODERATOR')],
  ADMINS_ONLY: [createPermission('ADMIN')],
  OWNER_ONLY: [createPermission('OWNER')],
};