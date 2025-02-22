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

/**
 * A helper function that wraps a promise and throws an error with a provided message.
 */
const withErrorHandling = async <T>(promise: Promise<T>, errorMessage: string): Promise<T> => {
  try {
    return await promise;
  } catch (error) {
    console.error(`${errorMessage}:`, error);
    throw new Error(`${errorMessage}: ${error}`);
  }
};

export class HtmlToPdfConverter {
  private templatePath: string;

  constructor(templatePath: string) {
    this.templatePath = templatePath;
  }

  private async readTemplate(): Promise<string> {
    return withErrorHandling(
      fs.promises.readFile(this.templatePath, 'utf-8'),
      `Error reading template from ${this.templatePath}`
    );
  }

  private replaceTemplateVariables(template: string, data: TemplateData): string {
    // Adjust @page CSS
    let modifiedTemplate = template.replace(
      /@page\s*{[^}]*}/,
      `@page {
        size: A4;
        margin: 15mm;
      }`
    );

    // Adjust container style
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

    // Append footer style
    const footerStyle = `
      .footer-content {
        margin-top: auto;
        padding-top: 20px;
      }
    `;
    modifiedTemplate = modifiedTemplate.replace('</style>', `${footerStyle}</style>`);

    // Replace template variables (undefined variables will be replaced with an empty string)
    return modifiedTemplate.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      if (!(key in data)) {
        console.warn(`Template variable ${key} not found; replacing with empty string.`);
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

      // Write temporary HTML file
      await withErrorHandling(
        fs.promises.writeFile(tempHtmlPath, htmlContent),
        'Error writing template file'
      );

      // Launch Puppeteer
      browser = await withErrorHandling(
        puppeteer.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        }),
        'Error launching Puppeteer'
      );

      const page = await browser.newPage();

      // Set viewport for A4 size
      await page.setViewport({
        width: 794,
        height: 1123,
        deviceScaleFactor: 1,
      });

      // Navigate to the local HTML file
      await withErrorHandling(
        page.goto(`file://${tempHtmlPath}`, { waitUntil: 'networkidle0' }),
        'Error loading HTML file'
      );

      // Generate PDF
      await withErrorHandling(
        page.pdf({
          path: outputPath,
          format: 'A4',
          printBackground: true,
          preferCSSPageSize: true,
        }),
        'Error generating PDF'
      );

      console.log('PDF generation completed successfully');
    } catch (error) {
      console.error('PDF conversion process failed:', error);
      throw error;
    } finally {
      // Always close the browser if it was launched
      if (browser) {
        try {
          await browser.close();
        } catch (error) {
          console.error('Error closing browser:', error);
        }
      }
      // Asynchronously check for temporary file and delete it if exists
      try {
        await fs.promises.access(tempHtmlPath, fs.constants.F_OK);
        await fs.promises.unlink(tempHtmlPath);
      } catch (err) {
        // If the file does not exist or deletion fails, ignore the error
      }
    }
  }
}

// Main execution as a function expression instead of a declaration within a block
const main = async (): Promise<void> => {
  try {
    const templatePath = path.join(__dirname, '..', '..', 'templates', 'template.html');
    const outputDir = path.join(__dirname, '..', '..', 'output');

    // Create output directory if it does not exist
    try {
      await fs.promises.access(outputDir, fs.constants.F_OK);
    } catch {
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
};

// Execute main function
main();
