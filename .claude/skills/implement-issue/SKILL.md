---
name: implement-issue
description: >
  GitHubのissueURLが与えられたら、ブランチを切ってdocs/feature以下にプランを立て実装を進める。
  ユーザーが「https://github.com/.../issues/NNN を対応してください」と言ったときに自動的に呼び出す。
argument-hint: "<issue-url>"
user-invocable: true
allowed-tools: Bash, Read, Write, Edit, Glob, Grep, Agent, TodoWrite, WebFetch, Skill, EnterWorktree
---

# Issue 実装ワークフロー

`$ARGUMENTS` で渡された GitHub Issue URL を対応する。

## ステップ 1: Issue の内容を取得

```
gh issue view <issue-number> --repo <owner>/<repo> --json title,body,labels,assignees,milestone
```

URLから `owner/repo` と `issue-number` を抽出してコマンドを実行する。

## ステップ 2: ブランチを作成

Issue のタイトルと番号をもとに適切なブランチ名を決定する。

- ブランチ命名規則: `feature/issue-<number>-<short-description>` または `fix/issue-<number>-<short-description>`
- バグ修正は `fix/`、新機能は `feature/` プレフィックスを使用
- `<short-description>` は英小文字・ハイフン区切りで 3〜5 語程度

### ワークツリーを使う場合

ユーザーが「worktree で」「worktree を使って」などと指示した場合、
git-worktree スキルを呼び出してブランチ作成とセットアップを一括で行う:

```
Skill(git-worktree, args: "<branch-name>")
```

この場合 `git switch -c` は不要（EnterWorktree が新ブランチを作成するため）。

### 通常の場合

```
git switch -c <branch-name>
```

## ステップ 3: docs/feature/ にプランを作成

`docs/feature/issue-<number>-<short-description>.md` ファイルを作成し、以下の構成で記載する。

```markdown
# Issue #<number>: <title>

## 概要

<issue の目的・背景を 2〜3 文で要約>

## 実装方針

<アーキテクチャ上の判断・採用アプローチを説明>

## タスクリスト

- [ ] タスク 1
- [ ] タスク 2
- [ ] ...

## 影響範囲

<変更されるファイル・モジュールの一覧>

## 完了条件

<テスト・動作確認の基準>
```

## ステップ 4: 実装

プロジェクトの規約に従って実装を進める。

- **TDD**: テストを先に書いてから実装する
- **Biome**: `pnpm lint:fix` でフォーマットを整える
- **コミット**: タスクごとに日本語 Conventional Commits 形式でコミットする（`Co-Authored-By` は付けない）
- **コミットメッセージ末尾**: タスク番号を含める（例: `feat: ○○を追加 (1-1)`）
- タスクが完了するたびに `docs/feature/` のプランのチェックボックスを更新する

## ステップ 5: PR の準備

実装が完了したら `.github/pull_request_template.md` のフォーマットに従って PR の説明を準備し、ユーザーに確認する。
