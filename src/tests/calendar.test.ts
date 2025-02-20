import { CalendarGenerator } from '../services/calendar';
import { GeneratePDFRequest } from '../types/api';

describe('CalendarGenerator', () => {
  const generator = new CalendarGenerator();

  it('カレンダーHTMLを生成できること', async () => {
    const request: GeneratePDFRequest = {
      template: 'calendar',
      data: {},
      year: 2025,
      month: 2,
      overlay: [{
        type: 'circle',
        days: [1, 15]
      }]
    };

    const html = await generator.generateHTML(request);
    expect(html).toContain('2025年2月');
    expect(html).toContain('circle');
  });

  it('複数のオーバーレイを生成できること', async () => {
    const request: GeneratePDFRequest = {
      template: 'calendar',
      data: {},
      year: 2025,
      month: 2,
      overlay: [
        { type: 'circle', days: [1, 2] },
        { type: 'triangle', days: [15] },
        { type: 'cross', days: [20] },
        { type: 'diamond', days: [25] }
      ]
    };

    const html = await generator.generateHTML(request);
    expect(html).toContain('circle');
    expect(html).toContain('triangle');
    expect(html).toContain('cross');
    expect(html).toContain('diamond');
  });
});
