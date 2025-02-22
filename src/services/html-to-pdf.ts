import * as puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

interface TemplateData {
  furigana?: string;
  user_name?: string;
  birth_date?: string;
  address?: string;
  [key: string]: string | undefined;
}

export class HtmlToPdfConverter {
  private templatePath: string;

  constructor(templatePath: string) {
    this.templatePath = templatePath;
  }

  private async readTemplate(): Promise<string> {
    try {
      return await fs.promises.readFile(this.templatePath, 'utf-8');
    } catch (error) {
      console.error(`Error reading template from ${this.templatePath}:`, error);
      throw new Error(`Template読み込みエラー: ${error}`);
    }
  }

  private replaceTemplateVariables(template: string, data: TemplateData): string {
    // CSSの調整を含むテンプレートの修正
    let modifiedTemplate = template.replace(
      /@page\s*{[^}]*}/,
      `@page {
        size: A4;
        margin: 15mm;
      }`
    );

    // コンテナのスタイル調整
    modifiedTemplate = modifiedTemplate.replace(
      /\.container\s*{[^}]*}/,
      `.container {
        max-width: 100%;
        margin: 0 auto;
        padding: 0;
        box-sizing: border-box;
        min-height: calc(100vh - 30mm);
        display: flex;
        flex-direction: column;
      }`
    );

    // フッター部分のスタイル調整
    const footerStyle = `
      .footer-content {
        margin-top: auto;
        padding-top: 20px;
      }
    `;
    modifiedTemplate = modifiedTemplate.replace('</style>', `${footerStyle}</style>`);

    // 変数の置換（存在しない変数は空文字に）
    return modifiedTemplate.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      if (!(key in data)) {
        console.warn(`テンプレート変数 ${key} が見つかりませんでした。空文字に置換します。`);
      }
      return data[key] || '';
    });
  }

  async convertToPdf(data: TemplateData, outputPath: string): Promise<void> {
    let browser: puppeteer.Browser | undefined;
    const tempHtmlPath = path.join(path.dirname(outputPath), '_temp.html');

    try {
      const template = await this.readTemplate();
      const htmlContent = this.replaceTemplateVariables(template, data);

      // テンプレートの書き込み
      try {
        await fs.promises.writeFile(tempHtmlPath, htmlContent);
      } catch (error) {
        console.error('テンプレートファイルの書き込みエラー:', error);
        throw new Error(`テンプレート書き込みエラー: ${error}`);
      }

      // Puppeteerの起動
      try {
        browser = await puppeteer.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
      } catch (error) {
        console.error('Puppeteerの起動エラー:', error);
        throw new Error(`Puppeteer起動エラー: ${error}`);
      }

      const page = await browser.newPage();

      // A4サイズに合わせたビューポート設定
      await page.setViewport({
        width: 794,
        height: 1123,
        deviceScaleFactor: 1,
      });

      // ローカルHTMLファイルを開く
      try {
        await page.goto(`file://${tempHtmlPath}`, {
          waitUntil: 'networkidle0',
        });
      } catch (error) {
        console.error('HTMLファイルの読み込みエラー:', error);
        throw new Error(`HTML読み込みエラー: ${error}`);
      }

      // PDF生成
      try {
        await page.pdf({
          path: outputPath,
          format: 'A4',
          printBackground: true,
          preferCSSPageSize: true,
        });
      } catch (error) {
        console.error('PDF生成エラー:', error);
        throw new Error(`PDF生成エラー: ${error}`);
      }

      console.log('PDF generation completed successfully');
    } catch (error) {
      console.error('PDF conversion process failed:', error);
      throw error;
    } finally {
      // ブラウザが起動していたら必ず閉じる
      if (browser) {
        try {
          await browser.close();
        } catch (error) {
          console.error('ブラウザのクローズエラー:', error);
        }
      }
      // 一時ファイルが存在していれば削除する
      try {
        if (fs.existsSync(tempHtmlPath)) {
          await fs.promises.unlink(tempHtmlPath);
        }
      } catch (error) {
        console.error('一時ファイルの削除エラー:', error);
      }
    }
  }
}

// メイン実行部分
if (require.main === module) {
  async function main() {
    try {
      const templatePath = path.join(__dirname, '..', '..', 'templates', 'template.html');
      const outputDir = path.join(__dirname, '..', '..', 'output');

      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const outputPath = path.join(outputDir, 'visiting-nurse-report.pdf');

      const sampleData = {
        furigana: 'ヤマダ タロウ',
        user_name: '山田 太郎',
        birth_date: '1990年1月1日',
        address: '東京都渋谷区渋谷1-1-1',
        circleDates: '2025-02-22,2025-02-25',
        triangleDates: '2025-02-23',
        crossDates: '2025-02-24',
        diamondDates: '2025-02-26',
      };

      const converter = new HtmlToPdfConverter(templatePath);
      await converter.convertToPdf(sampleData, outputPath);

      console.log(`PDF file has been created successfully at: ${outputPath}`);
    } catch (error) {
      console.error('Error in main execution:', error);
      process.exit(1);
    }
  }

  main();
}
