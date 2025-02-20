import { PDFService } from '../services/pdf';
import { PDFOptions } from '../types/pdf';

describe('PDFService', () => {
  let pdfService: PDFService;

  beforeEach(() => {
    pdfService = new PDFService();
  });

  describe('generatePDF', () => {
    it('PDFを正しく生成できること', async () => {
      const options: PDFOptions = {
        html: '<h1>テスト</h1>',
        filename: 'test.pdf'
      };

      const result = await pdfService.generatePDF(options);

      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.buffer.length).toBeGreaterThan(0);
      expect(result.filename).toBe('test.pdf');
      expect(result.timestamp).toBeInstanceOf(Date);
    }, 30000); // タイムアウトを30秒に延長

    it('カスタム設定でPDFを生成できること', async () => {
      const options: PDFOptions = {
        html: '<h1>テスト</h1>',
        filename: 'test.pdf',
        pageConfig: {
          format: 'A3',
          orientation: 'landscape',
          margin: {
            top: '30mm',
            right: '30mm',
            bottom: '30mm',
            left: '30mm'
          }
        }
      };

      const result = await pdfService.generatePDF(options);

      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.buffer.length).toBeGreaterThan(0);
    }, 30000); // タイムアウトを30秒に延長
  });

  describe('generatePreviewHTML', () => {
    it('プレビューHTMLを生成できること', async () => {
      const options: PDFOptions = {
        html: '<h1>テスト</h1>',
        filename: 'test.pdf'
      };

      const result = await pdfService.generatePreviewHTML(options);

      expect(typeof result).toBe('string');
      expect(result).toContain('<h1>テスト</h1>');
    }, 30000); // タイムアウトを30秒に延長
  });
});
