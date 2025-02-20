import { PDFService } from '../services/pdf';
import { GeneratePDFRequest } from '../types/api';
import { expect, test, describe } from '@jest/globals';

describe('PDFService', () => {
  let service: PDFService;

  beforeEach(() => {
    service = new PDFService();
  });

  describe('generatePDF', () => {
    test('PDFを生成できること', async () => {
      const request: GeneratePDFRequest = {
        template: 'calendar',
        data: {
          title: 'テストカレンダー'
        },
        year: 2025,
        month: 2,
        overlay: [{
          type: 'circle',
          days: [1, 15]
        }]
      };

      const pdf = await service.generatePDF(request);
      expect(Buffer.isBuffer(pdf)).toBe(true);
      expect(pdf.length).toBeGreaterThan(0);
    }, 30000); // タイムアウトを30秒に延長

    test('オーバーレイなしでPDFを生成できること', async () => {
      const request: GeneratePDFRequest = {
        template: 'calendar',
        data: {
          title: 'シンプルカレンダー'
        },
        year: 2025,
        month: 2,
        overlay: []
      };

      const pdf = await service.generatePDF(request);
      expect(Buffer.isBuffer(pdf)).toBe(true);
      expect(pdf.length).toBeGreaterThan(0);
    }, 30000); // タイムアウトを30秒に延長

    test('should handle errors gracefully', async () => {
      const request: GeneratePDFRequest = {
        template: 'calendar',
        data: {
          title: 'エラーカレンダー'
        },
        year: -1, // 不正な年
        month: 13, // 不正な月
        overlay: []
      };

      await expect(service.generatePDF(request)).rejects.toThrow();
    }, 30000); // タイムアウトを30秒に延長
  });

  describe('generatePreviewHtml', () => {
    test('should generate preview HTML', async () => {
      const request: GeneratePDFRequest = {
        template: 'calendar',
        data: {
          title: 'テストカレンダー'
        },
        year: 2025,
        month: 2,
        overlay: [{
          type: 'circle',
          days: [1, 15]
        }]
      };

      const html = await service.generatePreviewHtml(request);
      
      expect(typeof html).toBe('string');
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('2025年2月');
    }, 30000); // タイムアウトを30秒に延長

    test('should handle errors gracefully', async () => {
      const request: GeneratePDFRequest = {
        template: 'calendar',
        data: {
          title: 'エラーカレンダー'
        },
        year: -1, // 不正な年
        month: 13, // 不正な月
        overlay: []
      };

      await expect(service.generatePreviewHtml(request)).rejects.toThrow();
    }, 30000); // タイムアウトを30秒に延長
  });
});
