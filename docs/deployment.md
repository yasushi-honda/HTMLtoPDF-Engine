# デプロイメントガイド（MVP版）

## 前提条件
1. Google Cloud Platform（GCP）アカウント
2. Google Cloud CLIのインストール
3. Node.js v18以上
4. Docker

## デプロイ手順

### 1. ローカル環境での準備

```bash
# リポジトリのクローン
git clone https://github.com/your-org/dynamic-html-to-pdf.git
cd dynamic-html-to-pdf

# 依存パッケージのインストール
npm install

# ビルドとテスト
npm run build
npm test
```

### 2. GCPプロジェクトの設定

```bash
# プロジェクトの設定
export PROJECT_ID=htmltopdf-engine
gcloud config set project $PROJECT_ID

# 必要なAPIの有効化
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable drive.googleapis.com
gcloud services enable iam.googleapis.com
```

### 3. Workload Identity設定

```bash
# サービスアカウントの作成
gcloud iam service-accounts create pdf-generator \
    --display-name="PDF Generator Service Account"

# サービスアカウントのメールアドレス
export SA_EMAIL=pdf-generator@htmltopdf-engine.iam.gserviceaccount.com

# Drive API アクセス権限
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="roles/drive.file"
```

### 4. Cloud Runへのデプロイ

```bash
# サービスのデプロイ
gcloud run deploy pdf-generator \
  --source . \
  --region asia-northeast1 \
  --platform managed \
  --service-account=$SA_EMAIL \
  --allow-unauthenticated
```

### 5. 動作確認

```bash
# サービスURLの取得
export SERVICE_URL=$(gcloud run services describe pdf-generator \
  --platform managed \
  --region asia-northeast1 \
  --format 'value(status.url)')

# テストリクエストの送信
curl -X POST $SERVICE_URL/api/pdf/generate \
  -H "Content-Type: application/json" \
  -d '{
    "year": 2025,
    "month": 2,
    "overlay": [
      {"type": "circle", "days": [1, 15]}
    ]
  }'
```

## トラブルシューティング

### よくあるエラー

1. **ビルドエラー**
   - 原因: TypeScriptの型エラー
   - 対処: `src/types/`内の型定義を確認

2. **デプロイエラー**
   - 原因: 権限不足
   - 対処: サービスアカウントの権限を確認

3. **実行時エラー**
   - 原因: Google Drive APIの権限
   - 対処: IAMの設定を確認

## 本番環境チェックリスト

- [ ] ビルドが成功する
- [ ] 基本的なテストが成功する
- [ ] Workload Identity設定が完了
- [ ] AppSheetから接続できる
