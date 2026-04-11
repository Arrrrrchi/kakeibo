# Commit Conventions

コミットメッセージは**日本語**で書く。Conventional Commits 形式に従う。

```
feat: ○○を追加 (1-1, 1-2)
fix: ○○のバグを修正 (2-3)
```

Valid types: `feat` `fix` `docs` `test` `refactor` `chore` `ci`

Rules:
- 末尾にタスク番号を `(1-1)` 形式で付ける
- `Co-Authored-By:` は付けない
- タスクごとに個別コミット — 複数タスクをまとめない
- Breaking changes: type の後に `!` を付ける (例: `feat!: APIを変更`)
