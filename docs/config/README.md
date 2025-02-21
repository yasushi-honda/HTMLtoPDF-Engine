# 設定ファイル管理ガイド

## 概要
このディレクトリには、HTMLtoPDF-Engineの設定ファイルが含まれています。設定はYAML形式で管理され、環境ごとに適切な設定を選択できます。

## ファイル構成
- `default.yml`: デフォルト設定
- `schemas/config.schema.yml`: 設定ファイルのバリデーションスキーマ

## 主な設定項目

### アプリケーション設定
```yaml
app:
  name: HTMLtoPDF-Engine
  version: 1.0.0
```

### PDF出力設定
```yaml
pdf:
  output:
    directory: ./output
    format: A4
    margin: 10mm
    dpi: 300
```

### テスト設定
```yaml
test:
  timeout: 30000
  memory:
    limit: 512mb
  options:
    runInBand: true
    detectOpenHandles: true
```

### ログ設定
```yaml
logging:
  level: info
  format: json
```

## 設定の検証
`schemas/config.schema.yml`を使用して、設定ファイルの妥当性を検証できます。これにより、設定ミスを早期に発見し、アプリケーションの安定性を向上させることができます。
