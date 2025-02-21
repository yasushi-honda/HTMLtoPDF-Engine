import { GeneratePDFRequest } from '../types/api';

/**
 * カレンダー生成サービス
 */
export class CalendarGenerator {
  /**
   * カレンダーHTMLの生成
   */
  public async generateHTML(request: GeneratePDFRequest): Promise<string> {
    const { year, month, overlay = [] } = request;

    if (year === undefined || month === undefined) {
      throw new Error('Year and month are required for calendar generation');
    }

    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
    
    // カレンダーのHTMLを生成
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Calendar ${year}/${month}</title>
          <style>
            ${this.getStyles()}
          </style>
        </head>
        <body>
          <div class="calendar">
            ${this.generateCalendarHeader(year, month)}
            ${this.generateCalendarBody(firstDayOfMonth, daysInMonth, overlay)}
          </div>
        </body>
      </html>
    `;

    return html;
  }

  /**
   * スタイルの取得
   */
  private getStyles(): string {
    return `
      body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 20px;
      }
      .calendar {
        width: 100%;
        border-collapse: collapse;
      }
      .calendar th {
        padding: 10px;
        text-align: center;
        background-color: #f5f5f5;
      }
      .calendar td {
        width: 14.28%;
        padding: 10px;
        text-align: center;
        border: 1px solid #ddd;
        position: relative;
        height: 80px;
        vertical-align: top;
      }
      .calendar-date {
        position: relative;
        z-index: 2;
        font-size: 1.2em;
      }
      .calendar-overlay {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 1;
        width: 40px;
        height: 40px;
      }
      .overlay-circle {
        border: 2px solid #ff0000;
        border-radius: 50%;
      }
      .overlay-triangle {
        width: 0;
        height: 0;
        border-left: 20px solid transparent;
        border-right: 20px solid transparent;
        border-bottom: 34.6px solid #00ff00;
        background: transparent;
      }
      .overlay-cross::before,
      .overlay-cross::after {
        content: '';
        position: absolute;
        background: #0000ff;
        width: 2px;
        height: 40px;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) rotate(45deg);
      }
      .overlay-cross::after {
        transform: translate(-50%, -50%) rotate(-45deg);
      }
      .overlay-diamond {
        transform: translate(-50%, -50%) rotate(45deg);
        border: 2px solid #ff00ff;
        width: 28px;
        height: 28px;
      }
    `;
  }

  /**
   * カレンダーヘッダーの生成
   */
  private generateCalendarHeader(year: number, month: number): string {
    const weekDays = ['日', '月', '火', '水', '木', '金', '土'];
    
    return `
      <table class="calendar">
        <thead>
          <tr>
            <th colspan="7">${year}年${month}月</th>
          </tr>
          <tr>
            ${weekDays.map(day => `<th>${day}</th>`).join('')}
          </tr>
        </thead>
    `;
  }

  /**
   * カレンダー本体の生成
   */
  private generateCalendarBody(firstDay: number, daysInMonth: number, overlays: Array<{type: string, days: number[]}>): string {
    let html = '<tbody>';
    let day = 1;
    let position = 0;

    while (day <= daysInMonth) {
      html += '<tr>';
      
      for (let i = 0; i < 7; i++) {
        if (position < firstDay || day > daysInMonth) {
          html += '<td></td>';
        } else {
          const currentDay = day;
          const dayOverlays = overlays.filter(o => o.days.includes(currentDay));
          
          html += `
            <td>
              <div class="calendar-date">${day}</div>
              ${dayOverlays.map(o => this.generateOverlay(o.type)).join('')}
            </td>
          `;
          day++;
        }
        position++;
      }
      
      html += '</tr>';
    }

    return html + '</tbody></table>';
  }

  /**
   * オーバーレイの生成
   */
  private generateOverlay(type: string): string {
    const classMap = {
      circle: 'overlay-circle',
      triangle: 'overlay-triangle',
      cross: 'overlay-cross',
      diamond: 'overlay-diamond'
    };

    const overlayClass = classMap[type as keyof typeof classMap] || '';
    return `<div class="calendar-overlay ${overlayClass}"></div>`;
  }
}
