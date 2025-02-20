import { CalendarOptions, CalendarDay, Overlay, OverlayType } from '../types/calendar';

/**
 * カレンダー生成サービス
 */
export class CalendarService {
  /**
   * 指定された年月のカレンダー情報を生成
   * @param options カレンダー生成オプション
   * @returns カレンダーの日付情報配列
   */
  public generateCalendarDays(options: CalendarOptions): CalendarDay[] {
    const { year, month, overlay } = options;
    const daysInMonth = new Date(year, month, 0).getDate();
    const days: CalendarDay[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const overlayType = this.getOverlayType(day, overlay);
      days.push({
        day,
        overlayType,
        className: this.generateClassName(day, overlayType),
      });
    }

    return days;
  }

  /**
   * カレンダーのHTMLを生成
   * @param options カレンダー生成オプション
   * @returns HTML文字列
   */
  public generateCalendarHTML(options: CalendarOptions): string {
    const days = this.generateCalendarDays(options);
    const rows: string[] = [];
    let currentRow: string[] = [];

    days.forEach((day, index) => {
      currentRow.push(this.generateDayCell(day));
      if ((index + 1) % 7 === 0 || index === days.length - 1) {
        // 週の最後または月の最後
        while (currentRow.length < 7) {
          currentRow.push('<td></td>'); // 空セルで埋める
        }
        rows.push(`<tr>${currentRow.join('')}</tr>`);
        currentRow = [];
      }
    });

    return `<table class="exact-calendar">
      ${rows.join('\n')}
    </table>`;
  }

  /**
   * 指定された日付に適用するオーバーレイタイプを取得
   */
  private getOverlayType(day: number, overlay: Overlay[]): OverlayType | undefined {
    const matchingOverlay = overlay.find((o) => o.days.includes(day));
    return matchingOverlay?.type;
  }

  /**
   * 日付セルのCSSクラス名を生成
   */
  private generateClassName(day: number, overlayType?: OverlayType): string {
    const classes = ['day'];
    if (overlayType) {
      classes.push(overlayType);
    }
    return classes.join(' ');
  }

  /**
   * 日付セルのHTML要素を生成
   */
  private generateDayCell(day: CalendarDay): string {
    return `<td class="${day.className}">${day.day}</td>`;
  }
}
