import { DriveService } from '../services/drive';
import { DriveUploadOptions } from '../types/drive';

// モック化
jest.mock('googleapis', () => ({
  google: {
    drive: jest.fn().mockReturnValue({
      files: {
        create: jest.fn().mockResolvedValue({
          data: {
            id: 'test-file-id',
            name: 'test.pdf',
            webViewLink: 'https://drive.google.com/file/d/test-file-id/view'
          }
        }),
        get: jest.fn().mockResolvedValue({
          data: {
            id: 'test-file-id',
            name: 'test.pdf',
            webViewLink: 'https://drive.google.com/file/d/test-file-id/view'
          }
        })
      },
      permissions: {
        create: jest.fn().mockResolvedValue({})
      }
    })
  }
}));

jest.mock('google-auth-library', () => ({
  GoogleAuth: jest.fn().mockImplementation(() => ({
    getClient: jest.fn().mockResolvedValue({})
  }))
}));

describe('DriveService', () => {
  let driveService: DriveService;
  const testBuffer = Buffer.from('test content');

  beforeEach(() => {
    driveService = new DriveService();
  });

  describe('uploadFile', () => {
    it('ファイルを正しくアップロードできること', async () => {
      const options: DriveUploadOptions = {
        buffer: testBuffer,
        filename: 'test.pdf',
        mimeType: 'application/pdf',
        description: 'Test PDF file'
      };

      const result = await driveService.uploadFile(options);

      expect(result.fileId).toBe('test-file-id');
      expect(result.webViewLink).toBe('https://drive.google.com/file/d/test-file-id/view');
      expect(result.filename).toBe('test.pdf');
      expect(result.uploadedAt).toBeInstanceOf(Date);
    });

    it('フォルダIDを指定してアップロードできること', async () => {
      const options: DriveUploadOptions = {
        buffer: testBuffer,
        filename: 'test.pdf',
        mimeType: 'application/pdf',
        folderId: 'test-folder-id'
      };

      const result = await driveService.uploadFile(options);

      expect(result.fileId).toBe('test-file-id');
      expect(result.webViewLink).toBe('https://drive.google.com/file/d/test-file-id/view');
    });
  });

  describe('updateFilePermissions', () => {
    it('ファイルの権限を更新できること', async () => {
      await expect(
        driveService.updateFilePermissions('test-file-id', 'reader')
      ).resolves.not.toThrow();
    });
  });

  describe('getFileInfo', () => {
    it('ファイル情報を取得できること', async () => {
      const info = await driveService.getFileInfo('test-file-id');

      expect(info.id).toBe('test-file-id');
      expect(info.name).toBe('test.pdf');
      expect(info.webViewLink).toBe('https://drive.google.com/file/d/test-file-id/view');
    });
  });
});
