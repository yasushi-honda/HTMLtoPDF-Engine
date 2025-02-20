import { GeneratePDFRequest } from '../../types/api';

let mockDelay = 100; // ミリ秒

export class PDFService {
  public async generatePDF(request: GeneratePDFRequest): Promise<Buffer> {
    // 実際のPDF生成をシミュレート
    await new Promise(resolve => setTimeout(resolve, mockDelay));
    return Buffer.from('Mock PDF Content');
  }

  public async generatePreviewHtml(request: GeneratePDFRequest): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, mockDelay));
    return '<html><body>Mock Preview HTML</body></html>';
  }
}

export const setMockDelay = (delay: number): void => {
  mockDelay = delay;
};
