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

- Prisma 7 のインストール（ドライバーアダプター含む）
  ```bash
  pnpm add prisma @prisma/client @prisma/adapter-pg
  pnpm exec prisma init
  ```
  - Prisma 7 では `prisma init` で `prisma.config.ts` も生成される
  - `dotenv` が devDependencies として必要（`prisma.config.ts` で使用）
- `prisma/schema.prisma` にスキーマ定義
  ```prisma
  generator client {
    provider = "prisma-client"
    output   = "../src/generated/prisma"
  }

  datasource db {
    provider = "postgresql"
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
    id            String    @id @default(uuid())
    name          String
    monthlyAmount Int       @map("monthly_amount")
    cycleType     CycleType @map("cycle_type")
    sortOrder     Int       @default(0) @map("sort_order")
    createdAt     DateTime  @default(now()) @map("created_at")
    updatedAt     DateTime  @updatedAt @map("updated_at")

    mappings BudgetCategoryMapping[]

    @@map("budget_items")
  }

  model BudgetCategoryMapping {
    id            String   @id @default(uuid())
    budgetItemId  String   @map("budget_item_id")
    majorCategory String   @map("major_category")
    minorCategory String   @map("minor_category")
    createdAt     DateTime @default(now()) @map("created_at")

    budgetItem BudgetItem @relation(fields: [budgetItemId], references: [id], onDelete: Cascade)

    @@unique([budgetItemId, majorCategory, minorCategory])
    @@map("budget_category_mappings")
  }
  ```
  - Prisma 7 の変更点:
    - provider は `prisma-client`（`prisma-client-js` から変更）
    - `output` でクライアント生成先を `../src/generated/prisma` に指定
    - `datasource` に `url` は不要（`prisma.config.ts` で管理）
- `prisma.config.ts` — Prisma 7 の設定ファイル（`prisma init` で生成）
  ```typescript
  import "dotenv/config"
  import { defineConfig } from "prisma/config"

  export default defineConfig({
    schema: "prisma/schema.prisma",
    migrations: {
      path: "prisma/migrations",
    },
    datasource: {
      url: process.env.DATABASE_URL,
    },
  })
  ```
- `src/server/lib/prisma.ts` — Prisma クライアントシングルトン（ドライバーアダプター使用）
  ```typescript
  import { PrismaPg } from "@prisma/adapter-pg"
  import { PrismaClient } from "@/generated/prisma/client"

  const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
  }

  function createPrismaClient(): PrismaClient {
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
    return new PrismaClient({ adapter })
  }

  export const prisma = globalForPrisma.prisma ?? createPrismaClient()

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma
  }
  ```
  - Prisma 7 ではドライバーアダプター（`@prisma/adapter-pg`）が必須
  - import パスは `@/generated/prisma/client`（index ファイルがないため）
- `.env.example` に `DATABASE_URL` のテンプレートを記載（`.env` は Git 管理外）
  ```
  DATABASE_URL="postgresql://postgres:postgres@localhost:5432/kakeibo?schema=public"
  ```
- 初回マイグレーションは DB 接続環境が整ってから実行する
  ```bash
  pnpm exec prisma migrate dev --name init
  ```

### 1-5. Biome 設定

- Next.js 16 は ESLint を含まないため、削除は不要。Biome をインストール
  ```bash
  pnpm add -D @biomejs/biome
  pnpm exec biome init
  ```
- `biome.json` の設定（Biome 2.x）
  ```json
  {
    "$schema": "https://biomejs.dev/schemas/2.4.4/schema.json",
    "vcs": {
      "enabled": true,
      "clientKind": "git",
      "useIgnoreFile": true
    },
    "files": {
      "ignoreUnknown": false,
      "includes": ["**", "!sample"]
    },
    "formatter": {
      "enabled": true,
      "indentStyle": "tab",
      "lineWidth": 100
    },
    "linter": {
      "enabled": true,
      "rules": { "recommended": true }
    },
    "javascript": {
      "formatter": { "semicolons": "asNeeded" }
    },
    "css": {
      "parser": { "tailwindDirectives": true }
    },
    "assist": {
      "enabled": true,
      "actions": {
        "source": { "organizeImports": "on" }
      }
    }
  }
  ```
  - Biome 2.x の変更点:
    - `ignore` → `files.includes` でネガションパターンを使用（`["**", "!sample"]`）
    - `organizeImports` → `assist.actions.source.organizeImports` に移動
    - `css.parser.tailwindDirectives: true` で Tailwind CSS v4 の `@theme` 等を許可
    - `vcs` で `.gitignore` のパターンを尊重
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
pnpm add -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom vite-tsconfig-paths
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
- `prisma/*.db`, `prisma/*.db-journal` を確認
- `.next/`, `node_modules/`, `coverage/` 等を確認
- `/src/generated/prisma` を追加（Prisma 7 の生成先）
- 既存の `.gitignore` に大部分のエントリが含まれていたため、Prisma 生成ファイルの追加のみ実施

## 完了条件

- [x] `pnpm dev` でアプリが起動し、ダッシュボードページが表示される
- [x] `pnpm lint` （Biome）がエラーなく通過する
- [x] TypeScript strict モードでのビルドが成功する（`pnpm build`）
- [x] ヘッダーが表示され、`/` → `/dashboard` のリダイレクトが動作する
- [x] `pnpm test:run` でサンプルテストが通過する

## 成果物

| ファイル | 説明 |
|---|---|
| `package.json` | 依存関係・スクリプト定義 |
| `pnpm-workspace.yaml` | pnpm ワークスペース設定（Prisma ビルド許可リスト） |
| `.node-version` | Node.js バージョン指定（v22） |
| `tsconfig.json` | TypeScript 設定 |
| `next.config.ts` | Next.js 設定 |
| `postcss.config.mjs` | PostCSS 設定（Tailwind CSS v4） |
| `biome.json` | Biome リンター/フォーマッター設定 |
| `prisma/schema.prisma` | データベーススキーマ |
| `prisma.config.ts` | Prisma 7 設定ファイル（DB 接続先等） |
| `.env.example` | 環境変数テンプレート |
| `src/server/lib/prisma.ts` | Prisma クライアントシングルトン |
| `src/app/layout.tsx` | ルートレイアウト |
| `src/app/globals.css` | グローバルスタイル（Tailwind エントリ） |
| `src/app/page.tsx` | トップページ（リダイレクト） |
| `src/app/dashboard/page.tsx` | ダッシュボードページ（プレースホルダー） |
| `src/app/dashboard/loading.tsx` | ローディング UI |
| `src/client/components/layout/Header.tsx` | ヘッダーコンポーネント |
| `vitest.config.ts` | Vitest 設定 |
| `src/test/setup.ts` | テストセットアップ |
| `src/test/setup.test.ts` | Vitest 動作確認テスト |
