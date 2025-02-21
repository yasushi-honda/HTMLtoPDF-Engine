import { Request, Response, NextFunction } from 'express';
import { PDFService } from '../services/pdf';
import { DriveService } from '../services/drive';
import { GeneratePDFRequest, GeneratePDFResponse } from '../types/api';
import { DriveApiError } from '../types/drive';

const pdfService = new PDFService();
const driveService = new DriveService();

/**
 * PDF生成コントローラー
 */
export async function generatePDF(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const request = req.body as GeneratePDFRequest;

    // バリデーション
    if (!request.template || !request.year || !request.month) {
      res.status(400).json({
        error: 'ValidationError',
        message: '必須パラメータが不足しています（template, year, month）'
      });
      return;
    }

    if (request.year < 1900 || request.year > 2100 || request.month < 1 || request.month > 12) {
      res.status(400).json({
        error: 'ValidationError',
        message: '年月の値が不正です'
      });
      return;
    }

    // PDF生成
    const pdf = await pdfService.generatePDF(request);

    // Google Driveへのアップロード
    try {
      const uploadResult = await driveService.uploadFile(
        pdf,
        request.filename || `calendar-${request.year}-${request.month}.pdf`,
        request.description,
        request.outputFolderId
      );

      const response: GeneratePDFResponse = {
        fileId: uploadResult.fileId,
        webViewLink: uploadResult.webViewLink,
        filename: uploadResult.filename
      };

      res.json(response);
    } catch (error) {
      if (error instanceof DriveApiError) {
        res.status(500).json({
          error: 'DriveError',
          message: 'Google Driveへのアップロードに失敗しました',
          details: error.message
        });
      } else {
        throw error;
      }
    }
  } catch (error) {
    next(error);
  } finally {
    // ブラウザのクリーンアップ
    await pdfService.cleanup();
  }
}

/**
 * プレビューHTML生成
 */
export async function generatePreviewHtml(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const request = req.body as GeneratePDFRequest;

    // バリデーション
    if (!request.template || !request.year || !request.month) {
      res.status(400).json({
        error: 'ValidationError',
        message: '必須パラメータが不足しています（template, year, month）'
      });
      return;
    }

    const html = await pdfService.generatePreviewHtml(request);
    res.send(html);
  } catch (error) {
    next(error);
  }
}
