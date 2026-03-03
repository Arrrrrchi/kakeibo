# Issue #13: 毎月の投信積立額を見える化

## 概要

マネーフォワード Me の CSV には「振替」フラグ付きのレコードがあり、現状は CSV パーサーでスキップされている。
「振替 SBI証券」（住信SBIネット銀行からの振替）は毎月の投信積立に相当するため、
予算対比レポートの末尾にその月次集計行を追加して可視化する。

## 実装方針

- `Transaction` モデルに `isTransfer: Boolean` フィールドを追加してマイグレーション
- CSV パーサーを修正し、振替レコードも DB に保存（`isTransfer = true` として記録）
- 既存の集計クエリ（月次集計・カテゴリ内訳）では `isTransfer = false` 条件を追加し、二重計上を防ぐ
- トランザクションリポジトリに `getMonthlyInvestmentTransferTrend()` を追加し、
  description が「振替 SBI証券」で始まる振替レコードの月次合計を返す
- `DashboardData` に `investmentRow` を追加してユースケース・ローダー・UI へと流す
- `ReportPanel` の最下部に「投信積立 (SBI証券)」行を表示（予算・差額・達成率なし）

## タスクリスト

- [x] 1-1. Prisma スキーマに `isTransfer` フィールドを追加しマイグレーション実行
- [x] 1-2. `TransactionCreateInput` 型に `isTransfer` を追加
- [x] 2-1. `csv-parser.test.ts`: 振替レコードを保存する・`isTransfer` フラグが正しく設定されることを検証するテストを追加（Red）
- [x] 2-2. CSV パーサーを修正して振替レコードも保存するよう実装（Green）
- [x] 3-1. `prisma-transaction.repository.test.ts` 相当のモックテスト: `getMonthlyInvestmentTransferTrend` のテストを追加（Red）
- [x] 3-2. リポジトリインターフェースに `getMonthlyInvestmentTransferTrend` を追加
- [x] 3-3. `PrismaTransactionRepository` に実装（Green）
- [x] 4-1. `getMonthlyAggregation` / `getCategoryBreakdown` クエリに `is_transfer = false` 条件を追加
- [x] 5-1. `InvestmentRow` 型を定義し `DashboardData` に追加
- [x] 5-2. ユースケーステスト: `investmentRow` が正しく構築されることを検証（Red）
- [x] 5-3. `GetDashboardSummaryUsecase` に投信積立行の構築処理を追加（Green）
- [x] 6-1. `ReportPanel.test.tsx`: 投信積立行の表示テストを追加（Red）
- [x] 6-2. `ReportPanel` に投信積立行を追加（Green）

## 影響範囲

| ファイル | 変更内容 |
|---|---|
| `prisma/schema.prisma` | `isTransfer Boolean @default(false)` を Transaction に追加 |
| `prisma/migrations/` | 新規マイグレーションファイル |
| `src/types/transaction.ts` | `TransactionCreateInput` に `isTransfer` 追加 |
| `src/server/lib/csv-parser.ts` | 振替レコードを保存・`isTransfer` フラグを設定 |
| `src/server/lib/csv-parser.test.ts` | 振替関連テストを追加 |
| `src/server/repositories/interfaces/transaction-repository.interface.ts` | `getMonthlyInvestmentTransferTrend` 追加 |
| `src/server/repositories/prisma-transaction.repository.ts` | 同メソッド実装・既存クエリ修正 |
| `src/types/dashboard.ts` | `InvestmentRow` 型追加・`DashboardData` に追加 |
| `src/server/usecases/get-dashboard-summary.usecase.ts` | 投信積立行の構築処理追加 |
| `src/server/usecases/get-dashboard-summary.usecase.test.ts` | 投信積立行のテスト追加 |
| `src/client/components/dashboard/ReportPanel.tsx` | 投信積立行の表示追加 |
| `src/client/components/dashboard/ReportPanel.test.tsx` | 表示テスト追加 |

## 完了条件

- `pnpm test:run` が全件グリーン
- `pnpm lint` エラーなし
- CSV 再インポート後に「投信積立 (SBI証券)」行が予算対比レポートの最下部に表示される
- 既存の予算対比レポートの数値（収入・支出・差額）が変わらない
