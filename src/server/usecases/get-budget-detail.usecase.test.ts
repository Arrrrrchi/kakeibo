import { describe, expect, it, vi } from "vitest"
import {
	createMockBudgetRepository,
	createMockTransactionRepository,
} from "@/test/helpers/mock-repositories"
import type { BudgetItemWithMappings } from "@/types/budget"
import { GetBudgetDetailUsecase } from "./get-budget-detail.usecase"

const budgetItem: BudgetItemWithMappings = {
	id: "budget-1",
	name: "電気代",
	monthlyAmount: 10000,
	cycleType: "monthly_fixed",
	sortOrder: 100,
	createdAt: new Date(),
	updatedAt: new Date(),
	mappings: [
		{
			id: "m1",
			budgetItemId: "budget-1",
			majorCategory: "水道・光熱費",
			minorCategory: "電気代",
			createdAt: new Date(),
		},
	],
}

describe("GetBudgetDetailUsecase", () => {
	it("予算項目と関連取引を返す", async () => {
		const budgetRepo = createMockBudgetRepository()
		const transactionRepo = createMockTransactionRepository()
		vi.mocked(budgetRepo.findById).mockResolvedValue(budgetItem)
		vi.mocked(transactionRepo.findByCategory).mockResolvedValue([])

		const usecase = new GetBudgetDetailUsecase(budgetRepo, transactionRepo)
		const result = await usecase.execute("budget-1")

		expect(result).not.toBeNull()
		expect(result?.budgetItem.name).toBe("電気代")
		expect(budgetRepo.findById).toHaveBeenCalledWith("budget-1")
	})

	it("存在しない予算項目の場合は null を返す", async () => {
		const budgetRepo = createMockBudgetRepository()
		const transactionRepo = createMockTransactionRepository()

		const usecase = new GetBudgetDetailUsecase(budgetRepo, transactionRepo)
		const result = await usecase.execute("nonexistent")

		expect(result).toBeNull()
	})

	it("マッピングされた全カテゴリの取引を取得する", async () => {
		const budgetRepo = createMockBudgetRepository()
		const transactionRepo = createMockTransactionRepository()
		vi.mocked(budgetRepo.findById).mockResolvedValue(budgetItem)
		vi.mocked(transactionRepo.findByCategory).mockResolvedValue([])

		const usecase = new GetBudgetDetailUsecase(budgetRepo, transactionRepo)
		await usecase.execute("budget-1")

		expect(transactionRepo.findByCategory).toHaveBeenCalledWith("水道・光熱費", "電気代")
	})
})
