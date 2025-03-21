"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const server_1 = __importDefault(require("../server"));
describe('Server', () => {
    describe('GET /health', () => {
        it('should return 200 OK with status information', async () => {
            const response = await (0, supertest_1.default)(server_1.default).get('/health');
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('status', 'ok');
            expect(response.body).toHaveProperty('timestamp');
            expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
        });
    });
});
//# sourceMappingURL=server.test.js.map