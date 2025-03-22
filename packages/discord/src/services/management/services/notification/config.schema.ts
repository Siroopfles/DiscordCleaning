import { ConfigSchema } from '../../interfaces/config/types';

// Basis schema properties
const schemaDefaults = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  additionalProperties: false
} as const;

export const notificationConfigSchema: ConfigSchema = {
  ...schemaDefaults,
  type: 'object',
  required: ['channels', 'monitoring'],
  properties: {
    channels: {
      type: 'object',
      description: 'Channel configuration settings'
    },
    monitoring: {
      type: 'object',
      description: 'Monitoring configuration settings'
    }
  }
};

export const channelsConfigSchema: ConfigSchema = {
  ...schemaDefaults,
  type: 'object',
  required: ['maxChannelsPerType', 'healthCheckInterval', 'loadBalancing'],
  properties: {
    maxChannelsPerType: {
      type: 'number',
      description: 'Maximum number of channels allowed per channel type',
      minimum: 1
    },
    healthCheckInterval: {
      type: 'number',
      description: 'Interval in milliseconds between health checks',
      minimum: 1000
    },
    loadBalancing: {
      type: 'object',
      description: 'Load balancing configuration'
    }
  }
};

export const loadBalancingConfigSchema: ConfigSchema = {
  ...schemaDefaults,
  type: 'object',
  required: ['strategy', 'maxQueueSize', 'targetThroughput', 'balancingInterval'],
  properties: {
    strategy: {
      type: 'string',
      description: 'Load balancing strategy to use',
      enum: ['round-robin', 'least-loaded']
    },
    maxQueueSize: {
      type: 'number',
      description: 'Maximum number of messages in queue per channel',
      minimum: 1
    },
    targetThroughput: {
      type: 'number',
      description: 'Target messages per second per channel',
      minimum: 1
    },
    balancingInterval: {
      type: 'number',
      description: 'Interval in milliseconds for load balancing checks',
      minimum: 100
    }
  }
};

export const monitoringConfigSchema: ConfigSchema = {
  ...schemaDefaults,
  type: 'object',
  required: ['metricsInterval', 'errorThreshold', 'performanceThreshold'],
  properties: {
    metricsInterval: {
      type: 'number',
      description: 'Interval in milliseconds between metrics collection',
      minimum: 1000
    },
    errorThreshold: {
      type: 'number',
      description: 'Maximum acceptable error rate before alerting (0-1)',
      minimum: 0,
      maximum: 1
    },
    performanceThreshold: {
      type: 'number',
      description: 'Maximum acceptable latency in milliseconds',
      minimum: 0
    }
  }
};