/**
 * カレンダーのオーバーレイタイプ
 */
export type OverlayType = 'circle' | 'triangle' | 'diamond' | 'cross';

/**
 * オーバーレイ設定
 */
export interface Overlay {
  /** オーバーレイの種類（○、△、◇、×） */
  type: OverlayType;
  /** オーバーレイを適用する日付の配列 */
  days: number[];
}

/**
 * カレンダー生成のオプション
 */
export interface CalendarOptions {
  /** 年 */
  year: number;
  /** 月（1-12） */
  month: number;
  /** オーバーレイ設定の配列 */
  overlay: Overlay[];
}

/**
 * カレンダーの日付情報
 */
export interface CalendarDay {
  /** 日付 */
  day: number;
  /** 適用されるオーバーレイの種類（複数ある場合は最初のもの） */
  overlayType?: OverlayType;
  /** CSSクラス名 */
  className: string;
}
