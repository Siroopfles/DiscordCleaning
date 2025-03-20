import { Router } from 'express';
import notificationService from '../services/notification.service';
import { ApiError } from '../utils/ApiError';

const router = Router();

// Ophalen van notificaties voor een gebruiker
router.get('/user/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { status, limit } = req.query;

    const notifications = await notificationService.getUserNotifications(
      userId,
      status as string,
      limit ? parseInt(limit as string) : undefined
    );

    res.json(notifications);
  } catch (error) {
    next(error);
  }
});

// Aanmaken van een nieuwe notificatie
router.post('/', async (req, res, next) => {
  try {
    const notificationData = req.body;

    if (!notificationData.userId || !notificationData.type || !notificationData.message) {
      throw new ApiError(400, 'Ontbrekende verplichte velden');
    }

    const notification = await notificationService.createNotification(notificationData);
    res.status(201).json(notification);
  } catch (error) {
    next(error);
  }
});

// Markeer notificatie als gezien
router.patch('/:notificationId/seen', async (req, res, next) => {
  try {
    const { notificationId } = req.params;
    const notification = await notificationService.markNotificationAsSeen(notificationId);

    if (!notification) {
      throw new ApiError(404, 'Notificatie niet gevonden');
    }

    res.json(notification);
  } catch (error) {
    next(error);
  }
});

export default router;