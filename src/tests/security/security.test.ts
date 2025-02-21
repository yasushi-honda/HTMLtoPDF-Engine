import { Request, Response } from 'express';
import { generatePDF } from '../../controllers/pdf';
import { GeneratePDFRequest } from '../../types/api';

describe('セキュリティテスト', () => {
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
        overlay: []
      } as GeneratePDFRequest,
      headers: {
        authorization: 'Bearer test-token'
      }
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  test('不正なテンプレートIDを拒否する', async () => {
    const maliciousRequest = {
      body: {
        template: '../../../etc/passwd',
        data: {
          title: '悪意のあるリクエスト'
        },
        year: 2025,
        month: 2,
        overlay: []
      } as GeneratePDFRequest,
      headers: {
        authorization: 'Bearer test-token'
      }
    };

    await generatePDF(maliciousRequest as Request, mockResponse as Response, jest.fn());
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'ValidationError'
      })
    );
  });

  test('不正なフォルダIDを拒否する', async () => {
    const maliciousRequest = {
      body: {
        template: 'calendar',
        data: {
          title: 'テストカレンダー'
        },
        year: 2025,
        month: 2,
        overlay: [],
        outputFolderId: '../root_folder'
      } as GeneratePDFRequest,
      headers: {
        authorization: 'Bearer test-token'
      }
    };

    await generatePDF(maliciousRequest as Request, mockResponse as Response, jest.fn());
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'ValidationError'
      })
    );
  });

  test('認証トークンなしのリクエストを拒否する', async () => {
    const requestWithoutAuth = {
      body: {
        template: 'calendar',
        data: {
          title: 'テストカレンダー'
        },
        year: 2025,
        month: 2,
        overlay: []
      } as GeneratePDFRequest
    };

    await generatePDF(requestWithoutAuth as Request, mockResponse as Response, jest.fn());
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'AuthenticationError'
      })
    );
  });
});
