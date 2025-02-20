import { PDFService } from '../services/pdf';
import { GeneratePDFRequest } from '../types/api';
import { expect } from 'chai';

describe('PDFService', () => {
  let service: PDFService;

  beforeEach(() => {
    service = new PDFService();
  });

  describe('generatePDF', () => {
    it('should generate a PDF file', async () => {
      const request: GeneratePDFRequest = {
        year: 2025,
        month: 2,
        overlay: [
          {
            days: [1, 15],
            type: 'circle'
          }
        ]
      };

      const pdf = await service.generatePDF(request);
      
      expect(pdf).toBeInstanceOf(Buffer);
      expect(pdf.length).toBeGreaterThan(0);
    }, 30000); // タイムアウトを30秒に延長

    it('should handle errors gracefully', async () => {
      const request: GeneratePDFRequest = {
        year: -1, // 不正な年
        month: 13, // 不正な月
        overlay: []
      };

      await expect(service.generatePDF(request)).rejects.toThrow();
    }, 30000); // タイムアウトを30秒に延長
  });

  describe('generatePreviewHtml', () => {
    it('should generate preview HTML', async () => {
      const request: GeneratePDFRequest = {
        year: 2025,
        month: 2,
        overlay: [
          {
            days: [1, 15],
            type: 'circle'
          }
        ]
      };

      const html = await service.generatePreviewHtml(request);
      
      expect(typeof html).toBe('string');
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('2025年2月');
    }, 30000); // タイムアウトを30秒に延長

    it('should handle errors gracefully', async () => {
      const request: GeneratePDFRequest = {
        year: -1, // 不正な年
        month: 13, // 不正な月
        overlay: []
      };

      await expect(service.generatePreviewHtml(request)).rejects.toThrow();
    }, 30000); // タイムアウトを30秒に延長
  });
});
