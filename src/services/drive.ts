import { drive_v3, google } from 'googleapis';
import { DriveUploadOptions, DriveUploadResult, DriveApiError } from '../types/drive';

/**
 * Google Drive操作サービス
 */
export class DriveService {
  private drive: drive_v3.Drive;

  constructor() {
    // Workload Identityを使用した認証
    const auth = new google.auth.GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/drive.file']
    });
    this.drive = google.drive('v3');
  }

  /**
   * PDFファイルをアップロード
   */
  public async uploadFile(options: {
    buffer: Buffer;
    filename: string;
    mimeType: string;
    description?: string;
    folderId?: string;
  }): Promise<DriveUploadResult> {
    try {

      const result = await this.uploadToGoogleDrive(options);
      return result;
    } catch (error) {
      throw new DriveApiError(
        'Driveアップロードエラー',
        'DRIVE_UPLOAD_ERROR',
        error
      );
    }
  }

  /**
   * Google Driveにファイルをアップロード
   */
  private async uploadToGoogleDrive(options: DriveUploadOptions): Promise<DriveUploadResult> {
    const { buffer, filename, mimeType, folderId, description } = options;

    const requestBody = {
      name: filename,
      description,
      mimeType,
      parents: folderId ? [folderId] : undefined
    };

    const media = {
      mimeType,
      body: buffer
    };

    const response = await this.drive.files.create({
      requestBody,
      media,
      fields: 'id, webViewLink'
    });

    if (!response.data.id || !response.data.webViewLink) {
      throw new DriveApiError(
        'ファイルのアップロードに失敗しました',
        'DRIVE_UPLOAD_ERROR'
      );
    }

    return {
      fileId: response.data.id,
      webViewLink: response.data.webViewLink,
      filename,
      uploadedAt: new Date()
    };
  }

  /**
   * ファイルの権限を更新
   */
  public async updateFilePermissions(fileId: string, role: 'reader' | 'writer' | 'owner'): Promise<void> {
    await this.drive.permissions.create({
      fileId,
      requestBody: {
        role,
        type: 'anyone'
      }
    });
  }

  /**
   * ファイル情報を取得
   */
  public async getFileInfo(fileId: string): Promise<{
    id: string;
    name: string;
    webViewLink: string;
  }> {
    const response = await this.drive.files.get({
      fileId,
      fields: 'id, name, webViewLink'
    });

    return {
      id: response.data.id!,
      name: response.data.name!,
      webViewLink: response.data.webViewLink!
    };
  }
}
