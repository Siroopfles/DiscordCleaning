import { Collection } from 'discord.js';


export interface Command {
  data: any;
  execute: (interaction: any) => Promise<void>;
}

export async function loadCommands(): Promise<Collection<string, Command>> {
  const commands = new Collection<string, Command>();
  
  

  return commands;
}