import { CalendarGenerator } from '../services/calendar';
import { GeneratePDFRequest } from '../types/api';

describe('CalendarGenerator', () => {
  const generator = new CalendarGenerator();

  it('should generate HTML for a calendar', async () => {
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

    const html = await generator.generateHTML(request);
    
    // 基本的なHTML構造の確認
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<html>');
    expect(html).toContain('</html>');
    
    // カレンダーのタイトル確認
    expect(html).toContain('2025年2月');
    
    // 曜日ヘッダーの確認
    expect(html).toContain('<th>日</th>');
    expect(html).toContain('<th>月</th>');
    expect(html).toContain('<th>火</th>');
    expect(html).toContain('<th>水</th>');
    expect(html).toContain('<th>木</th>');
    expect(html).toContain('<th>金</th>');
    expect(html).toContain('<th>土</th>');
    
    // オーバーレイの確認
    expect(html).toContain('<div class="circle"></div>');
  });

  it('should handle different overlay types', async () => {
    const request: GeneratePDFRequest = {
      year: 2025,
      month: 2,
      overlay: [
        { days: [1], type: 'circle' },
        { days: [2], type: 'triangle' },
        { days: [3], type: 'cross' },
        { days: [4], type: 'diamond' }
      ]
    };

    const html = await generator.generateHTML(request);
    
    expect(html).toContain('<div class="circle"></div>');
    expect(html).toContain('<div class="triangle"></div>');
    expect(html).toContain('<div class="cross">×</div>');
    expect(html).toContain('<div class="diamond"></div>');
  });
});
