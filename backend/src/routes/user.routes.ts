import { Router } from 'express';
import { userService } from '../services/user.service';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware';
import { 
  UpdateSettingsDto, 
  UpdateNotificationSettingsDto,
  UpdateTaskManagementSettingsDto,
  UpdateGamificationSettingsDto 
} from '../types/validation';

const router = Router();

// Get user settings
router.get('/settings', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user;
    res.json({ settings: user.settings });
  } catch (error) {
    console.error('Error getting user settings:', error);
    res.status(500).json({ 
      error: 'Failed to get user settings',
      message: 'Internal server error'
    });
  }
});

// Update all settings
router.patch('/settings', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const settings: UpdateSettingsDto = req.body;
    const discordId = req.discordId!;

    const updatedUser = await userService.updateSettings(discordId, settings);
    res.json({ settings: updatedUser.settings });
  } catch (error) {
    console.error('Error updating user settings:', error);
    if (error instanceof Error) {
      res.status(400).json({ 
        error: 'Failed to update settings',
        message: error.message 
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to update settings',
        message: 'Internal server error'
      });
    }
  }
});

// Update notification settings
router.patch('/settings/notifications', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const settings: UpdateNotificationSettingsDto = req.body;
    const discordId = req.discordId!;

    const updatedUser = await userService.updateNotificationSettings(discordId, settings);
    res.json({ settings: updatedUser.settings.notifications });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    if (error instanceof Error) {
      res.status(400).json({ 
        error: 'Failed to update notification settings',
        message: error.message 
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to update notification settings',
        message: 'Internal server error'
      });
    }
  }
});

// Update task management settings
router.patch('/settings/task-management', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const settings: UpdateTaskManagementSettingsDto = req.body;
    const discordId = req.discordId!;

    const updatedUser = await userService.updateTaskManagementSettings(discordId, settings);
    res.json({ settings: updatedUser.settings.taskManagement });
  } catch (error) {
    console.error('Error updating task management settings:', error);
    if (error instanceof Error) {
      res.status(400).json({ 
        error: 'Failed to update task management settings',
        message: error.message 
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to update task management settings',
        message: 'Internal server error'
      });
    }
  }
});

// Update gamification settings
router.patch('/settings/gamification', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const settings: UpdateGamificationSettingsDto = req.body;
    const discordId = req.discordId!;

    const updatedUser = await userService.updateGamificationSettings(discordId, settings);
    res.json({ settings: updatedUser.settings.gamification });
  } catch (error) {
    console.error('Error updating gamification settings:', error);
    if (error instanceof Error) {
      res.status(400).json({ 
        error: 'Failed to update gamification settings',
        message: error.message 
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to update gamification settings',
        message: 'Internal server error'
      });
    }
  }
});

export default router;