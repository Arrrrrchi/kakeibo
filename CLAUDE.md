# Kakeibo - 家計分析ダッシュボード

@package.json

## Architecture

サーバーコンポーネントをデフォルトとする。データ取得は `src/server/loaders/` に切り出し (`import "server-only"` 必須)。ビジネスロジックは `src/server/usecases/`。DB アクセスは必ず `src/server/repositories/interfaces/` 経由 — ユースケースやアクションから Prisma を直接使わない。`"use client"` はリーフコンポーネントにのみ付与する。

## Commands

| Task | Command |
|------|---------|
| Dev | `pnpm dev` |
| Test (watch) | `pnpm test` |
| Test (CI) | `pnpm test:run` |
| Lint | `pnpm lint` |
| Lint + fix | `pnpm lint:fix` |

## Constraints

- Do NOT use relative imports — use `@/` absolute paths
- Do NOT add `"use client"` to parent/wrapper components — push it to leaf nodes
- Do NOT access Prisma from usecases or actions — always go through repository interfaces
- Do NOT skip `revalidatePath()` when writing a Server Action with side effects

## Commit Format

日本語、Conventional Commits 形式: `feat: ○○を追加 (1-1, 1-2)`  
Valid types: `feat` `fix` `docs` `test` `refactor` `chore` `ci`  
末尾にタスク番号を付ける。`Co-Authored-By` は付けない。タスクごとに個別コミット。

## Phase Completion

Phase 完了時は PR 作成前に:
1. `docs/mvp/phaseN_*.md` を実際の実装に合わせて更新する
2. 技術スタックの変更が後続 Phase ドキュメントに影響しないか確認する

## Key Design Docs

- `docs/20260228_1359_家計分析ダッシュボードアプリケーション設計.md`
- `docs/mvp/phase1_*.md` 〜 `docs/mvp/phase6_*.md`
