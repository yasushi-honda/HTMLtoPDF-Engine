import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pdfRoutes from './routes/pdf';
import { errorHandler } from './middleware/error';

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

// サーバー起動
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
