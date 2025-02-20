import request from 'supertest';
import { app } from '../../app';
import { GeneratePDFRequest } from '../../types/api';

describe('Load Testing', () => {
  it('should handle multiple concurrent PDF generation requests', async () => {
    const requests: Promise<void>[] = [];
    const concurrentRequests = 5;

    for (let i = 0; i < concurrentRequests; i++) {
      const req: GeneratePDFRequest = {
        year: 2025,
        month: 2,
        overlay: [
          {
            days: [1, 15],
            type: 'circle'
          }
        ]
      };

      const promise = request(app)
        .post('/api/pdf/generate')
        .send(req)
        .set('Authorization', 'Bearer test-token')
        .expect(200)
        .then(res => {
          expect(res.body).toHaveProperty('fileId');
          expect(res.body).toHaveProperty('webViewLink');
          expect(res.body).toHaveProperty('filename');
        });

      requests.push(promise);
    }

    await Promise.all(requests);
  }, 60000); // タイムアウトを60秒に延長

  it('should handle multiple concurrent preview requests', async () => {
    const requests: Promise<void>[] = [];
    const concurrentRequests = 10;

    for (let i = 0; i < concurrentRequests; i++) {
      const req: GeneratePDFRequest = {
        year: 2025,
        month: 2,
        overlay: [
          {
            days: [1, 15],
            type: 'circle'
          }
        ]
      };

      const promise = request(app)
        .post('/api/pdf/preview')
        .send(req)
        .set('Authorization', 'Bearer test-token')
        .expect(200)
        .then(res => {
          expect(res.text).toContain('<!DOCTYPE html>');
          expect(res.text).toContain('2025年2月');
        });

      requests.push(promise);
    }

    await Promise.all(requests);
  }, 30000); // タイムアウトを30秒に延長
});
