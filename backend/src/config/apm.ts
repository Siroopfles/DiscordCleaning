import apm from 'elastic-apm-node';
import logger from '../utils/logger';

const initAPM = () => {
  try {
    // Initialize APM if configuration is present
    if (process.env.ELASTIC_APM_SERVER_URL) {
      apm.start({
        serviceName: 'calendar-service',
        secretToken: process.env.ELASTIC_APM_SECRET_TOKEN,
        serverUrl: process.env.ELASTIC_APM_SERVER_URL,
        environment: process.env.NODE_ENV || 'development',
        active: process.env.NODE_ENV === 'production',
        transactionSampleRate: 1.0,
        captureBody: 'errors',
        errorOnAbortedRequests: true,
        captureErrorLogStackTraces: 'always',
        logLevel: 'info'
      });

      logger.info('Elastic APM initialized successfully');
    }
  } catch (error) {
    logger.error('Failed to initialize APM:', error);
  }
};

export default initAPM;