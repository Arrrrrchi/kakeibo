# 年月範囲フィルター機能

作成日: 2026-04-11 | ステータス: レビュー待ち

## 背景・目的

現状、`/dashboard` ページは DB 上の全期間のトランザクションを集計して表示している。分析の柔軟性を高めるため、開始年月・終了年月の 2 点で表示期間を絞り込めるようにする。

- フィルタ状態は URL の `searchParams`（`from` / `to`、`"YYYY-MM"` 形式）で管理する。
- サーバーサイドで DB クエリに反映し、クライアント側のフィルタリングは行わない。
- 未指定時の挙動は後方互換（全期間）を維持する。

## スコープ

### 含む

- `DateRange` 型の追加と `searchParams` からの受け渡し
- `ITransactionRepository` の読み取り系メソッドへの `dateRange?: DateRange` 追加
- `PrismaTransactionRepository` の WHERE 句への反映
- `GetDashboardSummaryUsecase.execute()` の引数拡張
- `loadDashboardData()` および `DashboardPage` の `searchParams` 対応
- `DateRangeFilter` クライアントコンポーネントの新規追加
- ユースケース・リポジトリの単体テスト追加
- `searchParams` バリデーション（形式・順序）

### 含まない

- プリセット（「今月」「直近 3 ヶ月」等）のクイック選択 UI
- カテゴリ別ドリルダウンページ（`/dashboard/[category]` 等）への波及対応（本計画では dashboard トップのみ）
- `getDistinctCategories()` `findByCategory()` `findByCategoryAndMonth()` へのフィルタ拡張（ダッシュボードトップで未使用のため）
- `upsertMany()` への影響（書き込み系は対象外）
- 永続化（ユーザーごとのデフォルト範囲保存）

## 設計

### 影響ファイル

| ファイル | 変更内容 | 新規/既存 |
|---|---|---|
| `src/types/dashboard.ts` | `DateRange` 型を追加。`DashboardData` はそのまま | 既存 |
| `src/server/lib/date-range.ts` | `parseDateRange()` ヘルパー（`searchParams` → `DateRange \| undefined`、バリデーション込み） | 新規 |
| `src/server/lib/date-range.test.ts` | 上記の単体テスト | 新規 |
| `src/server/repositories/interfaces/transaction-repository.interface.ts` | 読み取り系メソッドに `dateRange?: DateRange` を追加 | 既存 |
| `src/server/repositories/prisma-transaction.repository.ts` | `dateRange` を raw SQL の WHERE 句に反映 | 既存 |
| `src/server/usecases/get-dashboard-summary.usecase.ts` | `execute(dateRange?: DateRange)` に変更。下流の repository 呼び出しに伝播 | 既存 |
| `src/server/usecases/get-dashboard-summary.usecase.test.ts` | `dateRange` 有無のテストを追加 | 既存 |
| `src/server/loaders/load-dashboard-data.ts` | `loadDashboardData(dateRange?: DateRange)` に変更 | 既存 |
| `src/server/loaders/load-dashboard-data.test.ts` | 引数伝播のテストを追加 | 既存 |
| `src/test/helpers/mock-repositories.ts` | `createMockTransactionRepository()` のシグネチャ反映（`vi.fn()` のままで OK、型のみ追従） | 既存 |
| `src/app/dashboard/page.tsx` | `searchParams` を `await` して `parseDateRange()` に渡す。`DateRangeFilter` を配置 | 既存 |
| `src/client/components/dashboard/DateRangeFilter.tsx` | `"use client"` リーフ、`<input type="month">` 2 つ、`useRouter().push` で URL 更新 | 新規 |
| `src/client/components/dashboard/DateRangeFilter.test.tsx` | React Testing Library で入力・送信ハンドラをテスト | 新規 |

### データモデル変更

DB スキーマ変更なし。既存の `transactions.date` カラム（`DATE` 型）をそのまま利用。

### 型定義変更

`src/types/dashboard.ts` に追加:

```ts
export type DateRange = {
  from: string; // "YYYY-MM"
  to: string;   // "YYYY-MM"（from 以上）
};
```

- 文字列ベースで保持する理由: `<input type="month">` の値形式と一致し、`searchParams` への往復で型変換ロスが出にくい。
- 使用箇所では `${from}-01` にしてから `date >= ...` / `date < (toNextMonth)-01` に変換する。
- バリデーション: 正規表現 `^\d{4}-(0[1-9]|1[0-2])$`。`from > to` の場合は未指定扱い（= 全期間）とする。
- `any` は使わず、入力は `string | string[] | undefined` を `unknown` 経由で受けて型ガードで絞る。

### リポジトリインターフェース変更

`ITransactionRepository` の以下のメソッドに `dateRange?: DateRange` を追加:

- `getMonthlyAggregation(dateRange?: DateRange)`
- `getCategoryBreakdown(dateRange?: DateRange)`
- `getMonthlyTrendByCategory(majorCategory, minorCategory, dateRange?: DateRange)`
- `getMonthlyInvestmentTransferTrend(descriptionPrefix, dateRange?: DateRange)`

変更しない（ダッシュボードトップで未使用）:

- `upsertMany`
- `findByCategory`
- `findByCategoryAndMonth`（`month` で既に単月指定済み）
- `getDistinctCategories`

### Prisma 実装変更

Prisma の `$queryRaw` はテンプレートリテラルでパラメータバインドを行うため、`dateRange` の有無で SQL を分岐させる。ヘルパーを SQL 断片組み立てに使うと `Prisma.sql` が必要になるので、各メソッドで 2 分岐（with / without dateRange）する方針を採る。

境界条件:

- 下限: `date >= '${from}-01'::date`
- 上限: `date < ('${to}-01'::date + interval '1 month')`（`to` 月を含む半開区間）

### ユースケース設計

`GetDashboardSummaryUsecase.execute(dateRange?: DateRange)` に変更:

- `getMonthlyAggregation(dateRange)` に伝播
- `getCategoryBreakdown(dateRange)` に伝播
- `buildBudgetReport` 内の `getMonthlyTrendByCategory(..., dateRange)` に伝播
- `buildInvestmentRow` 内の `getMonthlyInvestmentTransferTrend("SBI証券", dateRange)` に伝播
- `monthCount` は既に `monthlyTrend.length` から算出しているので、`dateRange` 範囲内のデータが存在する月数で自然に補正される

注意: `monthCount` はあくまで「データが存在する月数」であり、`dateRange` の全期間月数ではない。現状の KPI 計算（平均支出）との整合性は維持される。`monthCount` の意味が今後変わる可能性は計画書内で明記するに留める。

### Server Actions

本機能は read-only のため Server Action の追加はなし。`revalidatePath()` も不要。

### コンポーネント設計

| コンポーネント | 種別 | 役割 |
|---|---|---|
| `src/app/dashboard/page.tsx` | Server | `searchParams` を `await` して `parseDateRange()` → `loadDashboardData()` 呼び出し |
| `src/client/components/dashboard/DateRangeFilter.tsx` | Client (リーフ) | `<input type="month">` 2 つ、`useRouter` で `router.push` |
| `src/client/components/dashboard/DashboardTabs.tsx` | Client（既存） | 変更なし |

`DashboardPage`（Server）は引き続き Server Component のままで、`DateRangeFilter` のみ `"use client"` を付ける。親にはクライアント境界を持ち込まない。

## 実装ステップ

### Step 1: `DateRange` 型と `parseDateRange()` ヘルパーの追加

- 対象ファイル:
  - `src/types/dashboard.ts`（型追加）
  - `src/server/lib/date-range.ts`（新規）
  - `src/server/lib/date-range.test.ts`（新規）
- 変更内容:
  - `DateRange = { from: string; to: string }` をエクスポート
  - `parseDateRange(searchParams: Record<string, string | string[] | undefined>): DateRange | undefined`
  - 正規表現でフォーマット検証、`from > to` の場合は `undefined`、どちらか片方のみは `undefined`
- テスト方針:
  - 正常系（`from` < `to`）、等価（`from === to`）、フォーマット不正、片方欠落、`from > to`、配列混入（`?from=a&from=b`）
- 完了条件: `pnpm test:run src/server/lib/date-range.test.ts` が全通過

### Step 2: リポジトリインターフェースの拡張

- 対象ファイル: `src/server/repositories/interfaces/transaction-repository.interface.ts`
- 変更内容: Step 1 の `DateRange` を import し、4 メソッドに optional 引数を追加
- テスト方針: 型レベルの変更のみ。`pnpm lint` と `tsc`（`pnpm test:run`）で確認
- 完了条件: 型エラーなしでビルドが通る。既存呼び出しは引数省略のため壊れない
- 依存: Step 1

### Step 3: Prisma 実装で `dateRange` を WHERE 句に反映

- 対象ファイル: `src/server/repositories/prisma-transaction.repository.ts`
- 変更内容:
  - `getMonthlyAggregation` / `getCategoryBreakdown` / `getMonthlyTrendByCategory` / `getMonthlyInvestmentTransferTrend` を `dateRange` 有無で 2 分岐
  - 上限は半開区間（`date < (to-01 + interval '1 month')`）で実装
- テスト方針:
  - Prisma 実装の単体テストは行わない方針（既存も同様）
  - ユースケーステスト（Step 4）でインターフェース越しに検証する
- 完了条件: `pnpm lint` / `pnpm test:run` がグリーン
- 依存: Step 2

### Step 4: ユースケースで `dateRange` を伝播

- 対象ファイル:
  - `src/server/usecases/get-dashboard-summary.usecase.ts`
  - `src/server/usecases/get-dashboard-summary.usecase.test.ts`
- 変更内容:
  - `execute(dateRange?: DateRange)` に変更
  - 4 つのリポジトリ呼び出しに `dateRange` を渡す
  - テスト追加: `dateRange` を渡すと `getMonthlyAggregation` / `getCategoryBreakdown` / `getMonthlyTrendByCategory` / `getMonthlyInvestmentTransferTrend` の mock に同じ値が渡ること（`createMockRepositories` 系ヘルパー + `vi.mocked(...).mockResolvedValue(...)` → `expect(...).toHaveBeenCalledWith(...)`）
- 完了条件: 新旧テストが全通過
- 依存: Step 2（Step 3 とは独立に進められる）

### Step 5: Loader で `dateRange` を受け取る

- 対象ファイル:
  - `src/server/loaders/load-dashboard-data.ts`
  - `src/server/loaders/load-dashboard-data.test.ts`
- 変更内容:
  - `loadDashboardData(dateRange?: DateRange)` に変更し、`usecase.execute(dateRange)` に渡す
  - `import "server-only"` は維持
- テスト方針: 既存テストの引数伝播ケースを追加（`GetDashboardSummaryUsecase` をモック or 統合テストで確認、既存テストのスタイルに合わせる）
- 完了条件: テスト通過
- 依存: Step 4

### Step 6: `DashboardPage` で `searchParams` を受け取る

- 対象ファイル: `src/app/dashboard/page.tsx`
- 変更内容:
  - `PageProps`（Next.js 16 の `await params` / `await searchParams`）に準拠
  - `const sp = await searchParams;` → `parseDateRange(sp)` → `loadDashboardData(dateRange)`
  - `export const dynamic = "force-dynamic"` は維持
  - ヘッダー行に `<DateRangeFilter />` を配置（初期値として `dateRange` を渡す）
- テスト方針: ページ自体の単体テストは追加しない（既存方針）
- 完了条件: `pnpm dev` で `/dashboard?from=2024-01&to=2024-12` が動作し、未指定時は従来通り全期間表示
- 依存: Step 5, Step 7（UI が無くても URL 直打ちで動作確認可能なので、Step 7 と並列でも可）

### Step 7: `DateRangeFilter` クライアントコンポーネントの追加

- 対象ファイル:
  - `src/client/components/dashboard/DateRangeFilter.tsx`（新規、`"use client"`）
  - `src/client/components/dashboard/DateRangeFilter.test.tsx`（新規）
- 変更内容:
  - Props: `initialFrom?: string; initialTo?: string`
  - `useState` でローカル値を保持、`<form>` の submit または onChange debounce で `useRouter().push('/dashboard?from=...&to=...')` を呼ぶ
  - 「クリア」ボタンで `router.push('/dashboard')`
  - `from > to` のときは送信ボタンを disable（クライアント側の軽いバリデーション、権威はサーバー側）
- テスト方針:
  - 初期値が描画されること
  - 入力変更 → submit で `router.push` が期待 URL で呼ばれること（`next/navigation` をモック）
  - クリアで `/dashboard` に遷移すること
  - `from > to` のとき submit 不可
- 完了条件: テスト通過、リーフで `"use client"` が閉じている
- 依存: Step 1（型）

### Step 8: `DashboardPage` への `DateRangeFilter` 組み込み（Step 6 と統合してもよい）

- 対象ファイル: `src/app/dashboard/page.tsx`
- 変更内容: `CsvUploadForm` の隣または別行に `DateRangeFilter` を配置。`initialFrom` / `initialTo` を現在の `dateRange` から渡す
- 完了条件: 画面上で年月を変更 → URL が更新 → サーバー側で絞り込まれたデータが描画される一連の E2E 動作を開発環境で手動確認
- 依存: Step 6, Step 7

## テスト戦略

| レイヤー | 対象 | 方針 |
|---|---|---|
| 純粋関数 | `parseDateRange` | モックなしで境界値・不正入力を網羅 |
| ユースケース | `GetDashboardSummaryUsecase` | `createMockTransactionRepository()` を使い、`dateRange` が全リポジトリ呼び出しに伝播することを `toHaveBeenCalledWith` で検証 |
| Loader | `loadDashboardData` | 既存テストスタイルを踏襲し、引数伝播を検証 |
| Repository (Prisma) | `PrismaTransactionRepository` | 既存方針に合わせ DB 依存のテストは追加しない |
| UI | `DateRangeFilter` | React Testing Library + `next/navigation` モックで `router.push` 呼び出しを検証 |
| ページ | `DashboardPage` | 手動確認のみ（既存方針） |

## 注意事項・リスク

- **Next.js 16 の非同期 `searchParams`**: `DashboardPage` では `await searchParams` を必ず使う。同期アクセスは削除されている。
- **Prisma `$queryRaw` の SQL 分岐**: テンプレートリテラルを動的に組み立てる際に `Prisma.sql` の利用を検討するか、メソッドごとに with/without の 2 分岐で書く。後者の方が静的解析しやすく推奨。
- **`monthCount` の意味**: 現状「データが存在する月数」であり、`dateRange` が広くてもデータがない月はカウントされない。月平均支出 KPI の解釈に影響するため、将来「指定範囲の月数」に変えるなら別タスクとして切り出す。
- **`findByCategoryAndMonth` 等のドリルダウン系**: 本計画では対象外。カテゴリ詳細ページで `dateRange` に連動させる場合は別途 Issue を切る。
- **URL 状態とフォーム状態の同期**: `DateRangeFilter` では `searchParams` が正であり、URL 変更時に `initialFrom/To` を通じて再マウント時に反映される。`useEffect` ベースの双方向同期は避ける。
- **バリデーション境界**: `from > to` や不正形式はサーバー側で `undefined` に落とし、UI 側では送信 disable。両側で守ることで壊れた URL を受けても 500 にしない。
- **`any` 型禁止**: `searchParams` は `Record<string, string | string[] | undefined>` として受け、配列・undefined の場合は型ガードで絞る。
- **`"use client"` の境界**: 親（`page.tsx` / `DashboardTabs` のラッパー）には付けず、`DateRangeFilter` のみに閉じる。
- **Prisma 直アクセス禁止**: usecase / loader / action から Prisma を呼ばず、すべて `ITransactionRepository` 経由で行う。
- **`revalidatePath()` 不要**: read-only のため Server Action も revalidate も不要。
