# Google Cloud Platform セットアップ手順

## プロジェクト情報
- プロジェクト名: HTMLtoPDF-Engine
- プロジェクト番号: 692399870482
- プロジェクト ID: htmltopdf-engine

## 1. 必要なAPIの有効化

```bash
# Cloud Run API
gcloud services enable run.googleapis.com

# Cloud Build API
gcloud services enable cloudbuild.googleapis.com

# Drive API
gcloud services enable drive.googleapis.com

# IAM API
gcloud services enable iam.googleapis.com

# Identity and Access Management (IAM) API
gcloud services enable iamcredentials.googleapis.com
```

## 2. サービスアカウントの作成と設定

```bash
# サービスアカウントの作成
gcloud iam service-accounts create pdf-generator \
    --display-name="PDF Generator Service Account" \
    --project=htmltopdf-engine

# サービスアカウントのメールアドレス
export SA_EMAIL=pdf-generator@htmltopdf-engine.iam.gserviceaccount.com

# 必要な権限の付与
# Cloud Run 実行権限
gcloud projects add-iam-policy-binding htmltopdf-engine \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="roles/run.invoker"

# Drive API アクセス権限
gcloud projects add-iam-policy-binding htmltopdf-engine \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="roles/drive.file"
```

## 3. Workload Identity の設定

```bash
# Workload Identity プールの作成
gcloud iam workload-identity-pools create "pdf-generator-pool" \
    --project="htmltopdf-engine" \
    --location="global" \
    --display-name="PDF Generator Pool"

# プールIDの取得
export POOL_ID=$(gcloud iam workload-identity-pools describe "pdf-generator-pool" \
    --project="htmltopdf-engine" \
    --location="global" \
    --format="value(name)")

# Workload Identity プロバイダーの作成
gcloud iam workload-identity-pools providers create-oidc "pdf-generator-provider" \
    --project="htmltopdf-engine" \
    --location="global" \
    --workload-identity-pool="pdf-generator-pool" \
    --display-name="PDF Generator Provider" \
    --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.aud=assertion.aud" \
    --issuer-uri="https://accounts.google.com"

# サービスアカウントとWorkload Identityの紐付け
gcloud iam service-accounts add-iam-policy-binding "${SA_EMAIL}" \
    --project="htmltopdf-engine" \
    --role="roles/iam.workloadIdentityUser" \
    --member="principalSet://iam.googleapis.com/${POOL_ID}/attribute.repository/htmltopdf-engine"
```

## 4. Cloud Run の設定

```bash
# Cloud Runのデプロイ
gcloud run deploy pdf-generator \
    --source . \
    --project=htmltopdf-engine \
    --region=asia-northeast1 \
    --platform=managed \
    --service-account=${SA_EMAIL} \
    --set-env-vars="PROJECT_ID=htmltopdf-engine" \
    --allow-unauthenticated
```

## 5. 環境変数の設定

Cloud Run サービスに設定する環境変数：

```bash
PROJECT_ID=htmltopdf-engine
GOOGLE_CLOUD_PROJECT=htmltopdf-engine
DRIVE_OUTPUT_FOLDER_ID=<Google Driveの出力先フォルダID>
```

## 6. 動作確認

1. Cloud Run URLの取得：
```bash
gcloud run services describe pdf-generator \
    --project=htmltopdf-engine \
    --region=asia-northeast1 \
    --format='value(status.url)'
```

2. テストリクエストの送信：
```bash
curl -X POST ${CLOUD_RUN_URL}/generate-pdf \
    -H "Content-Type: application/json" \
    -d '{
        "year": 2025,
        "month": 2,
        "overlay": [
            {"type": "circle", "days": [1, 15]},
            {"type": "triangle", "days": [5, 20]}
        ],
        "output_folder_id": "DRIVE_FOLDER_ID"
    }'
```

## 注意事項

1. セキュリティ
   - Workload Identity の設定は慎重に行う
   - 必要最小限の権限のみを付与
   - 環境変数は Cloud Run のコンソールで暗号化して設定

2. 監視設定
   - Cloud Monitoring でメトリクスを設定
   - エラーログの通知設定
   - パフォーマンスモニタリングの設定

3. コスト管理
   - 予算アラートの設定
   - 使用量の監視
   - 自動スケーリングの制限設定
