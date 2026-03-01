# Phase 4: UI コンポーネント

## 概要

汎用 UI コンポーネント、チャートコンポーネント、ダッシュボードの基本画面（サマリータブ）、CSV アップロードフォームを実装する。Phase 5 のインタラクティブ機能の土台となる。

## タスク一覧

### 4-1. Recharts インストール

```bash
pnpm add recharts
```

### 4-2. クライアントユーティリティ

Phase 3 で実装済み。

#### `src/client/lib/format.ts`

- 通貨フォーマット関数
  ```typescript
  export function formatCurrency(amount: number): string {
    const sign = amount < 0 ? "-" : ""
    const formatted = new Intl.NumberFormat("ja-JP").format(Math.abs(amount))
    return `${sign}¥${formatted}`
  }

  export function formatCompactCurrency(amount: number): string {
    if (amount >= 10000) {
      return `${(amount / 10000).toFixed(1)}万`
    }
    return formatCurrency(amount)
  }

  export function formatPercent(value: number): string {
    return `${value.toFixed(1)}%`
  }

  export function formatMonth(yearMonth: string): string {
    const month = Number.parseInt(yearMonth.split("-")[1], 10)
    return `${month}月`
  }
  ```

### 4-3. 汎用 UI コンポーネント

`src/client/components/ui/` に作成する。hooks やイベントハンドラを使うコンポーネントのみ `"use client"` を付与する。

#### `Button.tsx` (`"use client"`)

- `ButtonHTMLAttributes<HTMLButtonElement>` を拡張した型定義
- variant: `primary` | `secondary` | `danger` | `add`
- size: `default` | `sm`
- Tailwind でスタイリング
  - primary: `bg-[#1a1a2e] text-white hover:bg-[#2c3e50]`
  - secondary: `bg-gray-100 text-gray-700 hover:bg-gray-200`
  - danger: `bg-red-50 text-red-700 border border-red-200 hover:bg-red-200`
  - add: `bg-green-50 text-green-800 border border-green-200 hover:bg-green-200`
- disabled 時: `opacity-50 cursor-not-allowed`

#### `Card.tsx`（サーバーコンポーネント）

- `title` prop（オプション）でヘッダー表示（`<h2>`）
- `className` prop でスタイル拡張可能
- 基本スタイル: `bg-white rounded-xl p-5 shadow-sm`

#### `Modal.tsx` (`"use client"`)

- オーバーレイ + 中央配置のモーダル
- `isOpen`, `onClose`, `title`, `children` props
- ESC キーで閉じる（`document.addEventListener("keydown")` で実装）
- オーバーレイクリックで閉じる、モーダル内部クリックは `stopPropagation`
- スクロール可能なボディ
- a11y: `role="dialog"`, `aria-modal="true"`, `aria-label={title}`
- Biome の a11y lint ルールを `biome-ignore` で抑制（overlay クリックは標準的なモーダル UX のため）

#### `KpiCard.tsx`（サーバーコンポーネント）

- `label`, `value`, `sub`（サブテキスト、オプション）, `color`（green/red/orange）props
- スタイル:
  ```
  ┌──────────────────┐
  │ 総支出            │  ← label (text-xs, text-gray-500)
  │ ¥2,345,678       │  ← value (text-2xl, font-bold, color)
  │ 月平均 ¥195,473   │  ← sub (text-xs, text-gray-400)
  └──────────────────┘
  ```

#### `Select.tsx` (`"use client"`)

- `options: { value, label }[]`, `value`, `onChange`, `label`, `className` props
- `<label>` でラベルとセレクトを包むパターン
- Tailwind でスタイリングした `<select>` ラッパー

#### `Table.tsx`（サーバーコンポーネント）

- 汎用テーブルコンポーネント
- `columns: { key, header, className? }[]`, `data: Record<string, string | number>[]`, `className` props
- ヘッダー固定（`sticky top-0`）
- スタイル:
  - ヘッダー: `bg-[#1a1a2e] text-white`
  - 行ホバー: `hover:bg-gray-50`

### 4-4. チャートコンポーネント

`src/client/components/charts/` に作成する。すべて `"use client"` コンポーネント。Recharts を使用。

テスト環境で Recharts の `ResponsiveContainer` が使う `ResizeObserver` をモックするため、`src/test/setup.ts` にモックを追加。

#### `MonthlyTrendChart.tsx`

- 月次の収入 vs 支出を棒グラフで表示
- props: `data: MonthlyAggregation[]`
- Recharts の `BarChart` + `Bar`（2 本: 収入=緑 `#22c55e`, 支出=赤 `#ef4444`）
- X 軸: 月（`formatMonth` で "4月", "5月", ...）
- Y 軸: 金額（`formatCompactCurrency` で万円単位）
- ツールチップ: `formatCurrency` でフォーマット
- レスポンシブ: `ResponsiveContainer` で幅 100%、高さ 300px
- データが空の場合「データがありません」を表示

#### `CategoryPieChart.tsx`

- 大項目別の支出構成をドーナツチャートで表示
- props: `data: CategoryBreakdown[]`
- Recharts の `PieChart` + `Pie`（`innerRadius=60`, `outerRadius=100` でドーナツ化）
- 大項目でグルーピング（`groupByMajorCategory` 関数で同一大項目の中項目を合算）
- カラーパレット: 10 色を定義（`COLORS` 配列）
- ラベル: 大項目名 + 割合%（`formatPercent` 使用）
- レジェンド表示、ツールチップ対応
- データが空の場合「データがありません」を表示

#### `StackedBarChart.tsx`

- 大項目別の月次推移を積み上げ棒グラフで表示
- props: `data: MonthlyAggregation[]`, `categoryData: CategoryBreakdown[]`
- 実装方針:
  - `buildStackedData` 関数で月ごと × 大項目の集計データを構築
  - カテゴリ全体の比率をもとに各月の支出を按分（月別×カテゴリ詳細データが `DashboardData` にないため近似）
  - Recharts の `BarChart` + 大項目ごとの `Bar`（`stackId="a"`）
  - カラーパレットは `CategoryPieChart` と統一（同じ `COLORS` 配列）
- レスポンシブ: 高さ 350px
- データが空の場合「データがありません」を表示

### 4-5. ダッシュボードタブコンテナ

#### `src/client/components/dashboard/DashboardTabs.tsx`

- `"use client"` コンポーネント
- タブ切り替え UI を管理（`useState<Tab>` で activeTab 管理）
- 3 つのタブ: サマリー / 予算マッピング / 予算対比レポート
- props: `dashboardData: DashboardData`
- a11y: `role="tablist"`, `role="tab"`, `aria-selected`, `role="tabpanel"`
- スタイル:
  - タブバー: `bg-white rounded-xl p-1 shadow-sm`
  - アクティブタブ: `bg-[#1a1a2e] text-white rounded-lg`
- アクティブタブに応じてパネルを切り替え表示
  - サマリー: `<SummaryPanel>`
  - 予算マッピング / 予算対比レポート: Phase 5 プレースホルダー

### 4-6. サマリーパネル

#### `src/client/components/dashboard/SummaryPanel.tsx`

- `"use client"` コンポーネント（チャートコンポーネントが `"use client"` のため）
- props: `data: DashboardData`
- KPI カード行（4 枚、`grid-cols-2 lg:grid-cols-4`）
  - 総収入（緑）
  - 総支出（赤）
  - 収支差額（正=緑、負=赤）
  - 月平均支出（オレンジ）+ サブテキスト「○ヶ月分」
- チャートセクション（`grid-cols-1 lg:grid-cols-2`）
  - 左: MonthlyTrendChart（Card でラップ、タイトル「月次収支トレンド」）
  - 右: CategoryPieChart（Card でラップ、タイトル「カテゴリ別支出」）
- 全幅セクション
  - StackedBarChart（Card でラップ、タイトル「カテゴリ別月次推移」）

### 4-7. CSV アップロードフォーム

#### `src/client/components/forms/CsvUploadForm.tsx`

- `"use client"` コンポーネント
- ファイル選択 → アップロードの 2 ステップ UI
- `<input type="file" accept=".csv">` でファイル選択
- ファイル未選択時はアップロードボタンを `disabled`
- アップロード中のローディング状態表示（「アップロード中...」）
- `importCsv` サーバーアクションを `useTransition` で呼び出し
- 結果表示: 成功時「○件インポートしました」（緑）/ 失敗時エラーメッセージ（赤）
- 成功後にファイル入力をリセット

### 4-8. ダッシュボードページの接続

#### `src/app/dashboard/page.tsx`

- サーバーコンポーネントとして `loadDashboardData()` を呼び出し
- `export const dynamic = "force-dynamic"` で動的レンダリングを強制（ビルド時に DB 接続が不要になる）
- ページ上部にタイトル「ダッシュボード」と `CsvUploadForm` を横並びで配置
- 取得したデータを `DashboardTabs` に props として渡す

```typescript
import { DashboardTabs } from "@/client/components/dashboard/DashboardTabs"
import { CsvUploadForm } from "@/client/components/forms/CsvUploadForm"
import { loadDashboardData } from "@/server/loaders/load-dashboard-data"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const data = await loadDashboardData()

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">ダッシュボード</h2>
        <CsvUploadForm />
      </div>
      <DashboardTabs dashboardData={data} />
    </div>
  )
}
```

#### `src/app/dashboard/loading.tsx`

- ローディングスケルトン UI
- `KpiSkeleton` / `ChartSkeleton` を抽出したコンポーネント構成
- ヘッダー + タブバー + KPI カード 4 枚 + チャート 2 枚分のスケルトン
- `animate-pulse` でパルスアニメーション

## TDD テスト計画

UI コンポーネントは React Testing Library を使ったコンポーネントテストを行う。
テストファーストで「何が表示されるべきか」「操作したら何が起きるか」を先に定義する。

テスト用のモックデータとして `src/test/fixtures/mock-dashboard-data.ts` に `createMockDashboardData()` ヘルパーを用意。

### T4-1. 汎用 UI コンポーネントのテスト

#### `src/client/components/ui/Button.test.tsx`（6 テスト）

- テキストが表示される
- クリックでハンドラが呼ばれる
- disabled 時はクリックできない
- variant=danger で danger スタイルが適用される
- variant=primary がデフォルトで適用される
- size=sm で小さいサイズが適用される

#### `src/client/components/ui/Card.test.tsx`（3 テスト）

- 子要素が表示される
- title を指定するとヘッダーが表示される
- title を指定しないとヘッダーが表示されない

#### `src/client/components/ui/Modal.test.tsx`（5 テスト）

- isOpen=true でモーダルが表示される
- isOpen=false でモーダルが非表示
- ESC キーで onClose が呼ばれる
- オーバーレイクリックで onClose が呼ばれる
- モーダル内部クリックでは閉じない

#### `src/client/components/ui/KpiCard.test.tsx`（3 テスト）

- ラベル・値・サブテキストが表示される
- color=green で緑色のスタイルが適用される
- sub を省略しても表示できる

#### `src/client/components/ui/Select.test.tsx`（3 テスト）

- ラベルが表示される
- すべてのオプションが表示される
- 選択変更で onChange が呼ばれる

#### `src/client/components/ui/Table.test.tsx`（3 テスト）

- ヘッダーが表示される
- データ行が表示される
- データが空の場合はヘッダーのみ表示される

### T4-2. DashboardTabs のテスト

#### `src/client/components/dashboard/DashboardTabs.test.tsx`（4 テスト）

- 3 つのタブが表示される
- デフォルトでサマリータブがアクティブ
- タブクリックでパネルが切り替わる
- サマリータブでサマリーパネルが表示される

### T4-3. チャートコンポーネントのテスト方針

チャート（Recharts）は DOM の詳細な描画テストが困難なため、以下の方針で行う:

- **テストする**: props を受け取ってクラッシュせずにレンダリングできること
- **テストする**: データが空の場合に適切なフォールバック表示がされること
- **テストしない**: SVG の描画内容（Recharts 側の責務）

各チャートコンポーネントに 2 テストずつ（計 6 テスト）。

### T4-4. CsvUploadForm のテスト

#### `src/client/components/forms/CsvUploadForm.test.tsx`（5 テスト）

- ファイル選択とアップロードボタンが表示される
- ファイル未選択時はアップロードボタンが無効
- ファイル選択後にアップロードボタンが有効になる
- 成功時にインポート件数が表示される
- エラー時にエラーメッセージが表示される

`importCsv` サーバーアクションは `vi.mock` でモック化。

## 完了条件

- [x] ダッシュボードページにアクセスするとサマリータブが表示される
- [x] KPI カード 4 枚が正しい値で表示される
- [x] 3 種類のチャートがデータに基づいて描画される
- [x] CSV アップロードでファイルをインポートし、画面が更新される
- [x] タブ切り替えが動作する（サマリータブのみ内容表示、他はプレースホルダー）
- [x] レスポンシブ: モバイル幅でも崩れない
- [x] ローディング中にスケルトン UI が表示される
- [x] 汎用 UI コンポーネントのテストが全て通過する（23 テスト）
- [x] DashboardTabs のタブ切り替えテストが通過する（4 テスト）
- [x] チャートコンポーネントがデータあり/なしでクラッシュしない（6 テスト）
- [x] CsvUploadForm のテストが通過する（5 テスト）
- [x] Biome lint エラーなし
- [x] `pnpm build` 成功

## 成果物

| ファイル | 説明 |
|---|---|
| `src/client/lib/format.ts` | フォーマットユーティリティ（Phase 3 で実装済み） |
| `src/client/components/ui/Button.tsx` | ボタンコンポーネント |
| `src/client/components/ui/Button.test.tsx` | ボタンテスト（6 テスト） |
| `src/client/components/ui/Card.tsx` | カードコンポーネント |
| `src/client/components/ui/Card.test.tsx` | カードテスト（3 テスト） |
| `src/client/components/ui/Modal.tsx` | モーダルコンポーネント |
| `src/client/components/ui/Modal.test.tsx` | モーダルテスト（5 テスト） |
| `src/client/components/ui/KpiCard.tsx` | KPI カードコンポーネント |
| `src/client/components/ui/KpiCard.test.tsx` | KPI カードテスト（3 テスト） |
| `src/client/components/ui/Select.tsx` | セレクトコンポーネント |
| `src/client/components/ui/Select.test.tsx` | セレクトテスト（3 テスト） |
| `src/client/components/ui/Table.tsx` | テーブルコンポーネント |
| `src/client/components/ui/Table.test.tsx` | テーブルテスト（3 テスト） |
| `src/client/components/charts/MonthlyTrendChart.tsx` | 月次トレンドチャート |
| `src/client/components/charts/MonthlyTrendChart.test.tsx` | 月次トレンドチャートテスト（2 テスト） |
| `src/client/components/charts/CategoryPieChart.tsx` | カテゴリ別ドーナツチャート |
| `src/client/components/charts/CategoryPieChart.test.tsx` | カテゴリ別チャートテスト（2 テスト） |
| `src/client/components/charts/StackedBarChart.tsx` | 積み上げ棒グラフ |
| `src/client/components/charts/StackedBarChart.test.tsx` | 積み上げ棒グラフテスト（2 テスト） |
| `src/client/components/dashboard/DashboardTabs.tsx` | タブコンテナ |
| `src/client/components/dashboard/DashboardTabs.test.tsx` | タブコンテナテスト（4 テスト） |
| `src/client/components/dashboard/SummaryPanel.tsx` | サマリーパネル |
| `src/client/components/forms/CsvUploadForm.tsx` | CSV アップロードフォーム |
| `src/client/components/forms/CsvUploadForm.test.tsx` | CSV アップロードフォームテスト（5 テスト） |
| `src/app/dashboard/page.tsx` | ダッシュボードページ |
| `src/app/dashboard/loading.tsx` | ローディング UI |
| `src/test/fixtures/mock-dashboard-data.ts` | テスト用モックダッシュボードデータ |
| `src/test/setup.ts` | テストセットアップ（ResizeObserver モック追加） |
