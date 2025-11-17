# 人事評価・研修統合プラットフォーム

評価と育成をシームレスに繋ぐ、次世代型人材開発プラットフォーム

## 概要

本システムは、人事評価制度と研修管理システム（LMS）を統合し、以下の機能を提供します：

- **人事評価システム**: 目標設定、評価実施、フィードバック管理
- **研修管理システム (LMS)**: 動画コンテンツ配信、受講管理、テスト・アンケート
- **連携機能**: 評価結果に基づく研修推奨、スキルマップ管理

## 技術スタック

### バックエンド
- Node.js 20.x
- NestJS 10.x
- Prisma 5.x (ORM)
- PostgreSQL 15
- Redis 7

### フロントエンド
- Next.js 14 (App Router)
- React 18
- TypeScript 5.x
- Tailwind CSS 3.x
- React Query 5.x
- Zustand 4.x

### インフラ
- Docker / Docker Compose
- pnpm (パッケージマネージャー)

## プロジェクト構造

```
jinzai-ikusei/
├── apps/
│   ├── backend/          # NestJS バックエンドAPI
│   │   ├── prisma/       # Prisma スキーマ・マイグレーション
│   │   └── src/
│   │       ├── auth/     # 認証モジュール
│   │       ├── users/    # ユーザー管理
│   │       ├── goals/    # 目標管理
│   │       ├── evaluations/  # 評価管理
│   │       └── courses/  # 研修（LMS）管理
│   └── frontend/         # Next.js フロントエンド
│       └── src/
│           ├── app/      # App Router ページ
│           ├── components/  # UIコンポーネント
│           ├── lib/      # APIクライアント等
│           └── store/    # 状態管理
├── packages/
│   └── shared/          # 共通ライブラリ
├── docs/                # 設計ドキュメント
└── docker-compose.yml   # Docker設定
```

## セットアップ

### 前提条件

- Node.js 20.x
- pnpm 9.x
- Docker & Docker Compose

### 1. リポジトリのクローン

```bash
git clone https://github.com/Qrokawa/jinzai-ikusei.git
cd jinzai-ikusei
```

### 2. 依存関係のインストール

```bash
pnpm install
```

### 3. 環境変数の設定

```bash
# バックエンド
cp apps/backend/.env.example apps/backend/.env

# フロントエンド
cp apps/frontend/.env.example apps/frontend/.env.local
```

### 4. Docker環境の起動

```bash
# PostgreSQL と Redis を起動
docker-compose up -d postgres redis
```

### 5. データベースのセットアップ

```bash
cd apps/backend

# Prisma クライアントの生成
npx prisma generate

# データベースマイグレーション
npx prisma migrate dev --name init

# シードデータの投入（オプション）
npx prisma db seed
```

### 6. 開発サーバーの起動

**バックエンド:**
```bash
cd apps/backend
pnpm dev
```
→ http://localhost:3001

**フロントエンド:**
```bash
cd apps/frontend
pnpm dev
```
→ http://localhost:3000

### Docker Compose で全体起動

```bash
docker-compose up -d
```

- フロントエンド: http://localhost:3000
- バックエンドAPI: http://localhost:3001
- Swagger API ドキュメント: http://localhost:3001/api/docs

## API ドキュメント

バックエンド起動後、以下のURLでSwagger UIを確認できます：
http://localhost:3001/api/docs

主要なエンドポイント:
- `POST /api/v1/auth/login` - ログイン
- `GET /api/v1/users/me` - 現在のユーザー情報
- `GET /api/v1/goals/my` - 自分の目標一覧
- `POST /api/v1/goals` - 目標作成
- `GET /api/v1/courses` - コース一覧
- `POST /api/v1/courses/:id/enroll` - コース登録

## 開発

### コード品質

```bash
# リント
pnpm lint

# フォーマット
pnpm format

# テスト
pnpm test
```

### データベース操作

```bash
# Prisma Studio（データ閲覧・編集GUI）
cd apps/backend
npx prisma studio
```

### マイグレーション

```bash
# 新しいマイグレーションを作成
npx prisma migrate dev --name <migration_name>

# 本番環境への適用
npx prisma migrate deploy
```

## MVP機能一覧

### Phase 1（MVP）
- [x] 基本的な認証・認可（JWT）
- [x] ユーザー管理
- [x] 目標設定・進捗管理
- [x] 基本的な評価機能
- [x] コース管理・受講機能
- [ ] 動画ストリーミング配信
- [ ] テスト・アンケート機能
- [ ] 基本的なレポート機能

### Phase 2
- [ ] 360度評価
- [ ] SCORM対応
- [ ] 高度な分析・レコメンド
- [ ] スキルマップ管理
- [ ] SSO連携

## ドキュメント

詳細な設計ドキュメントは `docs/` ディレクトリにあります：

- [要件定義書](docs/01_要件定義書.md)
- [ユーザーストーリー・ユースケース](docs/02_ユーザーストーリー・ユースケース.md)
- [画面設計書](docs/03_画面設計書.md)
- [データベース設計書](docs/04_データベース設計書.md)
- [システムアーキテクチャ設計書](docs/05_システムアーキテクチャ設計書.md)
- [API設計書](docs/06_API設計書.md)
- [セキュリティ設計書](docs/07_セキュリティ設計書.md)

## ライセンス

UNLICENSED - Private Repository

## 開発チーム

一般社団法人人材育成支援機構
