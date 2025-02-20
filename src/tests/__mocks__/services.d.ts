declare module '../../services/pdf' {
  export class PDFService {
    generatePDF(request: any): Promise<Buffer>;
    generatePreviewHtml(request: any): Promise<string>;
    static setMockDelay(delay: number): void;
  }
}

declare module '../../services/drive' {
  export class DriveService {
    uploadFile(buffer: Buffer, filename: string, description?: string, folderId?: string): Promise<any>;
    static setMockDelay(delay: number): void;
  }
}
