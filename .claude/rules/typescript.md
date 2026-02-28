# TypeScript Rules

## Strict Mode

- `strict: true` を使用する。`any` 型は使わない
- `unknown` を使い、型ガードで絞り込む
- 関数の戻り値の型は明示的に書く (公開 API に限る)

## 型定義

- 型定義は `src/types/` に集約する
- Prisma が生成する型をベースにし、必要な場合のみ独自の型を定義する
- `interface` よりも `type` を優先する (チームの一貫性のため)
- ユニオン型やリテラル型を積極的に活用する

## Import

- `@/` パスエイリアスを使用する (相対パスは使わない)
- `import type` を型のみの import に使用する
- Biome が import 順序を自動整理するので手動で並べ替えない
