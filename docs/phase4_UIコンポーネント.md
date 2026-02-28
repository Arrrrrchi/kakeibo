# Phase 4: UI コンポーネント

## 概要

汎用 UI コンポーネント、チャートコンポーネント、ダッシュボードの基本画面（サマリータブ）、CSV アップロードフォームを実装する。Phase 5 のインタラクティブ機能の土台となる。

## タスク一覧

### 4-1. Recharts インストール

```bash
pnpm add recharts
```

### 4-2. クライアントユーティリティ

#### `src/client/lib/format.ts`

- 通貨フォーマット関数
  ```typescript
  export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  export function formatCompactCurrency(amount: number): string {
    // 10000 → "1.0万" のような短縮表記
    if (Math.abs(amount) >= 10000) {
      return `${(amount / 10000).toFixed(1)}万`
    }
    return formatCurrency(amount)
  }

  export function formatPercent(value: number): string {
    return `${value.toFixed(1)}%`
  }

  export function formatMonth(month: string): string {
    // "2025-04" → "4月"
    const m = Number.parseInt(month.split("-")[1], 10)
    return `${m}月`
  }
  ```

### 4-3. 汎用 UI コンポーネント

`src/client/components/ui/` に作成する。すべて `"use client"` コンポーネント。

#### `Button.tsx`

- variant: `primary` | `secondary` | `danger` | `add`
- size: `default` | `sm`
- 既存 HTML のボタンスタイルを Tailwind で再現
  - primary: `bg-[#1a1a2e] text-white hover:bg-[#2c3e50]`
  - secondary: `bg-gray-100 text-gray-700 hover:bg-gray-200`
  - danger: `bg-red-50 text-red-700 border border-red-200 hover:bg-red-200`
  - add: `bg-green-50 text-green-800 border border-green-200 hover:bg-green-200`

#### `Card.tsx`

- `title` prop（オプション）でヘッダー表示
- 既存 HTML の `.card` スタイルを踏襲: `bg-white rounded-xl p-5 shadow-sm`

#### `Modal.tsx`

- オーバーレイ + 中央配置のモーダル
- `isOpen`, `onClose`, `title`, `children` props
- ESC キーで閉じる、オーバーレイクリックで閉じる
- スクロール可能なボディ
- 既存 HTML の `.modal` スタイルを踏襲

#### `KpiCard.tsx`

- `label`, `value`, `sub`（サブテキスト）, `color`（green/red/orange）props
- 既存 HTML の `.kpi` スタイルを踏襲
  ```
  ┌──────────────────┐
  │ 総支出            │  ← label (11px, gray)
  │ ¥2,345,678       │  ← value (24px, bold, color)
  │ 月平均 ¥195,473   │  ← sub (11px, lighter)
  └──────────────────┘
  ```

#### `Select.tsx`

- `options`, `value`, `onChange`, `label` props
- Tailwind でスタイリングした `<select>` ラッパー

#### `Table.tsx`

- 汎用テーブルコンポーネント
- `columns`, `data`, `className` props
- ヘッダー固定（`sticky top-0`）
- 既存 HTML のテーブルスタイルを踏襲
  - ヘッダー: `bg-[#1a1a2e] text-white`
  - 行ホバー: `hover:bg-gray-50`

### 4-4. チャートコンポーネント

`src/client/components/charts/` に作成する。すべて `"use client"` コンポーネント。Recharts を使用。

#### `MonthlyTrendChart.tsx`

- 月次の収入 vs 支出を棒グラフで表示
- props: `data: MonthlyAggregation[]`
- Recharts の `BarChart` + `Bar`（2 本: 収入=緑, 支出=赤）
- X 軸: 月（"4月", "5月", ...）
- Y 軸: 金額（万円単位）
- ツールチップ: フォーマット済み通貨表示
- レスポンシブ: `ResponsiveContainer` で幅 100%

#### `CategoryPieChart.tsx`

- 大項目別の支出構成をドーナツチャートで表示
- props: `data: CategoryBreakdown[]`
- Recharts の `PieChart` + `Pie`（`innerRadius` 指定でドーナツ化）
- 大項目でグルーピング（同一大項目の中項目を合算）
- カラーパレット: 8〜10 色を定義
- ラベル: 大項目名 + 割合%
- レジェンド表示

#### `StackedBarChart.tsx`

- 大項目別の月次推移を積み上げ棒グラフで表示
- props: `data: MonthlyAggregation[]`, `categoryData: CategoryBreakdown[]`
- 実装方針:
  - 月ごと × 大項目の集計データを構築
  - Recharts の `BarChart` + 大項目ごとの `Bar`（`stackId="a"`）
  - カラーパレットは `CategoryPieChart` と統一

### 4-5. ダッシュボードタブコンテナ

#### `src/client/components/dashboard/DashboardTabs.tsx`

- `"use client"` コンポーネント
- タブ切り替え UI を管理（state: activeTab）
- 3 つのタブ: サマリー / 予算マッピング / 予算対比レポート
- props: `dashboardData: DashboardData`
- 既存 HTML の `.tabs` スタイルを踏襲
  - タブバー: `bg-white rounded-xl p-1 shadow-sm`
  - アクティブタブ: `bg-[#1a1a2e] text-white rounded-lg`
- アクティブタブに応じてパネルを切り替え表示

### 4-6. サマリーパネル

#### `src/client/components/dashboard/SummaryPanel.tsx`

- KPI カード行（4 枚横並び、レスポンシブで折り返し）
  - 総収入（緑）
  - 総支出（赤）
  - 収支差額（正=緑、負=赤）
  - 月平均支出（オレンジ）+ サブテキスト「○ヶ月分」
- チャートセクション（2 カラムグリッド）
  - 左: MonthlyTrendChart
  - 右: CategoryPieChart
- 全幅セクション
  - StackedBarChart
- CSV アップロードボタン（ページ上部またはヘッダー内）

### 4-7. CSV アップロードフォーム

#### `src/client/components/forms/CsvUploadForm.tsx`

- `"use client"` コンポーネント
- ファイル選択 → アップロードの 2 ステップ UI
- `<input type="file" accept=".csv">` でファイル選択
- アップロード中のローディング状態表示
- `importCsv` サーバーアクションを `useActionState` または `useTransition` で呼び出し
- 結果表示: 成功時「○件インポートしました」/ 失敗時エラーメッセージ

### 4-8. ダッシュボードページの接続

#### `src/app/dashboard/page.tsx`

- サーバーコンポーネントとして `loadDashboardData()` を呼び出し
- 取得したデータを `DashboardTabs` に props として渡す

```typescript
import { loadDashboardData } from "@/server/loaders/load-dashboard-data"
import { DashboardTabs } from "@/client/components/dashboard/DashboardTabs"

export default async function DashboardPage() {
  const data = await loadDashboardData()
  return <DashboardTabs dashboardData={data} />
}
```

#### `src/app/dashboard/loading.tsx`

- ローディングスケルトン UI
- KPI カード 4 枚 + チャート 2 枚分のスケルトン

## TDD テスト計画

UI コンポーネントは React Testing Library を使ったコンポーネントテストを行う。
テストファーストで「何が表示されるべきか」「操作したら何が起きるか」を先に定義する。

### T4-1. 汎用 UI コンポーネントのテスト

#### `src/client/components/ui/Button.test.tsx`

```typescript
import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Button } from "./Button"

describe("Button", () => {
  it("テキストが表示される", () => {
    render(<Button>保存</Button>)
    expect(screen.getByRole("button", { name: "保存" })).toBeInTheDocument()
  })

  it("クリックでハンドラが呼ばれる", async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>保存</Button>)

    await user.click(screen.getByRole("button"))
    expect(handleClick).toHaveBeenCalledOnce()
  })

  it("disabled 時はクリックできない", async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(<Button onClick={handleClick} disabled>保存</Button>)

    await user.click(screen.getByRole("button"))
    expect(handleClick).not.toHaveBeenCalled()
  })

  it("variant=danger で danger スタイルが適用される", () => {
    render(<Button variant="danger">削除</Button>)
    const button = screen.getByRole("button")
    expect(button.className).toContain("red")
  })
})
```

#### `src/client/components/ui/Modal.test.tsx`

```typescript
import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Modal } from "./Modal"

describe("Modal", () => {
  it("isOpen=true でモーダルが表示される", () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="テスト">
        <p>コンテンツ</p>
      </Modal>
    )
    expect(screen.getByText("テスト")).toBeInTheDocument()
    expect(screen.getByText("コンテンツ")).toBeInTheDocument()
  })

  it("isOpen=false でモーダルが非表示", () => {
    render(
      <Modal isOpen={false} onClose={vi.fn()} title="テスト">
        <p>コンテンツ</p>
      </Modal>
    )
    expect(screen.queryByText("テスト")).not.toBeInTheDocument()
  })

  it("ESC キーで onClose が呼ばれる", async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(
      <Modal isOpen={true} onClose={onClose} title="テスト">
        <p>コンテンツ</p>
      </Modal>
    )

    await user.keyboard("{Escape}")
    expect(onClose).toHaveBeenCalledOnce()
  })

  it("オーバーレイクリックで onClose が呼ばれる", async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(
      <Modal isOpen={true} onClose={onClose} title="テスト">
        <p>コンテンツ</p>
      </Modal>
    )

    await user.click(screen.getByTestId("modal-overlay"))
    expect(onClose).toHaveBeenCalledOnce()
  })
})
```

#### `src/client/components/ui/KpiCard.test.tsx`

```typescript
import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { KpiCard } from "./KpiCard"

describe("KpiCard", () => {
  it("ラベル・値・サブテキストが表示される", () => {
    render(<KpiCard label="総支出" value="¥2,345,678" sub="月平均 ¥195,473" color="red" />)

    expect(screen.getByText("総支出")).toBeInTheDocument()
    expect(screen.getByText("¥2,345,678")).toBeInTheDocument()
    expect(screen.getByText("月平均 ¥195,473")).toBeInTheDocument()
  })
})
```

### T4-2. DashboardTabs のテスト

#### `src/client/components/dashboard/DashboardTabs.test.tsx`

```typescript
import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { DashboardTabs } from "./DashboardTabs"

describe("DashboardTabs", () => {
  const mockData = createMockDashboardData()

  it("3つのタブが表示される", () => {
    render(<DashboardTabs dashboardData={mockData} />)

    expect(screen.getByRole("tab", { name: /サマリー/ })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: /予算マッピング/ })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: /予算対比レポート/ })).toBeInTheDocument()
  })

  it("デフォルトでサマリータブがアクティブ", () => {
    render(<DashboardTabs dashboardData={mockData} />)

    const summaryTab = screen.getByRole("tab", { name: /サマリー/ })
    expect(summaryTab).toHaveAttribute("aria-selected", "true")
  })

  it("タブクリックでパネルが切り替わる", async () => {
    const user = userEvent.setup()
    render(<DashboardTabs dashboardData={mockData} />)

    await user.click(screen.getByRole("tab", { name: /予算マッピング/ }))

    const mappingTab = screen.getByRole("tab", { name: /予算マッピング/ })
    expect(mappingTab).toHaveAttribute("aria-selected", "true")
  })
})
```

### T4-3. チャートコンポーネントのテスト方針

チャート（Recharts）は DOM の詳細な描画テストが困難なため、以下の方針で行う:

- **テストする**: props を受け取ってクラッシュせずにレンダリングできること
- **テストする**: データが空の場合に適切なフォールバック表示がされること
- **テストしない**: SVG の描画内容（Recharts 側の責務）

```typescript
describe("MonthlyTrendChart", () => {
  it("データを渡してクラッシュせずにレンダリングできる", () => {
    expect(() => {
      render(<MonthlyTrendChart data={mockMonthlyData} />)
    }).not.toThrow()
  })

  it("データが空でもクラッシュしない", () => {
    expect(() => {
      render(<MonthlyTrendChart data={[]} />)
    }).not.toThrow()
  })
})
```

## 完了条件

- [ ] ダッシュボードページにアクセスするとサマリータブが表示される
- [ ] KPI カード 4 枚が正しい値で表示される
- [ ] 3 種類のチャートがデータに基づいて描画される
- [ ] CSV アップロードでファイルをインポートし、画面が更新される
- [ ] タブ切り替えが動作する（サマリータブのみ内容表示、他はプレースホルダー）
- [ ] レスポンシブ: モバイル幅でも崩れない
- [ ] ローディング中にスケルトン UI が表示される
- [ ] 汎用 UI コンポーネントのテストが全て通過する
- [ ] DashboardTabs のタブ切り替えテストが通過する
- [ ] チャートコンポーネントがデータあり/なしでクラッシュしない

## 成果物

| ファイル | 説明 |
|---|---|
| `src/client/lib/format.ts` | フォーマットユーティリティ |
| `src/client/components/ui/Button.tsx` | ボタンコンポーネント |
| `src/client/components/ui/Card.tsx` | カードコンポーネント |
| `src/client/components/ui/Modal.tsx` | モーダルコンポーネント |
| `src/client/components/ui/KpiCard.tsx` | KPI カードコンポーネント |
| `src/client/components/ui/Select.tsx` | セレクトコンポーネント |
| `src/client/components/ui/Table.tsx` | テーブルコンポーネント |
| `src/client/components/charts/MonthlyTrendChart.tsx` | 月次トレンドチャート |
| `src/client/components/charts/CategoryPieChart.tsx` | カテゴリ別ドーナツチャート |
| `src/client/components/charts/StackedBarChart.tsx` | 積み上げ棒グラフ |
| `src/client/components/dashboard/DashboardTabs.tsx` | タブコンテナ |
| `src/client/components/dashboard/SummaryPanel.tsx` | サマリーパネル |
| `src/client/components/forms/CsvUploadForm.tsx` | CSV アップロードフォーム |
| `src/app/dashboard/page.tsx` | ダッシュボードページ |
| `src/app/dashboard/loading.tsx` | ローディング UI |
