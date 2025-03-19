import express, { Request, Response, NextFunction } from 'express';
import { taskService } from '../services/task.service';
import { ApiError } from '../utils/ApiError';

const router = express.Router();

// Error handling middleware
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// GET /tasks
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { category, priority, status, assigned_to } = req.query;
  const filter: any = {};

  if (category) filter.category = category;
  if (priority) filter.priority = priority;
  if (status) filter.status = status;
  if (assigned_to) filter.assigned_to = assigned_to;

  const tasks = await taskService.getTasks(filter);
  res.json(tasks);
}));

// GET /tasks/:id
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const task = await taskService.getTaskById(req.params.id);
  res.json(task);
}));

// POST /tasks
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const task = await taskService.createTask(req.body);
  res.status(201).json(task);
}));

// PUT /tasks/:id
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const task = await taskService.updateTask(req.params.id, req.body);
  res.json(task);
}));

// DELETE /tasks/:id
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const task = await taskService.deleteTask(req.params.id);
  res.status(204).send();
}));

// GET /tasks/user/:userId
router.get('/user/:userId', asyncHandler(async (req: Request, res: Response) => {
  const tasks = await taskService.getUserTasks(req.params.userId);
  res.json(tasks);
}));

// Error handling middleware
router.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      error: {
        message: err.message,
        details: err.details
      }
    });
  } else {
    res.status(500).json({
      error: {
        message: 'Internal Server Error',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      }
    });
  }
});

export default router;