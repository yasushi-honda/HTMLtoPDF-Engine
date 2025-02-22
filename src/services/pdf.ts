import { Browser, launch } from 'puppeteer';
import { GeneratePDFRequest } from '../types/api';
import { CalendarGenerator } from './calendar';
import * as yaml from 'js-yaml';
import * as fs from 'fs/promises';
import * as path from 'path';

interface PDFConfig {
  pdf: {
    output: {
      directory: string;
      format: string;
      margin: string;
      dpi: number;
    };
  };
}

/**
 * PDF生成サービス
 */
export class PDFService {
  private browser: Browser | null = null;
  private calendarGenerator: CalendarGenerator;
  private config!: PDFConfig;

  constructor() {
    this.calendarGenerator = new CalendarGenerator();
  }

  /**
   * 初期化
   */
  async initialize(): Promise<void> {
    if (!this.browser) {
      // 設定ファイルの読み込み
      const configPath = path.join(__dirname, '../../docs/config/default.yml');
      const configFile = await fs.readFile(configPath, 'utf-8');
      this.config = yaml.load(configFile) as any;

      this.browser = await launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        headless: true
      });
    }
  }

  /**
   * PDF生成
   */
  public async generatePDF(request: GeneratePDFRequest): Promise<Buffer> {
    try {
      await this.initialize();

      // カレンダーHTMLの生成
      const html = await this.calendarGenerator.generateHTML(request);

      // PDFの生成
      const page = await this.browser!.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      // 設定に基づいてPDFオプションを設定
      const pdfBuffer = await page.pdf({
        format: this.config.pdf.output.format as 'A4',
        margin: {
          top: this.config.pdf.output.margin,
          right: this.config.pdf.output.margin,
          bottom: this.config.pdf.output.margin,
          left: this.config.pdf.output.margin
        },
        printBackground: true,
        // DPI設定（72がデフォルト）
        scale: this.config.pdf.output.dpi / 72
      });

      await page.close();
      return Buffer.from(pdfBuffer);

    } catch (error) {
      console.error('PDF生成エラー:', error);
      throw error;
    }
  }

  /**
   * クリーンアップ
   */
  async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
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

  /**
   * 利用可能なテンプレート一覧を取得
   */
  public getTemplates(): Array<{
    id: string;
    name: string;
    description: string;
  }> {
    return [
      {
        id: 'report',
        name: 'レポート',
        description: 'テスト用テンプレート'
      }
    ];
  }
}
