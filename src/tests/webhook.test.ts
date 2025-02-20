import request from 'supertest';
import express from 'express';
import webhookRouter from '../routes/webhook';
import { PDFService } from '../services/pdf';
import { DriveService } from '../services/drive';

// モック
jest.mock('../services/pdf');
jest.mock('../services/drive');
jest.mock('../middleware/auth', () => ({
  validateAppSheetRequest: (req: any, res: any, next: any) => next(),
  sanitizeInput: (req: any, res: any, next: any) => next()
}));

describe('Webhook Routes', () => {
  let app: express.Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/webhook', webhookRouter);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /webhook/appsheet', () => {
    it('PDFを生成してアップロード', async () => {
      const mockPdf = Buffer.from('test pdf');
      const mockUploadResult = {
        fileId: 'test-file-id',
        webViewLink: 'https://drive.google.com/test',
        filename: 'test.pdf'
      };

      (PDFService.prototype.generatePDF as jest.Mock).mockResolvedValue(mockPdf);
      (DriveService.prototype.uploadFile as jest.Mock).mockResolvedValue(mockUploadResult);

      const response = await request(app)
        .post('/webhook/appsheet')
        .send({
          action: 'generate_pdf',
          templateId: 'report',
          data: {
            title: 'テストレポート',
            date: '2025-02-20'
          },
          filename: 'test.pdf'
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: mockUploadResult
      });
    });

    it('プレビューHTMLを生成', async () => {
      const mockHtml = '<html>test</html>';
      (PDFService.prototype.generatePreviewHtml as jest.Mock).mockResolvedValue(mockHtml);

      const response = await request(app)
        .post('/webhook/appsheet')
        .send({
          action: 'preview',
          templateId: 'report',
          data: {
            title: 'テストレポート',
            date: '2025-02-20'
          }
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: {
          html: mockHtml
        }
      });
    });

    it('テンプレート一覧を取得', async () => {
      const mockTemplates = [
        {
          id: 'report',
          name: 'レポート',
          description: 'テスト用テンプレート'
        }
      ];
      (PDFService.prototype.listTemplates as jest.Mock).mockReturnValue(mockTemplates);

      const response = await request(app)
        .post('/webhook/appsheet')
        .send({
          action: 'list_templates'
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: {
          templates: mockTemplates
        }
      });
    });

    it('不正なアクションでエラー', async () => {
      const response = await request(app)
        .post('/webhook/appsheet')
        .send({
          action: 'invalid_action'
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'INVALID_ACTION',
          message: '不正なアクションが指定されました'
        }
      });
    });

    it('PDFの生成に失敗した場合のエラーハンドリング', async () => {
      (PDFService.prototype.generatePDF as jest.Mock).mockRejectedValue(
        new Error('PDF generation failed')
      );

      const response = await request(app)
        .post('/webhook/appsheet')
        .send({
          action: 'generate_pdf',
          templateId: 'report',
          data: {
            title: 'テストレポート'
          }
        });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });
});
