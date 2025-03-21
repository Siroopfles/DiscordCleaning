import { jest } from '@jest/globals';
import { WebhookError } from '../../middleware/errorHandler';
import queueService, { QUEUES } from '../../config/queue';
import webhookService from '../../services/WebhookService';
import { webhookQueueSize } from '../../config/webhookMetrics';
import WebhookWorker from '../../workers/WebhookWorker';

// Define message type
interface WebhookDeliveryMessage {
  webhookId: string;
  event: string;
  payload: any;
  deliveryId: string;
  retryCount: number;
  nextRetry?: Date;
}

// Define handler types
type DeliveryHandler = (message: WebhookDeliveryMessage) => Promise<void>;
type RetryHandler = (message: WebhookDeliveryMessage) => Promise<void>;

// Mock dependencies
jest.mock('../../config/queue');
jest.mock('../../services/WebhookService');
jest.mock('../../utils/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  },
  addWebhookContext: jest.fn((ctx) => ctx)
}));
jest.mock('../../config/webhookMetrics', () => ({
  webhookQueueSize: {
    labels: jest.fn(() => ({
      inc: jest.fn(),
      dec: jest.fn()
    }))
  }
}));

describe('WebhookWorker', () => {
  // Type the mock message
  const mockDeliveryMessage: WebhookDeliveryMessage = {
    webhookId: 'test-webhook-id',
    event: 'task.completed',
    payload: { taskId: '123' },
    deliveryId: 'test-delivery-id',
    retryCount: 0
  };

  // Type the handlers
  let deliveryHandler: DeliveryHandler;
  let retryHandler: RetryHandler;

  beforeEach(() => {
    jest.clearAllMocks();

    // Type the mock implementations
    const mockQueueService = queueService as jest.Mocked<typeof queueService>;
    const mockWebhookService = webhookService as jest.Mocked<typeof webhookService>;

    mockQueueService.connect.mockResolvedValue();
    mockQueueService.close.mockResolvedValue();
    mockWebhookService.processDelivery.mockResolvedValue();
    mockQueueService.publishToQueue.mockResolvedValue(true);

    // Setup handler capture with proper typing
    mockQueueService.consumeFromQueue.mockImplementation((queue: string, handler: DeliveryHandler | RetryHandler) => {
      if (queue === QUEUES.WEBHOOK_DELIVERY) {
        deliveryHandler = handler as DeliveryHandler;
      } else if (queue === QUEUES.WEBHOOK_RETRY) {
        retryHandler = handler as RetryHandler;
      }
      return Promise.resolve();
    });
  });

  describe('start', () => {
    it('should connect and setup queue consumers', async () => {
      await WebhookWorker.start();

      expect(queueService.connect).toHaveBeenCalled();
      expect(queueService.consumeFromQueue).toHaveBeenCalledWith(
        QUEUES.WEBHOOK_DELIVERY,
        expect.any(Function)
      );
      expect(queueService.consumeFromQueue).toHaveBeenCalledWith(
        QUEUES.WEBHOOK_RETRY,
        expect.any(Function)
      );
    });

    it('should throw error if queue connection fails', async () => {
      const mockQueueService = queueService as jest.Mocked<typeof queueService>;
      const error = new Error('Connection failed');
      mockQueueService.connect.mockRejectedValue(error);

      await expect(WebhookWorker.start()).rejects.toThrow('Connection failed');
    });
  });

  describe('stop', () => {
    it('should close queue connection', async () => {
      await WebhookWorker.stop();

      expect(queueService.close).toHaveBeenCalled();
    });

    it('should throw error if closing connection fails', async () => {
      const mockQueueService = queueService as jest.Mocked<typeof queueService>;
      const error = new Error('Close failed');
      mockQueueService.close.mockRejectedValue(error);

      await expect(WebhookWorker.stop()).rejects.toThrow('Close failed');
    });
  });

  describe('processDelivery', () => {
    it('should process webhook delivery successfully', async () => {
      await WebhookWorker.start();

      await deliveryHandler(mockDeliveryMessage);

      expect(webhookQueueSize.labels).toHaveBeenCalledWith('processing');
      expect(webhookQueueSize.labels).toHaveBeenCalledWith('pending');
      expect(webhookService.processDelivery).toHaveBeenCalledWith(
        mockDeliveryMessage.webhookId,
        mockDeliveryMessage.event,
        mockDeliveryMessage.payload,
        mockDeliveryMessage.deliveryId
      );
    });

    it('should handle delivery failure', async () => {
      const mockWebhookService = webhookService as jest.Mocked<typeof webhookService>;
      const error = new Error('Delivery failed');
      mockWebhookService.processDelivery.mockRejectedValue(error);

      await WebhookWorker.start();

      await expect(deliveryHandler(mockDeliveryMessage)).rejects.toThrow('Delivery failed');
    });
  });

  describe('processRetry', () => {
    it('should process webhook retry successfully', async () => {
      await WebhookWorker.start();

      await retryHandler(mockDeliveryMessage);

      expect(webhookQueueSize.labels).toHaveBeenCalledWith('processing');
      expect(webhookQueueSize.labels).toHaveBeenCalledWith('failed');
      expect(webhookService.processDelivery).toHaveBeenCalledWith(
        mockDeliveryMessage.webhookId,
        mockDeliveryMessage.event,
        mockDeliveryMessage.payload,
        mockDeliveryMessage.deliveryId,
        mockDeliveryMessage.retryCount
      );
    });

    it('should handle retry failure and requeue with incremented retry count', async () => {
      const mockWebhookService = webhookService as jest.Mocked<typeof webhookService>;
      const error = new Error('Retry failed');
      mockWebhookService.processDelivery.mockRejectedValue(error);

      await WebhookWorker.start();

      await retryHandler(mockDeliveryMessage);

      expect(queueService.publishToQueue).toHaveBeenCalledWith(
        QUEUES.WEBHOOK_RETRY,
        expect.objectContaining({
          ...mockDeliveryMessage,
          retryCount: mockDeliveryMessage.retryCount + 1,
          nextRetry: expect.any(Date)
        })
      );
    });

    it('should not requeue after max retries reached', async () => {
      const mockWebhookService = webhookService as jest.Mocked<typeof webhookService>;
      const error = new Error('Retry failed');
      mockWebhookService.processDelivery.mockRejectedValue(error);

      await WebhookWorker.start();

      const maxRetriesMessage: WebhookDeliveryMessage = {
        ...mockDeliveryMessage,
        retryCount: 3 // Max retries
      };

      await expect(retryHandler(maxRetriesMessage)).rejects.toThrow('Retry failed');
      expect(queueService.publishToQueue).not.toHaveBeenCalled();
    });
  });

  describe('metrics tracking', () => {
    it('should track queue size metrics for successful delivery', async () => {
      await WebhookWorker.start();

      await deliveryHandler(mockDeliveryMessage);

      expect(webhookQueueSize.labels('processing').inc).toHaveBeenCalled();
      expect(webhookQueueSize.labels('pending').dec).toHaveBeenCalled();
    });

    it('should track queue size metrics for failed delivery', async () => {
      const mockWebhookService = webhookService as jest.Mocked<typeof webhookService>;
      const error = new Error('Delivery failed');
      mockWebhookService.processDelivery.mockRejectedValue(error);

      await WebhookWorker.start();

      await expect(deliveryHandler(mockDeliveryMessage)).rejects.toThrow();

      expect(webhookQueueSize.labels('processing').inc).toHaveBeenCalled();
      expect(webhookQueueSize.labels('pending').dec).toHaveBeenCalled();
    });

    it('should track queue size metrics for retry attempt', async () => {
      await WebhookWorker.start();

      await retryHandler(mockDeliveryMessage);

      expect(webhookQueueSize.labels('processing').inc).toHaveBeenCalled();
      expect(webhookQueueSize.labels('failed').dec).toHaveBeenCalled();
    });
  });
});