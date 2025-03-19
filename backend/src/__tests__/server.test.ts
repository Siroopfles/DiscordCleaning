import request from 'supertest';
import app from '../server';

describe('Server', () => {
  describe('GET /health', () => {
    it('should return 200 OK with status information', async () => {
      const response = await request(app).get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
    });
  });
});