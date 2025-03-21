import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import request from 'supertest';
import nock from 'nock';
import { app } from '../../app';
import WebhookWorker from '../../workers/WebhookWorker';
import WebhookConfiguration, { IWebhookConfiguration } from '../../models/WebhookConfiguration';
import WebhookDelivery, { IWebhookDelivery } from '../../models/WebhookDelivery';
import queueService from '../../config/queue';

type WebhookDoc = mongoose.Document<unknown, {}, IWebhookConfiguration> & 
  Omit<IWebhookConfiguration & { _id: mongoose.Types.ObjectId }, never>;

describe('Webhook Integration Tests', () => {
  let mockWebhookUrl: string;
  
  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/test');
    await queueService.connect();
    await WebhookWorker.start();
  });

  afterAll(async () => {
    await WebhookWorker.stop();
    await queueService.close();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear collections
    await WebhookConfiguration.deleteMany({});
    await WebhookDelivery.deleteMany({});
    
    // Setup mock webhook endpoint
    mockWebhookUrl = 'https://webhook-test.example.com/hook';
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('Webhook Registration Flow', () => {
    it('should register a new webhook', async () => {
      const webhookData = {
        name: 'Test Webhook',
        url: mockWebhookUrl,
        events: ['task.completed'],
        secret: 'test-secret',
        enabled: true
      };

      const response = await request(app)
        .post('/api/webhooks')
        .send(webhookData)
        .expect(201);

      expect(response.body).toMatchObject({
        name: webhookData.name,
        url: webhookData.url,
        events: webhookData.events,
        enabled: webhookData.enabled
      });

      // Verify webhook was saved in database
      const savedWebhook = await WebhookConfiguration.findById(response.body._id);
      expect(savedWebhook).toBeTruthy();
      expect(savedWebhook?.url).toBe(webhookData.url);
    });

    it('should validate required fields', async () => {
      const invalidData = {
        name: 'Test Webhook',
        // Missing url and events
        secret: 'test-secret'
      };

      const response = await request(app)
        .post('/api/webhooks')
        .send(invalidData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });
  });

  describe('Webhook Delivery Flow', () => {
    let webhookId: string;

    beforeEach(async () => {
      // Create a test webhook
      const webhook = await WebhookConfiguration.create({
        name: 'Test Webhook',
        url: mockWebhookUrl,
        events: ['task.completed'],
        secret: 'test-secret',
        enabled: true,
        headers: {},
        retryCount: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      }) as WebhookDoc;
      
      webhookId = webhook._id.toString();
    });

    it('should deliver webhook event successfully', async () => {
      const payload = { taskId: '123', status: 'completed' };

      // Mock the webhook endpoint
      nock('https://webhook-test.example.com')
        .post('/hook')
        .reply(200, { received: true });

      const response = await request(app)
        .post(`/api/webhooks/${webhookId}/test`)
        .send(payload)
        .expect(202);

      // Wait for async delivery to complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verify delivery was recorded
      const delivery = await WebhookDelivery.findOne({ 
        webhookId: new mongoose.Types.ObjectId(webhookId)
      });
      expect(delivery).toBeTruthy();
      expect(delivery?.status).toBe('success');
      expect(delivery?.payload).toMatchObject(payload);
    });

    it('should handle delivery failures and retry', async () => {
      const payload = { taskId: '123', status: 'completed' };

      // Mock webhook endpoint to fail first, then succeed
      nock('https://webhook-test.example.com')
        .post('/hook')
        .reply(500, { error: 'Internal error' })
        .post('/hook')
        .reply(200, { received: true });

      await request(app)
        .post(`/api/webhooks/${webhookId}/test`)
        .send(payload)
        .expect(202);

      // Wait for retry
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Verify delivery was eventually successful
      const delivery = await WebhookDelivery.findOne({ 
        webhookId: new mongoose.Types.ObjectId(webhookId)
      });
      expect(delivery).toBeTruthy();
      expect(delivery?.status).toBe('success');
      expect(delivery?.retryCount).toBe(1);
    });
  });

  describe('Rate Limiting', () => {
    let webhookId: string;

    beforeEach(async () => {
      const webhook = await WebhookConfiguration.create({
        name: 'Test Webhook',
        url: mockWebhookUrl,
        events: ['task.completed'],
        secret: 'test-secret',
        enabled: true,
        headers: {},
        retryCount: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      }) as WebhookDoc;

      webhookId = webhook._id.toString();

      // Mock webhook endpoint
      nock('https://webhook-test.example.com')
        .persist()
        .post('/hook')
        .reply(200, { received: true });
    });

    it('should enforce rate limits', async () => {
      const payload = { taskId: '123', status: 'completed' };

      // Send multiple requests in quick succession
      const requests = Array(70).fill(null).map(() => 
        request(app)
          .post(`/api/webhooks/${webhookId}/test`)
          .send(payload)
      );

      const responses = await Promise.all(requests);

      // Some requests should be rate limited
      const rateLimited = responses.filter(r => r.status === 429);
      expect(rateLimited.length).toBeGreaterThan(0);

      // Wait for rate limit to reset
      await new Promise(resolve => setTimeout(resolve, 60000));
    });
  });

  describe('Error Handling', () => {
    let webhookId: string;

    beforeEach(async () => {
      const webhook = await WebhookConfiguration.create({
        name: 'Test Webhook',
        url: mockWebhookUrl,
        events: ['task.completed'],
        secret: 'test-secret',
        enabled: true,
        headers: {},
        retryCount: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      }) as WebhookDoc;

      webhookId = webhook._id.toString();
    });

    it('should handle network errors gracefully', async () => {
      const payload = { taskId: '123', status: 'completed' };

      // Mock network error
      nock('https://webhook-test.example.com')
        .post('/hook')
        .replyWithError('Network error');

      await request(app)
        .post(`/api/webhooks/${webhookId}/test`)
        .send(payload)
        .expect(202);

      // Wait for delivery attempt
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verify error was recorded
      const delivery = await WebhookDelivery.findOne({ 
        webhookId: new mongoose.Types.ObjectId(webhookId)
      });
      expect(delivery).toBeTruthy();
      expect(delivery?.status).toBe('failed');
      expect(delivery?.error).toContain('Network error');
    });

    it('should handle invalid webhook URLs', async () => {
      const invalidWebhook = await WebhookConfiguration.create({
        name: 'Invalid Webhook',
        url: 'not-a-url',
        events: ['task.completed'],
        secret: 'test-secret',
        enabled: true,
        headers: {},
        retryCount: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      }) as WebhookDoc;

      const payload = { taskId: '123', status: 'completed' };

      await request(app)
        .post(`/api/webhooks/${invalidWebhook._id}/test`)
        .send(payload)
        .expect(202);

      // Wait for delivery attempt
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verify error was recorded
      const delivery = await WebhookDelivery.findOne({ 
        webhookId: invalidWebhook._id 
      });
      expect(delivery).toBeTruthy();
      expect(delivery?.status).toBe('failed');
      expect(delivery?.error).toBeTruthy();
    });
  });
});