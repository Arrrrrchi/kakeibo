# Phase 1: プロジェクト基盤

## 概要

Next.js 16 プロジェクトの初期化と開発環境の構築を行う。以降のフェーズの土台となるため、技術スタックの設定を正確に行う。

## タスク一覧

### 1-1. Next.js 16 プロジェクト初期化

- pnpm でプロジェクトを作成
  ```bash
  pnpm create next-app@latest . --typescript --tailwind --app --src-dir --import-alias "@/*"
  ```
- Node.js バージョンを `.node-version` に記載（v22 推奨、最小 v20.9）
- `next.config.ts` の基本設定

### 1-2. TypeScript 設定

- `tsconfig.json` で strict モードを有効化
  ```json
  {
    "compilerOptions": {
      "strict": true,
      "paths": { "@/*": ["./src/*"] }
    }
  }
  ```
- Next.js が生成するデフォルト設定をベースに、必要に応じて調整

### 1-3. Tailwind CSS v4 設定

- `src/app/globals.css` に Tailwind CSS v4 のエントリを記述
  ```css
  @import "tailwindcss";
  ```
- v4 では `tailwind.config.ts` は不要（CSS ベースの設定に移行）
- カスタムカラー（ダッシュボードのテーマカラー `#1a1a2e` 等）を CSS カスタムプロパティで定義

### 1-4. Prisma セットアップ

- Prisma のインストール
  ```bash
  pnpm add prisma @prisma/client
  pnpm exec prisma init
  ```
- `prisma/schema.prisma` にスキーマ定義
  ```prisma
  generator client {
    provider = "prisma-client-js"
  }

  datasource db {
    provider = "postgresql"
    url      = env("DATABASE_URL")
  }

  enum CycleType {
    monthly_fixed
    monthly_variable
    irregular_fixed
    irregular_variable
  }

  model Transaction {
    id             String   @id @default(uuid())
    date           DateTime @db.Date
    description    String
    amount         Int
    majorCategory  String   @map("major_category")
    minorCategory  String   @map("minor_category")
    institution    String?
    memo           String?
    moneyforwardId String?  @map("moneyforward_id")
    isIncome       Boolean  @default(false) @map("is_income")
    importHash     String   @unique @map("import_hash")
    createdAt      DateTime @default(now()) @map("created_at")
    updatedAt      DateTime @updatedAt @map("updated_at")

    @@index([date(sort: Desc)])
    @@index([majorCategory, minorCategory])
    @@map("transactions")
  }

  model BudgetItem {
    id            String     @id @default(uuid())
    name          String
    monthlyAmount Int        @map("monthly_amount")
    cycleType     CycleType  @map("cycle_type")
    sortOrder     Int        @default(0) @map("sort_order")
    createdAt     DateTime   @default(now()) @map("created_at")
    updatedAt     DateTime   @updatedAt @map("updated_at")

    mappings BudgetCategoryMapping[]

    @@map("budget_items")
  }

  model BudgetCategoryMapping {
    id            String     @id @default(uuid())
    budgetItemId  String     @map("budget_item_id")
    majorCategory String     @map("major_category")
    minorCategory String     @map("minor_category")
    createdAt     DateTime   @default(now()) @map("created_at")

    budgetItem BudgetItem @relation(fields: [budgetItemId], references: [id], onDelete: Cascade)

    @@unique([budgetItemId, majorCategory, minorCategory])
    @@map("budget_category_mappings")
  }
  ```
- `.env` に `DATABASE_URL` を設定
  ```
  DATABASE_URL="postgresql://user:password@localhost:5432/kakeibo?schema=public"
  ```
- 初回マイグレーション実行
  ```bash
  pnpm exec prisma migrate dev --name init
  ```

### 1-5. Biome 設定

- ESLint を削除し Biome に置き換え
  ```bash
  pnpm remove eslint eslint-config-next
  pnpm add -D @biomejs/biome
  pnpm exec biome init
  ```
- `biome.json` の設定
  ```json
  {
    "$schema": "https://biomejs.dev/schemas/2.0.0/schema.json",
    "organizeImports": { "enabled": true },
    "linter": {
      "enabled": true,
      "rules": { "recommended": true }
    },
    "formatter": {
      "enabled": true,
      "indentStyle": "tab",
      "lineWidth": 100
    },
    "javascript": {
      "formatter": { "semicolons": "asNeeded" }
    }
  }
  ```
- `package.json` にスクリプト追加
  ```json
  {
    "scripts": {
      "lint": "biome check .",
      "lint:fix": "biome check --fix .",
      "format": "biome format --write ."
    }
  }
  ```

### 1-6. 基本レイアウト

- `src/app/layout.tsx` — ルートレイアウト（サーバーコンポーネント）
  - HTML lang="ja" 設定
  - フォント設定（Noto Sans JP または Inter）
  - メタデータ（title, description）
- `src/client/components/layout/Header.tsx` — ヘッダーコンポーネント
  - アプリ名「家計分析ダッシュボード」を表示
  - 既存 HTML のヘッダーデザイン（グラデーション背景 `#1a1a2e → #16213e`）を踏襲
- `src/app/page.tsx` — トップページ
  - `/dashboard` へのリダイレクト
- `src/app/dashboard/page.tsx` — ダッシュボードページ（空のプレースホルダー）
- `src/app/dashboard/loading.tsx` — ローディング UI

### 1-7. テスト環境セットアップ（Vitest）

#### インストール

```bash
pnpm add -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

#### `vitest.config.ts` の作成

```typescript
import react from "@vitejs/plugin-react"
import tsconfigPaths from "vite-tsconfig-paths"
import { defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/test/**", "src/**/*.d.ts"],
    },
  },
})
```

#### `src/test/setup.ts` の作成

```typescript
import "@testing-library/jest-dom/vitest"
```

#### `package.json` にスクリプト追加

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

#### テストディレクトリ構成方針

テストファイルは対象ファイルと同じディレクトリに配置する（コロケーション方式）。

```
src/
├── server/
│   ├── lib/
│   │   ├── csv-parser.ts
│   │   └── csv-parser.test.ts          ← 同じディレクトリ
│   ├── usecases/
│   │   ├── get-dashboard-summary.usecase.ts
│   │   └── get-dashboard-summary.usecase.test.ts
│   └── ...
├── client/
│   ├── lib/
│   │   ├── format.ts
│   │   └── format.test.ts
│   └── components/
│       └── ui/
│           ├── Button.tsx
│           └── Button.test.tsx
├── test/
│   ├── setup.ts                        ← グローバルセットアップ
│   ├── fixtures/                       ← テスト用固定データ
│   │   └── sample.csv                  ← サンプル CSV（cp932）
│   └── helpers/                        ← テストヘルパー
│       └── mock-repositories.ts        ← リポジトリモック生成
└── ...
```

#### テスト方針

| レイヤー | テスト種別 | テスト対象 | モック対象 |
|---|---|---|---|
| CSV パーサー | ユニットテスト | パース・フィルタ・ハッシュ生成 | なし（純粋関数） |
| ユースケース | ユニットテスト | ビジネスロジック・集計 | リポジトリ（インターフェース経由） |
| リポジトリ | 統合テスト | Prisma クエリの正しさ | DB（テスト用 DB） |
| フォーマット関数 | ユニットテスト | 通貨・日付フォーマット | なし（純粋関数） |
| UI コンポーネント | コンポーネントテスト | 表示・操作 | サーバーアクション |

### 1-8. .gitignore 更新

- `.env` が含まれていることを確認
- `prisma/*.db`, `prisma/*.db-journal` を追加
- `.next/`, `node_modules/`, `coverage/` 等の確認

## 完了条件

- [ ] `pnpm dev` でアプリが起動し、ダッシュボードページが表示される
- [ ] `pnpm exec prisma migrate dev` が正常に完了する
- [ ] `pnpm lint` （Biome）がエラーなく通過する
- [ ] TypeScript strict モードでのビルドが成功する（`pnpm build`）
- [ ] ヘッダーが表示され、`/` → `/dashboard` のリダイレクトが動作する
- [ ] `pnpm test:run` でサンプルテストが通過する

## 成果物

| ファイル | 説明 |
|---|---|
| `package.json` | 依存関係・スクリプト定義 |
| `tsconfig.json` | TypeScript 設定 |
| `next.config.ts` | Next.js 設定 |
| `biome.json` | Biome リンター/フォーマッター設定 |
| `prisma/schema.prisma` | データベーススキーマ |
| `.env` | 環境変数（Git 管理外） |
| `src/app/layout.tsx` | ルートレイアウト |
| `src/app/globals.css` | グローバルスタイル（Tailwind エントリ） |
| `src/app/page.tsx` | トップページ（リダイレクト） |
| `src/app/dashboard/page.tsx` | ダッシュボードページ（プレースホルダー） |
| `src/app/dashboard/loading.tsx` | ローディング UI |
| `src/client/components/layout/Header.tsx` | ヘッダーコンポーネント |
| `vitest.config.ts` | Vitest 設定 |
| `src/test/setup.ts` | テストセットアップ |
