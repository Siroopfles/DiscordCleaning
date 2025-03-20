"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = void 0;
const errors_1 = require("../utils/errors");
const validateRequest = (schema) => {
    return (req, res, next) => {
        try {
            if (schema.body) {
                validateFields(req.body, schema.body, 'body');
            }
            if (schema.query) {
                validateFields(req.query, schema.query, 'query');
            }
            if (schema.params) {
                validateFields(req.params, schema.params, 'params');
            }
            next();
        }
        catch (error) {
            if (error instanceof Error) {
                next(new errors_1.BadRequestError(error.message));
            }
            else {
                next(new errors_1.BadRequestError('Invalid request'));
            }
        }
    };
};
exports.validateRequest = validateRequest;
const validateFields = (data, schema, location) => {
    for (const [field, validation] of Object.entries(schema)) {
        const value = data[field];
        // Check required fields
        if (validation.required && (value === undefined || value === '')) {
            throw new Error(`${field} is required in ${location}`);
        }
        // Skip validation if field is not required and not present
        if (!validation.required && value === undefined) {
            continue;
        }
        // Type validation
        switch (validation.type) {
            case 'number':
                const num = Number(value);
                if (isNaN(num)) {
                    throw new Error(`${field} must be a number in ${location}`);
                }
                if (validation.min !== undefined && num < validation.min) {
                    throw new Error(`${field} must be at least ${validation.min} in ${location}`);
                }
                if (validation.max !== undefined && num > validation.max) {
                    throw new Error(`${field} must be at most ${validation.max} in ${location}`);
                }
                break;
            case 'string':
                if (typeof value !== 'string') {
                    throw new Error(`${field} must be a string in ${location}`);
                }
                if (validation.pattern && !validation.pattern.test(value)) {
                    throw new Error(`${field} has invalid format in ${location}`);
                }
                if (validation.enum && !validation.enum.includes(value)) {
                    throw new Error(`${field} must be one of [${validation.enum.join(', ')}] in ${location}`);
                }
                break;
            case 'boolean':
                if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
                    throw new Error(`${field} must be a boolean in ${location}`);
                }
                break;
            case 'array':
                if (!Array.isArray(value)) {
                    throw new Error(`${field} must be an array in ${location}`);
                }
                break;
            case 'object':
                if (typeof value !== 'object' || value === null || Array.isArray(value)) {
                    throw new Error(`${field} must be an object in ${location}`);
                }
                break;
        }
    }
};
//# sourceMappingURL=validateRequest.js.map