# 取引データインライン編集機能

作成日: 2026-04-11 | ステータス: 実装完了

## 概要

インポートされた Transaction を、ダッシュボードのモーダル（`BudgetItemMonthDetailModal` / `TransactionDetailModal`）のテーブル上から直接編集・削除できるようにする。マネーフォワードME の収入支出詳細画面に近い UX を提供する。

編集対象フィールド:
- `description`（内容）
- `amount`（金額）
- `majorCategory` / `minorCategory`（大項目・中項目）
- `memo`（メモ）
- `isTransfer`（振替フラグ）
- 行削除

`date` / `institution` / `moneyforwardId` / `importHash` は CSV 由来の不変データとして編集対象外。

## 参照UI分析（マネーフォワードME 収入支出詳細）

- 取引一覧がテーブル形式で表示される
- 各行のセルをクリックすると入力フィールドに切り替わり、フォーカスを外す (blur) と自動保存される
- カテゴリはドロップダウン（大項目 → 中項目の 2 段選択）
- 振替フラグはチェックボックス、削除はゴミ箱アイコン
- 保存中はインラインで saving インジケーター、失敗したらフィールドを元に戻してエラートーストを出す

## 現状分析（既存コードの構造）

### データモデル
- `prisma/schema.prisma` の `Transaction` モデル: `id` / `date` / `description` / `amount` / `majorCategory` / `minorCategory` / `institution` / `memo` / `moneyforwardId` / `isIncome` / `isTransfer` / `importHash` / `createdAt` / `updatedAt`
- `importHash` が `@unique`。金額やカテゴリなど編集対象を変更しても `importHash` は更新しないため、再 CSV 取り込み時の重複防止との衝突はない（要確認、注意事項参照）。

### 型定義
- `src/types/transaction.ts`: `Transaction` は Prisma 生成型の再エクスポート、`TransactionCreateInput` 定義あり。更新用 DTO (`TransactionUpdateInput`) は未定義。

### リポジトリ
- `src/server/repositories/interfaces/transaction-repository.interface.ts` (`ITransactionRepository`): `upsertMany` / `findByCategoryAndMonth` などの参照系のみ。**単一 Transaction の `update` / `delete` メソッドは未実装**。
- `src/server/repositories/prisma-transaction.repository.ts`: 同上。Prisma Client は `prisma.transaction.update` / `delete` を直接呼べる。

### ユースケース
- `src/server/usecases/manage-budget.usecase.ts` のようなパターンで作る予定。現在 `manage-transaction.usecase.ts` は存在しない。

### Server Actions
- `src/server/actions/` には `get-transactions-by-budget-item-month.ts` / `get-transactions-by-category.ts` / `upsert-budget.ts` / `delete-budget.ts` / `update-mappings.ts` / `import-csv.ts` が存在。
- `upsert-budget.ts` が `ActionResult` + `revalidatePath("/dashboard")` のお手本。

### クライアント側
- `src/client/components/dashboard/BudgetItemMonthDetailModal.tsx`: `"use client"`、`useEffect` で取引を取得しテーブル表示。各セルは静的レンダリング。
- `src/client/components/dashboard/TransactionDetailModal.tsx`: カテゴリ全体ビュー。同様のテーブル構造。
- `Modal` は `src/client/components/ui/Modal` にある既存コンポーネント。

### ローダー
- `src/server/loaders/load-dashboard-data.ts` がダッシュボード全体のデータを取得。カテゴリ一覧 (`getDistinctCategories`) は既に利用可能。

### 共通型
- `src/types/action.ts`: `ActionResult<T>` パターンが確立済み。

## スコープ

### 含む
- Transaction の `description` / `amount` / `majorCategory` / `minorCategory` / `memo` / `isTransfer` 更新
- Transaction の削除
- 2 つのモーダル (`BudgetItemMonthDetailModal`, `TransactionDetailModal`) に編集 UI を組み込む
- 編集後の集計・予算実績・カテゴリ内訳の再取得（`revalidatePath` による）

### 含まない
- 新規取引の手動追加（CSV インポート経由のみ）
- `date` / `institution` / `isIncome` / `moneyforwardId` / `importHash` の編集
- 一括編集・一括削除
- 編集履歴/監査ログ
- 楽観ロック（`updatedAt` ベースの衝突検知）

## 実装方針

- **リポジトリ拡張**: `ITransactionRepository` に `updateOne` / `deleteOne` を追加。
- **ユースケース新設**: `ManageTransactionUsecase`（`update` / `delete` メソッド）。`createMockRepositories()` ベースのユニットテストで純粋ロジックを保証する。
- **Server Action 追加**: `update-transaction.ts` と `delete-transaction.ts`。バリデーション → ユースケース呼び出し → `revalidatePath("/dashboard")` → `ActionResult` 返却。
- **Client 側**: 編集は「行単位インライン編集」方式を採用。セルクリックで `input` / `select` / `textarea` にスイッチし、blur または Enter で保存 Action を発火。保存中は行に opacity、失敗時はロールバック。
  - 既存モーダル本体は `"use client"` のまま。
  - **編集対象の行部分のみ独立した `EditableTransactionRow` クライアントコンポーネントに切り出す** ことで差分最小化。
  - カテゴリ候補は親モーダルから props で受け取る（親モーダルは既にクライアントなので、サーバーから初期 props として受け渡す or 開くときに初回取得）。
  - 代替案として「カテゴリ一覧用の独立 Server Action」(`get-distinct-categories.ts`) を追加し、初回マウント時にフェッチ。

## データモデル変更

**スキーマ変更なし**。`updatedAt` は既存で自動更新されるためそのまま利用。マイグレーションは不要。

## 型定義追加

`src/types/transaction.ts`:
```
export type TransactionUpdateInput = {
    description: string;
    amount: number;
    majorCategory: string;
    minorCategory: string;
    memo: string | null;
    isTransfer: boolean;
};
```

## リポジトリインターフェース変更

`src/server/repositories/interfaces/transaction-repository.interface.ts` に以下を追加:
```
updateOne(id: string, data: TransactionUpdateInput): Promise<Transaction>;
deleteOne(id: string): Promise<void>;
```
`PrismaTransactionRepository` は `prisma.transaction.update({ where: { id }, data })` / `prisma.transaction.delete({ where: { id } })` で実装。

新たにカテゴリ候補取得を Server Action で提供する場合:
- 既存の `getDistinctCategories()` を流用できるため、インターフェース追加は不要。

## ユースケース設計

新規: `src/server/usecases/manage-transaction.usecase.ts`

```
class ManageTransactionUsecase {
    constructor(private readonly repo: ITransactionRepository) {}
    async updateTransaction(id: string, data: TransactionUpdateInput): Promise<Transaction>;
    async deleteTransaction(id: string): Promise<void>;
}
```

バリデーションはアクション層で行い、ユースケースはリポジトリ委譲に徹する。

## Server Actions 設計

### `src/server/actions/update-transaction.ts`
- シグネチャ: `updateTransaction(id: string, input: TransactionUpdateInput): Promise<ActionResult<Transaction>>`
- バリデーション:
  - `id` が空でない
  - `description` が 1〜200 文字
  - `amount` が整数かつ >= 0（`isTransfer` のとき負値許可などは今回は考慮しない）
  - `majorCategory` / `minorCategory` が 1〜50 文字
  - `memo` が null または 0〜500 文字
  - `isTransfer` が boolean
- `new ManageTransactionUsecase(new PrismaTransactionRepository())` を生成して呼び出し
- 成功時 `revalidatePath("/dashboard")` → `{ success: true, data: transaction }`
- 失敗時 `{ success: false, error: "取引の更新に失敗しました" }`

### `src/server/actions/delete-transaction.ts`
- シグネチャ: `deleteTransaction(id: string): Promise<ActionResult>`
- 成功時 `revalidatePath("/dashboard")`

### `src/server/actions/get-distinct-categories.ts`（新規・任意）
- シグネチャ: `getDistinctCategories(): Promise<ActionResult<{ majorCategory: string; minorCategory: string }[]>>`
- 既存 `ITransactionRepository.getDistinctCategories()` を呼ぶだけ
- カテゴリドロップダウンの選択肢として利用

## コンポーネント設計

### 影響ファイル

| ファイル | 変更内容 | 新規/既存 |
|---|---|---|
| `src/types/transaction.ts` | `TransactionUpdateInput` 追加 | 既存 |
| `src/server/repositories/interfaces/transaction-repository.interface.ts` | `updateOne` / `deleteOne` 追加 | 既存 |
| `src/server/repositories/prisma-transaction.repository.ts` | `updateOne` / `deleteOne` 実装 | 既存 |
| `src/server/usecases/manage-transaction.usecase.ts` | ユースケース新設 | 新規 |
| `src/server/usecases/manage-transaction.usecase.test.ts` | ユニットテスト | 新規 |
| `src/server/actions/update-transaction.ts` | Server Action | 新規 |
| `src/server/actions/delete-transaction.ts` | Server Action | 新規 |
| `src/server/actions/get-distinct-categories.ts` | Server Action（カテゴリ候補） | 新規 |
| `src/client/components/dashboard/EditableTransactionRow.tsx` | 編集可能行コンポーネント | 新規 |
| `src/client/components/dashboard/EditableTransactionRow.test.tsx` | RTL テスト | 新規 |
| `src/client/components/dashboard/BudgetItemMonthDetailModal.tsx` | `EditableTransactionRow` を使うように差し替え、`onTransactionChange` で state 更新 | 既存 |
| `src/client/components/dashboard/TransactionDetailModal.tsx` | 同上 | 既存 |
| `src/client/components/dashboard/CategorySelect.tsx`（任意） | 大/中 2 段ドロップダウン | 新規 |
| `src/__tests__/mocks/repositories.ts` 等のモック | `updateOne` / `deleteOne` をモック追加 | 既存（場所は要確認） |

### Server/Client 分類
- `EditableTransactionRow` / `CategorySelect`: `"use client"`（イベントハンドラと `useState` を持つリーフ）
- 親モーダルは既に `"use client"`（useState/useEffect 利用）。親に変更は最小化。
- `update-transaction` / `delete-transaction` / `get-distinct-categories` は `"use server"`。

### 行コンポーネントの API
```
type EditableTransactionRowProps = {
    transaction: Transaction;
    categoryOptions: { majorCategory: string; minorCategory: string }[];
    onUpdated: (updated: Transaction) => void;
    onDeleted: (id: string) => void;
};
```
内部では `useState` で「編集中のフィールド」「saving 中フラグ」「ローカル編集値」を保持。保存失敗時にロールバック。

## 実装ステップ

### Step 1: 型・リポジトリ拡張
- 対象: `src/types/transaction.ts` / `transaction-repository.interface.ts` / `prisma-transaction.repository.ts`
- 内容: `TransactionUpdateInput` 追加、インターフェースに `updateOne` / `deleteOne` 追加、Prisma 実装追加
- テスト: 既存リポジトリはインテグレーションテスト対象外。`pnpm lint` / `pnpm test:run` で型エラーなしを確認
- 完了条件: ビルドと lint がパス

### Step 2: ManageTransactionUsecase 新設
- 対象: `src/server/usecases/manage-transaction.usecase.ts` + テスト
- 内容: `updateTransaction` / `deleteTransaction` を実装。`createMockRepositories()` を用いてリポジトリ呼び出し引数を検証
- テスト方針:
  - `updateTransaction` が `repo.updateOne(id, input)` を正しい引数で呼ぶ
  - `deleteTransaction` が `repo.deleteOne(id)` を呼ぶ
  - エラーは伝播する（repo が throw → usecase が throw）
- 完了条件: ユニットテスト緑、lint 緑

### Step 3: Server Action（update/delete/get-distinct-categories）
- 対象: `src/server/actions/update-transaction.ts` / `delete-transaction.ts` / `get-distinct-categories.ts`
- 内容: 各アクションを実装。バリデーション → ユースケース呼び出し → `revalidatePath("/dashboard")`
- テスト方針:
  - 既存の `upsert-budget.test.ts` と同パターンで、`vi.mock` により `PrismaTransactionRepository` をモック
  - バリデーション境界値（description 空/201 文字、amount 負値/小数、memo 501 文字）
  - 成功時に `revalidatePath` が呼ばれるか
- 完了条件: テスト緑

### Step 4: CategorySelect コンポーネント
- 対象: `src/client/components/dashboard/CategorySelect.tsx` + テスト
- 内容: 大/中 2 段ドロップダウン。props で候補と現在値を受け取り、`onChange(major, minor)` を発火
- テスト方針: 大項目切り替え時に中項目候補が絞り込まれる、選択時に onChange が呼ばれる
- 完了条件: RTL テスト緑

### Step 5: EditableTransactionRow コンポーネント
- 対象: `src/client/components/dashboard/EditableTransactionRow.tsx` + テスト
- 内容:
  - 各セルをクリック → 入力モード
  - blur / Enter で `updateTransaction` を呼ぶ
  - 削除ボタンで `deleteTransaction`（確認ダイアログ付き）
  - 楽観更新 + 失敗時ロールバック
  - saving 中は `aria-busy` / 薄いスタイル
- テスト方針:
  - `update-transaction` / `delete-transaction` アクションを `vi.mock`
  - クリックして編集モードになる、保存されると `onUpdated` が呼ばれる
  - 失敗時にロールバックされ、エラー表示が出る
  - 削除確認後 `onDeleted` が呼ばれる
- 完了条件: RTL テスト緑

### Step 6: BudgetItemMonthDetailModal 組み込み
- 対象: `src/client/components/dashboard/BudgetItemMonthDetailModal.tsx`
- 内容:
  - 初回マウント時に `getDistinctCategories()` も並行取得
  - 行を `EditableTransactionRow` に置き換え
  - `onUpdated` でローカル state を更新し、合計も再計算
  - `onDeleted` でローカル state から除外
- テスト方針: 既存モーダルのテストがあれば拡張（無ければ新規）。編集・削除で合計が再計算される
- 完了条件: 手動確認 + テスト緑

### Step 7: TransactionDetailModal 組み込み
- 対象: `src/client/components/dashboard/TransactionDetailModal.tsx`
- 内容: Step 6 と同様。月別推移チャートは `onUpdated` 時に再取得するか、ローカル差分だけ反映するかを判断（シンプルには `revalidatePath` に任せてモーダルを閉じずに再フェッチ or そのまま表示）
- 完了条件: 手動確認 + テスト緑

### Step 8: E2E 動作確認・ドキュメント更新
- 対象: `docs/feature/transaction-inline-edit.md` のステータス更新、必要であれば `docs/mvp/phaseN_*.md` への追記検討
- 内容: 実機確認、エッジケース洗い出し、スクリーンショット添付（任意）
- 完了条件: PR 作成準備完了

## テスト戦略

- **ユニット**: `ManageTransactionUsecase` はモックリポジトリで呼び出し検証
- **Action**: `vi.mock("@/server/repositories/prisma-transaction.repository")` で Prisma 層を切り、`revalidatePath` を `vi.mock("next/cache")` でスパイ
- **コンポーネント**: RTL + `user-event`。Server Action は `vi.mock` で置換し、編集・保存・ロールバック・削除のフローを検証
- **手動**: `pnpm dev` で 2 つのモーダルを開き、各フィールドの編集・保存・失敗時の挙動を確認

## 注意事項・リスク

- **`importHash` と編集の衝突**: `importHash` は CSV の元データから算出され、編集後も更新しない。同じ CSV を再インポートすると重複として `skipDuplicates` で弾かれる現在の挙動は維持される。ただしユーザーが「編集 → 再インポートで元に戻したい」ケースではユーザビリティ上の混乱があり得るため、PR 説明に明記する。
- **カテゴリ変更による予算実績の再計算**: `revalidatePath("/dashboard")` により loader が再実行され、`BudgetItemCard` などのサーバーレンダリングは更新されるが、**モーダル内のローカル state は revalidate の影響を受けない**。モーダル側は `onUpdated` でローカル state を更新すること。
- **Client 側でのカテゴリ変更時の表示の整合性**: カテゴリを変更したら、現在のモーダル（`BudgetItemMonthDetailModal` は特定カテゴリ集合で絞っている）から該当取引を外す必要がある。`onUpdated` の結果が現在のフィルタ条件に合致しなければリスト削除扱いにする。
- **any 禁止**: Server Action 内で `FormData` は使わず、プレーンオブジェクト受け取り。呼び出し側でも `TransactionUpdateInput` 型で渡す。
- **`"use client"` 配置**: 親モーダルはすでにクライアントなのでそのまま。新規作成コンポーネントはリーフ扱いにし、不要に hoist しない。
- **`import "server-only"`**: 新規 loader は作らないので不要だが、リポジトリファイルには既に `server-only` が入っているので踏襲。
- **Prisma 直アクセス禁止**: アクション・ユースケースからは必ずインターフェース経由。
- **`revalidatePath`**: 両 Server Action で `/dashboard` を必ず呼ぶ。
- **ユースケーステスト**: `createMockRepositories()` を使う。ヘルパーの場所は実装時に `src/server/usecases/__mocks__/` や既存テストファイルから確認する。
- **楽観ロックなし**: 同一取引を複数タブから編集した場合、後勝ちになる。当面は許容し、issue として記録のみ。
