import { Request, Response, NextFunction } from 'express';
import { DriveApiError } from '../types/drive';
import { APIErrorResponse } from '../types/api';

/**
 * エラーハンドリングミドルウェア
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('Error:', err);

  const errorResponse: APIErrorResponse = {
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred'
  };

  if (err instanceof DriveApiError) {
    errorResponse.code = err.code;
    errorResponse.message = err.message;
    errorResponse.details = err.details;
    res.status(500).json(errorResponse);
    return;
  }

  // バリデーションエラー
  if (err.name === 'ValidationError') {
    errorResponse.code = 'VALIDATION_ERROR';
    errorResponse.message = err.message;
    res.status(400).json(errorResponse);
    return;
  }

  // その他のエラー
  res.status(500).json(errorResponse);
}
