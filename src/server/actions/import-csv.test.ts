import { describe, expect, it, vi } from "vitest"
import { importCsv } from "@/server/actions/import-csv"

const mockUpsertMany = vi.fn().mockResolvedValue(0)

vi.mock("next/cache", () => ({
	revalidatePath: vi.fn(),
}))

const mockParseCsv = vi.fn().mockResolvedValue([])

vi.mock("@/server/lib/csv-parser", () => ({
	parseMoneyforwardCsv: (...args: unknown[]) => mockParseCsv(...args),
}))

vi.mock("@/server/repositories/prisma-transaction.repository", () => ({
	PrismaTransactionRepository: class {
		upsertMany = mockUpsertMany
	},
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

	it("パース結果が0件の場合はエラーを返す", async () => {
		const file = new File(["invalid,csv,data"], "test.csv")
		const formData = new FormData()
		formData.set("file", file)

		const result = await importCsv(formData)

		expect(result.success).toBe(false)
		if (!result.success) {
			expect(result.error).toContain("インポートできるデータがありません")
		}
	})

	it("正常なファイルの場合はインポートが成功する", async () => {
		mockParseCsv.mockResolvedValue([{ date: new Date(), description: "test", amount: 100 }])
		mockUpsertMany.mockResolvedValue(5)

		const file = new File(["test,data"], "test.csv")
		const formData = new FormData()
		formData.set("file", file)

		const result = await importCsv(formData)

		expect(result.success).toBe(true)
		if (result.success) {
			expect(result.data.importedCount).toBe(5)
		}
	})
})
