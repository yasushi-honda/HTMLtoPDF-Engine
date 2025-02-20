import request from 'supertest';
import { app } from '../../app';
import { GeneratePDFRequest } from '../../types/api';

describe('Security Testing', () => {
  describe('Authentication', () => {
    it('should reject requests without auth token', async () => {
      const req: GeneratePDFRequest = {
        year: 2025,
        month: 2,
        overlay: []
      };

      await request(app)
        .post('/api/pdf/generate')
        .send(req)
        .expect(401);
    });

    it('should reject requests with invalid auth token', async () => {
      const req: GeneratePDFRequest = {
        year: 2025,
        month: 2,
        overlay: []
      };

      await request(app)
        .post('/api/pdf/generate')
        .send(req)
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should reject requests with non-AppSheet domain', async () => {
      const req: GeneratePDFRequest = {
        year: 2025,
        month: 2,
        overlay: []
      };

      await request(app)
        .post('/api/pdf/generate')
        .send(req)
        .set('Authorization', 'Bearer non-appsheet-token')
        .expect(403);
    });
  });

  describe('Input Validation', () => {
    it('should reject invalid year values', async () => {
      const req = {
        year: -1,
        month: 2,
        overlay: []
      };

      await request(app)
        .post('/api/pdf/generate')
        .send(req)
        .set('Authorization', 'Bearer test-token')
        .expect(400);
    });

    it('should reject invalid month values', async () => {
      const req = {
        year: 2025,
        month: 13,
        overlay: []
      };

      await request(app)
        .post('/api/pdf/generate')
        .send(req)
        .set('Authorization', 'Bearer test-token')
        .expect(400);
    });

    it('should reject invalid overlay types', async () => {
      const req = {
        year: 2025,
        month: 2,
        overlay: [
          {
            days: [1],
            type: 'invalid-type'
          }
        ]
      };

      await request(app)
        .post('/api/pdf/generate')
        .send(req)
        .set('Authorization', 'Bearer test-token')
        .expect(400);
    });

    it('should reject invalid day values', async () => {
      const req = {
        year: 2025,
        month: 2,
        overlay: [
          {
            days: [0, 29], // 2025年2月は28日まで
            type: 'circle'
          }
        ]
      };

      await request(app)
        .post('/api/pdf/generate')
        .send(req)
        .set('Authorization', 'Bearer test-token')
        .expect(400);
    });
  });
});
