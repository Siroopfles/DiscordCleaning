import express, { Request, Response } from 'express';
import { body, param, ValidationChain } from 'express-validator';
import { validateRequest } from '../middleware/validation';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware';
import webhookService from '../services/WebhookService';
import logger from '../utils/logger';

const router = express.Router();

/**
 * @swagger
 * /api/webhooks:
 *   post:
 *     summary: Register a new webhook
 *     tags: [Webhooks]
 *     security:
 *       - discordAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - url
 *               - events
 *             properties:
 *               name:
 *                 type: string
 *               url:
 *                 type: string
 *                 format: uri
 *               secret:
 *                 type: string
 *               events:
 *                 type: array
 *                 items:
 *                   type: string
 *               description:
 *                 type: string
 *               headers:
 *                 type: object
 *               retryCount:
 *                 type: number
 */
router.post('/',
  authenticate,
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('url').trim().isURL().withMessage('Valid URL is required'),
    body('secret').trim().notEmpty().withMessage('Secret is required'),
    body('events').isArray({ min: 1 }).withMessage('At least one event is required'),
    body('events.*').trim().notEmpty().withMessage('Event names cannot be empty'),
    body('retryCount').optional().isInt({ min: 0, max: 10 }).withMessage('Retry count must be between 0 and 10'),
    validateRequest
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const webhook = await webhookService.registerWebhook(req.body);
      res.status(201).json(webhook);
    } catch (error) {
      logger.error('Error registering webhook:', error);
      res.status(500).json({ error: 'Failed to register webhook' });
    }
  }
);

/**
 * @swagger
 * /api/webhooks/{id}:
 *   put:
 *     summary: Update an existing webhook
 *     tags: [Webhooks]
 *     security:
 *       - discordAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.put('/:id',
  authenticate,
  [
    param('id').isMongoId().withMessage('Invalid webhook ID'),
    body('url').optional().trim().isURL().withMessage('Valid URL is required'),
    body('events').optional().isArray({ min: 1 }).withMessage('At least one event is required'),
    body('events.*').optional().trim().notEmpty().withMessage('Event names cannot be empty'),
    body('retryCount').optional().isInt({ min: 0, max: 10 }).withMessage('Retry count must be between 0 and 10'),
    validateRequest
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const webhook = await webhookService.updateWebhook(req.params.id, req.body);
      if (!webhook) {
        return res.status(404).json({ error: 'Webhook not found' });
      }
      res.json(webhook);
    } catch (error) {
      logger.error('Error updating webhook:', error);
      res.status(500).json({ error: 'Failed to update webhook' });
    }
  }
);

/**
 * @swagger
 * /api/webhooks/{id}:
 *   delete:
 *     summary: Delete a webhook
 *     tags: [Webhooks]
 *     security:
 *       - discordAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.delete('/:id',
  authenticate,
  [
    param('id').isMongoId().withMessage('Invalid webhook ID'),
    validateRequest
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const deleted = await webhookService.deleteWebhook(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: 'Webhook not found' });
      }
      res.status(204).send();
    } catch (error) {
      logger.error('Error deleting webhook:', error);
      res.status(500).json({ error: 'Failed to delete webhook' });
    }
  }
);

/**
 * @swagger
 * /api/webhooks/{id}/deliveries:
 *   get:
 *     summary: Get webhook delivery history
 *     tags: [Webhooks]
 *     security:
 *       - discordAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/:id/deliveries',
  authenticate,
  [
    param('id').isMongoId().withMessage('Invalid webhook ID'),
    validateRequest
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const deliveries = await webhookService.getDeliveries(req.params.id);
      res.json(deliveries);
    } catch (error) {
      logger.error('Error fetching webhook deliveries:', error);
      res.status(500).json({ error: 'Failed to fetch webhook deliveries' });
    }
  }
);

export default router;