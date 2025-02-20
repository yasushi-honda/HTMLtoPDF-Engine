import request from 'supertest';
import { app } from '../app';

describe('アプリケーションのテスト', () => {
  describe('PDFエンドポイント', () => {
    it('認証なしでアクセスすると401エラーを返す', async () => {
      const response = await request(app)
        .post('/api/pdf/preview')
        .send({
          year: 2024,
          month: 2
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('code', 'MISSING_AUTH_HEADER');
    });
  });
});
