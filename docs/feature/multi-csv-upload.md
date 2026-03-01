# 複数CSVファイルアップロード機能

## 概要

現在は1ファイルずつしかCSVをアップロードできないが、複数ファイルを一度に選択・アップロードできるようにする。
マネーフォワード Me は月ごとにCSVをエクスポートするため、数ヶ月分をまとめてインポートしたいユースケースに対応する。

## 現状

- `CsvUploadForm` で `<input type="file" accept=".csv">` (単一ファイル)
- サーバーアクション `importCsv` は `FormData` から1ファイルを取得して処理
- `importHash` による重複排除済みのため、同じデータの再インポートは安全

## 方針

- `<input type="file" multiple>` で複数選択に対応
- サーバーアクションで全ファイルをまとめて受け取り、順次処理
- ファイルごとのバリデーションエラーは個別に報告し、正常なファイルは処理を継続（部分成功を許容）
- 合計サイズ上限を設ける（全ファイル合計 50MB）

## タスク

### 1. 型定義の拡張

**ファイル**: `src/types/action.ts`

`ActionResult` はそのまま活用し、複数ファイル用のレスポンス型を追加する。

```typescript
export type FileResult = {
  fileName: string
} & ({ success: true; importedCount: number } | { success: false; error: string })

export type MultiImportResult = {
  totalImported: number
  fileResults: FileResult[]
}
```

### 2. サーバーアクションの拡張

**ファイル**: `src/server/actions/import-csv.ts`

- 既存の `importCsv` (単一ファイル) は削除し、`importCsvFiles` (複数ファイル) に置き換える
- `FormData` の `getAll("files")` で複数ファイルを取得
- ファイルごとにバリデーション → パース → インポートを実行
- 1ファイルが失敗しても他のファイルの処理は継続する
- 全ファイル処理後に `revalidatePath("/dashboard")` を1回だけ呼ぶ

```typescript
export async function importCsvFiles(
  formData: FormData,
): Promise<ActionResult<MultiImportResult>> {
  const files = formData.getAll("files") as File[]
  // ファイル数・合計サイズのバリデーション
  // ファイルごとに処理し、結果を集約
}
```

### 3. UI の変更

**ファイル**: `src/client/components/forms/CsvUploadForm.tsx`

- `useState<File[]>` で複数ファイルを管理
- `<input type="file" multiple accept=".csv">` に変更
- 選択中ファイル一覧を表示（ファイル名 + サイズ）
- 個別ファイルの削除ボタン（×）を追加
- アップロード結果をファイルごとに表示（Toast ではなく結果リストで表示）
  - 成功: ファイル名 + インポート件数
  - 失敗: ファイル名 + エラー内容

### 4. テスト

#### 4-1. サーバーアクションのテスト (`import-csv.test.ts`)

- ファイルが0件の場合エラー
- 合計サイズ超過でエラー
- 単一ファイルの正常インポート
- 複数ファイルの正常インポート（合計件数の確認）
- 一部ファイルが不正な場合、正常ファイルは処理される（部分成功）
- 全ファイルが不正な場合のエラー

#### 4-2. UI コンポーネントのテスト (`CsvUploadForm.test.tsx`)

- 複数ファイル選択で一覧が表示される
- ファイル削除ボタンで一覧から除外される
- ファイル未選択時はボタン無効
- アップロード成功時に結果が表示される
- 部分成功時にファイルごとの結果が表示される

## 変更対象ファイル

| ファイル | 変更内容 |
|---------|---------|
| `src/types/action.ts` | `FileResult`, `MultiImportResult` 型を追加 |
| `src/server/actions/import-csv.ts` | `importCsv` → `importCsvFiles` に変更 |
| `src/server/actions/import-csv.test.ts` | 複数ファイル対応のテストに書き換え |
| `src/client/components/forms/CsvUploadForm.tsx` | 複数ファイル選択 UI に変更 |
| `src/client/components/forms/CsvUploadForm.test.tsx` | 複数ファイル対応のテストに書き換え |

## 変更しないもの

- `csv-parser.ts`: 1ファイル分のパース処理はそのまま（サーバーアクション側でループ）
- `import-transactions.usecase.ts`: 既存のユースケースをそのまま利用
- `prisma-transaction.repository.ts`: `skipDuplicates` で重複排除済み
- DB スキーマ: 変更なし
