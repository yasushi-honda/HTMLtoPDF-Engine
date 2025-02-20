import { Request, Response, NextFunction } from 'express';
import { generatePDF } from '../controllers/pdf';
import { GeneratePDFRequest } from '../types/api';

describe('負荷テスト', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      body: {
        template: 'calendar',
        data: {},
        year: 2025,
        month: 2,
        overlay: [
          { type: 'circle', days: [1, 15] }
        ]
      } as GeneratePDFRequest
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
  });

  test('同時に10件のリクエストを処理できること', async () => {
    const requests = Array(10).fill(null).map(() => 
      generatePDF(mockRequest as Request, mockResponse as Response, mockNext)
    );

    await expect(Promise.all(requests)).resolves.not.toThrow();
  }, 30000); // タイムアウトを30秒に設定

  test('エラー発生時も他のリクエストに影響を与えないこと', async () => {
    const validRequest = { ...mockRequest };
    const invalidRequest = {
      body: {
        template: 'calendar',
        data: {},
        year: -1, // 不正な値
        month: 13, // 不正な値
        overlay: []
      }
    };

    const requests = [
      generatePDF(validRequest as Request, mockResponse as Response, mockNext),
      generatePDF(invalidRequest as Request, mockResponse as Response, mockNext),
      generatePDF(validRequest as Request, mockResponse as Response, mockNext)
    ];

    await expect(Promise.all(requests)).resolves.not.toThrow();
  }, 30000);

  test('メモリ使用量が適切な範囲内であること', async () => {
    const initialMemory = process.memoryUsage();
    
    // 100件の小さなPDFを生成
    const requests = Array(100).fill(null).map(() => 
      generatePDF(mockRequest as Request, mockResponse as Response, mockNext)
    );

    await Promise.all(requests);

    const finalMemory = process.memoryUsage();
    const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

    // メモリ増加が100MB以下であることを確認
    expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
  }, 60000);
});
