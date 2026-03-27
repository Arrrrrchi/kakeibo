---
name: setup-worktree
description: >
  kakeibo プロジェクトのワークツリーをセットアップする。
  メインリポジトリから .env をコピーし、依存関係のインストールと Prisma クライアントの生成を行う。
  git-worktree スキルから内部的に呼び出される。
argument-hint: "<main-repo-path>"
user-invocable: false
allowed-tools: Bash, Read
---

# kakeibo ワークツリーセットアップ

`$ARGUMENTS` にはメインリポジトリの絶対パスが渡される。
以下、`$MAIN_REPO` は `$ARGUMENTS` の値を指す。

## ステップ 1: .env をコピー

メインリポジトリから `.env` をワークツリーにコピーする。

```bash
cp "$MAIN_REPO/.env" .env
```

`.env` の中身を Read する必要はない。`cp` でファイルをそのままコピーするだけ。

## ステップ 2: 依存関係のインストール

```bash
pnpm install
```

## ステップ 3: Prisma クライアントの生成

```bash
pnpm exec prisma generate
```

出力先は `src/generated/prisma`（gitignore 済み）。

## ステップ 4: データベース確認

PostgreSQL は docker-compose で起動済み（ポート 5432）で、全ワークツリーで共有される。
DB が起動していない場合は `docker compose up -d` が必要な旨をユーザーに伝える。
