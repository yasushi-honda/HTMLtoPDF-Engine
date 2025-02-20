# テスト実行ガイド

このガイドでは、HTMLtoPDF-Engineのテスト実行に関する重要な情報をまとめています。

## テストの種類

1. **単体テスト**
   - `validation.test.ts`: バリデーションミドルウェアのテスト
   - `error.test.ts`: エラーハンドリングミドルウェアのテスト
   - `calendar.test.ts`: カレンダー生成ロジックのテスト
   - `drive.test.ts`: Google Drive操作のテスト

2. **負荷テスト**
   - `load.test.ts`: 同時リクエスト処理とメモリ使用量のテスト
   - 実行時は`--runInBand`オプションを使用して1つずつ実行

## テスト実行方法

### 全テストの実行
```bash
npm test -- --runInBand
```

### 特定のテストファイルの実行
```bash
npm test -- --runInBand src/tests/validation.test.ts
```

### カバレッジレポートの生成
```bash
npm test -- --coverage
```

## テスト実行時の注意点

1. **メモリ管理**
   - `--runInBand`オプションを使用して1つずつ実行
   - `--detectOpenHandles`でメモリリークを検出
   - 大規模なテストスイートは分割実行を検討

2. **テストの安定性**
   - タイムアウトは30秒以上に設定
   - afterEach/afterAllでリソースを適切にクリーンアップ
   - タイマーは.unref()を使用

3. **エラー対策**
   - テストプロセスのSIGKILL監視
   - メモリ使用量の定期的な確認
   - 非同期処理の適切な待機

4. **パフォーマンス**
   - テストの並列実行は避ける
   - 重いテストは分割を検討
   - モックデータのサイズを最適化

## エラーハンドリング

1. **バリデーションエラー**
   - エラーコード: `VALIDATION_ERROR`
   - HTTPステータス: 400
   - レスポンス例:
     ```json
     {
       "status": "error",
       "code": "VALIDATION_ERROR",
       "message": "バリデーションエラー"
     }
     ```

2. **Google Driveエラー**
   - エラーコード: `DRIVE_API_ERROR`
   - HTTPステータス: 500
   - レスポンス例:
     ```json
     {
       "status": "error",
       "code": "DRIVE_API_ERROR",
       "message": "Driveアップロードエラー",
       "details": { ... }
     }
     ```

3. **PDF生成エラー**
   - エラーコード: `PDF_GENERATION_ERROR`
   - HTTPステータス: 500
   - レスポンス例:
     ```json
     {
       "status": "error",
       "code": "PDF_GENERATION_ERROR",
       "message": "PDF生成中にエラーが発生しました"
     }
     ```

## テストカバレッジ目標

各コンポーネントで以下のカバレッジ目標を設定しています：

- **ステートメントカバレッジ**: 90%以上
- **ブランチカバレッジ**: 85%以上
- **関数カバレッジ**: 95%以上

現在のカバレッジ状況：

- バリデーションミドルウェア: 100%
- エラーハンドリングミドルウェア: 100%
- カレンダー生成: 95%
- Google Drive操作: 90%

## 今後の改善計画

1. **テストの自動化**
   - CI/CDパイプラインの整備
   - 自動テスト実行の設定

2. **テストデータの管理**
   - テストデータの一元管理
   - フィクスチャーの整備

3. **パフォーマンステスト**
   - 負荷テストの拡充
   - メモリ使用量の最適化
