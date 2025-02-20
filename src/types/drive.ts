/**
 * Google Driveアップロード設定
 */
export interface DriveUploadOptions {
  /** アップロードするファイルのバッファ */
  buffer: Buffer;
  /** ファイル名 */
  filename: string;
  /** MIMEタイプ */
  mimeType: string;
  /** 保存先フォルダID（指定しない場合はルートに保存） */
  folderId?: string;
  /** ファイルの説明 */
  description?: string;
}

/**
 * アップロード結果
 */
export interface DriveUploadResult {
  /** ファイルID */
  fileId: string;
  /** ファイルの共有URL */
  webViewLink: string;
  /** ファイル名 */
  filename: string;
  /** アップロード日時 */
  uploadedAt: Date;
}

/**
 * Google Drive APIのエラー
 */
export class DriveApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: any
  ) {
    super(message);
    this.name = 'DriveApiError';
  }
}

/**
 * Drive APIエラー
 */
export class DriveApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: any
  ) {
    super(message);
    this.name = 'DriveApiError';
  }
}
