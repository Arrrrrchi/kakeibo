# サマリータブ再デザイン計画

作成日: 2026-04-12
対象: ダッシュボードの「サマリー」タブ（`SummaryPanel.tsx` の中身のみ）

## 1. スコープ

- 本計画は `src/client/components/dashboard/SummaryPanel.tsx` の中身の差し替えのみを扱う。
- `DashboardTabs.tsx` の構造、タブ構成（summary / mapping / report）は**変更しない**。
- 「予算マッピング」「予算対比レポート」タブは**一切触らない**（`MappingPanel` / `ReportPanel` は不変）。
- サーバー側 (`GetDashboardSummaryUsecase` / `DashboardData`) には必要最小限の拡張を加えるが、既存の `MappingPanel` / `ReportPanel` が参照するフィールド（`budgetItems` / `unmappedCategories` / `budgetReport` / `investmentRow` / `monthlyTrend` / `categoryBreakdown`）は**後方互換のため残す**。

## 2. 前提・意思決定

### 2.1 旧 SummaryPanel の要素は捨てるか残すか

参考画像には月次トレンドもスタックバーも KPI 4 枚構成も登場しないため、**旧 SummaryPanel の以下は削除**する：

- `KpiCard × 4`（総収入 / 総支出 / 収支差額 / 月平均支出）
- `MonthlyTrendChart`
- `StackedBarChart`
- `CategoryPieChart`（新しい `DonutChart` ラッパーに置き換えるため実質削除）

これらは SummaryPanel から外れるだけで、ファイル自体（`src/client/components/charts/*`）は将来利用余地を考慮して**本計画では削除しない**。使われていないことが確定したら別 PR で片付ける。

### 2.2 `DashboardData` の `monthlyTrend` / `categoryBreakdown` の扱い

- `categoryBreakdown` は `MappingPanel` / `DashboardTabs` が参照しているので**残す**。
- `monthlyTrend` は `ReportPanel` が月ヘッダー算出に使っているので**残す**。
- 新サマリーは両者を直接読まず、新規追加する `DashboardData.overview` を読む。

### 2.3 「4つの敵」バケット定義

既存の `CycleType` enum が 4 値（`monthly_fixed` / `monthly_variable` / `irregular_fixed` / `irregular_variable`）で「4つの敵」と 1:1 対応しているため、**スキーマ変更・マイグレーションは不要**。ラベル/カラーは共通定数に切り出す。

| CycleType          | 表示ラベル     | 用途           |
| ------------------ | -------------- | -------------- |
| monthly_fixed      | 毎月の固定支出 | 家賃・通信費等 |
| monthly_variable   | 毎月の変動支出 | 食費・日用品等 |
| irregular_fixed    | 単発の固定支出 | 年払い保険等   |
| irregular_variable | 単発の変動支出 | 旅行・家電等   |

### 2.4 未マッピングカテゴリの扱い

4つの敵ビューの集計では、どの `BudgetItem` にも属さない支出は `unclassified` バケットに集約し、「未分類」として 5 番目の要素としてドーナツ/リストに表示する（色はグレー系）。

### 2.5 サーバー/クライアント境界

- `SummaryPanel` は**サーバーコンポーネントのまま**とし、`DashboardData` を受け取り純粋にレイアウトを組む。
  - 現 `SummaryPanel.tsx` が `"use client"` であれば削除する。
- `"use client"` を付けるのは以下のリーフのみ：
  - `BreakdownCard`（支出の内訳：タブ状態を保持するため）
  - `DonutChart`（Recharts のラッパー）
- `IncomeExpenseSummaryCard`・`DetailDataCard`・各小パーツはサーバーコンポーネント。

## 3. 新 SummaryPanel の 3 カード構成

### 3.1 カード A: 収支実績 (`IncomeExpenseSummaryCard`)

- 左上に `収支実績`、右上に対象期間（`YYYY/MM ～ YYYY/MM`）。
- 中央に支出率（`totalExpense / totalIncome * 100` を四捨五入）を**超大型（text-7xl 相当）** で表示。色は率に応じて（〜80% 緑 / 〜100% オレンジ / >100% 赤）。
- 率の左右に「予算内収入」「支出」の金額を対比表示。
- 下部に評価コメント（率に応じた定型文 3 パターン：良好 / 注意 / 警告）。

### 3.2 カード B: 支出の内訳 (`BreakdownCard`)

- 上部に 2 タブ：`項目別` / `4つの敵別`（クライアント state）。
- 左（PC）/上（モバイル）に `DonutChart`、中央ラベルに合計支出額。
- 右（PC）/下（モバイル）に一覧：カラードット＋ラベル＋割合＋金額。
- データソース：
  - 項目別: `DashboardData.overview.breakdownByBudgetItem`
  - 4つの敵別: `DashboardData.overview.breakdownByCycleType`
- いずれも合計は `totalExpense` と一致するよう未分類バケットを含める。

### 3.3 カード C: 詳細データ (`DetailDataCard`)

3 セクションに分割した定義リスト：

- **総収入**: 総収入、予算内収入（予算マッピング済み収入）、予算外収入
- **総支出**: 総支出、毎月の固定支出、毎月の変動支出、単発の固定支出、単発の変動支出
- **総投資**（= 投信積立等）
- **貯蓄率**: 貯蓄率（= (総収入 − 総支出 − 総投資) / 総収入）、月平均支出、貯蓄率

各行は「ラベル + 金額（右寄せ）」。セクションヘッダ行の金額は太字。

## 4. PC レイアウト（参考画像をワイド化）

```
┌───────────────────────────────────────────┐
│ A. 収支実績（フル幅）                      │
├──────────────────────┬────────────────────┤
│ B. 支出の内訳         │ C. 詳細データ       │
│ (ドーナツ + リスト)   │ (定義リスト)        │
└──────────────────────┴────────────────────┘
```

- `lg:` 以上（>= 1024px）: カード A は横いっぱい、B と C を 2 カラム（`lg:grid-cols-5`、B=3 / C=2 相当）。
- `md:` 〜 `lg:`: A フル幅、B フル幅、C フル幅の縦 3 段。
- モバイル（`< md`）: 参考画像どおり縦一列。

## 5. 型・Usecase 拡張

### 5.1 `src/types/dashboard.ts`

既存 `DashboardData` に `overview` フィールドを追加：

```ts
export type BreakdownItem = {
	key: string; // budgetItemId | CycleType | "unclassified"
	label: string;
	amount: number; // 正の支出額
	ratio: number; // 0..1
	color: string; // HEX
};

export type DashboardOverview = {
	period: { from: string; to: string; monthCount: number };
	totalIncome: number;
	totalExpense: number;
	totalInvestment: number;
	mappedIncome: number; // 予算マッピング済み収入
	unmappedIncome: number; // 予算外収入
	expenseRate: number; // totalExpense / totalIncome
	savingsRate: number; // (income - expense - investment) / income
	monthlyAvgIncome: number;
	monthlyAvgExpense: number;
	byCycleType: {
		monthly_fixed: number;
		monthly_variable: number;
		irregular_fixed: number;
		irregular_variable: number;
		unclassified: number;
	};
	breakdownByBudgetItem: BreakdownItem[];
	breakdownByCycleType: BreakdownItem[];
};

export type DashboardData = {
	// ...既存フィールドはすべて残す
	overview: DashboardOverview;
};
```

### 5.2 `GetDashboardSummaryUsecase`

- 既存の集計結果を利用して `overview` を組み立てるプライベートメソッド `buildOverview` を追加。
- 4つの敵別集計は `budgetItems` をキーに `CycleType → 合計` を算出。マッピング済み支出カテゴリ以外はすべて `unclassified` に落とす。
- 「予算マッピング済み収入」は、収入カテゴリのうち `budgetItems.mappings` で拾われている分とする。
- Usecase は `key` / `label` / `amount` までを返し、`ratio` と `color` はプレゼンテーション層（`SummaryPanel`）で付加する（結合度を下げる）。

## 6. Step 分割（1 Step = 1 コミット）

### Step 1: 共通定数 `cycle-type.ts` を追加

- **タスク #1**
- **対象ファイル**
  - 新規: `src/client/lib/cycle-type.ts`
  - 新規: `src/client/lib/cycle-type.test.ts`
- **変更概要**
  - `CYCLE_TYPE_LABEL: Record<CycleType, string>` / `CYCLE_TYPE_COLOR: Record<CycleType, string>`。
  - `UNCLASSIFIED_LABEL` / `UNCLASSIFIED_COLOR`。
  - `getCycleTypeLabel(cycleType)` / `getCycleTypeColor(cycleType)` ヘルパ。
- **テスト観点**
  - 全 4 CycleType でラベル/カラーが取れる。
  - 不正値で fallback が返る。
- **完了条件**: `pnpm test:run` で新規テスト緑。
- **依存**: なし

---

### Step 2: `DashboardOverview` 型を追加

- **タスク #2**
- **対象ファイル**
  - 編集: `src/types/dashboard.ts`
- **変更概要**
  - `BreakdownItem`, `DashboardOverview` 型を export。
  - `DashboardData` に `overview: DashboardOverview` を追加（他フィールドは維持）。
- **テスト観点**: 型のみの変更。`tsc` が通ること。
- **完了条件**: `pnpm lint` / 型チェック通過。
- **依存**: Step 1

---

### Step 3: Usecase で `overview` を組み立てる

- **タスク #3**
- **対象ファイル**
  - 編集: `src/server/usecases/get-dashboard-summary.usecase.ts`
  - 編集: `src/server/usecases/get-dashboard-summary.usecase.test.ts`
- **変更概要**
  - `buildOverview(monthlyTrend, categoryBreakdown, budgetItems, investmentRow, dateRange)` を追加。
  - `byCycleType` の 4 + 未分類バケット、`breakdownByBudgetItem`・`breakdownByCycleType` を算出。
  - `expenseRate` と `savingsRate` のゼロ除算ガード。
  - 戻り値の `DashboardData` に `overview` を含める。
- **テスト観点**
  - 収入なしケース（rate が 0 でエラーにならない）。
  - 全カテゴリがマッピング済みのケースで `unclassified.amount === 0`。
  - 未分類が含まれるケースで `unclassified` にフォールバック。
  - 4 CycleType すべてに支出があるケース。
  - `breakdownByBudgetItem` の合計 + 未分類 ≒ `totalExpense`。
- **完了条件**: 既存テスト緑維持 + 新規テスト緑。
- **依存**: Step 2

---

### Step 4: `DonutChart` ラッパーを追加

- **タスク #4**
- **対象ファイル**
  - 新規: `src/client/components/charts/DonutChart.tsx`（`"use client"`）
  - 新規: `src/client/components/charts/DonutChart.test.tsx`
- **変更概要**
  - Recharts の `PieChart` + `Pie`（innerRadius 穴あき）+ `Cell` + `Tooltip`。
  - props: `items: { key; label; amount; color }[]` / `centerLabel?: ReactNode` / `size?: number`。
  - 中央ラベルを絶対配置で overlay。
  - 空データ時はグレー単色 + 「データなし」。
- **テスト観点**
  - items を渡すと正しい数の Cell が描画される。
  - 空配列で fallback。
- **完了条件**: 新規テスト緑。
- **依存**: Step 1

---

### Step 5: `IncomeExpenseSummaryCard` を追加

- **タスク #5**
- **対象ファイル**
  - 新規: `src/client/components/dashboard/summary/IncomeExpenseSummaryCard.tsx`（サーバー）
  - 新規: `src/client/components/dashboard/summary/IncomeExpenseSummaryCard.test.tsx`
- **変更概要**
  - props: `overview: DashboardOverview`。
  - 対象期間の右上表示、中央大型 `%`、左右に「予算内収入 / 支出」金額、下部に評価コメント。
  - `getExpenseRateLevel(rate): "good" | "warn" | "alert"` を純粋関数で分離。
- **テスト観点**
  - 期間ラベルが `YYYY/MM ～ YYYY/MM` 形式。
  - 率 0 / 80 / 100 / >100 のしきい値でコメント/色が切り替わる。
  - 金額が `formatCurrency` で整形される。
- **完了条件**: 新規テスト緑。
- **依存**: Step 2

---

### Step 6: `BreakdownCard` を追加（タブ切替）

- **タスク #6**
- **対象ファイル**
  - 新規: `src/client/components/dashboard/summary/BreakdownCard.tsx`（`"use client"`）
  - 新規: `src/client/components/dashboard/summary/BreakdownCard.test.tsx`
- **変更概要**
  - props: `byBudgetItem: BreakdownItem[]` / `byCycleType: BreakdownItem[]` / `totalExpense: number`。
  - タブ state: `"item" | "enemy"`、初期値 `"item"`。
  - `DonutChart` + リスト（カラードット、ラベル、割合 %、金額右寄せ）。
  - リストは降順ソート、未分類は最後に固定。
- **テスト観点**
  - タブ切替で表示データが変わる。
  - 0 件の場合 fallback。
  - 各行の割合表示と金額が props と一致。
- **完了条件**: 新規テスト緑。
- **依存**: Step 4, Step 5

---

### Step 7: `DetailDataCard` を追加

- **タスク #7**
- **対象ファイル**
  - 新規: `src/client/components/dashboard/summary/DetailDataCard.tsx`（サーバー）
  - 新規: `src/client/components/dashboard/summary/DetailDataCard.test.tsx`
- **変更概要**
  - props: `overview: DashboardOverview`。
  - 3 セクション（総収入 / 総支出 / 貯蓄率）を定義リストで表示。
  - 合計行太字、子行インデント。
- **テスト観点**
  - 各行の金額・割合が `overview` から描画される。
  - 貯蓄率が負の場合は赤表示。
- **完了条件**: 新規テスト緑。
- **依存**: Step 2

---

### Step 8: 新 `SummaryPanel` へ差し替え

- **タスク #8**
- **対象ファイル**
  - 編集: `src/client/components/dashboard/SummaryPanel.tsx`
- **変更概要**
  - `"use client"` を外す（サーバーコンポーネント化）。
  - 旧 KPI 4 枚 / `MonthlyTrendChart` / `StackedBarChart` / `CategoryPieChart` の import を全削除。
  - 新 3 カード（A/B/C）を section 4 のレイアウトで配置。
  - 色付与はこのコンポーネント内で `cycle-type.ts` 定数を使用。`breakdownByBudgetItem` は `BudgetItem.id` → 固定パレット（10 色ローテ）でマッピング。
- **テスト観点**
  - `DashboardTabs.test.tsx` が壊れていないこと。
- **完了条件**: `pnpm test:run` 全緑、`pnpm lint` 通過。
- **依存**: Step 5, 6, 7

---

### Step 9: 旧チャート参照のお掃除確認

- **タスク #9**
- **対象ファイル**: なし（Grep のみ）
- **変更概要**: `MonthlyTrendChart` / `StackedBarChart` / `CategoryPieChart` / `KpiCard` の参照ゼロなら「次 PR で削除候補」として TODO 記録。
- **依存**: Step 8

---

## 7. ディレクトリ構成（追加分）

```
src/
├── client/
│   ├── lib/
│   │   ├── cycle-type.ts                 (new)
│   │   └── cycle-type.test.ts            (new)
│   └── components/
│       ├── charts/
│       │   ├── DonutChart.tsx            (new)
│       │   └── DonutChart.test.tsx       (new)
│       └── dashboard/
│           ├── SummaryPanel.tsx          (rewrite)
│           └── summary/                   (new dir)
│               ├── IncomeExpenseSummaryCard.tsx
│               ├── IncomeExpenseSummaryCard.test.tsx
│               ├── BreakdownCard.tsx
│               ├── BreakdownCard.test.tsx
│               ├── DetailDataCard.tsx
│               └── DetailDataCard.test.tsx
├── server/
│   └── usecases/
│       ├── get-dashboard-summary.usecase.ts       (edit)
│       └── get-dashboard-summary.usecase.test.ts  (edit)
└── types/
    └── dashboard.ts                      (edit)
```

## 8. テスト戦略

| 層       | テスト                                                              |
| -------- | ------------------------------------------------------------------- |
| Usecase  | `buildOverview` の分岐（ゼロ除算・未分類・CycleType 全バケット）    |
| 共通定数 | `cycle-type.ts` のラベル/カラー取得                                 |
| Chart    | `DonutChart` のスライス描画 / 空データ fallback                     |
| Card     | 各カードの金額フォーマット・条件分岐（率しきい値・貯蓄率負の表示） |
| タブ切替 | `BreakdownCard` のタブ切替で表示が変わる                            |
| 統合     | `DashboardTabs.test.tsx` が既存どおり通ること                       |

## 9. 注意事項・リスク

- **Recharts SSR 問題**: `DonutChart` は `"use client"`、`BreakdownCard` の子にする。サーバーから直接呼ばない。
- **色の一貫性**: `byCycleType` は `cycle-type.ts` を唯一の真実とする。`byBudgetItem` は別パレット（`BUDGET_ITEM_PALETTE`）を同ファイル内に定義。
- **未分類キー統一**: Usecase と UI で `"unclassified"` キー共通利用。ラベル・カラーは `UNCLASSIFIED_*` 定数から引く。
- **既存タブへの副作用ゼロ**: `DashboardData` の既存フィールドを保つことで `MappingPanel` / `ReportPanel` は無変更。
- **「予算内/予算外収入」の暫定対応**: スキーマに明示的な区別がない場合、暫定的に「全収入を予算内」として扱い、`DashboardOverview.unmappedIncome = 0` としても可。その場合は TODO コメントで将来拡張を明記する。

## 10. 完了条件

- `pnpm test:run` で全テスト緑。
- `pnpm lint` / 型チェックエラーなし。
- `/dashboard` のサマリータブが参考画像の 3 カード構成で表示される。
- `DashboardTabs` のタブ切替で「予算マッピング」「予算対比レポート」が従来通り動く。
