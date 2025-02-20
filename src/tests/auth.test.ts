import { Request, Response, NextFunction } from 'express';
import { validateAppSheetRequest, sanitizeInput } from '../middleware/auth';
import { OAuth2Client } from 'google-auth-library';

// モック
jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    verifyIdToken: jest.fn().mockImplementation(({ idToken }) => {
      if (idToken === 'valid_token') {
        return Promise.resolve({
          getPayload: () => ({
            email: 'test@appsheet.com',
            sub: 'user123',
            name: 'Test User'
          })
        });
      }
      throw new Error('Invalid token');
    })
  }))
}));

describe('Auth Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let nextFunction: NextFunction = jest.fn();

  beforeEach(() => {
    mockReq = {
      headers: {},
      body: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    nextFunction = jest.fn();
  });

  describe('validateAppSheetRequest', () => {
    it('認証ヘッダーがない場合はエラー', async () => {
      await validateAppSheetRequest(
        mockReq as Request,
        mockRes as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'MISSING_AUTH_HEADER'
        })
      );
    });

    it('不正な認証形式の場合はエラー', async () => {
      mockReq.headers = { authorization: 'Invalid token' };

      await validateAppSheetRequest(
        mockReq as Request,
        mockRes as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'INVALID_AUTH_FORMAT'
        })
      );
    });

    it('有効なトークンの場合は成功', async () => {
      mockReq.headers = { authorization: 'Bearer valid_token' };

      await validateAppSheetRequest(
        mockReq as Request,
        mockRes as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalledWith();
      expect(mockReq.user).toEqual({
        email: 'test@appsheet.com',
        sub: 'user123',
        name: 'Test User'
      });
    });

    it('無効なトークンの場合はエラー', async () => {
      mockReq.headers = { authorization: 'Bearer invalid_token' };

      await validateAppSheetRequest(
        mockReq as Request,
        mockRes as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'INVALID_TOKEN'
        })
      );
    });
  });

  describe('sanitizeInput', () => {
    it('HTMLタグを除去', () => {
      mockReq.body = {
        text: '<script>alert("test")</script>Hello',
        nested: {
          html: '<p>Test</p>'
        },
        array: ['<div>Item</div>']
      };

      sanitizeInput(mockReq as Request, mockRes as Response, nextFunction);

      expect(mockReq.body).toEqual({
        text: 'Hello',
        nested: {
          html: 'Test'
        },
        array: ['Item']
      });
      expect(nextFunction).toHaveBeenCalled();
    });

    it('HTMLタグ以外のデータは保持', () => {
      mockReq.body = {
        number: 123,
        boolean: true,
        text: 'Normal text'
      };

      sanitizeInput(mockReq as Request, mockRes as Response, nextFunction);

      expect(mockReq.body).toEqual({
        number: 123,
        boolean: true,
        text: 'Normal text'
      });
      expect(nextFunction).toHaveBeenCalled();
    });
  });
});
