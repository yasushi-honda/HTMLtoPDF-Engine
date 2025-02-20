import { Request, Response, NextFunction } from 'express';
import { OAuth2Client } from 'google-auth-library';

// ユーザー情報の型定義
interface User {
  email: string;
  sub: string;
  name: string | undefined;
}

// Requestの型拡張
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

/**
 * 認証エラー
 */
export class AuthError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number = 401
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * AppSheetからのリクエストを検証するミドルウェア
 */
export async function validateAppSheetRequest(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new AuthError(
        'Authorization header is missing',
        'MISSING_AUTH_HEADER',
        401
      );
    }

    // Bearer tokenの形式を確認
    const [scheme, token] = authHeader.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new AuthError(
        'Invalid authorization format',
        'INVALID_AUTH_FORMAT',
        401
      );
    }

    // Google OAuth2クライアントの初期化
    const oauth2Client = new OAuth2Client();

    try {
      // トークンの検証
      const ticket = await oauth2Client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID
      });

      // トークンのペイロードを取得
      const payload = ticket.getPayload();
      if (!payload) {
        throw new AuthError(
          'Invalid token payload',
          'INVALID_TOKEN_PAYLOAD',
          401
        );
      }

      // AppSheetのドメインを確認
      const email = payload.email;
      if (!email || !email.endsWith('@appsheet.com')) {
        throw new AuthError(
          'Unauthorized email domain',
          'UNAUTHORIZED_DOMAIN',
          403
        );
      }

      // リクエストにユーザー情報を追加
      req.user = {
        email: payload.email,
        sub: payload.sub,
        name: payload.name
      };

      next();
    } catch (error) {
      throw new AuthError(
        'Token verification failed',
        'INVALID_TOKEN',
        401
      );
    }
  } catch (error) {
    next(error);
  }
}

/**
 * レート制限ミドルウェア
 */
export function rateLimiter(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // TODO: Redis等を使用してレート制限を実装
  next();
}

/**
 * 入力サニタイズミドルウェア
 */
export function sanitizeInput(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (req.body) {
    // HTMLタグの除去
    const sanitize = (obj: any): any => {
      if (typeof obj !== 'object') return obj;
      
      const sanitized: any = Array.isArray(obj) ? [] : {};
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
          // HTMLタグを除去
          sanitized[key] = value.replace(/<[^>]*>/g, '');
        } else if (typeof value === 'object') {
          sanitized[key] = sanitize(value);
        } else {
          sanitized[key] = value;
        }
      }
      return sanitized;
    };

    req.body = sanitize(req.body);
  }
  next();
}
