"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiClient = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../utils/logger");
// We gebruiken CategoryInfo van models.ts die extends van ICategory
class ApiClient {
    constructor() {
        this.client = axios_1.default.create({
            baseURL: process.env.API_BASE_URL || 'http://localhost:3000/api',
            timeout: 5000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        // Response interceptor voor error handling
        this.client.interceptors.response.use((response) => response, (error) => {
            var _a, _b;
            logger_1.logger.error('API Error:', {
                status: (_a = error.response) === null || _a === void 0 ? void 0 : _a.status,
                message: error.message,
                path: (_b = error.config) === null || _b === void 0 ? void 0 : _b.url
            });
            return Promise.reject(error);
        });
    }
    static getInstance() {
        if (!ApiClient.instance) {
            ApiClient.instance = new ApiClient();
        }
        return ApiClient.instance;
    }
    // Task endpoints
    async createTask(data) {
        try {
            const response = await this.client.post('/tasks', data);
            return response.data;
        }
        catch (error) {
            throw this.handleError(error);
        }
    }
    async getTasks() {
        try {
            const response = await this.client.get('/tasks');
            return response.data;
        }
        catch (error) {
            throw this.handleError(error);
        }
    }
    async updateTask(taskId, data) {
        try {
            const response = await this.client.patch(`/tasks/${taskId}`, data);
            return response.data;
        }
        catch (error) {
            throw this.handleError(error);
        }
    }
    async deleteTask(taskId) {
        try {
            const response = await this.client.delete(`/tasks/${taskId}`);
            return response.data;
        }
        catch (error) {
            throw this.handleError(error);
        }
    }
    // Category endpoints
    async getCategories() {
        try {
            const response = await this.client.get('/categories');
            return response.data;
        }
        catch (error) {
            throw this.handleError(error);
        }
    }
    async getCategory(categoryId) {
        try {
            const response = await this.client.get(`/categories/${categoryId}`);
            return response.data;
        }
        catch (error) {
            throw this.handleError(error);
        }
    }
    async createCategory(data) {
        try {
            const response = await this.client.post('/categories', data);
            return response.data;
        }
        catch (error) {
            throw this.handleError(error);
        }
    }
    async updateCategory(categoryId, data) {
        try {
            const response = await this.client.patch(`/categories/${categoryId}`, data);
            return response.data;
        }
        catch (error) {
            throw this.handleError(error);
        }
    }
    async deleteCategory(categoryId) {
        try {
            const response = await this.client.delete(`/categories/${categoryId}`);
            return response.data;
        }
        catch (error) {
            throw this.handleError(error);
        }
    }
    handleError(error) {
        var _a, _b, _c;
        if (axios_1.default.isAxiosError(error)) {
            const status = (_a = error.response) === null || _a === void 0 ? void 0 : _a.status;
            const message = ((_c = (_b = error.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.error) || error.message;
            switch (status) {
                case 404:
                    return new Error('Resource niet gevonden');
                case 400:
                    return new Error(`Ongeldige aanvraag: ${message}`);
                case 429:
                    return new Error('Te veel verzoeken. Probeer het later opnieuw');
                case 500:
                    return new Error('Interne serverfout');
                default:
                    return new Error(`API fout: ${message}`);
            }
        }
        return new Error('Er is een onverwachte fout opgetreden');
    }
}
exports.ApiClient = ApiClient;
//# sourceMappingURL=apiClient.js.map