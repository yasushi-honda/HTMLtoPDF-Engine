import puppeteer from 'puppeteer';
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
    return fs.promises.readFile(this.templatePath, 'utf-8');
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

    // 変数の置換
    return modifiedTemplate.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] || '';
    });
  }

  async convertToPdf(data: TemplateData, outputPath: string): Promise<void> {
    try {
      const template = await this.readTemplate();
      const htmlContent = this.replaceTemplateVariables(template, data);

      const tempHtmlPath = path.join(path.dirname(outputPath), '_temp.html');
      await fs.promises.writeFile(tempHtmlPath, htmlContent);

      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await browser.newPage();

      // A4サイズに合わせたビューポート設定
      await page.setViewport({
        width: 794,
        height: 1123,
        deviceScaleFactor: 1,
      });

      await page.goto(`file://${tempHtmlPath}`, {
        waitUntil: 'networkidle0',
      });

      await page.pdf({
        path: outputPath,
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
      });

      await browser.close();
      await fs.promises.unlink(tempHtmlPath);

      console.log('PDF generation completed successfully');
    } catch (error) {
      console.error('Error during PDF conversion:', error);
      throw new Error(`PDF conversion failed: ${error}`);
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
      };

      const converter = new HtmlToPdfConverter(templatePath);
      await converter.convertToPdf(sampleData, outputPath);

      console.log(`PDF file has been created successfully at: ${outputPath}`);
    } catch (error) {
      console.error('Error:', error);
      process.exit(1);
    }
  }

  main();
}
