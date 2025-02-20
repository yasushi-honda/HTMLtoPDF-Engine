import { Request, Response, NextFunction } from 'express';
import { errorHandler } from '../middleware/error';

describe('エラーハンドリングミドルウェアのテスト', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
  });

  test('ValidationErrorを適切にハンドリングできること', () => {
    const error = new Error('バリデーションエラー');
    error.name = 'ValidationError';

    errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      status: 'error',
      code: 'VALIDATION_ERROR',
      message: 'バリデーションエラー'
    });
  });

  test('DriveErrorを適切にハンドリングできること', () => {
    const error = new Error('Driveアップロードエラー');
    error.name = 'DriveError';

    errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      status: 'error',
      code: 'INTERNAL_SERVER_ERROR',
      message: '内部サーバーエラー'
    });
  });

  test('PDFGenerationErrorを適切にハンドリングできること', () => {
    const error = new Error('PDF生成エラー');
    error.name = 'PDFGenerationError';

    errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      status: 'error',
      code: 'PDF_GENERATION_ERROR',
      message: 'PDF生成エラー'
    });
  });

  test('未知のエラーを適切にハンドリングできること', () => {
    const error = new Error('予期せぬエラー');

    errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      status: 'error',
      code: 'INTERNAL_SERVER_ERROR',
      message: '内部サーバーエラー'
    });
  });
});
