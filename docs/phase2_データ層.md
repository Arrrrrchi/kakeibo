# Phase 2: データ層

## 概要

Prisma クライアントのセットアップ、リポジトリパターンによるデータアクセス層の構築、ユースケースの実装、CSV パーサーの実装を行う。

## タスク一覧

### 2-0. DB 接続・初回マイグレーション

- PostgreSQL が起動していることを確認し、`.env` に `DATABASE_URL` を設定
- 初回マイグレーションを実行
  ```bash
  pnpm exec prisma migrate dev --name init
  ```
- `pnpm exec prisma generate` でクライアントを生成

### 2-1. Prisma クライアントシングルトン

> **注**: Phase 1 で `src/server/lib/prisma.ts` は作成済み（Prisma 7 のドライバーアダプターパターン）。
> ここでは DB 接続が正常に動作することを確認する。

### 2-2. 型定義

以下のファイルを `src/types/` 配下に作成する。

#### `src/types/transaction.ts`

- `Transaction` — Prisma が生成する型のエイリアス
- `MonthlyAggregation` — 月別集計データ
  ```typescript
  type MonthlyAggregation = {
    month: string        // "YYYY-MM" 形式
    totalIncome: number
    totalExpense: number
  }
  ```
- `CategoryBreakdown` — カテゴリ別集計
  ```typescript
  type CategoryBreakdown = {
    majorCategory: string
    minorCategory: string
    total: number
    count: number
  }
  ```

#### `src/types/budget.ts`

- `BudgetItem` — Prisma 型エイリアス
- `BudgetItemWithMappings` — マッピングを含む予算項目
  ```typescript
  type BudgetItemWithMappings = BudgetItem & {
    mappings: BudgetCategoryMapping[]
  }
  ```
- `BudgetFormData` — 予算フォーム入力型
  ```typescript
  type BudgetFormData = {
    name: string
    monthlyAmount: number
    cycleType: CycleType
  }
  ```

#### `src/types/dashboard.ts`

- `DashboardData` — ダッシュボードに必要な全データを束ねる型
  ```typescript
  type DashboardData = {
    kpiSummary: KpiSummary
    monthlyTrend: MonthlyAggregation[]
    categoryBreakdown: CategoryBreakdown[]
    budgetItems: BudgetItemWithMappings[]
    unmappedCategories: CategoryBreakdown[]
    budgetReport: BudgetReportRow[]
  }
  ```
- `KpiSummary` — KPI カード用
  ```typescript
  type KpiSummary = {
    totalIncome: number
    totalExpense: number
    balance: number
    monthlyAvgExpense: number
    monthCount: number
  }
  ```
- `BudgetReportRow` — 予算対比レポート行
  ```typescript
  type BudgetReportRow = {
    budgetItem: BudgetItemWithMappings
    monthlyActuals: Record<string, number>  // "YYYY-MM" → 金額
    totalActual: number
    totalBudget: number
    difference: number
    achievementRate: number
  }
  ```

#### `src/types/moneyforward.ts`

- `MoneyforwardCsvRow` — CSV の 1 行を表す型
  ```typescript
  type MoneyforwardCsvRow = {
    isCalculationTarget: boolean
    date: string
    description: string
    amount: number
    institution: string
    majorCategory: string
    minorCategory: string
    memo: string
    isTransfer: boolean
    moneyforwardId: string
  }
  ```

### 2-3. リポジトリインターフェース

`src/server/repositories/interfaces/` に以下を定義する。

#### `transaction-repository.interface.ts`

```typescript
interface ITransactionRepository {
  upsertMany(transactions: TransactionCreateInput[]): Promise<number>
  getMonthlyAggregation(): Promise<MonthlyAggregation[]>
  getCategoryBreakdown(): Promise<CategoryBreakdown[]>
  findByCategory(majorCategory: string, minorCategory: string): Promise<Transaction[]>
  getDistinctCategories(): Promise<{ majorCategory: string; minorCategory: string }[]>
  getMonthlyTrendByCategory(
    majorCategory: string,
    minorCategory: string
  ): Promise<{ month: string; total: number }[]>
}
```

#### `budget-repository.interface.ts`

```typescript
interface IBudgetRepository {
  findAll(): Promise<BudgetItem[]>
  findAllWithMappings(): Promise<BudgetItemWithMappings[]>
  findById(id: string): Promise<BudgetItemWithMappings | null>
  create(data: BudgetFormData): Promise<BudgetItem>
  update(id: string, data: BudgetFormData): Promise<BudgetItem>
  delete(id: string): Promise<void>
  updateSortOrder(items: { id: string; sortOrder: number }[]): Promise<void>
}
```

#### `mapping-repository.interface.ts`

```typescript
interface IMappingRepository {
  findByBudgetItemId(budgetItemId: string): Promise<BudgetCategoryMapping[]>
  replaceAll(
    budgetItemId: string,
    categories: { majorCategory: string; minorCategory: string }[]
  ): Promise<void>
  findUnmappedCategories(
    allCategories: { majorCategory: string; minorCategory: string }[]
  ): Promise<{ majorCategory: string; minorCategory: string }[]>
}
```

### 2-4. リポジトリ実装

`src/server/repositories/` に Prisma を使った具体実装を作成する。

#### `prisma-transaction.repository.ts`

- `upsertMany`: `import_hash` による重複排除つき一括挿入（`skipDuplicates`）
- `getMonthlyAggregation`: `groupBy` + `date` の年月でグルーピング。収入・支出を `is_income` で分離
- `getCategoryBreakdown`: `groupBy` + `major_category`, `minor_category`。支出のみ（`is_income: false`）
- `findByCategory`: 指定カテゴリの取引一覧を日付降順で取得
- `getDistinctCategories`: 支出取引の `major_category` + `minor_category` のユニーク一覧
- `getMonthlyTrendByCategory`: 特定カテゴリの月別合計（モーダル表示用）

#### `prisma-budget.repository.ts`

- `findAllWithMappings`: `include: { mappings: true }` で結合取得、`sortOrder` 順
- `create` / `update`: 基本 CRUD
- `delete`: カスケードで mappings も削除される
- `updateSortOrder`: トランザクション内で一括更新

#### `prisma-mapping.repository.ts`

- `replaceAll`: トランザクション内で既存削除 → 新規挿入
- `findUnmappedCategories`: 全カテゴリからマッピング済みを除外して返す

### 2-5. ユースケース実装

`src/server/usecases/` に作成する。

#### `import-transactions.usecase.ts`

- 入力: パース済み CSV データの配列
- 処理:
  1. 各行から `import_hash` を生成（SHA-256: `date + description + amount + institution + id`）
  2. `is_income` フラグを設定（金額が正 → 収入、負 → 支出）
  3. 金額を絶対値に変換
  4. `TransactionRepository.upsertMany()` を呼び出し
- 出力: 挿入件数

#### `get-dashboard-summary.usecase.ts`

- 入力: なし
- 処理:
  1. `TransactionRepository.getMonthlyAggregation()` で月別データ取得
  2. `TransactionRepository.getCategoryBreakdown()` でカテゴリ別データ取得
  3. `BudgetRepository.findAllWithMappings()` で予算データ取得
  4. KPI を計算（総収入、総支出、収支差額、月平均支出）
  5. 未割当カテゴリを算出
  6. 予算対比レポートデータを構築
- 出力: `DashboardData`

#### `get-budget-detail.usecase.ts`

- 入力: `budgetItemId`
- 処理: 予算項目 + マッピング + 関連取引の取得
- 出力: 予算項目の詳細データ

#### `manage-budget.usecase.ts`

- `createBudget(data: BudgetFormData)` — 新規作成
- `updateBudget(id: string, data: BudgetFormData)` — 更新
- `deleteBudget(id: string)` — 削除

#### `update-mapping.usecase.ts`

- 入力: `budgetItemId`, カテゴリ配列
- 処理: `MappingRepository.replaceAll()` で置き換え
- 出力: void

### 2-6. CSV パーサー実装

`src/server/lib/csv-parser.ts` を作成する。

- cp932（Shift-JIS）エンコーディングの対応
  - `TextDecoder("shift-jis")` で Buffer → 文字列に変換
- CSV パース処理
  - ヘッダー行を解析してカラム位置を特定
  - カラム名マッピング: `計算対象`, `日付`, `内容`, `金額（円）`, `保有金融機関`, `大項目`, `中項目`, `メモ`, `振替`, `ID`
- フィルタリング
  - `計算対象 == 1`
  - `振替 == 0`
  - 支出: `金額 < 0` → `is_income: false`、金額を絶対値に変換
  - 収入: `金額 > 0` → `is_income: true`、金額はそのまま
- ハッシュ生成
  - `crypto.createHash("sha256")` を使用
  - 入力: `${date}|${description}|${amount}|${institution}|${moneyforwardId}`
- 戻り値: パース済み取引データの配列（`TransactionCreateInput[]`）

```typescript
import "server-only"

export async function parseMoneforwardCsv(
  buffer: Buffer
): Promise<TransactionCreateInput[]> {
  // 1. cp932 → UTF-8
  const decoder = new TextDecoder("shift-jis")
  const text = decoder.decode(buffer)

  // 2. 行分割・ヘッダー解析
  const lines = text.split("\n")
  const headers = parseHeaders(lines[0])

  // 3. データ行をパース・フィルタ・変換
  const transactions: TransactionCreateInput[] = []
  for (let i = 1; i < lines.length; i++) {
    const row = parseLine(lines[i], headers)
    if (!row) continue
    if (!row.isCalculationTarget || row.isTransfer) continue

    transactions.push({
      date: new Date(row.date),
      description: row.description,
      amount: Math.abs(row.amount),
      majorCategory: row.majorCategory,
      minorCategory: row.minorCategory,
      institution: row.institution || null,
      memo: row.memo || null,
      moneyforwardId: row.moneyforwardId || null,
      isIncome: row.amount > 0,
      importHash: generateHash(row),
    })
  }

  return transactions
}
```

## TDD テスト計画

Phase 2 の各モジュールは **Red → Green → Refactor** の TDD サイクルで開発する。
実装に取りかかる前にテストを書き、テストが失敗することを確認（Red）してから実装（Green）し、リファクタリングする。

### テスト用ヘルパー

#### `src/test/helpers/mock-repositories.ts`

リポジトリインターフェースのモックを生成するヘルパー。ユースケースのテストで使用する。

```typescript
import { vi } from "vitest"
import type { ITransactionRepository } from "@/server/repositories/interfaces/transaction-repository.interface"
import type { IBudgetRepository } from "@/server/repositories/interfaces/budget-repository.interface"
import type { IMappingRepository } from "@/server/repositories/interfaces/mapping-repository.interface"

export function createMockTransactionRepository(): ITransactionRepository {
  return {
    upsertMany: vi.fn().mockResolvedValue(0),
    getMonthlyAggregation: vi.fn().mockResolvedValue([]),
    getCategoryBreakdown: vi.fn().mockResolvedValue([]),
    findByCategory: vi.fn().mockResolvedValue([]),
    getDistinctCategories: vi.fn().mockResolvedValue([]),
    getMonthlyTrendByCategory: vi.fn().mockResolvedValue([]),
  }
}

export function createMockBudgetRepository(): IBudgetRepository {
  return {
    findAll: vi.fn().mockResolvedValue([]),
    findAllWithMappings: vi.fn().mockResolvedValue([]),
    findById: vi.fn().mockResolvedValue(null),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    updateSortOrder: vi.fn(),
  }
}

export function createMockMappingRepository(): IMappingRepository {
  return {
    findByBudgetItemId: vi.fn().mockResolvedValue([]),
    replaceAll: vi.fn(),
    findUnmappedCategories: vi.fn().mockResolvedValue([]),
  }
}
```

#### `src/test/fixtures/sample.csv`

テスト用のマネーフォワード CSV ファイル（cp932 エンコーディング）を用意する。
以下のパターンをカバーするデータを含める:

- 通常の支出行（計算対象=1, 振替=0, 金額<0）
- 収入行（金額>0）
- 振替行（振替=1 → 除外対象）
- 計算対象外（計算対象=0 → 除外対象）
- 空行・不正行

### T2-1. CSV パーサーのテスト（最優先）

純粋関数であり、外部依存がないため TDD で最も書きやすい。**最初に取り組む**。

#### `src/server/lib/csv-parser.test.ts`

```typescript
import { describe, it, expect } from "vitest"
import { parseMoneyforwardCsv } from "./csv-parser"

describe("parseMoneyforwardCsv", () => {
  // --- Red: まずこのテストを書いて失敗させる ---

  describe("正常系", () => {
    it("支出行をパースして絶対値の金額で返す", async () => {
      const csv = createTestCsv([
        { date: "2025/04/15", description: "東京電力", amount: -8500, major: "水道・光熱費", minor: "電気代", calc: 1, transfer: 0 },
      ])
      const result = await parseMoneyforwardCsv(csv)

      expect(result).toHaveLength(1)
      expect(result[0].amount).toBe(8500)
      expect(result[0].isIncome).toBe(false)
      expect(result[0].majorCategory).toBe("水道・光熱費")
      expect(result[0].minorCategory).toBe("電気代")
    })

    it("収入行をパースして isIncome: true で返す", async () => {
      const csv = createTestCsv([
        { date: "2025/04/25", description: "給与", amount: 300000, major: "収入", minor: "給与", calc: 1, transfer: 0 },
      ])
      const result = await parseMoneyforwardCsv(csv)

      expect(result).toHaveLength(1)
      expect(result[0].amount).toBe(300000)
      expect(result[0].isIncome).toBe(true)
    })

    it("同一データから同じ importHash を生成する（冪等性）", async () => {
      const csv = createTestCsv([
        { date: "2025/04/15", description: "東京電力", amount: -8500, major: "水道・光熱費", minor: "電気代", calc: 1, transfer: 0 },
      ])
      const result1 = await parseMoneyforwardCsv(csv)
      const result2 = await parseMoneyforwardCsv(csv)

      expect(result1[0].importHash).toBe(result2[0].importHash)
    })

    it("複数行を正しくパースする", async () => {
      const csv = createTestCsv([
        { date: "2025/04/15", description: "東京電力", amount: -8500, major: "水道・光熱費", minor: "電気代", calc: 1, transfer: 0 },
        { date: "2025/04/20", description: "スーパー", amount: -3000, major: "食費", minor: "食料品", calc: 1, transfer: 0 },
      ])
      const result = await parseMoneyforwardCsv(csv)

      expect(result).toHaveLength(2)
    })
  })

  describe("フィルタリング", () => {
    it("振替行を除外する", async () => {
      const csv = createTestCsv([
        { date: "2025/04/01", description: "振替", amount: -50000, major: "食費", minor: "共同生活費", calc: 1, transfer: 1 },
      ])
      const result = await parseMoneyforwardCsv(csv)

      expect(result).toHaveLength(0)
    })

    it("計算対象外を除外する", async () => {
      const csv = createTestCsv([
        { date: "2025/04/01", description: "対象外", amount: -1000, major: "その他", minor: "その他", calc: 0, transfer: 0 },
      ])
      const result = await parseMoneyforwardCsv(csv)

      expect(result).toHaveLength(0)
    })
  })

  describe("エッジケース", () => {
    it("空の CSV はからの配列を返す", async () => {
      const csv = createHeaderOnlyCsv()
      const result = await parseMoneyforwardCsv(csv)

      expect(result).toHaveLength(0)
    })

    it("日本語が文字化けしない（cp932 エンコーディング）", async () => {
      // cp932 でエンコードされた実際のサンプルファイルを使用
      const buffer = await readFixture("sample.csv")
      const result = await parseMoneyforwardCsv(buffer)

      const hasJapanese = result.some((t) => /[\u3000-\u9fff]/.test(t.description))
      expect(hasJapanese).toBe(true)
    })
  })
})
```

### T2-2. ユースケースのテスト

リポジトリインターフェースをモックして、ビジネスロジックのみをテストする。

#### `src/server/usecases/import-transactions.usecase.test.ts`

```typescript
import { describe, it, expect, vi } from "vitest"
import { ImportTransactionsUsecase } from "./import-transactions.usecase"
import { createMockTransactionRepository } from "@/test/helpers/mock-repositories"

describe("ImportTransactionsUsecase", () => {
  it("リポジトリの upsertMany にデータを渡して件数を返す", async () => {
    const mockRepo = createMockTransactionRepository()
    vi.mocked(mockRepo.upsertMany).mockResolvedValue(3)

    const usecase = new ImportTransactionsUsecase(mockRepo)
    const result = await usecase.execute(mockTransactions)

    expect(mockRepo.upsertMany).toHaveBeenCalledWith(mockTransactions)
    expect(result).toBe(3)
  })

  it("空配列の場合は 0 を返す", async () => {
    const mockRepo = createMockTransactionRepository()
    vi.mocked(mockRepo.upsertMany).mockResolvedValue(0)

    const usecase = new ImportTransactionsUsecase(mockRepo)
    const result = await usecase.execute([])

    expect(result).toBe(0)
  })
})
```

#### `src/server/usecases/get-dashboard-summary.usecase.test.ts`

```typescript
import { describe, it, expect, vi } from "vitest"
import { GetDashboardSummaryUsecase } from "./get-dashboard-summary.usecase"
import {
  createMockTransactionRepository,
  createMockBudgetRepository,
  createMockMappingRepository,
} from "@/test/helpers/mock-repositories"

describe("GetDashboardSummaryUsecase", () => {
  it("KPI サマリーを正しく計算する", async () => {
    const mockTransactionRepo = createMockTransactionRepository()
    vi.mocked(mockTransactionRepo.getMonthlyAggregation).mockResolvedValue([
      { month: "2025-04", totalIncome: 300000, totalExpense: 200000 },
      { month: "2025-05", totalIncome: 300000, totalExpense: 250000 },
    ])
    vi.mocked(mockTransactionRepo.getCategoryBreakdown).mockResolvedValue([])

    const mockBudgetRepo = createMockBudgetRepository()
    vi.mocked(mockBudgetRepo.findAllWithMappings).mockResolvedValue([])

    const mockMappingRepo = createMockMappingRepository()

    const usecase = new GetDashboardSummaryUsecase(
      mockTransactionRepo,
      mockBudgetRepo,
      mockMappingRepo
    )
    const result = await usecase.execute()

    expect(result.kpiSummary.totalIncome).toBe(600000)
    expect(result.kpiSummary.totalExpense).toBe(450000)
    expect(result.kpiSummary.balance).toBe(150000)
    expect(result.kpiSummary.monthlyAvgExpense).toBe(225000)
    expect(result.kpiSummary.monthCount).toBe(2)
  })

  it("未割当カテゴリを正しく算出する", async () => {
    const mockTransactionRepo = createMockTransactionRepository()
    vi.mocked(mockTransactionRepo.getMonthlyAggregation).mockResolvedValue([])
    vi.mocked(mockTransactionRepo.getCategoryBreakdown).mockResolvedValue([
      { majorCategory: "食費", minorCategory: "外食", total: 30000, count: 10 },
      { majorCategory: "水道・光熱費", minorCategory: "電気代", total: 10000, count: 1 },
    ])

    const mockBudgetRepo = createMockBudgetRepository()
    vi.mocked(mockBudgetRepo.findAllWithMappings).mockResolvedValue([
      {
        id: "1", name: "電気代", monthlyAmount: 10000,
        cycleType: "monthly_fixed", sortOrder: 100,
        createdAt: new Date(), updatedAt: new Date(),
        mappings: [{ id: "m1", budgetItemId: "1", majorCategory: "水道・光熱費", minorCategory: "電気代", createdAt: new Date() }],
      },
    ])

    const mockMappingRepo = createMockMappingRepository()

    const usecase = new GetDashboardSummaryUsecase(
      mockTransactionRepo, mockBudgetRepo, mockMappingRepo
    )
    const result = await usecase.execute()

    // 電気代はマッピング済み、外食は未割当
    expect(result.unmappedCategories).toHaveLength(1)
    expect(result.unmappedCategories[0].minorCategory).toBe("外食")
  })

  it("予算対比レポートの差額と達成率を正しく計算する", async () => {
    // 月別の実績データとマッピング済み予算を用意して
    // 差額 = 予算 - 実績、達成率 = (実績 / 予算) * 100 を検証
    // ...
  })
})
```

#### `src/server/usecases/manage-budget.usecase.test.ts`

```typescript
import { describe, it, expect, vi } from "vitest"
import { ManageBudgetUsecase } from "./manage-budget.usecase"
import { createMockBudgetRepository } from "@/test/helpers/mock-repositories"

describe("ManageBudgetUsecase", () => {
  describe("createBudget", () => {
    it("リポジトリの create を呼び出す", async () => {
      const mockRepo = createMockBudgetRepository()
      const usecase = new ManageBudgetUsecase(mockRepo)

      await usecase.createBudget({
        name: "テスト費目",
        monthlyAmount: 5000,
        cycleType: "monthly_fixed",
      })

      expect(mockRepo.create).toHaveBeenCalledWith({
        name: "テスト費目",
        monthlyAmount: 5000,
        cycleType: "monthly_fixed",
      })
    })
  })

  describe("deleteBudget", () => {
    it("リポジトリの delete を呼び出す", async () => {
      const mockRepo = createMockBudgetRepository()
      const usecase = new ManageBudgetUsecase(mockRepo)

      await usecase.deleteBudget("budget-1")

      expect(mockRepo.delete).toHaveBeenCalledWith("budget-1")
    })
  })
})
```

### T2-3. フォーマット関数のテスト

#### `src/client/lib/format.test.ts`

```typescript
import { describe, it, expect } from "vitest"
import { formatCurrency, formatCompactCurrency, formatPercent, formatMonth } from "./format"

describe("formatCurrency", () => {
  it("日本円フォーマットで表示する", () => {
    expect(formatCurrency(10000)).toBe("¥10,000")
    expect(formatCurrency(0)).toBe("¥0")
    expect(formatCurrency(1234567)).toBe("¥1,234,567")
  })

  it("負の値もフォーマットする", () => {
    expect(formatCurrency(-5000)).toBe("-¥5,000")
  })
})

describe("formatCompactCurrency", () => {
  it("1万以上を万単位に短縮する", () => {
    expect(formatCompactCurrency(10000)).toBe("1.0万")
    expect(formatCompactCurrency(150000)).toBe("15.0万")
    expect(formatCompactCurrency(1234567)).toBe("123.5万")
  })

  it("1万未満はそのまま通貨フォーマットする", () => {
    expect(formatCompactCurrency(9999)).toBe("¥9,999")
  })
})

describe("formatPercent", () => {
  it("小数点1桁のパーセント表示にする", () => {
    expect(formatPercent(100)).toBe("100.0%")
    expect(formatPercent(85.678)).toBe("85.7%")
    expect(formatPercent(0)).toBe("0.0%")
  })
})

describe("formatMonth", () => {
  it("YYYY-MM 形式を N月 に変換する", () => {
    expect(formatMonth("2025-04")).toBe("4月")
    expect(formatMonth("2025-12")).toBe("12月")
    expect(formatMonth("2025-01")).toBe("1月")
  })
})
```

### TDD 開発サイクルの進め方

Phase 2 の各モジュールは以下の順序で開発する:

```
1. format.test.ts を書く → format.ts を実装（ウォーミングアップ）
2. 型定義ファイルを作成（テスト不要だがコンパイル通過を確認）
3. リポジトリインターフェースを定義
4. csv-parser.test.ts を書く → csv-parser.ts を実装
5. mock-repositories.ts を作成
6. import-transactions.usecase.test.ts を書く → usecase を実装
7. get-dashboard-summary.usecase.test.ts を書く → usecase を実装
8. manage-budget.usecase.test.ts を書く → usecase を実装
9. update-mapping.usecase.test.ts を書く → usecase を実装
10. リポジトリ実装（Prisma）→ 統合テストは Phase 3 で
```

各ステップで:
1. **Red**: テストを書いて `pnpm test` で失敗を確認
2. **Green**: 最小限の実装でテストを通す
3. **Refactor**: コードを整理（テストは通ったまま）

## 完了条件

- [ ] `pnpm exec prisma migrate dev` が正常に完了する
- [ ] Prisma クライアントシングルトンが正常に動作する
- [ ] 全リポジトリの CRUD 操作が正常に動作する
- [ ] ユースケースが想定通りのデータを返す
- [ ] CSV パーサーがサンプル CSV を正しくパースできる
- [ ] cp932 エンコーディングの日本語が文字化けしない
- [ ] 重複 CSV インポート時に `import_hash` で正しく重複排除される
- [ ] TypeScript 型チェックがエラーなく通過する
- [ ] `pnpm test:run` で全テストが通過する
- [ ] CSV パーサーのテスト: 正常系・フィルタリング・エッジケースが通過
- [ ] ユースケースのテスト: KPI 計算・未割当算出・予算対比が通過
- [ ] フォーマット関数のテスト: 全パターンが通過

## 成果物

| ファイル | 説明 |
|---|---|
| `src/server/lib/csv-parser.ts` | マネーフォワード CSV パーサー |
| `src/types/transaction.ts` | 取引関連の型定義 |
| `src/types/budget.ts` | 予算関連の型定義 |
| `src/types/dashboard.ts` | ダッシュボード関連の型定義 |
| `src/types/moneyforward.ts` | マネーフォワード CSV 関連の型定義 |
| `src/server/repositories/interfaces/*.ts` | リポジトリインターフェース（3 ファイル） |
| `src/server/repositories/prisma-*.ts` | リポジトリ実装（3 ファイル） |
| `src/server/usecases/*.ts` | ユースケース（5 ファイル） |
| `src/server/lib/csv-parser.test.ts` | CSV パーサーテスト |
| `src/server/usecases/*.test.ts` | ユースケーステスト |
| `src/client/lib/format.test.ts` | フォーマット関数テスト |
| `src/test/helpers/mock-repositories.ts` | リポジトリモックヘルパー |
| `src/test/fixtures/sample.csv` | テスト用サンプル CSV |
