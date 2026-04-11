---
paths:
  - "**/*.test.ts"
  - "**/*.test.tsx"
  - "src/test/**"
---

# Testing Rules (TDD with Vitest)

## TDD Cycle

1. **Red**: テストを先に書いて失敗を確認する (`pnpm test`)
2. **Green**: 最小限の実装でテストを通す
3. **Refactor**: テストが通る状態を保ちながらコードを整理する

## テスト構成

- テストファイルはソースファイルと同じディレクトリに配置する
- ファイル名は `*.test.ts` または `*.test.tsx`
- テストヘルパーは `src/test/helpers/` に配置する
- フィクスチャは `src/test/fixtures/` に配置する

## テストの書き方

- `describe` でテスト対象の関数やコンポーネント名を指定する
- `it` で「何をしたら何が起きるか」を日本語で記述する
- 1 つのテストでは 1 つの振る舞いのみ検証する
- Arrange-Act-Assert パターンに従う

## レイヤー別テスト方針

- **純粋関数** (CSV パーサー, フォーマット関数): モックなしで直接テスト
- **ユースケース**: リポジトリインターフェースをモック (`src/test/helpers/mock-repositories.ts`)
- **サーバーアクション**: `next/cache` をモック、バリデーションロジックをテスト
- **UI コンポーネント**: React Testing Library で表示と操作をテスト
- **チャート (Recharts)**: クラッシュしないことのスモークテストのみ

## アンチパターン

- 実装の詳細をテストしない (内部状態やプライベートメソッド)
- スナップショットテストは使わない
- `test.skip` や `test.todo` を長期間放置しない
