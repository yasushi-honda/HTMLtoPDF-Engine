# 動的オーバーレイ付き HTML → PDF 生成設計書

以下のドキュメントでは、**Workload Identity** を使用した認証構成や **AppSheet** との連携を含め、
抜け漏れのない形で **HTML → PDF 変換 + Google Drive アップロード** の全体フローをまとめます。

## 目次
1. [システム概要](#システム概要)
2. [全体アーキテクチャ](#全体アーキテクチャ)
3. [機能要件とフロー](#機能要件とフロー)
4. [詳細設計](#詳細設計)
5. [AppSheet 側の設定](#AppSheet-側の設定)
6. [Workload Identity 構成](#Workload-Identity-構成)
7. [エラーハンドリング](#エラーハンドリング)
8. [セキュリティ対策](#セキュリティ対策)
9. [テスト計画](#テスト計画)
10. [負荷テスト設計](#負荷テスト設計)
11. [まとめ](#まとめ)

---

## システム概要

- **目的：**
  1. 雛形 HTML に利用者情報や日付を反映しながら **動的にカレンダー部分を生成**。
  2. **特定の日付** に対して、HTML/CSS で **円・三角形・×印など** のオーバーレイを適用。
  3. その完成した HTML を puppeteer で PDF 化。
  4. PDF を **Google Drive** にアップロード。
  5. アップロード先の **Drive URL** を **AppSheet** に返却。

- **認証：**
  - Cloud Run → Google Drive 間の認証は **Workload Identity** を使用。
  - AppSheet からのリクエストにも特別なキーは不要（ただし GCP 側の設定により認可）。


## 全体アーキテクチャ

```mermaid
graph LR
    A[AppSheet] -->|JSON/POST| B((Cloud Run))
    B -->|puppeteer<br>HTML->PDF| C[PDF Buffer]
    B -->|Drive API| D((Google Drive))
    C --> D
    D -->|URL| A
```

1. **AppSheet** が Cloud Run のエンドポイントに JSON を POST。
2. **Cloud Run** が HTML テンプレート + オーバーレイ設定 + puppeteer による PDF 生成。
3. 生成した PDF バッファを **Google Drive** にアップロード。
4. **アップロード完了** 後、生成された PDF の Drive リンクを **AppSheet** に返す。

---

## 機能要件とフロー

1. **カレンダー自動生成**
   - パラメーターに含まれる年・月から日数を計算し、日付 `<span>` を動的作成。
   - `overlay` に指定された日付にはオーバーレイクラス（例: `.circle`, `.triangle`）を付与。

2. **HTML → PDF**
   - puppeteer で headless Chrome を起動し、最終的な HTML をレンダリング。
   - `page.pdf()` で A4 等の形式で PDF を生成。

3. **Google Drive アップロード**
   - Workload Identity ベースで Google Drive API を使用。
   - `drive.files.create()` でフォルダに格納し、ファイル ID を取得。
   - ファイル ID から閲覧用リンクを生成して返却。

4. **AppSheet 連携**
   - AppSheet の「Call a webhook」アクションや Bot を利用。
   - 生成された PDF リンクをテーブルに格納・表示。

---

## 詳細設計

### カレンダー生成仕様

1. **基本レイアウト**
   - 週始め: 日曜日
   - 表示形式: 月単位のグリッド表示
   - セル内容: 日付と該当するオーバーレイ

2. **オーバーレイ表示仕様**
   - 表示位置: 日付の上に重ねて表示
   - 複数指定: 全てのオーバーレイを重ねて表示
   - 対応図形:
     - 円（circle）: 日付を囲む円形
     - 三角形（triangle）: 日付の上部に三角形
     - ×印（cross）: 日付に重ねて表示
     - ダイヤ（diamond）: 日付を囲むダイヤ形

3. **スタイル定義**
   ```css
   .calendar-overlay {
     position: absolute;
     top: 50%;
     left: 50%;
     transform: translate(-50%, -50%);
     z-index: 1;
   }
   .calendar-date {
     position: relative;
     z-index: 2;
   }
   ```

### 実装フェーズ

1. **フェーズ1（デモ優先）**
   - 基本カレンダー生成
   - PDF出力設定の最適化
   - ローカルでの動作確認

2. **フェーズ2**
   - オーバーレイ機能の実装
   - 複数オーバーレイの重ね合わせ
   - スタイル調整

3. **フェーズ3**
   - Google Drive連携
   - AppSheet連携
   - エラーハンドリング完備

### 1. 雛形 HTML (例)

```html
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <title>訪問看護報告書</title>
    <style>
        /* カレンダー・オーバーレイ用クラス */
        .day {
            position: relative;
            width: 24px;
            height: 24px;
            display: inline-block;
            text-align: center;
        }
        .circle::before {
            content: "\25CB"; /* ○ */
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 14pt;
        }
        .triangle::before {
            content: "\25B3"; /* △ */
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 14pt;
        }
        /* 他にも diamond や cross など定義可能 */
    </style>
</head>
<body>
    <h1>訪問看護報告書</h1>
    <div id="calendar">
        <!-- 動的に挿入される日付セル -->
    </div>
</body>
</html>
```

### 2. 動的カレンダー生成

- サーバーサイド（Node.js） or クライアントサイド（puppeteer 内 JavaScript）で以下を行う：

```js
function generateCalendarHTML(year, month, overlay) {
  const daysInMonth = new Date(year, month, 0).getDate();
  let html = '';
  for (let d = 1; d <= daysInMonth; d++) {
    // overlay の判定
    let classes = 'day';
    overlay.forEach(item => {
      if (item.days.includes(d)) {
        classes += ` ${item.type}`; // circle, triangle等
      }
    });
    html += `<span data-day="${d}" class="${classes}">${d}</span>`;
  }
  return html;
}
```

- 生成後、`<div id="calendar">...</div>` に挿入。

### 3. Cloud Run (Node.js) 例

```js
// server.js
const express = require('express');
const puppeteer = require('puppeteer');
const { google } = require('googleapis');
const fs = require('fs');

const app = express();
app.use(express.json());

// Google Drive にアップロードする関数
async function uploadToDrive(pdfBuffer, folderId) {
  // Workload Identity 連携の場合
  const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  });
  const drive = google.drive({ version: 'v3', auth });

  const fileMetadata = {
    name: `report-${Date.now()}.pdf`,
    parents: [folderId],
  };
  const media = {
    mimeType: 'application/pdf',
    body: Buffer.from(pdfBuffer),
  };

  const file = await drive.files.create({
    resource: fileMetadata,
    media,
    fields: 'id',
  });
  return `https://drive.google.com/file/d/${file.data.id}/view`;
}

function generateCalendarHTML(year, month, overlay) {
  const daysInMonth = new Date(year, month, 0).getDate();
  let html = '';
  for (let d = 1; d <= daysInMonth; d++) {
    let classes = 'day';
    overlay.forEach(item => {
      if (item.days.includes(d)) {
        classes += ` ${item.type}`;
      }
    });
    html += `<span data-day="${d}" class="${classes}">${d}</span>`;
  }
  return html;
}

app.post('/generate-pdf', async (req, res) => {
  try {
    const { year, month, overlay, output_folder_id } = req.body;
    if (!year || !month || !Array.isArray(overlay) || !output_folder_id) {
      throw new Error('Invalid or missing parameters');
    }

    // 雛形HTMLを読み込み
    let template = fs.readFileSync('template.html', 'utf8');

    // カレンダーHTML生成
    const calendarHTML = generateCalendarHTML(year, month, overlay);

    // <div id="calendar"></div> に挿入
    template = template.replace('<div id="calendar">', `<div id="calendar">${calendarHTML}`);

    // puppeteer で PDF 化
    const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(template, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4' });
    await browser.close();

    // Drive アップロード
    const pdfUrl = await uploadToDrive(pdfBuffer, output_folder_id);
    res.json({ status: 'success', pdf_url: pdfUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
```

---

## 実装状況

### カレンダー生成機能
- [x] 週始めを日曜日に設定
- [x] 複数オーバーレイの重ね合わせ対応
- [x] スタイル定義の最適化
- [x] 日付の表示形式の統一

### PDF生成機能
- [x] YAML設定ファイルからの設定読み込み
- [x] 出力設定の最適化
  - [x] マージン: 10mm
  - [x] DPI: 300
  - [x] A4フォーマット
- [x] エラーハンドリングの強化

### Google Drive連携
- [x] ファイルアップロード機能
- [x] エラーハンドリング
- [x] レスポンス形式の統一

### 設定管理
- [x] YAML形式での設定管理
- [x] 環境別設定の分離
- [x] スキーマ定義の整備

### テスト
- [ ] ユニットテストの追加
- [ ] 統合テストの準備
- [ ] テストカバレッジの向上

### セキュリティ
- [ ] APIキーの安全な管理
- [ ] アクセス制御の実装
- [ ] 入力値のバリデーション強化

---

## エラーハンドリング設計

### エラーの種類と対応

1. **バリデーションエラー**
   - エラーコード: `VALIDATION_ERROR`
   - HTTPステータス: 400
   - 発生条件:
     - 必須パラメータの欠落
     - パラメータの型不一致
     - 値の範囲外（年、月など）

2. **Google Driveエラー**
   - エラーコード: `DRIVE_API_ERROR`
   - HTTPステータス: 500
   - 発生条件:
     - 認証エラー
     - アップロード失敗
     - API制限超過

3. **PDF生成エラー**
   - エラーコード: `PDF_GENERATION_ERROR`
   - HTTPステータス: 500
   - 発生条件:
     - テンプレート不正
     - リソース不足
     - レンダリングエラー

### エラーレスポンスの形式

```typescript
interface ErrorResponse {
  /** ステータス */
  status: 'error';
  /** エラーコード */
  code: string;
  /** エラーメッセージ */
  message: string;
  /** エラーの詳細（開発環境のみ） */
  details?: any;
}
```

### エラー処理の方針

1. **早期検出**
   - バリデーションを最初に実行
   - 前提条件のチェックを徹底

2. **適切な情報提供**
   - ユーザーフレンドリーなメッセージ
   - デバッグに必要な情報の提供（開発環境のみ）

3. **リソースの解放**
   - エラー発生時のクリーンアップ
   - 一時ファイルの削除
   - メモリの解放

4. **ロギングとモニタリング**
   - エラーの発生を記録
   - パターンの分析
   - 予防的な対策の実施

### テスト戦略

1. **単体テスト:**
   - 各エラーケースのカバレッジ
   - エラーメッセージの検証
   - ステータスコードの確認

2. **負荷テスト:**
   - 同時リクエスト時のエラー処理
   - メモリリークの検出
   - リソース解放の確認

3. **統合テスト:**
   - エラー伝播の検証
   - 外部サービスとの連携
   - エラーレスポンスの一貫性

---

## AppSheet 側の設定

1. **アクション (Webhook)**
   - **HTTP Verb:** `POST`
   - **URL:** `https://[YOUR_CLOUD_RUN_URL]/generate-pdf`
   - **Headers:**
     - `Content-Type: application/json`
   - **JSON Body** (例):

     ```json
     {
       "year": 2025,
       "month": 10,
       "overlay": [
         { "type": "circle", "days": [2, 10] },
         { "type": "triangle", "days": [5, 14] }
       ],
       "output_folder_id": "GOOGLE_DRIVE_FOLDER_ID"
     }
     ```
2. **Bot や Workflow:**
   - 任意のタイミングで上記アクションを呼び出す。
   - レスポンス内の `pdf_url` をテーブルに格納し、ユーザーに表示。

---

## Workload Identity 構成

**Workload Identity** を使用すると、サービスアカウントの鍵ファイルを管理せずに、
GCP リソース間で安全に認証できます。

1. **Cloud Run サービス アカウント:**
   - `roles/iam.workloadIdentityUser`, `roles/drive.file` を付与。
2. **Workload Identity プールとプロバイダ 作成:**
   - AppSheet が動作する Google アカウントやスプレッドシートをプールのメンバーとして登録。
3. **Cloud Run サービス** に対し、上記サービスアカウントを関連付け。
4. **AppSheet からの呼び出し** は、Workload Identity により自動的に認証。

> **Note:** AppSheet 側で別途 OAuth 2.0 設定や API キーを使わなくても、
> **クラウド間の連携** で認証できるのが利点。

---

## セキュリティ対策

1. **Workload Identity:**
   - サービスアカウント キー不要で管理が容易。
   - キー漏洩リスクを回避できる。
2. **入力検証:**
   - `typeof year === 'number'` か確認、`overlay` が配列か確認など。
3. **Cloud Run の IAM 設定:**
   - 公開するか、VPC Internal のみにするか要検討。
   - AppSheet からのみ呼べるようにする場合、[Cloud Run への IAM ポリシー](https://cloud.google.com/run/docs/configuring/authenticating) を調整。
4. **HTTPS 必須:**
   - Cloud Run のエンドポイントは自動 HTTPS 化されるが、必ず `https://` で呼び出すこと。

---

## テスト計画

1. **単体テスト:**
   - `generateCalendarHTML()`、`uploadToDrive()` など、各関数を別々にテスト。
2. **結合テスト:**
   - AppSheet → Cloud Run → puppeteer → PDF → Drive → リンク返却 まで通しで確認。
3. **エラーハンドリングテスト:**
   - 不正パラメーター、Drive フォルダ ID 不正など、各種エラーケース。
4. **負荷テスト:**
   - 同時リクエスト時のパフォーマンス確認。

---

## 負荷テスト設計

### 目的

- PDFサービスの安定性と信頼性の確保
- 同時リクエスト処理の検証
- エラーハンドリングの確認

### 要件

1. **同時実行要件**
   - 想定される最大同時ユーザー数: 5ユーザー
   - すべてのリクエストが正常に処理されること
   - リクエスト間の干渉がないこと

2. **パフォーマンス要件**
   - レスポンス時間: 1秒以内
   - タイムアウト設定: 10秒（テスト実行時）

3. **エラーハンドリング要件**
   - バリデーションエラーの適切な処理
   - エラーレスポンスの形式統一
   ```json
   {
     "error": "ValidationError" | "DriveError" | "PDFGenerationError",
     "message": "エラーの詳細メッセージ"
   }
   ```

4. **テスト環境**
   - モックサービスの使用
   - 遅延時間の調整機能
   - 実際の外部サービス（Google Drive）への依存を排除

### 制約事項

1. **リソース制限**
   - メモリ使用量の急激な増加を防ぐ
   - 同時実行数の制限（最大5件）

2. **テストデータ**
   - カレンダーテンプレートの使用
   - 年月の有効範囲: 1900年～2100年
   - 月の有効範囲: 1～12月

---

## まとめ

本ドキュメントは、**Workload Identity を活用した認証構成** と、**AppSheet から動的に HTML を生成→PDF 化→Drive アップロード** するフローを網羅的にまとめました。

- **HTML テンプレート** と **オーバーレイ指定** により多彩なレイアウトを実現。
- **puppeteer** を用いた **高品質 PDF 出力**。
- **Workload Identity** による **セキュアなサービスアカウント認証**。
- **AppSheet** との連携で、業務アプリからの **ワンクリック PDF 生成** を実現。

さらに詳細な手順やロール設定は、チームの運用ルールに合わせて適宜拡張してください。
