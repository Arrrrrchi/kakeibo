# Phase 3: サーバーサイド

## 概要

ローダー、サーバーアクション、シードスクリプトを実装する。Phase 2 で構築したデータ層をサーバーコンポーネントやクライアントコンポーネントから利用するための接続レイヤーを作る。

## タスク一覧

### 3-1. ローダー実装

サーバーコンポーネントから呼び出すデータ取得関数を `src/server/loaders/` に作成する。

#### `src/server/loaders/constants.ts`

- 周期タイプの表示名マッピング
  ```typescript
  export const CYCLE_TYPE_LABELS: Record<CycleType, string> = {
    monthly_fixed: "毎月・固定",
    monthly_variable: "毎月・変動",
    irregular_fixed: "不定期・固定",
    irregular_variable: "不定期・変動",
  }

  export const CYCLE_TYPE_ORDER: CycleType[] = [
    "monthly_fixed",
    "monthly_variable",
    "irregular_fixed",
    "irregular_variable",
  ]
  ```

#### `src/server/loaders/load-dashboard-data.ts`

- `import "server-only"` を冒頭に記述
- `GetDashboardSummaryUsecase` を呼び出して `DashboardData` を返す
- サーバーコンポーネント（`dashboard/page.tsx`）から直接呼び出す
- データ取得処理:
  1. 月別集計データの取得
  2. カテゴリ別集計データの取得
  3. 予算項目（マッピング付き）の取得
  4. KPI サマリーの計算
  5. 未割当カテゴリの算出
  6. 予算対比レポートの構築
     - 各予算項目に紐づくカテゴリの月別実績を集計
     - 予算外支出（どの予算にも紐づかない支出）を算出
     - 月数に基づいた予算合計の計算（月額 × 月数）

```typescript
import "server-only"

export async function loadDashboardData(): Promise<DashboardData> {
  const usecase = new GetDashboardSummaryUsecase(
    new PrismaTransactionRepository(),
    new PrismaBudgetRepository(),
    new PrismaMappingRepository()
  )
  return usecase.execute()
}
```

### 3-2. サーバーアクション実装

`src/server/actions/` に `"use server"` ファイルを作成する。各アクションは処理完了後に `revalidatePath("/dashboard")` を呼び出す。

#### `src/server/actions/import-csv.ts`

- FormData から CSV ファイルを受け取る
- `parseMoneyforwardCsv()` でパース
- `ImportTransactionsUsecase` で DB に保存
- 戻り値: `{ success: boolean; importedCount: number; error?: string }`

```typescript
"use server"

import { revalidatePath } from "next/cache"

export async function importCsv(formData: FormData) {
  const file = formData.get("file") as File
  if (!file) {
    return { success: false, importedCount: 0, error: "ファイルが選択されていません" }
  }

  // ファイルサイズチェック（10MB 上限）
  if (file.size > 10 * 1024 * 1024) {
    return { success: false, importedCount: 0, error: "ファイルサイズが大きすぎます" }
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const transactions = await parseMoneyforwardCsv(buffer)
  const importedCount = await usecase.execute(transactions)

  revalidatePath("/dashboard")
  return { success: true, importedCount }
}
```

#### `src/server/actions/upsert-budget.ts`

- 新規作成と更新を 1 つのアクションで処理
- `id` がある場合は更新、ない場合は新規作成
- バリデーション:
  - `name`: 空文字不可、50 文字以内
  - `monthlyAmount`: 0 以上の整数
  - `cycleType`: 有効な CycleType 値

```typescript
"use server"

import { revalidatePath } from "next/cache"

export async function upsertBudget(formData: FormData) {
  const id = formData.get("id") as string | null
  const name = (formData.get("name") as string).trim()
  const monthlyAmount = Number(formData.get("monthlyAmount"))
  const cycleType = formData.get("cycleType") as CycleType

  // バリデーション
  if (!name || name.length > 50) {
    return { success: false, error: "費目名は1〜50文字で入力してください" }
  }
  if (!Number.isInteger(monthlyAmount) || monthlyAmount < 0) {
    return { success: false, error: "月額予算は0以上の整数で入力してください" }
  }

  if (id) {
    await usecase.updateBudget(id, { name, monthlyAmount, cycleType })
  } else {
    await usecase.createBudget({ name, monthlyAmount, cycleType })
  }

  revalidatePath("/dashboard")
  return { success: true }
}
```

#### `src/server/actions/delete-budget.ts`

- 予算項目の削除（カスケードでマッピングも削除）
- 削除前の存在確認

```typescript
"use server"

import { revalidatePath } from "next/cache"

export async function deleteBudget(id: string) {
  await usecase.deleteBudget(id)
  revalidatePath("/dashboard")
  return { success: true }
}
```

#### `src/server/actions/update-mappings.ts`

- 予算項目に対するカテゴリマッピングの一括更新
- 既存マッピングを全て削除し、新しいマッピングで置き換える

```typescript
"use server"

import { revalidatePath } from "next/cache"

export async function updateMappings(
  budgetItemId: string,
  categories: { majorCategory: string; minorCategory: string }[]
) {
  await usecase.execute(budgetItemId, categories)
  revalidatePath("/dashboard")
  return { success: true }
}
```

### 3-3. シードスクリプト

`prisma/seed.ts` にデフォルト予算項目とマッピングを投入するスクリプトを作成する。

#### 処理フロー

1. 既存の予算項目が存在するかチェック（冪等性担保）
2. 予算項目が 0 件の場合のみシードを実行
3. 設計ドキュメントの 35 項目を `sortOrder` 付きで挿入
4. デフォルトマッピングがある項目は `budget_category_mappings` も同時に作成

#### シードデータ構造

```typescript
const seedData = [
  // 毎月・固定（sortOrder: 100〜）
  {
    name: "住宅（家賃）",
    monthlyAmount: 70700,
    cycleType: "monthly_fixed",
    sortOrder: 100,
    mappings: [],
  },
  {
    name: "電気代",
    monthlyAmount: 10000,
    cycleType: "monthly_fixed",
    sortOrder: 101,
    mappings: [{ majorCategory: "水道・光熱費", minorCategory: "電気代" }],
  },
  // ... 以下、設計ドキュメントの 35 項目すべて
]
```

#### sortOrder の採番規則

| 周期タイプ | sortOrder 範囲 |
|---|---|
| monthly_fixed | 100〜199 |
| monthly_variable | 200〜299 |
| irregular_fixed | 300〜399 |
| irregular_variable | 400〜499 |

#### package.json への登録

```json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

```bash
pnpm add -D tsx
pnpm exec prisma db seed
```

### 3-4. 取引データ取得用のサーバーアクション（モーダル用）

#### `src/server/actions/get-transactions-by-category.ts`

- 取引詳細モーダルから呼び出す
- 指定カテゴリの取引一覧と月別推移を返す

```typescript
"use server"

export async function getTransactionsByCategory(
  majorCategory: string,
  minorCategory: string
) {
  const transactions = await transactionRepo.findByCategory(majorCategory, minorCategory)
  const monthlyTrend = await transactionRepo.getMonthlyTrendByCategory(majorCategory, minorCategory)

  return { transactions, monthlyTrend }
}
```

## TDD テスト計画

### T3-1. サーバーアクションのテスト

サーバーアクションはバリデーションロジックをテストする。`revalidatePath` や `FormData` はモックする。

#### `src/server/actions/upsert-budget.test.ts`

```typescript
import { describe, it, expect, vi } from "vitest"

// revalidatePath をモック
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

describe("upsertBudget", () => {
  it("費目名が空の場合はエラーを返す", async () => {
    const formData = new FormData()
    formData.set("name", "")
    formData.set("monthlyAmount", "10000")
    formData.set("cycleType", "monthly_fixed")

    const result = await upsertBudget(formData)

    expect(result.success).toBe(false)
    expect(result.error).toContain("費目名")
  })

  it("費目名が50文字を超える場合はエラーを返す", async () => {
    const formData = new FormData()
    formData.set("name", "あ".repeat(51))
    formData.set("monthlyAmount", "10000")
    formData.set("cycleType", "monthly_fixed")

    const result = await upsertBudget(formData)

    expect(result.success).toBe(false)
  })

  it("月額予算が負の値の場合はエラーを返す", async () => {
    const formData = new FormData()
    formData.set("name", "テスト")
    formData.set("monthlyAmount", "-1000")
    formData.set("cycleType", "monthly_fixed")

    const result = await upsertBudget(formData)

    expect(result.success).toBe(false)
    expect(result.error).toContain("月額予算")
  })

  it("月額予算が小数の場合はエラーを返す", async () => {
    const formData = new FormData()
    formData.set("name", "テスト")
    formData.set("monthlyAmount", "100.5")
    formData.set("cycleType", "monthly_fixed")

    const result = await upsertBudget(formData)

    expect(result.success).toBe(false)
  })
})
```

#### `src/server/actions/import-csv.test.ts`

```typescript
import { describe, it, expect, vi } from "vitest"

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

describe("importCsv", () => {
  it("ファイルが未選択の場合はエラーを返す", async () => {
    const formData = new FormData()
    const result = await importCsv(formData)

    expect(result.success).toBe(false)
    expect(result.error).toContain("ファイル")
  })

  it("10MB を超えるファイルはエラーを返す", async () => {
    const largeFile = new File([new ArrayBuffer(11 * 1024 * 1024)], "large.csv")
    const formData = new FormData()
    formData.set("file", largeFile)

    const result = await importCsv(formData)

    expect(result.success).toBe(false)
    expect(result.error).toContain("ファイルサイズ")
  })
})
```

### T3-2. ローダーのテスト

#### `src/server/loaders/load-dashboard-data.test.ts`

ユースケースをモックして、ローダーが正しくデータを返すことを確認する。

```typescript
import { describe, it, expect, vi } from "vitest"

describe("loadDashboardData", () => {
  it("ユースケースの execute を呼び出してデータを返す", async () => {
    // ユースケースのモックを設定
    // loadDashboardData() の戻り値が DashboardData 型であることを確認
  })
})
```

### T3-3. シードスクリプトのテスト

冪等性のテストは統合テストとして別途実施。
ここではシードデータの構造が正しいことをバリデーションする。

```typescript
import { describe, it, expect } from "vitest"
import { seedData } from "../prisma/seed-data"

describe("シードデータ", () => {
  it("35 項目が定義されている", () => {
    expect(seedData).toHaveLength(35)
  })

  it("全項目に必須フィールドがある", () => {
    for (const item of seedData) {
      expect(item.name).toBeTruthy()
      expect(item.monthlyAmount).toBeGreaterThanOrEqual(0)
      expect(["monthly_fixed", "monthly_variable", "irregular_fixed", "irregular_variable"]).toContain(item.cycleType)
    }
  })

  it("sortOrder が周期タイプに応じた範囲に収まっている", () => {
    const ranges = {
      monthly_fixed: [100, 199],
      monthly_variable: [200, 299],
      irregular_fixed: [300, 399],
      irregular_variable: [400, 499],
    }
    for (const item of seedData) {
      const [min, max] = ranges[item.cycleType]
      expect(item.sortOrder).toBeGreaterThanOrEqual(min)
      expect(item.sortOrder).toBeLessThanOrEqual(max)
    }
  })
})
```

## 完了条件

- [x] `loadDashboardData()` がサーバーコンポーネントから正常に呼び出せる
- [x] CSV インポートアクションがファイルアップロード → DB 保存 → 画面更新の一連の流れで動作する
- [x] 予算の CRUD アクションが正常に動作する
- [x] マッピング更新アクションが正常に動作する
- [x] シードスクリプトで 35 項目が正しく投入される
- [x] シードスクリプトが冪等（2 回実行しても重複しない）
- [x] 全アクションで `revalidatePath` が呼ばれ画面が再描画される
- [x] TypeScript 型チェックが通過する
- [x] サーバーアクションのバリデーションテストが全て通過する
- [x] シードデータの構造テストが通過する

## 成果物

| ファイル | 説明 |
|---|---|
| `src/server/loaders/constants.ts` | 定数定義 |
| `src/server/loaders/load-dashboard-data.ts` | ダッシュボードデータローダー |
| `src/server/actions/import-csv.ts` | CSV インポートアクション |
| `src/server/actions/upsert-budget.ts` | 予算追加・更新アクション |
| `src/server/actions/delete-budget.ts` | 予算削除アクション |
| `src/server/actions/update-mappings.ts` | マッピング更新アクション |
| `src/server/actions/get-transactions-by-category.ts` | カテゴリ別取引取得 |
| `prisma/seed.ts` | シードスクリプト |
| `prisma/seed-data.ts` | シードデータ定義（テスト対象として分離） |
| `src/server/actions/upsert-budget.test.ts` | 予算アクションテスト |
| `src/server/actions/import-csv.test.ts` | CSV インポートアクションテスト |
| `src/server/loaders/load-dashboard-data.test.ts` | ローダーテスト |
| `prisma/seed-data.test.ts` | シードデータ構造テスト |
| `vitest.config.ts` | prisma/ テストの include 追加 |
