# Kakeibo - 家計分析ダッシュボード

## Project Overview

マネーフォワード Me の CSV データをもとに家計の支出を予算と比較・分析するダッシュボードアプリケーション。

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI**: React 19 + TypeScript 5 (strict mode)
- **Styling**: Tailwind CSS v4 (`@import "tailwindcss"` 方式)
- **ORM**: Prisma + PostgreSQL
- **Charts**: Recharts
- **Package Manager**: pnpm
- **Linter/Formatter**: Biome (ESLint は使わない)
- **Test**: Vitest + React Testing Library
- **Node.js**: v22

## Architecture

- サーバーコンポーネントを優先し、`"use client"` はクライアント側の必然性がある場合のみ使用
- サーバーコンポーネントからのデータ取得は `src/server/loaders/` に切り出す
- サーバー側で動作する処理には `import "server-only"` を記述する
- サーバーアクション (`"use server"`) は副作用を伴う操作のためだけに使い、`revalidatePath` を 1 セットで行う
- リポジトリパターン: インターフェース (`src/server/repositories/interfaces/`) + Prisma 実装
- ユースケース (`src/server/usecases/`) でビジネスロジックを分離

## Coding Conventions

- TypeScript の import は `@/` から始まる絶対パスを使用
- Biome 設定: タブインデント、セミコロンなし、行幅 100
- 日本語のコメントは最小限にし、コードで意図を表現する
- コミットメッセージは日本語で、Conventional Commits 形式 (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`)
- コミットメッセージの末尾にタスク番号を含める（例: `feat: ○○を追加 (1-1, 1-2)`）
- コミットメッセージに `Co-Authored-By` は付けない
- PR 作成時は `.github/pull_request_template.md` のフォーマットに従う

## TDD

- **テスト駆動開発** を採用: テストを先に書く → 実装 → リファクタリング
- テストファイルはソースと同じディレクトリに配置 (コロケーション方式)
  - `csv-parser.ts` → `csv-parser.test.ts`
  - `Button.tsx` → `Button.test.tsx`
- テストフレームワーク: Vitest (`pnpm test`)
- ユースケースのテストではリポジトリをモックする (`src/test/helpers/mock-repositories.ts`)
- UI コンポーネントは React Testing Library でテスト

## Directory Structure

```
src/
├── app/              # Next.js App Router pages
├── client/           # クライアントサイドコード
│   ├── components/   # React コンポーネント
│   └── lib/          # クライアントユーティリティ
├── server/           # サーバーサイドコード
│   ├── actions/      # Server Actions ("use server")
│   ├── lib/          # サーバーユーティリティ (Prisma, CSV parser)
│   ├── loaders/      # データローダー (server-only)
│   ├── repositories/ # リポジトリ (interfaces/ + Prisma 実装)
│   └── usecases/     # ビジネスロジック
├── test/             # テストヘルパー・フィクスチャ
└── types/            # 型定義
```

## Commands

```bash
pnpm dev          # 開発サーバー起動
pnpm build        # プロダクションビルド
pnpm test         # テスト実行 (watch mode)
pnpm test:run     # テスト実行 (single run)
pnpm lint         # Biome lint
pnpm lint:fix     # Biome lint + 自動修正
```

## Key Design Docs

- `docs/20260228_1359_家計分析ダッシュボードアプリケーション設計.md` - 全体設計
- `docs/phase1_プロジェクト基盤.md` 〜 `docs/phase6_仕上げ.md` - 実装計画
