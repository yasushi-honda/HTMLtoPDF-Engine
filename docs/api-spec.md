# API仕様書（MVP版）

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
    }
  ],
  "outputFolderId": "Google_Drive_Folder_ID"  // オプション
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

#### レスポンス
```json
{
  "fileId": "Google_Drive_File_ID",
  "webViewLink": "https://drive.google.com/file/d/FILE_ID/view",
  "filename": "calendar-2025-02.pdf"
}
```

#### エラーレスポンス
```json
{
  "code": "ERROR_CODE",
  "message": "エラーの説明"
}
```

#### 主要なエラーコード
| コード | 説明 |
|--------|------|
| VALIDATION_ERROR | リクエストパラメータが不正 |
| PDF_GENERATION_ERROR | PDF生成時にエラーが発生 |
| DRIVE_API_ERROR | Google Drive APIでエラーが発生 |

## 認証
- AppSheetからのリクエスト: Workload Identityによる認証

## 注意事項
1. タイムアウト
   - PDF生成: 30秒
   - Drive アップロード: 60秒

2. エラーハンドリング
   - すべてのエラーは適切なHTTPステータスコードとともに返却
   - エラーメッセージは日本語で提供
