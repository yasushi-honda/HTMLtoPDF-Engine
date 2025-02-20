import { PDFOptions } from './pdf';

/**
 * PDF生成リクエスト
 */
export interface GeneratePDFRequest {
  /** テンプレートID */
  template: string;
  /** テンプレートに渡すデータ */
  data: Record<string, any>;
  /** 年（オプション） */
  year?: number;
  /** 月（オプション） */
  month?: number;
  /** オーバーレイ設定（オプション） */
  overlay?: Array<{
    type: 'circle' | 'triangle' | 'cross' | 'diamond';
    days: number[];
  }>;
  /** 出力フォルダID（オプション） */
  outputFolderId?: string;
  /** ファイル名（オプション） */
  filename?: string;
  /** 説明（オプション） */
  description?: string;
}

/**
 * PDF生成レスポンス
 */
export interface GeneratePDFResponse {
  /** ファイルID */
  fileId: string;
  /** Web表示用URL */
  webViewLink: string;
  /** ファイル名 */
  filename: string;
}

/**
 * エラーレスポンス
 */
export interface ErrorResponse {
  /** ステータス */
  status: 'error';
  /** エラーコード */
  code: string;
  /** エラーメッセージ */
  message: string;
  /** エラーの詳細（開発環境のみ） */
  details?: any;
}

// APIErrorResponseをErrorResponseにエイリアス
export type APIErrorResponse = ErrorResponse;
