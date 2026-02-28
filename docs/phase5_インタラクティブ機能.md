# Phase 5: インタラクティブ機能

## 概要

予算マッピング、未割当カテゴリ管理、取引詳細モーダル、予算フォーム、予算対比レポートなど、ユーザー操作を伴うインタラクティブな機能を実装する。

## タスク一覧

### 5-1. MappingPanel（予算マッピングタブ）

#### `src/client/components/dashboard/MappingPanel.tsx`

- `"use client"` コンポーネント
- props: `budgetItems: BudgetItemWithMappings[]`, `allCategories: CategoryBreakdown[]`

#### レイアウト

```
┌─────────────────────────────────────────────────┐
│ [UnmappedSection - sticky]                       │
├─────────────────────────────────────────────────┤
│ ── 毎月・固定 ──────────────────────────────     │
│ ┌─ BudgetItemCard ─────────────────────────┐    │
│ │ 電気代  ✏️         ¥10,000/月             │    │
│ │ [水道・光熱費/電気代] [+カテゴリ]          │    │
│ └──────────────────────────────────────────┘    │
│ ┌─ BudgetItemCard ─────────────────────────┐    │
│ │ ガス代  ✏️         ¥10,000/月             │    │
│ │ [水道・光熱費/ガス・灯油代]               │    │
│ └──────────────────────────────────────────┘    │
│ ── 毎月・変動 ──────────────────────────────     │
│ ...                                              │
│ [+ 予算を追加] ボタン                             │
└─────────────────────────────────────────────────┘
```

#### 機能

- 周期タイプごとのセクション分け（`CYCLE_TYPE_ORDER` 順）
- 各セクションにヘッダー行（背景色: `bg-[#34495e] text-white`）
- 予算項目カードの一覧表示
- 「予算を追加」ボタンで BudgetFormModal を開く

### 5-2. BudgetItemCard

#### `src/client/components/dashboard/BudgetItemCard.tsx`

- 予算項目 1 件を表示するカード
- props: `budgetItem: BudgetItemWithMappings`, `allCategories`, `onEdit`

#### 表示要素

- ヘッダー行: 費目名 + 編集アイコン + 月額予算
- マッピング済みカテゴリ: `CategoryChip` で表示（選択状態）
- チップ選択/解除で即座にサーバーアクション `updateMappings` を呼び出す
- 選択可能なカテゴリ一覧（未割当カテゴリから選択）

#### 操作

- カテゴリチップクリック → マッピング追加/削除
- 費目名 or 金額クリック → BudgetFormModal を開く
- 編集アイコンクリック → BudgetFormModal を開く

### 5-3. CategoryChip

#### `src/client/components/dashboard/CategoryChip.tsx`

- カテゴリを表すチップ（ピル型 UI）
- props: `majorCategory`, `minorCategory`, `selected`, `onClick`, `onDetailClick`

#### 表示

```
┌──────────────────────────────┐
│ 食費 / 共同生活費             │ ← selected 時は青背景
└──────────────────────────────┘
```

- 未選択: 白背景、グレーボーダー
- 選択済み: 青背景（`bg-[#2980b9] text-white`）
- ホバー: ボーダー色変更

#### 操作

- クリック: 選択/解除を切り替え → `onClick` コールバック
- 詳細ボタン（i アイコン等）: `onDetailClick` → TransactionDetailModal を開く

### 5-4. UnmappedSection

#### `src/client/components/dashboard/UnmappedSection.tsx`

- 未割当カテゴリの一覧表示
- props: `unmappedCategories: CategoryBreakdown[]`, `onCategoryClick`
- `position: sticky; top: 0` で上部固定

#### レイアウト

```
┌─ 未割当のカテゴリ (5件) [▼ 折りたたみ] ─────────┐
│ どの予算にも紐づいていない支出カテゴリです         │
│ [食費/外食] [交際費/飲み会] [趣味・娯楽/書籍] ... │
└─────────────────────────────────────────────────┘
```

#### 機能

- 背景色: `bg-amber-50 border border-amber-300`（警告色）
- 折りたたみ/展開トグル
- 未割当カテゴリ数を表示
- 各チップクリックで TransactionDetailModal を開く
- 未割当が 0 件の場合は非表示

### 5-5. TransactionDetailModal

#### `src/client/components/dashboard/TransactionDetailModal.tsx`

- 特定カテゴリの取引詳細を表示するモーダル
- props: `majorCategory`, `minorCategory`, `isOpen`, `onClose`

#### データ取得

- モーダル表示時に `getTransactionsByCategory` サーバーアクションを呼び出す
- ローディング中はスピナー表示

#### レイアウト

```
┌─ 水道・光熱費 / 電気代 ───────────────── [×] ─┐
│                                                │
│ ┌─ 月別推移 ─────────────────────────────────┐ │
│ │ [棒グラフ: 月別の支出推移]                   │ │
│ └───────────────────────────────────────────┘ │
│                                                │
│ ┌─ 統計サマリー ─────────────────────────────┐ │
│ │ 合計: ¥120,000  月平均: ¥10,000  件数: 12   │ │
│ └───────────────────────────────────────────┘ │
│                                                │
│ ┌─ 振り分け候補 ─────────────────────────────┐ │
│ │ この項目を振り分けられる予算:                 │ │
│ │ [電気代] [光熱費まとめ]                      │ │
│ └───────────────────────────────────────────┘ │
│                                                │
│ ┌─ 取引一覧 ─────────────────────────────────┐ │
│ │ 日付       内容           金額    金融機関   │ │
│ │ 2025/04/15 東京電力       ¥8,500  楽天カード │ │
│ │ 2025/05/15 東京電力       ¥9,200  楽天カード │ │
│ │ ...                                         │ │
│ └───────────────────────────────────────────┘ │
└────────────────────────────────────────────────┘
```

#### 機能

- 月別推移: Recharts の `BarChart` で簡易チャート
- 統計サマリー: 合計、月平均、件数
- 振り分け候補: この中項目を紐づけ可能な予算項目のリスト（クリックで即座にマッピング）
- 取引一覧: テーブル形式で全取引を表示（日付降順）

### 5-6. BudgetFormModal

#### `src/client/components/dashboard/BudgetFormModal.tsx`

- 予算項目の追加・編集・削除を行うモーダル
- props: `budgetItem?` (編集時), `isOpen`, `onClose`

#### レイアウト

```
┌─ 予算項目の編集 ──────────────────────── [×] ─┐
│                                                │
│ 費目名                                         │
│ ┌──────────────────────────────────────────┐   │
│ │ 電気代                                    │   │
│ └──────────────────────────────────────────┘   │
│                                                │
│ 月額予算（円）                                  │
│ ┌──────────────────────────────────────────┐   │
│ │ 10000                                     │   │
│ └──────────────────────────────────────────┘   │
│                                                │
│ 周期                                           │
│ ┌──────────────────────────────────────────┐   │
│ │ 毎月・固定                          ▼     │   │
│ └──────────────────────────────────────────┘   │
│                                                │
│           [削除] [キャンセル] [保存]             │
└────────────────────────────────────────────────┘
```

#### 機能

- 新規作成モード: `budgetItem` が未指定の場合
  - 「予算項目の追加」タイトル
  - 削除ボタン非表示
- 編集モード: `budgetItem` が指定された場合
  - 「予算項目の編集」タイトル
  - 既存値をフォームに初期表示
  - 削除ボタン表示（確認ダイアログ付き）
- フォーム送信: `upsertBudget` サーバーアクションを呼び出す
- 削除: `deleteBudget` サーバーアクション + 確認「本当に削除しますか？」
- バリデーション:
  - 費目名: 必須、50 文字以内
  - 月額予算: 必須、0 以上の整数
  - 周期: 必須、4 つの選択肢から選択
- 送信中はボタンを disabled + ローディング表示

### 5-7. ReportPanel（予算対比レポートタブ）

#### `src/client/components/dashboard/ReportPanel.tsx`

- 予算対比レポートを表示するパネル
- props: `budgetReport: BudgetReportRow[]`, `months: string[]`

#### レイアウト

```
┌─ サマリーバー ──────────────────────────────────┐
│ 予算合計: ¥3,800,000  実績合計: ¥3,500,000      │
│ 差額: +¥300,000  予算外: ¥150,000  超過: 3項目  │
└─────────────────────────────────────────────────┘

┌─ 予算対比テーブル ──────────────────────────────┐
│ 費目      4月    5月    ...  合計    予算   差額  │
│ ── 毎月・固定 ──────────────────────────────── │
│ 電気代   8,500  9,200  ... 120,000 120,000   0  │
│ ガス代   6,000  5,800  ...  70,000 120,000 +50k │
│ ── 毎月・変動 ──────────────────────────────── │
│ ...                                              │
│ ── 予算外支出 ──────────────────────────────── │
│ 外食     3,000  4,500  ...  45,000    —    —    │
│ ── 総合計 ──────────────────────────────────── │
│ 合計    ...                 3,500k 3,800k +300k │
└─────────────────────────────────────────────────┘
```

#### 機能

- サマリーバー: 予算合計、実績合計、差額、予算外支出合計、超過項目数
- テーブル:
  - 行ヘッダー: 費目名
  - 列: 月別実績 + 合計 + 予算 + 差額 + 達成率
  - 周期タイプごとのセクション行
  - 超過項目は赤色（`text-red-600 font-semibold`）
  - 予算内項目は緑色（`text-green-600`）
- 予算外支出セクション: マッピングされていないカテゴリの支出合計
- 総合計行: 全体の合計
- テーブルは横スクロール対応（月数が多い場合）

### 5-8. 月選択フィルター（オプション）

- ダッシュボードヘッダーまたはタブ内に月範囲のフィルターを設置
- デフォルト: 取引データの全期間
- 将来的な拡張ポイントとして UI の配置場所を確保しておく

## TDD テスト計画

### T5-1. CategoryChip のテスト

#### `src/client/components/dashboard/CategoryChip.test.tsx`

```typescript
import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { CategoryChip } from "./CategoryChip"

describe("CategoryChip", () => {
  it("大項目/中項目が表示される", () => {
    render(
      <CategoryChip
        majorCategory="水道・光熱費"
        minorCategory="電気代"
        selected={false}
        onClick={vi.fn()}
      />
    )
    expect(screen.getByText(/電気代/)).toBeInTheDocument()
  })

  it("selected=true で選択状態のスタイルが適用される", () => {
    const { container } = render(
      <CategoryChip
        majorCategory="水道・光熱費"
        minorCategory="電気代"
        selected={true}
        onClick={vi.fn()}
      />
    )
    // 青背景のクラスが適用されていることを確認
    expect(container.firstChild).toHaveClass(/selected|bg-/)
  })

  it("クリックで onClick が呼ばれる", async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(
      <CategoryChip
        majorCategory="水道・光熱費"
        minorCategory="電気代"
        selected={false}
        onClick={onClick}
      />
    )

    await user.click(screen.getByText(/電気代/))
    expect(onClick).toHaveBeenCalledOnce()
  })
})
```

### T5-2. UnmappedSection のテスト

#### `src/client/components/dashboard/UnmappedSection.test.tsx`

```typescript
import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { UnmappedSection } from "./UnmappedSection"

describe("UnmappedSection", () => {
  const mockCategories = [
    { majorCategory: "食費", minorCategory: "外食", total: 30000, count: 10 },
    { majorCategory: "交際費", minorCategory: "飲み会", total: 15000, count: 5 },
  ]

  it("未割当カテゴリ数が表示される", () => {
    render(<UnmappedSection unmappedCategories={mockCategories} onCategoryClick={vi.fn()} />)
    expect(screen.getByText(/2件/)).toBeInTheDocument()
  })

  it("未割当カテゴリのチップが表示される", () => {
    render(<UnmappedSection unmappedCategories={mockCategories} onCategoryClick={vi.fn()} />)
    expect(screen.getByText(/外食/)).toBeInTheDocument()
    expect(screen.getByText(/飲み会/)).toBeInTheDocument()
  })

  it("折りたたみ/展開が動作する", async () => {
    const user = userEvent.setup()
    render(<UnmappedSection unmappedCategories={mockCategories} onCategoryClick={vi.fn()} />)

    const toggle = screen.getByRole("button", { name: /折りたたみ|▼|▲/ })
    await user.click(toggle)

    // 折りたたみ後はチップが非表示
    expect(screen.queryByText(/外食/)).not.toBeVisible()
  })

  it("未割当が 0 件の場合は非表示", () => {
    const { container } = render(
      <UnmappedSection unmappedCategories={[]} onCategoryClick={vi.fn()} />
    )
    expect(container.firstChild).toBeNull()
  })
})
```

### T5-3. BudgetFormModal のテスト

#### `src/client/components/dashboard/BudgetFormModal.test.tsx`

```typescript
import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { BudgetFormModal } from "./BudgetFormModal"

describe("BudgetFormModal", () => {
  describe("新規作成モード", () => {
    it("タイトルが「予算項目の追加」", () => {
      render(<BudgetFormModal isOpen={true} onClose={vi.fn()} />)
      expect(screen.getByText("予算項目の追加")).toBeInTheDocument()
    })

    it("削除ボタンが非表示", () => {
      render(<BudgetFormModal isOpen={true} onClose={vi.fn()} />)
      expect(screen.queryByRole("button", { name: /削除/ })).not.toBeInTheDocument()
    })

    it("フォームが空の状態で表示される", () => {
      render(<BudgetFormModal isOpen={true} onClose={vi.fn()} />)
      expect(screen.getByLabelText(/費目名/)).toHaveValue("")
      expect(screen.getByLabelText(/月額予算/)).toHaveValue(null)
    })
  })

  describe("編集モード", () => {
    const mockBudgetItem = {
      id: "1", name: "電気代", monthlyAmount: 10000,
      cycleType: "monthly_fixed" as const,
      sortOrder: 100, createdAt: new Date(), updatedAt: new Date(),
      mappings: [],
    }

    it("タイトルが「予算項目の編集」", () => {
      render(<BudgetFormModal isOpen={true} onClose={vi.fn()} budgetItem={mockBudgetItem} />)
      expect(screen.getByText("予算項目の編集")).toBeInTheDocument()
    })

    it("既存値がフォームに初期表示される", () => {
      render(<BudgetFormModal isOpen={true} onClose={vi.fn()} budgetItem={mockBudgetItem} />)
      expect(screen.getByLabelText(/費目名/)).toHaveValue("電気代")
      expect(screen.getByLabelText(/月額予算/)).toHaveValue(10000)
    })

    it("削除ボタンが表示される", () => {
      render(<BudgetFormModal isOpen={true} onClose={vi.fn()} budgetItem={mockBudgetItem} />)
      expect(screen.getByRole("button", { name: /削除/ })).toBeInTheDocument()
    })
  })

  describe("バリデーション", () => {
    it("費目名が空で送信するとエラー表示", async () => {
      const user = userEvent.setup()
      render(<BudgetFormModal isOpen={true} onClose={vi.fn()} />)

      await user.click(screen.getByRole("button", { name: /保存/ }))

      // HTML5 バリデーションまたはカスタムエラー
      expect(screen.getByLabelText(/費目名/)).toBeInvalid()
    })
  })
})
```

### T5-4. ReportPanel のテスト

#### `src/client/components/dashboard/ReportPanel.test.tsx`

```typescript
import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { ReportPanel } from "./ReportPanel"

describe("ReportPanel", () => {
  it("サマリーバーに予算合計・実績合計・差額が表示される", () => {
    render(<ReportPanel budgetReport={mockReportData} months={["2025-04", "2025-05"]} />)

    expect(screen.getByText(/予算合計/)).toBeInTheDocument()
    expect(screen.getByText(/実績合計/)).toBeInTheDocument()
  })

  it("超過項目が赤色でハイライトされる", () => {
    const reportWithOverBudget = [
      { ...mockRow, totalActual: 150000, totalBudget: 120000, difference: -30000 },
    ]
    render(<ReportPanel budgetReport={reportWithOverBudget} months={["2025-04"]} />)

    // 差額がマイナスの行に赤色スタイルが適用されていることを確認
    const diffCell = screen.getByText(/-30,000|▲30,000/)
    expect(diffCell.className).toContain("red")
  })

  it("データが空の場合にメッセージが表示される", () => {
    render(<ReportPanel budgetReport={[]} months={[]} />)
    expect(screen.getByText(/データがありません/)).toBeInTheDocument()
  })
})
```

## 完了条件

- [ ] 予算マッピングタブでカテゴリチップの選択/解除が動作し、DB に反映される
- [ ] 未割当セクションにマッピングされていないカテゴリが正しく表示される
- [ ] 未割当セクションの折りたたみ/展開が動作する
- [ ] カテゴリチップクリックで取引詳細モーダルが開き、データが表示される
- [ ] 予算フォームモーダルで新規作成・編集・削除が動作する
- [ ] 予算対比レポートが正しい数値で表示される
- [ ] 超過項目が赤色でハイライトされる
- [ ] 全操作後に `revalidatePath` で画面が最新データに更新される
- [ ] モーダルが ESC キー・オーバーレイクリックで閉じる
- [ ] レスポンシブ: テーブルが横スクロール対応
- [ ] CategoryChip のテスト（表示・選択状態・クリック）が通過
- [ ] UnmappedSection のテスト（件数表示・折りたたみ・0件非表示）が通過
- [ ] BudgetFormModal のテスト（新規/編集モード・バリデーション）が通過
- [ ] ReportPanel のテスト（サマリー表示・超過ハイライト）が通過

## 成果物

| ファイル | 説明 |
|---|---|
| `src/client/components/dashboard/MappingPanel.tsx` | 予算マッピングパネル |
| `src/client/components/dashboard/BudgetItemCard.tsx` | 予算項目カード |
| `src/client/components/dashboard/CategoryChip.tsx` | カテゴリチップ |
| `src/client/components/dashboard/UnmappedSection.tsx` | 未割当セクション |
| `src/client/components/dashboard/TransactionDetailModal.tsx` | 取引詳細モーダル |
| `src/client/components/dashboard/BudgetFormModal.tsx` | 予算フォームモーダル |
| `src/client/components/dashboard/ReportPanel.tsx` | 予算対比レポート |
