# デプロイメントガイド

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

# 環境変数の設定
cp .env.example .env
# .envファイルを編集して必要な値を設定

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

### 3. Dockerイメージのビルドとプッシュ

```bash
# Dockerイメージのビルド
docker build -t gcr.io/$PROJECT_ID/pdf-generator .

# イメージのプッシュ
gcloud auth configure-docker
docker push gcr.io/$PROJECT_ID/pdf-generator
```

### 4. Cloud Runへのデプロイ

```bash
# サービスのデプロイ
gcloud run deploy pdf-generator \
  --image gcr.io/$PROJECT_ID/pdf-generator \
  --platform managed \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --memory 1Gi \
  --timeout 300 \
  --set-env-vars="NODE_ENV=production,ALLOWED_ORIGINS=https://your-app.com"
```

### 5. 環境変数の設定

Cloud Runコンソールで以下の環境変数を設定：

| 変数名 | 説明 | 例 |
|--------|------|-----|
| NODE_ENV | 実行環境 | production |
| ALLOWED_ORIGINS | CORS許可オリジン | https://your-app.com |
| DRIVE_OUTPUT_FOLDER_ID | デフォルトの出力フォルダID | folder_id |

### 6. 動作確認

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

## スケーリング設定

### 1. 自動スケーリング

```bash
# 最小インスタンス数の設定
gcloud run services update pdf-generator \
  --min-instances 1 \
  --max-instances 10

# 同時リクエスト数の制限
gcloud run services update pdf-generator \
  --concurrency 50
```

### 2. リソース制限

```bash
# メモリとCPUの設定
gcloud run services update pdf-generator \
  --memory 1Gi \
  --cpu 1
```

## モニタリングの設定

1. Cloud Monitoringでアラートの設定
   - エラーレート
   - レイテンシー
   - メモリ使用率

2. Cloud Loggingでログの設定
   - エラーログの保存
   - アクセスログの保存

## バックアップとリカバリ

1. 定期的なバックアップ
   - Dockerイメージのバージョン管理
   - 設定のバージョン管理

2. リカバリ手順
   - 前バージョンへのロールバック手順
   - 障害時の対応手順

## セキュリティ設定

1. Cloud Run
   - IAMポリシーの設定
   - VPCコネクタの設定（必要な場合）

2. ネットワーク
   - Cloud Armorの設定
   - SSLの設定

## 本番環境チェックリスト

- [ ] すべてのテストが成功
- [ ] セキュリティスキャンの実施
- [ ] パフォーマンステストの実施
- [ ] モニタリングの設定完了
- [ ] バックアップ手順の確認
- [ ] ドキュメントの更新
- [ ] 緊急連絡先の設定
