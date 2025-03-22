import { DiscordClient } from '../../../../types';
import { ManagementServiceRegistry, DEFAULT_REGISTRY_OPTIONS } from '../index';
import { MonitoringService } from './monitoring.service';

/**
 * Mock DiscordClient voor het voorbeeld
 */
class MockDiscordClient {
  services = {
    logger: console
  };
}

/**
 * Demonstreert het gebruik van de Management Services integration layer
 */
async function example() {
  // Creëer mock client
  const client = new MockDiscordClient() as unknown as DiscordClient;

  try {
    // Creëer en initialiseer de service registry
    const registry = new ManagementServiceRegistry(client, {
      ...DEFAULT_REGISTRY_OPTIONS,
      healthCheckInterval: 5000 // Snellere health checks voor demo
    });

    // Creëer monitoring service
    const monitoring = new MonitoringService(client);

    // Registreer de service
    await registry.register(monitoring);
    console.log('Service registered successfully');

    // Wacht even om metrics te verzamelen
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Check service status
    const status = await monitoring.getStatus();
    console.log('Service status:', status);

    // Simuleer een recovery scenario
    console.log('\nSimulating service recovery...');
    await monitoring.reinitialize();
    const newStatus = await monitoring.getStatus();
    console.log('Service status after recovery:', newStatus);

    // Cleanup
    registry.destroy();
    console.log('\nRegistry destroyed');

  } catch (error) {
    console.error('Error in example:', error);
  }
}

// Voer het voorbeeld uit als dit script direct wordt uitgevoerd
if (require.main === module) {
  example().catch(console.error);
}

/*
Verwachte output:

Service registered successfully

Service status: {
  healthy: true,
  status: 'active',
  lastCheck: 2025-03-22T07:09:47.123Z,
  metrics: {
    responseTime: 45.3,
    errorRate: 0.05,
    resourceUsage: {
      memory: 67.2
    }
  }
}

Simulating service recovery...
Service status after recovery: {
  healthy: true,
  status: 'active',
  lastCheck: 2025-03-22T07:09:57.456Z,
  metrics: {
    responseTime: 42.8,
    errorRate: 0.04,
    resourceUsage: {
      memory: 67.5
    }
  }
}

Registry destroyed
*/