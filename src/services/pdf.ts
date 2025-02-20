import puppeteer from 'puppeteer';
import { PDFOptions, PDFResult } from '../types/pdf';

/**
 * PDF生成サービス
 */
export class PDFService {
  /**
   * HTMLからPDFを生成
   * @param options PDF生成オプション
   * @returns 生成されたPDFの情報
   */
  public async generatePDF(options: PDFOptions): Promise<PDFResult> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();

      // HTMLコンテンツを設定
      await page.setContent(options.html, {
        waitUntil: 'networkidle0'
      });

      // デフォルトのPDF設定
      const defaultConfig = {
        format: 'A4',
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm'
        },
        orientation: 'portrait' as const
      };

      // ユーザー設定とデフォルト設定をマージ
      const pageConfig = {
        ...defaultConfig,
        ...options.pageConfig,
        margin: {
          ...defaultConfig.margin,
          ...options.pageConfig?.margin
        }
      };

      // PDFを生成
      const pdfBuffer = await page.pdf({
        format: pageConfig.format as any,
        margin: pageConfig.margin,
        landscape: pageConfig.orientation === 'landscape',
        printBackground: true
      });

      return {
        buffer: Buffer.from(pdfBuffer),
        filename: options.filename,
        timestamp: new Date()
      };
    } finally {
      await browser.close();
    }
  }

  /**
   * PDFのプレビューHTMLを生成
   * @param options PDF生成オプション
   * @returns プレビュー用のHTML
   */
  public async generatePreviewHTML(options: PDFOptions): Promise<string> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      await page.setContent(options.html, {
        waitUntil: 'networkidle0'
      });

      // スタイルを適用した後のHTMLを取得
      const finalHTML = await page.content();
      return finalHTML;
    } finally {
      await browser.close();
    }
  }
}
