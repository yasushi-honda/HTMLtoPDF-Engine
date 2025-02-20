import { CalendarService } from '../services/calendar';
import { CalendarOptions } from '../types/calendar';

describe('CalendarService', () => {
  let service: CalendarService;

  beforeEach(() => {
    service = new CalendarService();
  });

  describe('generateCalendarDays', () => {
    it('正しい日数のカレンダーを生成すること', () => {
      const options: CalendarOptions = {
        year: 2025,
        month: 2, // 2月
        overlay: [],
      };

      const days = service.generateCalendarDays(options);
      expect(days.length).toBe(28); // 2025年2月は28日まで
    });

    it('オーバーレイが正しく適用されること', () => {
      const options: CalendarOptions = {
        year: 2025,
        month: 2,
        overlay: [
          { type: 'circle', days: [1, 15] },
          { type: 'triangle', days: [10, 20] },
        ],
      };

      const days = service.generateCalendarDays(options);
      
      // 1日目と15日目に○が付いているか確認
      expect(days[0].overlayType).toBe('circle');
      expect(days[14].overlayType).toBe('circle');
      
      // 10日目と20日目に△が付いているか確認
      expect(days[9].overlayType).toBe('triangle');
      expect(days[19].overlayType).toBe('triangle');
    });
  });

  describe('generateCalendarHTML', () => {
    it('有効なHTML文字列を生成すること', () => {
      const options: CalendarOptions = {
        year: 2025,
        month: 2,
        overlay: [
          { type: 'circle', days: [1] },
        ],
      };

      const html = service.generateCalendarHTML(options);
      
      // 基本的なHTML構造の確認
      expect(html).toContain('<table class="exact-calendar">');
      expect(html).toContain('</table>');
      
      // オーバーレイの確認
      expect(html).toContain('class="day circle"');
    });

    it('月末の空セルが正しく追加されること', () => {
      const options: CalendarOptions = {
        year: 2025,
        month: 2,
        overlay: [],
      };

      const html = service.generateCalendarHTML(options);
      const emptyTdCount = (html.match(/<td><\/td>/g) || []).length;
      
      // 28日の後に空セルが追加されているか確認
      expect(emptyTdCount).toBeGreaterThan(0);
    });
  });
});
