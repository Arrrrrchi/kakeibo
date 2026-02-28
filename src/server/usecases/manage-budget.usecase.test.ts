import { describe, expect, it, vi } from "vitest"
import { createMockBudgetRepository } from "@/test/helpers/mock-repositories"
import { ManageBudgetUsecase } from "./manage-budget.usecase"

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

	describe("updateBudget", () => {
		it("リポジトリの update を呼び出す", async () => {
			const mockRepo = createMockBudgetRepository()
			const usecase = new ManageBudgetUsecase(mockRepo)

			await usecase.updateBudget("budget-1", {
				name: "更新後",
				monthlyAmount: 10000,
				cycleType: "monthly_variable",
			})

			expect(mockRepo.update).toHaveBeenCalledWith("budget-1", {
				name: "更新後",
				monthlyAmount: 10000,
				cycleType: "monthly_variable",
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
