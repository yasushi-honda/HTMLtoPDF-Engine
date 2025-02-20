# トラブルシューティングガイド

## よくある問題と解決方法

### 1. PDF生成に関する問題

#### 1.1 PDF生成が失敗する
- **症状**: `PDF_GENERATION_ERROR`が返される
- **考えられる原因**:
  - メモリ不足
  - HTMLの構文エラー
  - Puppeteerの実行エラー
- **解決方法**:
  1. メモリ使用量を確認
  ```bash
  # Cloud Runのメモリ設定確認
  gcloud run services describe pdf-generator
  
  # メモリ増設（必要な場合）
  gcloud run services update pdf-generator --memory 2Gi
  ```
  2. HTMLの検証
  ```bash
  # プレビューエンドポイントで確認
  curl -X POST /api/pdf/preview -d '...'
  ```
  3. Puppeteerの依存関係確認
  ```bash
  # Dockerfileの必要なライブラリ確認
  apt-get update && apt-get install -y \
    libgbm1 \
    libwayland-server0 \
    ...
  ```

#### 1.2 PDFの生成が遅い
- **症状**: リクエストがタイムアウトする
- **考えられる原因**:
  - 複雑なHTML
  - サーバーの負荷
  - ネットワーク遅延
- **解決方法**:
  1. タイムアウト設定の調整
  ```bash
  gcloud run services update pdf-generator --timeout 300
  ```
  2. パフォーマンスモニタリング
  ```bash
  # Cloud Monitoringでメトリクスを確認
  # - CPU使用率
  # - メモリ使用率
  # - リクエスト処理時間
  ```

### 2. Google Drive連携の問題

#### 2.1 アップロードに失敗する
- **症状**: `DRIVE_API_ERROR`が返される
- **考えられる原因**:
  - 権限不足
  - APIクォータ超過
  - 無効なフォルダID
- **解決方法**:
  1. 権限の確認
  ```bash
  # サービスアカウントの権限確認
  gcloud projects get-iam-policy $PROJECT_ID \
    --flatten="bindings[].members" \
    --filter="bindings.members:pdf-generator@*"
  ```
  2. クォータの確認
  ```bash
  # Cloud ConsoleでDrive APIのクォータを確認
  # 必要に応じて制限を引き上げ
  ```
  3. フォルダIDの検証
  ```bash
  # Drive APIでフォルダ情報を取得
  curl -X GET \
    "https://www.googleapis.com/drive/v3/files/FOLDER_ID" \
    -H "Authorization: Bearer $ACCESS_TOKEN"
  ```

### 3. API関連の問題

#### 3.1 認証エラー
- **症状**: 401/403エラーが返される
- **考えられる原因**:
  - Workload Identity設定の問題
  - IAMポリシーの問題
- **解決方法**:
  1. Workload Identity設定の確認
  ```bash
  # プールとプロバイダーの確認
  gcloud iam workload-identity-pools describe "pdf-generator-pool"
  gcloud iam workload-identity-pools providers describe "pdf-generator-provider"
  ```
  2. IAMポリシーの確認と修正
  ```bash
  # 必要な権限の付与
  gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SA_EMAIL" \
    --role="roles/drive.file"
  ```

#### 3.2 バリデーションエラー
- **症状**: `VALIDATION_ERROR`が返される
- **考えられる原因**:
  - 不正なリクエストパラメータ
  - 範囲外の値
- **解決方法**:
  1. リクエストの検証
  ```bash
  # API仕様書の確認
  cat docs/api-spec.md
  
  # テストリクエストの送信
  curl -X POST /api/pdf/generate \
    -H "Content-Type: application/json" \
    -d '@test/fixtures/valid-request.json'
  ```

### 4. デプロイメントの問題

#### 4.1 デプロイに失敗する
- **症状**: Cloud Buildまたは`gcloud run deploy`が失敗
- **考えられる原因**:
  - Dockerビルドの失敗
  - 権限不足
  - 設定ミス
- **解決方法**:
  1. ローカルでのビルド確認
  ```bash
  # Dockerビルドのテスト
  docker build -t pdf-generator .
  
  # ローカルでの実行テスト
  docker run -p 8080:8080 pdf-generator
  ```
  2. Cloud Buildログの確認
  ```bash
  gcloud builds list
  gcloud builds log BUILD_ID
  ```

### 5. パフォーマンスの問題

#### 5.1 高負荷時の遅延
- **症状**: レスポンス時間が増大
- **考えられる原因**:
  - リソース不足
  - 同時リクエスト過多
- **解決方法**:
  1. スケーリング設定の調整
  ```bash
  # 自動スケーリングの設定
  gcloud run services update pdf-generator \
    --min-instances 2 \
    --max-instances 10
  ```
  2. リソース割り当ての増加
  ```bash
  # CPUとメモリの増設
  gcloud run services update pdf-generator \
    --cpu 2 \
    --memory 4Gi
  ```

## ログの確認方法

### 1. アプリケーションログ
```bash
# Cloud Runのログを表示
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=pdf-generator" --limit 50
```

### 2. エラーログ
```bash
# エラーログのみを表示
gcloud logging read "resource.type=cloud_run_revision AND severity>=ERROR" --limit 20
```

### 3. アクセスログ
```bash
# アクセスログの表示
gcloud logging read "resource.type=cloud_run_revision AND httpRequest.status>=400" --limit 20
```

## 監視とアラート

### 1. メトリクスの監視
- Cloud Monitoringダッシュボード
  - エラーレート
  - レイテンシー
  - リクエスト数
  - メモリ使用率

### 2. アラートの設定
- エラー率が5%を超えた場合
- レイテンシーが10秒を超えた場合
- メモリ使用率が90%を超えた場合

## 緊急時の対応

### 1. サービスのロールバック
```bash
# 前バージョンの確認
gcloud run revisions list --service pdf-generator

# ロールバックの実行
gcloud run services update-traffic pdf-generator \
  --to-revisions=REVISION_NAME=100
```

### 2. 一時的なサービス停止
```bash
# トラフィックを0に設定
gcloud run services update-traffic pdf-generator \
  --to-revisions=LATEST=0
```

### 3. 緊急連絡先
- システム管理者: xxx@example.com
- セキュリティ担当: yyy@example.com
- クラウド運用担当: zzz@example.com
