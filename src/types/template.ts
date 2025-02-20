/**
 * テンプレート変数の型定義
 */
export interface TemplateVariable {
  /** 変数名 */
  name: string;
  /** 変数の型 */
  type: 'string' | 'number' | 'date' | 'boolean' | 'array';
  /** 説明 */
  description: string;
  /** デフォルト値（オプション） */
  defaultValue?: any;
  /** 必須項目かどうか */
  required: boolean;
  /** 配列の場合の要素の型 */
  arrayElementType?: 'string' | 'number' | 'date' | 'boolean';
}

/**
 * テンプレート定義
 */
export interface TemplateDefinition {
  /** テンプレートID */
  id: string;
  /** テンプレート名 */
  name: string;
  /** 説明 */
  description: string;
  /** HTMLテンプレートのパス */
  templatePath: string;
  /** 使用可能な変数の定義 */
  variables: TemplateVariable[];
  /** PDFのデフォルト設定 */
  defaultPdfOptions?: {
    /** ページサイズ */
    format?: 'A4' | 'A3' | 'Letter';
    /** 向き */
    orientation?: 'portrait' | 'landscape';
    /** マージン */
    margin?: {
      top?: string;
      right?: string;
      bottom?: string;
      left?: string;
    };
  };
}

/**
 * テンプレートレジストリ
 */
export interface TemplateRegistry {
  /**
   * テンプレートの追加
   */
  addTemplate(template: TemplateDefinition): void;
  /**
   * テンプレートの取得
   */
  getTemplate(id: string): TemplateDefinition | undefined;
  /**
   * テンプレート一覧の取得
   */
  listTemplates(): TemplateDefinition[];
  /**
   * テンプレートの検証
   * @returns エラーメッセージの配列。問題がなければ空配列
   */
  validateTemplate(template: TemplateDefinition): string[];
}
