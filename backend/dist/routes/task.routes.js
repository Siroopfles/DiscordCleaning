"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const task_service_1 = require("../services/task.service");
const ApiError_1 = require("../utils/ApiError");
const router = express_1.default.Router();
// Error handling middleware
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
// GET /tasks
router.get('/', asyncHandler(async (req, res) => {
    const { category, priority, status, assigned_to } = req.query;
    const filter = {};
    if (category)
        filter.category = category;
    if (priority)
        filter.priority = priority;
    if (status)
        filter.status = status;
    if (assigned_to)
        filter.assigned_to = assigned_to;
    const tasks = await task_service_1.taskService.getTasks(filter);
    res.json(tasks);
}));
// GET /tasks/:id
router.get('/:id', asyncHandler(async (req, res) => {
    const task = await task_service_1.taskService.getTaskById(req.params.id);
    res.json(task);
}));
// POST /tasks
router.post('/', asyncHandler(async (req, res) => {
    const task = await task_service_1.taskService.createTask(req.body);
    res.status(201).json(task);
}));
// PUT /tasks/:id
router.put('/:id', asyncHandler(async (req, res) => {
    const task = await task_service_1.taskService.updateTask(req.params.id, req.body);
    res.json(task);
}));
// DELETE /tasks/:id
router.delete('/:id', asyncHandler(async (req, res) => {
    const task = await task_service_1.taskService.deleteTask(req.params.id);
    res.status(204).send();
}));
// GET /tasks/user/:userId
router.get('/user/:userId', asyncHandler(async (req, res) => {
    const tasks = await task_service_1.taskService.getUserTasks(req.params.userId);
    res.json(tasks);
}));
// Error handling middleware
router.use((err, req, res, next) => {
    if (err instanceof ApiError_1.ApiError) {
        res.status(err.statusCode).json({
            error: {
                message: err.message,
                details: err.details
            }
        });
    }
    else {
        res.status(500).json({
            error: {
                message: 'Internal Server Error',
                details: process.env.NODE_ENV === 'development' ? err.message : undefined
            }
        });
    }
});
exports.default = router;
//# sourceMappingURL=task.routes.js.map