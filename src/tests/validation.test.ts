import { Request, Response, NextFunction } from 'express';
import { validatePDFRequest } from '../middleware/validation';
import { GeneratePDFRequest } from '../types/api';

describe('バリデーションミドルウェアのテスト', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    nextFunction = jest.fn();
    mockResponse = {};
    mockRequest = {
      body: {
        year: 2025,
        month: 2,
        overlay: [
          {
            type: 'circle',
            days: [1, 15, 28]
          }
        ]
      }
    };
  });

  describe('必須フィールドのバリデーション', () => {
    test('正しいリクエストの場合、nextが呼ばれる', () => {
      validatePDFRequest(mockRequest as Request, mockResponse as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalledWith();
    });

    test('yearが欠けている場合、ValidationErrorを返す', () => {
      delete (mockRequest.body as any).year;
      validatePDFRequest(mockRequest as Request, mockResponse as Response, nextFunction);
      
      const error = (nextFunction as jest.Mock).mock.calls[0][0];
      expect(error.name).toBe('ValidationError');
      expect(error.message).toBe('Missing required fields: year, month, overlay');
    });

    test('monthが欠けている場合、ValidationErrorを返す', () => {
      delete (mockRequest.body as any).month;
      validatePDFRequest(mockRequest as Request, mockResponse as Response, nextFunction);
      
      const error = (nextFunction as jest.Mock).mock.calls[0][0];
      expect(error.name).toBe('ValidationError');
      expect(error.message).toBe('Missing required fields: year, month, overlay');
    });

    test('overlayが欠けている場合、ValidationErrorを返す', () => {
      delete (mockRequest.body as any).overlay;
      validatePDFRequest(mockRequest as Request, mockResponse as Response, nextFunction);
      
      const error = (nextFunction as jest.Mock).mock.calls[0][0];
      expect(error.name).toBe('ValidationError');
      expect(error.message).toBe('Missing required fields: year, month, overlay');
    });
  });

  describe('年月の範囲チェック', () => {
    test('年が1900未満の場合、ValidationErrorを返す', () => {
      mockRequest.body = {
        year: 1899,
        month: 2,
        overlay: [{ type: 'circle', days: [1, 15] }]
      };
      validatePDFRequest(mockRequest as Request, mockResponse as Response, nextFunction);
      
      const error = (nextFunction as jest.Mock).mock.calls[0][0];
      expect(error.name).toBe('ValidationError');
      expect(error.message).toBe('Invalid year or month');
    });

    test('年が2100より大きい場合、ValidationErrorを返す', () => {
      mockRequest.body = {
        year: 2101,
        month: 2,
        overlay: [{ type: 'circle', days: [1, 15] }]
      };
      validatePDFRequest(mockRequest as Request, mockResponse as Response, nextFunction);
      
      const error = (nextFunction as jest.Mock).mock.calls[0][0];
      expect(error.name).toBe('ValidationError');
      expect(error.message).toBe('Invalid year or month');
    });

    test('月が1未満の場合、ValidationErrorを返す', () => {
      mockRequest.body = {
        year: 2025,
        month: 0,
        overlay: [{ type: 'circle', days: [1, 15] }]
      };
      validatePDFRequest(mockRequest as Request, mockResponse as Response, nextFunction);
      
      const error = (nextFunction as jest.Mock).mock.calls[0][0];
      expect(error.name).toBe('ValidationError');
      expect(error.message).toBe('Invalid year or month');
    });

    test('月が12より大きい場合、ValidationErrorを返す', () => {
      mockRequest.body = {
        year: 2025,
        month: 13,
        overlay: [{ type: 'circle', days: [1, 15] }]
      };
      validatePDFRequest(mockRequest as Request, mockResponse as Response, nextFunction);
      
      const error = (nextFunction as jest.Mock).mock.calls[0][0];
      expect(error.name).toBe('ValidationError');
      expect(error.message).toBe('Invalid year or month');
    });
  });

  describe('オーバーレイのバリデーション', () => {
    test('オーバーレイの形式が不正な場合、ValidationErrorを返す', () => {
      mockRequest.body = {
        year: 2025,
        month: 2,
        overlay: [{ type: 'circle' }] // daysが欠けている
      };
      validatePDFRequest(mockRequest as Request, mockResponse as Response, nextFunction);
      
      const error = (nextFunction as jest.Mock).mock.calls[0][0];
      expect(error.name).toBe('ValidationError');
      expect(error.message).toBe('Invalid overlay format');
    });

    test('日付が月の範囲外の場合、ValidationErrorを返す', () => {
      mockRequest.body = {
        year: 2025,
        month: 2,
        overlay: [{
          type: 'circle',
          days: [0, 32] // 2月の範囲外
        }]
      };
      validatePDFRequest(mockRequest as Request, mockResponse as Response, nextFunction);
      
      const error = (nextFunction as jest.Mock).mock.calls[0][0];
      expect(error.name).toBe('ValidationError');
      expect(error.message).toBe('Invalid day: must be between 1 and 28');
    });

    test('無効なオーバーレイタイプの場合、ValidationErrorを返す', () => {
      mockRequest.body = {
        year: 2025,
        month: 2,
        overlay: [{
          type: 'invalid',
          days: [1, 15]
        }]
      };
      validatePDFRequest(mockRequest as Request, mockResponse as Response, nextFunction);
      
      const error = (nextFunction as jest.Mock).mock.calls[0][0];
      expect(error.name).toBe('ValidationError');
      expect(error.message).toBe('Invalid overlay type: must be one of circle, triangle, cross, diamond');
    });

    test('すべての有効なオーバーレイタイプが許可される', () => {
      const validTypes = ['circle', 'triangle', 'cross', 'diamond'];
      
      for (const type of validTypes) {
        mockRequest.body = {
          year: 2025,
          month: 2,
          overlay: [{ type, days: [1, 15] }]
        };
        
        validatePDFRequest(mockRequest as Request, mockResponse as Response, nextFunction);
        expect(nextFunction).toHaveBeenLastCalledWith();
      }
    });
  });
});
