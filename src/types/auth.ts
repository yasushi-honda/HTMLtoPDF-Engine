/**
 * 認証済みユーザー情報
 */
export interface User {
  /** メールアドレス */
  email: string;
  /** ユーザーID */
  sub: string;
  /** 表示名 */
  name: string | undefined;
}

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

/**
 * レート制限の設定
 */
export interface RateLimitConfig {
  /** 時間枠（秒） */
  windowSizeInSeconds: number;
  /** 最大リクエスト数 */
  maxRequests: number;
  /** エラーメッセージ */
  message: string;
}

/**
 * 認証設定
 */
export interface AuthConfig {
  /** Google Client ID */
  googleClientId: string;
  /** 許可されたメールドメイン */
  allowedDomains: string[];
  /** レート制限の設定 */
  rateLimit: RateLimitConfig;
}
