# ---- Stage 1: ビルド ----
    FROM node:18-alpine AS builder

    WORKDIR /app
    
    # package.jsonとtsconfig.jsonを先にコピーして依存関係をインストール
    COPY package*.json tsconfig.json ./
    RUN npm install
    
    # ソースコードをコピーしてビルド
    COPY . .
    RUN npm run build
    
    # ---- Stage 2: 本番環境 ----
    FROM node:18-alpine
    
    WORKDIR /app
    
    # 本番環境用の依存パッケージのみインストール
    COPY package*.json ./
    RUN npm install --production
    
    # ビルド済みの成果物とテンプレートをコピー
    COPY --from=builder /app/dist ./dist
    COPY --from=builder /app/templates ./templates
    
    # ポート番号はCloud Runなどで環境変数PORTが設定されることを想定
    EXPOSE 8080
    
    # アプリケーション起動
    CMD ["node", "dist/server.js"]
