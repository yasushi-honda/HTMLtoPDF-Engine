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
        message: '必須パラメータが不足しています'
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
    
    // PDFの生成
    const pdf = await pdfService.generatePDF(request);

    // Google Driveへのアップロード
    const uploadResult = await driveService.uploadFile(
      pdf,
      request.filename || `calendar_${request.year}_${request.month}.pdf`,
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
    // エラーハンドリング
    if (error instanceof DriveApiError) {
      res.status(500).json({
        error: 'DriveError',
        message: error.message
      });
    } else {
      res.status(500).json({
        error: 'PDFGenerationError',
        message: 'PDFの生成中にエラーが発生しました'
      });
    }
  }
}
