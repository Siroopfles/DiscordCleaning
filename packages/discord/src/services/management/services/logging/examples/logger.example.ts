import { DiscordClient } from '../../../../../types';
import { LoggerFactory } from '../logger.factory';
import { BasicFormatter } from '../formatters/basic.formatter';
import { ConsoleTransport } from '../transports/console.transport';
import { ILoggerConfig, ILoggerDependencies } from '../../../interfaces/logging/logger.interface';

/**
 * Voorbeeld van logger systeem gebruik
 */
async function setupLogger(client: DiscordClient) {
  // Creëer logger dependencies
  const dependencies: ILoggerDependencies = {
    client,
    logger: console
  };

  // Initialiseer logger factory
  const loggerFactory = new LoggerFactory(dependencies);

  // Creëer basis formatter
  const formatter = new BasicFormatter({
    includeTimestamp: true,
    timestampFormat: 'ISO',
    template: '{{timestamp}} [{{level}}] {{message}}{{meta}}'
  });

  // Creëer console transport
  const consoleTransport = new ConsoleTransport({
    level: 'debug',
    colorize: true,
    timestamp: true
  });

  // Configureer Winston logger
  const winstonConfig: ILoggerConfig = {
    level: 'debug',
    transports: [consoleTransport],
    formatter,
    metadata: {
      service: '@newboom/discord',
      component: 'winston-example'
    }
  };

  // Creëer en registreer Winston logger
  const winstonLogger = loggerFactory.createWinstonLogger(winstonConfig);
  await winstonLogger.initialize();

  // Log voorbeeld berichten met Winston
  await winstonLogger.info('Winston logger initialized');
  await winstonLogger.debug('Debug message', { source: 'winston-example' });
  await winstonLogger.warn('Warning message', { code: 'WARN001' });
  await winstonLogger.error('Error message', { error: new Error('Test error') });

  // Configureer Bunyan logger
  const bunyanConfig: ILoggerConfig = {
    level: 'debug',
    transports: [consoleTransport],
    formatter,
    metadata: {
      service: '@newboom/discord',
      component: 'bunyan-example'
    }
  };

  // Creëer en registreer Bunyan logger
  const bunyanLogger = loggerFactory.createBunyanLogger(bunyanConfig);
  await bunyanLogger.initialize();

  // Log voorbeeld berichten met Bunyan
  await bunyanLogger.info('Bunyan logger initialized');
  await bunyanLogger.debug('Debug message', { source: 'bunyan-example' });
  await bunyanLogger.warn('Warning message', { code: 'WARN001' });
  await bunyanLogger.error('Error message', { error: new Error('Test error') });

  // Cleanup
  await winstonLogger.destroy();
  await bunyanLogger.destroy();
}

export { setupLogger };