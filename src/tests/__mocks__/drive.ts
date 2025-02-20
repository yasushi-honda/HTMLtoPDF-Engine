import { DriveUploadResult } from '../../types/drive';

let mockDelay = 100; // ミリ秒

export class DriveService {
  public async uploadFile(
    buffer: Buffer,
    filename: string,
    description?: string,
    folderId?: string
  ): Promise<DriveUploadResult> {
    // アップロードをシミュレート
    await new Promise(resolve => setTimeout(resolve, mockDelay));
    
    return {
      fileId: 'mock-file-id',
      webViewLink: 'https://drive.google.com/mock-file',
      filename: filename,
      uploadedAt: new Date()
    };
  }
}

export const setMockDelay = (delay: number): void => {
  mockDelay = delay;
};
