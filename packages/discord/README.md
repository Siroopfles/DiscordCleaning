# @newboom/discord

Discord integratie package voor het Huishoudelijk Takenbeheersysteem.

## Structuur

```
src/
├── client/         # Discord.js client setup en configuratie
├── commands/       # Command handlers en implementaties
├── services/       # Service classes voor herbruikbare logica
├── types/          # TypeScript type definities
└── utils/          # Utility functies
```

## Gebruik

```typescript
import { createDiscordClient, connectDiscordClient } from '@newboom/discord';

const client = createDiscordClient({
  config: {
    token: 'YOUR_BOT_TOKEN',
    clientId: 'YOUR_CLIENT_ID',
  },
  services: {
    logger: console, // Of een custom logger
  },
});

await connectDiscordClient(client);
```

## Commands Toevoegen

Nieuwe commands kunnen worden toegevoegd door de `Command` interface te implementeren:

```typescript
import { Command } from '@newboom/discord';

export const pingCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Antwoordt met pong!'),
  async execute(interaction, client) {
    await interaction.reply('Pong!');
  },
};
```

## Services

Services kunnen worden uitgebreid door `BaseService` te implementeren:

```typescript
import { BaseService } from '@newboom/discord';

export class CustomService extends BaseService {
  async initialize(): Promise<void> {
    // Service initialisatie logica
  }
}
```

## Development

```bash
# Installatie
npm install

# Development
npm run dev

# Build
npm run build

# Tests
npm test