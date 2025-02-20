import { Request, Response, NextFunction } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { User } from '../types/auth';

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
      if (!payload.email || !payload.email.endsWith('@appsheet.com')) {
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
        name: payload.name || undefined
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
  // MVPでは簡易的な実装
  next();
}

/**
 * 入力サニタイズミドルウェア
 * オブジェクト内のすべての文字列からHTMLタグを除去します
 */
export function sanitizeInput(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const sanitizeValue = (value: any): any => {
      if (typeof value === 'string') {
        // scriptタグとその中身を除去
        let sanitized = value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        // その他のHTMLタグを除去
        sanitized = sanitized.replace(/<[^>]*>/g, '');
        return sanitized;
      } else if (Array.isArray(value)) {
        // 配列の各要素を再帰的にサニタイズ
        return value.map(item => sanitizeValue(item));
      } else if (value && typeof value === 'object') {
        // オブジェクトの各プロパティを再帰的にサニタイズ
        const sanitized: Record<string, any> = {};
        for (const [key, val] of Object.entries(value)) {
          sanitized[key] = sanitizeValue(val);
        }
        return sanitized;
      }
      // その他の型（number, boolean等）はそのまま返す
      return value;
    };

    // リクエストボディをサニタイズ
    req.body = sanitizeValue(req.body);
    next();
  } catch (error) {
    next(error);
  }
}
