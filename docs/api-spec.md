# API仕様書

## 概要
このAPIは、HTMLからPDFを生成し、Google Driveにアップロードする機能を提供します。

## エンドポイント

### 1. PDF生成 (`POST /api/pdf/generate`)

PDFを生成し、Google Driveにアップロードします。

#### リクエスト
```json
{
  "year": 2025,
  "month": 2,
  "overlay": [
    {
      "days": [1, 15],
      "type": "circle"
    },
    {
      "days": [5, 20],
      "type": "triangle"
    }
  ],
  "outputFolderId": "Google_Drive_Folder_ID",  // オプション
  "filename": "calendar-2025-02.pdf",          // オプション
  "description": "2025年2月のカレンダー"       // オプション
}
```

#### パラメータ説明
| パラメータ | 型 | 必須 | 説明 |
|------------|-----|------|------|
| year | number | ✓ | 年（1900-2100） |
| month | number | ✓ | 月（1-12） |
| overlay | array | ✓ | オーバーレイ設定の配列 |
| overlay[].days | number[] | ✓ | オーバーレイを適用する日付の配列 |
| overlay[].type | string | ✓ | オーバーレイの種類（circle、triangle、cross、diamond） |
| outputFolderId | string | - | Google Driveの出力フォルダID |
| filename | string | - | 生成するPDFのファイル名 |
| description | string | - | PDFの説明文 |

#### レスポンス
```json
{
  "fileId": "Google_Drive_File_ID",
  "webViewLink": "https://drive.google.com/file/d/FILE_ID/view",
  "filename": "calendar-2025-02.pdf",
  "generatedAt": "2025-02-20T09:41:36Z"
}
```

#### エラーレスポンス
```json
{
  "code": "ERROR_CODE",
  "message": "エラーの説明",
  "details": {}  // オプション
}
```

#### エラーコード
| コード | 説明 |
|--------|------|
| VALIDATION_ERROR | リクエストパラメータが不正 |
| DRIVE_API_ERROR | Google Drive APIでエラーが発生 |
| PDF_GENERATION_ERROR | PDF生成時にエラーが発生 |
| INTERNAL_SERVER_ERROR | サーバー内部でエラーが発生 |

### 2. プレビュー生成 (`POST /api/pdf/preview`)

生成されるPDFのプレビューHTMLを返します。

#### リクエスト
PDF生成と同じリクエスト形式です。

#### レスポンス
Content-Type: text/html
```html
<!DOCTYPE html>
<html>
  <!-- プレビュー用HTML -->
</html>
```

## 認証
- AppSheetからのリクエスト: Workload Identityによる認証
- その他のリクエスト: 要検討

## レート制限
- 1分あたり60リクエスト
- 超過した場合は429エラー

## 注意事項
1. ファイルサイズ制限
   - リクエストボディ: 最大10MB
   - 生成されるPDF: 最大100MB

2. タイムアウト
   - PDF生成: 30秒
   - Drive アップロード: 60秒

3. CORS
   - 許可オリジン: 環境変数`ALLOWED_ORIGINS`で設定
   - デフォルト: すべて許可

4. エラーハンドリング
   - すべてのエラーは適切なHTTPステータスコードとともに返却
   - エラーメッセージは日本語で提供
