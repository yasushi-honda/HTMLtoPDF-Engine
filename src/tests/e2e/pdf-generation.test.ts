import request from 'supertest';
import { app } from '../../app';
import { GeneratePDFRequest } from '../../types/api';

describe('PDF Generation API', () => {
  describe('POST /api/pdf/generate', () => {
    it('PDFを生成してGoogle Driveにアップロードできること', async () => {
      const req: GeneratePDFRequest = {
        template: 'calendar',
        data: {
          title: 'E2Eテストカレンダー'
        },
        year: 2025,
        month: 2,
        overlay: [{
          type: 'circle',
          days: [1, 15]
        }]
      };

      const res = await request(app)
        .post('/api/pdf/generate')
        .send(req)
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(res.body).toHaveProperty('fileId');
      expect(res.body).toHaveProperty('webViewLink');
      expect(res.body).toHaveProperty('filename');
      expect(res.body.filename).toMatch(/calendar-2025-2\.pdf$/);
    });

    it('エラー時に適切なエラーレスポンスを返すこと', async () => {
      const req: GeneratePDFRequest = {
        template: 'calendar',
        data: {
          title: 'エラーテスト'
        },
        year: 2025,
        month: 2,
        overlay: []
      };

      await request(app)
        .post('/api/pdf/generate')
        .send(req)
        .set('Authorization', 'Bearer test-token')
        .expect(400);
    });

    it('should return 401 without auth token', async () => {
      const req: GeneratePDFRequest = {
        template: 'calendar',
        data: {
          title: 'E2Eテストカレンダー'
        },
        year: 2025,
        month: 2,
        overlay: []
      };

      await request(app)
        .post('/api/pdf/generate')
        .send(req)
        .expect(401);
    });
  });

  describe('POST /api/pdf/preview', () => {
    it('should generate preview HTML', async () => {
      const req: GeneratePDFRequest = {
        template: 'calendar',
        data: {
          title: 'E2Eテストカレンダー'
        },
        year: 2025,
        month: 2,
        overlay: [{
          type: 'circle',
          days: [1, 15]
        }]
      };

      const res = await request(app)
        .post('/api/pdf/preview')
        .send(req)
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(res.text).toContain('<!DOCTYPE html>');
      expect(res.text).toContain('2025年2月');
    });

    it('should return 400 for invalid request', async () => {
      const req = {
        template: 'calendar',
        data: {
          title: 'エラーテスト'
        },
        year: -1,
        month: 13,
        overlay: []
      };

      await request(app)
        .post('/api/pdf/preview')
        .send(req)
        .set('Authorization', 'Bearer test-token')
        .expect(400);
    });
  });
});
