import { AuthConfig } from '../types/auth';

/**
 * 認証設定
 */
export const authConfig: AuthConfig = {
  // Google OAuth2のクライアントID
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',

  // 許可されたメールドメイン
  allowedDomains: ['appsheet.com'],

  // レート制限の設定
  rateLimit: {
    // 1分間あたりの制限
    windowSizeInSeconds: 60,
    // 最大60リクエスト
    maxRequests: 60,
    // エラーメッセージ
    message: 'リクエスト制限を超過しました。しばらく待ってから再試行してください。'
  }
};
