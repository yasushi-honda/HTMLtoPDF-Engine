import { TemplateDefinition, TemplateRegistry, TemplateVariable } from '../types/template';
import fs from 'fs/promises';
import path from 'path';

/**
 * テンプレートレジストリの実装
 */
export class TemplateRegistryImpl implements TemplateRegistry {
  private templates: Map<string, TemplateDefinition> = new Map();

  constructor() {}

  /**
   * テンプレートの追加
   */
  public addTemplate(template: TemplateDefinition): void {
    // テンプレートの検証
    const errors = this.validateTemplate(template);
    if (errors.length > 0) {
      throw new Error(`Invalid template: ${errors.join(', ')}`);
    }

    this.templates.set(template.id, template);
  }

  /**
   * テンプレートの取得
   */
  public getTemplate(id: string): TemplateDefinition | undefined {
    return this.templates.get(id);
  }

  /**
   * テンプレート一覧の取得
   */
  public listTemplates(): TemplateDefinition[] {
    return Array.from(this.templates.values());
  }

  /**
   * テンプレートの検証
   */
  public validateTemplate(template: TemplateDefinition): string[] {
    const errors: string[] = [];

    // 必須フィールドの検証
    if (!template.id) errors.push('Template ID is required');
    if (!template.name) errors.push('Template name is required');
    if (!template.templatePath) errors.push('Template path is required');

    // 変数の検証
    if (template.variables) {
      template.variables.forEach((variable, index) => {
        const variableErrors = this.validateVariable(variable);
        errors.push(...variableErrors.map(err => `Variable ${index}: ${err}`));
      });
    }

    return errors;
  }

  /**
   * 変数の検証
   */
  private validateVariable(variable: TemplateVariable): string[] {
    const errors: string[] = [];

    if (!variable.name) errors.push('Variable name is required');
    if (!variable.type) errors.push('Variable type is required');

    const validTypes = ['string', 'number', 'date', 'boolean', 'array'];
    if (!validTypes.includes(variable.type)) {
      errors.push(`Invalid variable type: ${variable.type}`);
    }

    if (variable.type === 'array' && !variable.arrayElementType) {
      errors.push('Array element type is required for array variables');
    }

    return errors;
  }

  /**
   * テンプレートHTMLの読み込み
   */
  public async loadTemplateHtml(templateId: string): Promise<string> {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    try {
      const templatePath = path.resolve(template.templatePath);
      const html = await fs.readFile(templatePath, 'utf-8');
      return html;
    } catch (error) {
      throw new Error(`Failed to load template HTML: ${(error as Error).message}`);
    }
  }

  /**
   * テンプレート変数の適用
   */
  public applyVariables(html: string, variables: Record<string, any>): string {
    return html.replace(/\{\{\s*([^}]+)\s*\}\}/g, (match, key) => {
      const value = variables[key.trim()];
      return value !== undefined ? String(value) : match;
    });
  }

  /**
   * 変数の型変換
   */
  public convertVariableValue(
    value: any,
    type: TemplateVariable['type'],
    arrayElementType?: TemplateVariable['arrayElementType']
  ): any {
    switch (type) {
      case 'string':
        return String(value);
      case 'number':
        return Number(value);
      case 'boolean':
        return Boolean(value);
      case 'date':
        return new Date(value);
      case 'array':
        if (!Array.isArray(value)) {
          throw new Error('Value must be an array');
        }
        return value.map(item => this.convertVariableValue(item, arrayElementType!));
      default:
        return value;
    }
  }

  /**
   * テンプレートの検証とデータの変換
   */
  public validateAndConvertData(
    templateId: string,
    data: Record<string, any>
  ): Record<string, any> {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    const result: Record<string, any> = {};
    const errors: string[] = [];

    // 各変数の検証と変換
    for (const variable of template.variables) {
      const value = data[variable.name];

      // 必須項目のチェック
      if (variable.required && value === undefined) {
        errors.push(`Missing required variable: ${variable.name}`);
        continue;
      }

      // 値が未定義で、デフォルト値がある場合
      if (value === undefined && variable.defaultValue !== undefined) {
        result[variable.name] = variable.defaultValue;
        continue;
      }

      // 値が存在する場合は型変換を試みる
      if (value !== undefined) {
        try {
          result[variable.name] = this.convertVariableValue(
            value,
            variable.type,
            variable.arrayElementType
          );
        } catch (error) {
          errors.push(`Invalid value for ${variable.name}: ${(error as Error).message}`);
        }
      }
    }

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    return result;
  }
}
