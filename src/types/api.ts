/**
 * PDFリクエストのボディ
 */
export interface GeneratePDFRequest {
  /** 年 */
  year: number;
  /** 月 */
  month: number;
  /** オーバーレイ設定 */
  overlay: {
    /** 日付の配列 */
    days: number[];
    /** オーバーレイの種類（circle, triangle, cross, diamond） */
    type: 'circle' | 'triangle' | 'cross' | 'diamond';
  }[];
  /** Google Driveの出力フォルダID */
  outputFolderId?: string;
  /** PDFのファイル名（指定しない場合は自動生成） */
  filename?: string;
  /** PDFの説明文 */
  description?: string;
}

/**
 * PDFレスポンス
 */
export interface GeneratePDFResponse {
  /** 生成されたPDFのファイルID */
  fileId: string;
  /** PDFの閲覧用URL */
  webViewLink: string;
  /** ファイル名 */
  filename: string;
  /** 生成日時 */
  generatedAt: string;
}

/**
 * APIエラーレスポンス
 */
export interface APIErrorResponse {
  /** エラーコード */
  code: string;
  /** エラーメッセージ */
  message: string;
  /** 詳細情報（開発者向け） */
  details?: any;
}
