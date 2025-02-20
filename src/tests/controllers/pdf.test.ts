import { Request, Response, NextFunction } from 'express';
import { generatePDF } from '../../controllers/pdf';
import { PDFService } from '../../services/pdf';
import { DriveService } from '../../services/drive';
import { GeneratePDFRequest } from '../../types/api';
import { setMockDelay as setPDFMockDelay } from '../__mocks__/pdf';
import { setMockDelay as setDriveMockDelay } from '../__mocks__/drive';

// PDFServiceとDriveServiceをモック化
jest.mock('../../services/pdf');
jest.mock('../../services/drive');

describe('PDFコントローラーの負荷テスト', () => {
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

    // モックの遅延時間をリセット
    setPDFMockDelay(100);
    setDriveMockDelay(100);
  });

  test('同時に5件のリクエストを処理できること', async () => {
    const requests = Array(5).fill(null).map(() => 
      generatePDF(mockRequest as Request, mockResponse as Response, mockNext)
    );

    await Promise.all(requests);
    expect(mockResponse.json).toHaveBeenCalledTimes(5);
  }, 10000);

  test('エラー発生時も他のリクエストに影響を与えないこと', async () => {
    // エラーを発生させるリクエスト
    const errorRequest = {
      body: {
        template: 'invalid',
        data: {},
        year: -1,
        month: 13
      }
    };

    const requests = [
      generatePDF(mockRequest as Request, mockResponse as Response, mockNext),
      generatePDF(errorRequest as Request, mockResponse as Response, mockNext),
      generatePDF(mockRequest as Request, mockResponse as Response, mockNext)
    ];

    await Promise.all(requests);

    // 正常なリクエストは成功し、エラーリクエストは400エラーを返すことを確認
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'ValidationError'
      })
    );
  });

  test('レスポンス時間が許容範囲内であること', async () => {
    // モックの遅延時間を調整
    setPDFMockDelay(200);
    setDriveMockDelay(100);

    const startTime = Date.now();
    await generatePDF(mockRequest as Request, mockResponse as Response, mockNext);
    const endTime = Date.now();

    const responseTime = endTime - startTime;
    // レスポンス時間が1秒以内であることを確認
    expect(responseTime).toBeLessThan(1000);
  });
});
