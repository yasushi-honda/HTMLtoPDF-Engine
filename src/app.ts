import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pdfRoutes from './routes/pdf';
import { errorHandler } from './middleware/error';

/**
 * Expressアプリケーションの設定
 */
export function createApp() {
  const app = express();

  // セキュリティミドルウェア
  app.use(helmet());

  // CORSの設定
  app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    methods: ['POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  // JSONボディパーサー
  app.use(express.json({ limit: '10mb' }));

  // ルートの設定
  app.use('/api/pdf', pdfRoutes);

  // エラーハンドリング
  app.use(errorHandler);

  return app;
}

// アプリケーションのインスタンスをエクスポート
export const app = createApp();
