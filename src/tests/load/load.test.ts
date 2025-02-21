import { Request, Response } from 'express';
import { generatePDF } from '../../controllers/pdf';
import { GeneratePDFRequest } from '../../types/api';

describe('負荷テスト', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockRequest = {
      body: {
        template: 'calendar',
        data: {
          title: 'テストカレンダー'
        },
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
  });

  test('同時に5件のリクエストを処理できること', async () => {
    const requests = Array(5).fill(null).map(() =>
      generatePDF(mockRequest as Request, mockResponse as Response, jest.fn())
    );

    await Promise.all(requests);
    expect(mockResponse.json).toHaveBeenCalledTimes(5);
  }, 10000);

  test('エラー時も他のリクエストに影響を与えないこと', async () => {
    const errorRequest = {
      body: {
        template: 'calendar',
        data: {
          title: 'エラーテスト'
        },
        year: -1, // 不正な値
        month: 13 // 不正な値
      } as GeneratePDFRequest
    };

    const requests = [
      generatePDF(mockRequest as Request, mockResponse as Response, jest.fn()),
      generatePDF(errorRequest as Request, mockResponse as Response, jest.fn()),
      generatePDF(mockRequest as Request, mockResponse as Response, jest.fn())
    ];

    await Promise.all(requests);
    expect(mockResponse.status).toHaveBeenCalledWith(400);
  });
});
