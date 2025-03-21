import { jest } from '@jest/globals';
import axios from 'axios';
import { Types, Document } from 'mongoose';
import { WebhookService } from '../../services/WebhookService';
import { webhookRateLimiter } from '../../middleware/rateLimiter';
import { WebhookError, WebhookErrorTypes } from '../../middleware/errorHandler';
import queueService from '../../config/queue';
import { IWebhookConfiguration, WebhookConfiguration } from '../../models/WebhookConfiguration';
import { IWebhookDelivery, WebhookDelivery } from '../../models/WebhookDelivery';

// Mock dependencies
jest.mock('axios');
jest.mock('../../middleware/rateLimiter');
jest.mock('../../config/queue');
jest.mock('../../config/webhookMetrics', () => ({
  webhookDeliveryCounter: { labels: () => ({ inc: jest.fn() }) },
  webhookDeliveryDuration: { labels: () => ({ observe: jest.fn() }) },
  webhookErrorCounter: { labels: () => ({ inc: jest.fn() }) },
  webhookRetryCounter: { labels: () => ({ inc: jest.fn() }) },
  webhookQueueSize: { labels: () => ({ inc: jest.fn(), dec: jest.fn() }) },
}));

describe('WebhookService', () => {
  let webhookService: WebhookService;
  let mockWebhookConfigRepo: any;
  let mockWebhookDeliveryRepo: any;

  const mockDate = new Date('2025-03-21T12:00:00Z');
  const mockId = new Types.ObjectId();

  // Create mock document methods
  const mockDocumentMethods = {
    $assertPopulated: jest.fn(),
    $clearModifiedPaths: jest.fn(),
    $clone: jest.fn(),
    $createModifiedPathsSnapshot: jest.fn(),
    $getAllSubdocs: jest.fn(),
    $ignore: jest.fn(),
    $inc: jest.fn(),
    $isDefaultedModifiedSubpaths: jest.fn(),
    $isDeleted: jest.fn(),
    $isEmpty: jest.fn(),
    $isModifiedSubpaths: jest.fn(),
    $isValid: jest.fn(),
    $locals: {},
    $markValid: jest.fn(),
    $model: jest.fn(),
    $op: null,
    $parent: jest.fn(),
    $session: jest.fn(),
    $set: jest.fn(),
    $toObject: jest.fn(),
    $toString: jest.fn(),
    collection: {},
    db: {},
    delete: jest.fn(),
    deleteOne: jest.fn(),
    depopulate: jest.fn(),
    directModifiedPaths: jest.fn(),
    equals: jest.fn(),
    errors: {},
    get: jest.fn(),
    getChanges: jest.fn(),
    increment: jest.fn(),
    init: jest.fn(),
    invalidate: jest.fn(),
    isDirectModified: jest.fn(),
    isDirectSelected: jest.fn(),
    isInit: jest.fn(),
    isModified: jest.fn(),
    isNew: false,
    isSelected: jest.fn(),
    markModified: jest.fn(),
    modifiedPaths: jest.fn(),
    overwrite: jest.fn(),
    populate: jest.fn(),
    populated: jest.fn(),
    remove: jest.fn(),
    replaceOne: jest.fn(),
    save: jest.fn(),
    schema: {},
    set: jest.fn(),
    toJSON: jest.fn(),
    toObject: jest.fn(),
    unmarkModified: jest.fn(),
    update: jest.fn(),
    updateOne: jest.fn(),
    validate: jest.fn(),
    validateSync: jest.fn()
  };

  const mockWebhook = {
    _id: mockId,
    id: mockId.toString(),
    name: 'Test Webhook',
    url: 'https://example.com/webhook',
    secret: 'test-secret',
    description: 'Test webhook for unit tests',
    enabled: true,
    events: ['task.completed'],
    headers: { 'Custom-Header': 'value' },
    retryCount: 3,
    createdAt: mockDate,
    updatedAt: mockDate,
    ...mockDocumentMethods
  } as unknown as WebhookConfiguration;

  const mockDelivery = {
    _id: new Types.ObjectId(),
    id: mockId.toString(),
    webhookId: mockId,
    event: 'task.completed',
    payload: { taskId: '123' },
    status: 'pending' as const,
    retryCount: 0,
    duration: 0,
    createdAt: mockDate,
    updatedAt: mockDate,
    ...mockDocumentMethods
  } as unknown as WebhookDelivery;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(mockDate);

    // Setup repository mocks
    mockWebhookConfigRepo = {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findById: jest.fn(),
      findByEvent: jest.fn()
    };

    mockWebhookDeliveryRepo = {
      create: jest.fn(),
      updateDeliveryStatus: jest.fn(),
      findByWebhookId: jest.fn()
    };

    // Initialize service with mocks
    webhookService = new WebhookService(
      mockWebhookConfigRepo,
      mockWebhookDeliveryRepo
    );

    // Setup default mock implementations
    (webhookRateLimiter.isRateLimited as jest.Mock).mockResolvedValue(false as never);
    (queueService.publishToQueue as jest.Mock).mockResolvedValue(true as never);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('registerWebhook', () => {
    it('should create a new webhook configuration', async () => {
      const webhookData: Partial<IWebhookConfiguration> = {
        name: 'Test Webhook',
        url: 'https://example.com/webhook',
        events: ['task.completed'],
        secret: 'test-secret',
        enabled: true,
        headers: {}
      };
      mockWebhookConfigRepo.create.mockResolvedValue(mockWebhook);

      const result = await webhookService.registerWebhook(webhookData);

      expect(mockWebhookConfigRepo.create).toHaveBeenCalledWith(webhookData);
      expect(result).toEqual(mockWebhook);
    });
  });

  describe('updateWebhook', () => {
    it('should update an existing webhook configuration', async () => {
      const webhookId = mockWebhook.id;
      const updateData = { url: 'https://new-url.com/webhook' };
      mockWebhookConfigRepo.update.mockResolvedValue({ ...mockWebhook, ...updateData });

      const result = await webhookService.updateWebhook(webhookId, updateData);

      expect(mockWebhookConfigRepo.update).toHaveBeenCalledWith(webhookId, updateData);
      expect(result?.url).toBe(updateData.url);
    });
  });

  describe('deleteWebhook', () => {
    it('should delete a webhook configuration', async () => {
      const webhookId = mockWebhook.id;
      mockWebhookConfigRepo.delete.mockResolvedValue(true);

      const result = await webhookService.deleteWebhook(webhookId);

      expect(mockWebhookConfigRepo.delete).toHaveBeenCalledWith(webhookId);
      expect(result).toBe(true);
    });
  });

  describe('getWebhooksByEvent', () => {
    it('should return webhooks for a specific event', async () => {
      const event = 'task.completed';
      mockWebhookConfigRepo.findByEvent.mockResolvedValue([mockWebhook]);

      const result = await webhookService.getWebhooksByEvent(event);

      expect(mockWebhookConfigRepo.findByEvent).toHaveBeenCalledWith(event);
      expect(result).toEqual([mockWebhook]);
    });
  });

  describe('deliverWebhook', () => {
    it('should queue a webhook delivery', async () => {
      const webhookId = mockWebhook.id;
      const event = 'task.completed';
      const payload = { taskId: '123' };

      mockWebhookConfigRepo.findById.mockResolvedValue(mockWebhook);
      mockWebhookDeliveryRepo.create.mockResolvedValue(mockDelivery);

      const result = await webhookService.deliverWebhook(webhookId, event, payload);

      expect(mockWebhookDeliveryRepo.create).toHaveBeenCalled();
      expect(queueService.publishToQueue).toHaveBeenCalledWith(
        'webhook_delivery',
        expect.objectContaining({
          webhookId,
          event,
          payload
        })
      );
      expect(result).toEqual(mockDelivery);
    });

    it('should throw error if webhook configuration not found', async () => {
      mockWebhookConfigRepo.findById.mockResolvedValue(null);

      await expect(
        webhookService.deliverWebhook('invalid-id', 'test-event', {})
      ).rejects.toThrow('Webhook configuration not found');
    });
  });

  describe('processDelivery', () => {
    const mockAxiosResponse = {
      status: 200,
      data: { success: true },
      headers: {},
      config: {},
      statusText: 'OK'
    };

    beforeEach(() => {
      (axios.post as jest.Mock).mockResolvedValue(mockAxiosResponse as never);
    });

    it('should successfully process a webhook delivery', async () => {
      mockWebhookConfigRepo.findById.mockResolvedValue(mockWebhook);

      await webhookService.processDelivery(
        mockWebhook.id,
        'task.completed',
        { taskId: '123' },
        'test-delivery-id'
      );

      expect(axios.post).toHaveBeenCalled();
      expect(mockWebhookDeliveryRepo.updateDeliveryStatus).toHaveBeenCalledWith(
        'test-delivery-id',
        'success',
        expect.any(Object)
      );
    });

    it('should handle rate limiting', async () => {
      mockWebhookConfigRepo.findById.mockResolvedValue(mockWebhook);
      (webhookRateLimiter.isRateLimited as jest.Mock).mockResolvedValue(true as never);

      await expect(
        webhookService.processDelivery(
          mockWebhook.id,
          'task.completed',
          { taskId: '123' },
          'test-delivery-id'
        )
      ).rejects.toThrow(expect.any(WebhookError));
    });

    it('should handle retryable errors', async () => {
      mockWebhookConfigRepo.findById.mockResolvedValue(mockWebhook);
      const error = new Error('Network error');
      (axios.post as jest.Mock).mockRejectedValue(error as never);

      await expect(
        webhookService.processDelivery(
          mockWebhook.id,
          'task.completed',
          { taskId: '123' },
          'test-delivery-id'
        )
      ).rejects.toThrow();

      expect(mockWebhookDeliveryRepo.updateDeliveryStatus).toHaveBeenCalledWith(
        'test-delivery-id',
        'failed',
        expect.objectContaining({
          error: 'Network error',
          nextRetry: expect.any(Date)
        })
      );
    });
  });

  describe('getDeliveries', () => {
    it('should return webhook deliveries for a specific webhook', async () => {
      const webhookId = mockWebhook.id;
      mockWebhookDeliveryRepo.findByWebhookId.mockResolvedValue([mockDelivery]);

      const result = await webhookService.getDeliveries(webhookId);

      expect(mockWebhookDeliveryRepo.findByWebhookId).toHaveBeenCalledWith(webhookId);
      expect(result).toEqual([mockDelivery]);
    });
  });
});