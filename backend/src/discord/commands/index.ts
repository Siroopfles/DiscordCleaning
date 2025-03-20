import { Collection } from 'discord.js';
import { balance } from './currency/balance';
import { transfer } from './currency/transfer';
import { leaderboard } from './currency/leaderboard';
import { history } from './currency/history';

export interface Command {
  data: any;
  execute: (interaction: any) => Promise<void>;
}

export async function loadCommands(): Promise<Collection<string, Command>> {
  const commands = new Collection<string, Command>();
  
  // Register currency commands
  commands.set(balance.data.name, balance);
  commands.set(transfer.data.name, transfer);
  commands.set(leaderboard.data.name, leaderboard);
  commands.set(history.data.name, history);

  return commands;
}