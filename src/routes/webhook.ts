import { Router } from 'express';
import { validateAppSheetRequest, sanitizeInput } from '../middleware/auth';
import { PDFService } from '../services/pdf';
import { DriveService } from '../services/drive';

const router = Router();
const pdfService = new PDFService();
const driveService = new DriveService();

/**
 * AppSheetからのWebhookエンドポイント
 */
router.post('/appsheet', validateAppSheetRequest, sanitizeInput, async (req, res, next) => {
  try {
    const {
      action,
      templateId,
      data,
      options = {},
      filename,
      description
    } = req.body;

    // アクションに応じた処理
    switch (action) {
      case 'generate_pdf': {
        // PDFの生成
        const pdf = await pdfService.generatePDF({
          templateId,
          data,
          ...options
        });

        // Google Driveにアップロード
        const uploadResult = await driveService.uploadFile({
          buffer: pdf,
          filename: filename || 'document.pdf',
          mimeType: 'application/pdf',
          description
        });

        res.json({
          success: true,
          data: {
            fileId: uploadResult.fileId,
            webViewLink: uploadResult.webViewLink,
            filename: uploadResult.filename
          }
        });
        break;
      }

      case 'preview': {
        // プレビューHTMLの生成
        const html = await pdfService.generatePreviewHtml({
          templateId,
          data,
          ...options
        });

        res.json({
          success: true,
          data: {
            html
          }
        });
        break;
      }


      default:
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ACTION',
            message: '不正なアクションが指定されました'
          }
        });
    }
  } catch (error) {
    next(error);
  }
});

export default router;
