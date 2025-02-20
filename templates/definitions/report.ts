import { TemplateDefinition } from '../../src/types/template';
import path from 'path';

export const reportTemplate: TemplateDefinition = {
  id: 'report',
  name: '基本レポートテンプレート',
  description: '基本的なレポート形式のテンプレートです。タイトル、サブタイトル、データテーブルなどを含みます。',
  templatePath: path.resolve(__dirname, '../report.html'),
  variables: [
    {
      name: 'title',
      type: 'string',
      description: 'レポートのタイトル',
      required: true
    },
    {
      name: 'subtitle',
      type: 'string',
      description: 'レポートのサブタイトル',
      required: false,
      defaultValue: ''
    },
    {
      name: 'date',
      type: 'date',
      description: 'レポート作成日',
      required: true
    },
    {
      name: 'summary',
      type: 'string',
      description: 'レポートの概要',
      required: true
    },
    {
      name: 'tableHeaders',
      type: 'array',
      arrayElementType: 'string',
      description: 'テーブルのヘッダー',
      required: false,
      defaultValue: []
    },
    {
      name: 'items',
      type: 'array',
      arrayElementType: 'array',
      description: 'テーブルのデータ（配列の配列）',
      required: false,
      defaultValue: []
    },
    {
      name: 'notes',
      type: 'string',
      description: '備考',
      required: false,
      defaultValue: ''
    },
    {
      name: 'footer',
      type: 'string',
      description: 'フッターテキスト',
      required: false,
      defaultValue: '© 2025 Your Company Name'
    }
  ],
  defaultPdfOptions: {
    format: 'A4',
    orientation: 'portrait',
    margin: {
      top: '20mm',
      right: '20mm',
      bottom: '20mm',
      left: '20mm'
    }
  }
};
