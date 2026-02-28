# Prisma Rules

## Schema

- テーブル名は snake_case で `@@map()` を使用する
- カラム名は camelCase (Prisma 側) → snake_case (DB 側) で `@map()` を使用する
- UUID を主キーとして使用する (`@id @default(uuid())`)
- `createdAt` / `updatedAt` を全テーブルに付与する

## Client

- Prisma クライアントはシングルトンで管理する (`src/server/lib/prisma.ts`)
- 開発環境のホットリロードでコネクションが増殖しないように `globalThis` にキャッシュする

## Repository Pattern

- Prisma への直接アクセスはリポジトリ内に閉じる
- ユースケースやアクションからは必ずリポジトリインターフェース経由でアクセスする
- これによりユースケースのテストでリポジトリをモックできる

## Migration

- マイグレーションは `pnpm exec prisma migrate dev --name <name>` で作成する
- 本番デプロイ前に `pnpm exec prisma migrate deploy` を実行する
- シードは `pnpm exec prisma db seed` で実行する
