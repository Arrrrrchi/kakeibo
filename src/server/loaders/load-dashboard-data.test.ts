import { describe, expect, it, vi } from "vitest"
import { loadDashboardData } from "@/server/loaders/load-dashboard-data"

const mockExecute = vi.fn()

vi.mock("@/server/repositories/prisma-transaction.repository", () => ({
	PrismaTransactionRepository: class {},
}))

vi.mock("@/server/repositories/prisma-budget.repository", () => ({
	PrismaBudgetRepository: class {},
}))

vi.mock("@/server/repositories/prisma-mapping.repository", () => ({
	PrismaMappingRepository: class {},
}))

vi.mock("@/server/usecases/get-dashboard-summary.usecase", () => ({
	GetDashboardSummaryUsecase: class {
		execute = mockExecute
	},
}))

describe("loadDashboardData", () => {
	it("ユースケースの execute を呼び出してデータを返す", async () => {
		const mockData = {
			kpiSummary: {
				totalIncome: 500000,
				totalExpense: 300000,
				balance: 200000,
				monthlyAvgExpense: 300000,
				monthCount: 1,
			},
			monthlyTrend: [],
			categoryBreakdown: [],
			budgetItems: [],
			unmappedCategories: [],
			budgetReport: [],
		}
		mockExecute.mockResolvedValue(mockData)

		const result = await loadDashboardData()

		expect(mockExecute).toHaveBeenCalled()
		expect(result).toEqual(mockData)
	})
})
