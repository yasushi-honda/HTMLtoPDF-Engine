import { Router } from 'express';
import { PDFService } from '../services/pdf';
import { DriveService } from '../services/drive';
import { validatePDFRequest } from '../middleware/validation';
import { validateAppSheetRequest, sanitizeInput, rateLimiter } from '../middleware/auth';
import { GeneratePDFRequest, GeneratePDFResponse } from '../types/api';

const router = Router();
const pdfService = new PDFService();
const driveService = new DriveService();

// 認証ミドルウェアを適用
router.use(validateAppSheetRequest);
router.use(sanitizeInput);
router.use(rateLimiter);

/**
 * PDF生成エンドポイント
 */
router.post('/generate', validatePDFRequest, async (req, res, next) => {
  try {
    const request = req.body as GeneratePDFRequest;
    
    // PDFの生成
    const pdf = await pdfService.generatePDF(request);

    // Google Driveにアップロード
    const uploadResult = await driveService.uploadFile({
      buffer: pdf,
      filename: request.filename || `calendar-${request.year}-${request.month}.pdf`,
      mimeType: 'application/pdf',
      description: request.description,
      folderId: request.outputFolderId
    });

    const response: GeneratePDFResponse = {
      fileId: uploadResult.fileId,
      webViewLink: uploadResult.webViewLink,
      filename: uploadResult.filename
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * プレビューHTML生成エンドポイント
 */
router.post('/preview', validatePDFRequest, async (req, res, next) => {
  try {
    const request = req.body as GeneratePDFRequest;
    
    // プレビューHTMLの生成
    const html = await pdfService.generatePreviewHtml(request);

    res.send(html);
  } catch (error) {
    next(error);
  }
});

export default router;
