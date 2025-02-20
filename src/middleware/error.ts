import { Request, Response, NextFunction } from 'express';
import { DriveApiError } from '../types/drive';
import { APIErrorResponse } from '../types/api';

/**
 * エラーハンドリングミドルウェア
 * 
 * 各種エラーを適切なHTTPステータスコードとレスポンス形式に変換します。
 * エラーの種類：
 * - DriveApiError: Google Drive API関連のエラー
 * - ValidationError: リクエストのバリデーションエラー
 * - PDFGenerationError: PDF生成時のエラー
 * - AuthError: 認証・認可エラー
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('Error:', err);

  const errorResponse: APIErrorResponse = {
    status: 'error',
    code: 'INTERNAL_SERVER_ERROR',
    message: '内部サーバーエラー'
  };

  // Google Drive APIエラー
  if (err instanceof DriveApiError) {
    errorResponse.code = err.code;
    errorResponse.message = err.message;
    errorResponse.details = err.details;
    res.status(500).json(errorResponse);
    return;
  }

  // 認証エラー
  if ('code' in err && 'status' in err) {
    const authError = err as { code: string; status: number; message: string };
    errorResponse.code = authError.code;
    errorResponse.message = authError.message;
    res.status(authError.status).json(errorResponse);
    return;
  }

  // バリデーションエラー
  if (err.name === 'ValidationError') {
    errorResponse.code = 'VALIDATION_ERROR';
    errorResponse.message = err.message;
    res.status(400).json(errorResponse);
    return;
  }

  // PDF生成エラー
  if (err.name === 'PDFGenerationError') {
    errorResponse.code = 'PDF_GENERATION_ERROR';
    errorResponse.message = err.message || 'PDF生成中にエラーが発生しました';
    res.status(500).json(errorResponse);
    return;
  }

  // その他のエラー
  res.status(500).json(errorResponse);
}
