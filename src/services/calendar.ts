import { GeneratePDFRequest } from '../types/api';

/**
 * カレンダー生成サービス
 */
export class CalendarGenerator {
  /**
   * カレンダーHTMLの生成
   */
  public async generateHTML(request: GeneratePDFRequest): Promise<string> {
    const { year, month, overlay } = request;
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
              background: #f0f0f0;
              padding: 10px;
              text-align: center;
              border: 1px solid #ddd;
            }
            .calendar td {
              width: 14.28%;
              height: 100px;
              border: 1px solid #ddd;
              vertical-align: top;
              padding: 5px;
              position: relative;
            }
            .date {
              font-size: 1.2em;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .circle {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              width: 40px;
              height: 40px;
              border: 2px solid red;
              border-radius: 50%;
            }
            .triangle {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              width: 0;
              height: 0;
              border-left: 20px solid transparent;
              border-right: 20px solid transparent;
              border-bottom: 40px solid blue;
            }
            .cross {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              color: green;
              font-size: 40px;
            }
            .diamond {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(45deg);
              width: 30px;
              height: 30px;
              background: purple;
            }
          </style>
        </head>
        <body>
          <h1>${year}年${month}月</h1>
          <table class="calendar">
            <tr>
              <th>日</th>
              <th>月</th>
              <th>火</th>
              <th>水</th>
              <th>木</th>
              <th>金</th>
              <th>土</th>
            </tr>
            ${this.generateCalendarBody(firstDayOfMonth, daysInMonth, overlay)}
          </table>
        </body>
      </html>
    `;

    return html;
  }

  /**
   * カレンダー本体の生成
   */
  private generateCalendarBody(firstDay: number, daysInMonth: number, overlay: { days: number[]; type: string; }[]): string {
    let html = '';
    let day = 1;
    let currentWeek = '';

    // 最初の週の空白を埋める
    for (let i = 0; i < firstDay; i++) {
      currentWeek += '<td></td>';
    }

    // 日付を埋める
    while (day <= daysInMonth) {
      if ((firstDay + day - 1) % 7 === 0 && day !== 1) {
        html += '<tr>' + currentWeek + '</tr>';
        currentWeek = '';
      }

      const overlayItem = overlay.find(item => item.days.includes(day));
      const overlayMark = overlayItem ? this.getOverlayMark(overlayItem.type) : '';

      currentWeek += `
        <td>
          <div class="date">${day}</div>
          ${overlayMark}
        </td>
      `;

      day++;
    }

    // 最後の週の空白を埋める
    const remainingCells = 7 - currentWeek.split('</td>').length + 1;
    for (let i = 0; i < remainingCells; i++) {
      currentWeek += '<td></td>';
    }
    html += '<tr>' + currentWeek + '</tr>';

    return html;
  }

  /**
   * オーバーレイマークの取得
   */
  private getOverlayMark(type: string): string {
    switch (type) {
      case 'circle':
        return '<div class="circle"></div>';
      case 'triangle':
        return '<div class="triangle"></div>';
      case 'cross':
        return '<div class="cross">×</div>';
      case 'diamond':
        return '<div class="diamond"></div>';
      default:
        return '';
    }
  }
}
