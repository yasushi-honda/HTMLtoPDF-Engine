import puppeteer from 'puppeteer';
import { GeneratePDFRequest } from '../types/api';
import { CalendarGenerator } from './calendar';

/**
 * PDF生成サービス
 */
export class PDFService {
  private calendarGenerator: CalendarGenerator;

  constructor() {
    this.calendarGenerator = new CalendarGenerator();
  }

  /**
   * PDFの生成
   */
  public async generatePDF(request: GeneratePDFRequest): Promise<Buffer> {
    try {
      // カレンダーHTMLの生成
      const html = await this.calendarGenerator.generateHTML(request);

      // PDFの生成
      const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      const page = await browser.newPage();
      await page.setContent(html);
      const pdf = await page.pdf({
        format: 'A4',
        landscape: true,
        printBackground: true,
        margin: {
          top: '1cm',
          right: '1cm',
          bottom: '1cm',
          left: '1cm'
        }
      });
      await browser.close();

      return Buffer.from(pdf);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`PDF generation failed: ${errorMessage}`);
    }
  }

  /**
   * プレビューHTMLの生成
   */
  public async generatePreviewHtml(request: GeneratePDFRequest): Promise<string> {
    try {
      return await this.calendarGenerator.generateHTML(request);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Preview generation failed: ${errorMessage}`);
    }
  }
}
