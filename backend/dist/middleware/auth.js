"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.requireAuth = void 0;
const errors_1 = require("../utils/errors");
const requireAuth = (req, res, next) => {
    if (!req.user) {
        throw new errors_1.UnauthorizedError('Authentication required');
    }
    next();
};
exports.requireAuth = requireAuth;
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            throw new errors_1.UnauthorizedError('Authentication required');
        }
        const hasRequiredRole = req.user.roles.some(role => roles.includes(role));
        if (!hasRequiredRole) {
            throw new errors_1.ForbiddenError('Insufficient permissions');
        }
        next();
    };
};
exports.requireRole = requireRole;
//# sourceMappingURL=auth.js.map