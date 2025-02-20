import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';
import { DriveUploadOptions, DriveUploadResult, DriveApiError } from '../types/drive';

/**
 * Google Drive操作サービス
 */
export class DriveService {
  private readonly drive;

  constructor() {
    // Workload Identityを使用した認証
    const auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/drive.file']
    });
    this.drive = google.drive({ version: 'v3', auth });
  }

  /**
   * ファイルをアップロード
   * @param options アップロードオプション
   * @returns アップロード結果
   */
  public async uploadFile(options: DriveUploadOptions): Promise<DriveUploadResult> {
    try {
      // ファイルのメタデータを設定
      const fileMetadata = {
        name: options.filename,
        description: options.description,
        ...(options.folderId && { parents: [options.folderId] })
      };

      // メディアの設定
      const media = {
        mimeType: options.mimeType,
        body: options.buffer
      };

      // ファイルをアップロード
      const response = await this.drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id, name, webViewLink'
      });

      if (!response.data.id || !response.data.webViewLink) {
        throw new DriveApiError(
          'Failed to get file information after upload',
          'UPLOAD_INCOMPLETE'
        );
      }

      return {
        fileId: response.data.id,
        webViewLink: response.data.webViewLink,
        filename: options.filename,
        uploadedAt: new Date()
      };
    } catch (error: any) {
      throw new DriveApiError(
        error.message || 'Failed to upload file to Google Drive',
        error.code || 'UPLOAD_FAILED',
        error.details
      );
    }
  }

  /**
   * ファイルの共有設定を更新
   * @param fileId ファイルID
   * @param role 権限（reader, writer, commenter）
   * @returns 更新されたファイルの情報
   */
  public async updateFilePermissions(
    fileId: string,
    role: 'reader' | 'writer' | 'commenter' = 'reader'
  ): Promise<void> {
    try {
      await this.drive.permissions.create({
        fileId: fileId,
        requestBody: {
          role: role,
          type: 'anyone'
        }
      });
    } catch (error: any) {
      throw new DriveApiError(
        error.message || 'Failed to update file permissions',
        error.code || 'PERMISSION_UPDATE_FAILED',
        error.details
      );
    }
  }

  /**
   * ファイルの情報を取得
   * @param fileId ファイルID
   * @returns ファイル情報
   */
  public async getFileInfo(fileId: string): Promise<{
    id: string;
    name: string;
    webViewLink: string;
  }> {
    try {
      const response = await this.drive.files.get({
        fileId: fileId,
        fields: 'id, name, webViewLink'
      });

      if (!response.data.id || !response.data.name || !response.data.webViewLink) {
        throw new DriveApiError(
          'Failed to get complete file information',
          'INCOMPLETE_FILE_INFO'
        );
      }

      return {
        id: response.data.id,
        name: response.data.name,
        webViewLink: response.data.webViewLink
      };
    } catch (error: any) {
      throw new DriveApiError(
        error.message || 'Failed to get file information',
        error.code || 'FILE_INFO_FAILED',
        error.details
      );
    }
  }
}
