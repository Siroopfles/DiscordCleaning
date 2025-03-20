"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const task_routes_1 = __importDefault(require("./routes/task.routes"));
const notification_routes_1 = __importDefault(require("./routes/notification.routes"));
const currency_routes_1 = __importDefault(require("./routes/currency.routes"));
const notification_service_1 = __importDefault(require("./services/notification.service"));
const ApiError_1 = require("./utils/ApiError");
// Load environment variables
dotenv_1.default.config();
// Connect to MongoDB
mongoose_1.default
    .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/household-tasks')
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Basic health check route
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Routes
app.use('/api/tasks', task_routes_1.default);
app.use('/api/notifications', notification_routes_1.default);
app.use('/api/currency', currency_routes_1.default);
// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err);
    if ('statusCode' in err && typeof err.statusCode === 'number') {
        return res.status(err.statusCode).json({
            error: err.message
        });
    }
    res.status(500).json({
        error: 'Internal Server Error'
    });
});
// Error handling middleware
app.use((err, _req, res, _next) => {
    console.error(err);
    if (err instanceof ApiError_1.ApiError) {
        return res.status(err.statusCode).json({
            error: {
                message: err.message,
                details: err.details
            }
        });
    }
    res.status(500).json({
        error: {
            message: 'Internal Server Error',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        }
    });
});
const PORT = process.env.PORT || 3000;
// Initialize notification service
notification_service_1.default
    .initialize()
    .then(() => console.log('Notification service initialized'))
    .catch((err) => console.error('Failed to initialize notification service:', err));
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
exports.default = app;
//# sourceMappingURL=server.js.map