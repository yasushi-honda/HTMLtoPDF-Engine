/**
 * PDF生成のオプション
 */
export interface PDFOptions {
  /** HTML文字列 */
  html: string;
  /** PDFのファイル名 */
  filename: string;
  /** ページ設定 */
  pageConfig?: {
    /** ページフォーマット（例：'A4'） */
    format?: string;
    /** 余白設定 */
    margin?: {
      top?: string;
      right?: string;
      bottom?: string;
      left?: string;
    };
    /** 印刷の向き（'portrait' or 'landscape'） */
    orientation?: 'portrait' | 'landscape';
  };
}

/**
 * PDF生成の結果
 */
export interface PDFResult {
  /** 生成されたPDFのバッファ */
  buffer: Buffer;
  /** PDFのファイル名 */
  filename: string;
  /** 生成時のタイムスタンプ */
  timestamp: Date;
}
