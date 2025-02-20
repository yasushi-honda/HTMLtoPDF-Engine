import { Router } from 'express';
import { CalendarService } from '../services/calendar';
import { PDFService } from '../services/pdf';
import { DriveService } from '../services/drive';
import { validatePDFRequest } from '../middleware/validation';
import { GeneratePDFRequest, GeneratePDFResponse } from '../types/api';

const router = Router();
const calendarService = new CalendarService();
const pdfService = new PDFService();
const driveService = new DriveService();

/**
 * PDF生成エンドポイント
 */
router.post('/generate', validatePDFRequest, async (req, res, next) => {
  try {
    const request = req.body as GeneratePDFRequest;

    // カレンダーHTMLの生成
    const calendarHtml = calendarService.generateCalendarHTML(
      request.year,
      request.month,
      request.overlay
    );

    // PDFの生成
    const pdfResult = await pdfService.generatePDF({
      html: calendarHtml,
      filename: request.filename || `calendar-${request.year}-${request.month}.pdf`
    });

    // Google Driveへのアップロード
    const uploadResult = await driveService.uploadFile({
      buffer: pdfResult.buffer,
      filename: pdfResult.filename,
      mimeType: 'application/pdf',
      folderId: request.outputFolderId,
      description: request.description
    });

    // ファイルを共有可能に設定
    await driveService.updateFilePermissions(uploadResult.fileId, 'reader');

    // レスポンスの作成
    const response: GeneratePDFResponse = {
      fileId: uploadResult.fileId,
      webViewLink: uploadResult.webViewLink,
      filename: uploadResult.filename,
      generatedAt: uploadResult.uploadedAt.toISOString()
    };

    res.status(200).json(response);
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

    // カレンダーHTMLの生成
    const calendarHtml = calendarService.generateCalendarHTML(
      request.year,
      request.month,
      request.overlay
    );

    // プレビューHTMLの生成
    const previewHtml = await pdfService.generatePreviewHTML({
      html: calendarHtml,
      filename: request.filename || `calendar-${request.year}-${request.month}.pdf`
    });

    res.status(200).send(previewHtml);
  } catch (error) {
    next(error);
  }
});

export default router;
