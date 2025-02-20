import { Request, Response, NextFunction } from 'express';
import { GeneratePDFRequest } from '../types/api';

/**
 * PDFリクエストのバリデーション
 */
export function validatePDFRequest(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const body = req.body as GeneratePDFRequest;

  // 必須フィールドのチェック
  if (!body.year || !body.month || !Array.isArray(body.overlay)) {
    const error = new Error('Missing required fields: year, month, overlay');
    error.name = 'ValidationError';
    next(error);
    return;
  }

  // 年月の範囲チェック
  if (body.year < 1900 || body.year > 2100 || body.month < 1 || body.month > 12) {
    const error = new Error('Invalid year or month');
    error.name = 'ValidationError';
    next(error);
    return;
  }

  // オーバーレイのバリデーション
  for (const item of body.overlay) {
    if (!Array.isArray(item.days) || !item.type) {
      const error = new Error('Invalid overlay format');
      error.name = 'ValidationError';
      next(error);
      return;
    }

    // 日付の範囲チェック
    const daysInMonth = new Date(body.year, body.month, 0).getDate();
    if (item.days.some(day => day < 1 || day > daysInMonth)) {
      const error = new Error(`Invalid day: must be between 1 and ${daysInMonth}`);
      error.name = 'ValidationError';
      next(error);
      return;
    }

    // オーバーレイタイプのチェック
    const validTypes = ['circle', 'triangle', 'cross', 'diamond'];
    if (!validTypes.includes(item.type)) {
      const error = new Error(`Invalid overlay type: must be one of ${validTypes.join(', ')}`);
      error.name = 'ValidationError';
      next(error);
      return;
    }
  }

  next();
}
