import { describe, expect, it, vi } from "vitest";
import {
	createMockBudgetRepository,
	createMockMappingRepository,
	createMockTransactionRepository,
} from "@/test/helpers/mock-repositories";
import type { BudgetItemWithMappings } from "@/types/budget";
import { GetDashboardSummaryUsecase } from "./get-dashboard-summary.usecase";

function createUsecase() {
	const transactionRepo = createMockTransactionRepository();
	const budgetRepo = createMockBudgetRepository();
	const mappingRepo = createMockMappingRepository();
	const usecase = new GetDashboardSummaryUsecase(transactionRepo, budgetRepo, mappingRepo);
	return { usecase, transactionRepo, budgetRepo, mappingRepo };
}

describe("GetDashboardSummaryUsecase", () => {
	it("KPI サマリーを正しく計算する", async () => {
		const { usecase, transactionRepo, budgetRepo } = createUsecase();
		vi.mocked(transactionRepo.getMonthlyAggregation).mockResolvedValue([
			{ month: "2025-04", totalIncome: 300000, totalExpense: 200000 },
			{ month: "2025-05", totalIncome: 300000, totalExpense: 250000 },
		]);
		vi.mocked(transactionRepo.getCategoryBreakdown).mockResolvedValue([]);
		vi.mocked(budgetRepo.findAllWithMappings).mockResolvedValue([]);

		const result = await usecase.execute();

		expect(result.kpiSummary.totalIncome).toBe(600000);
		expect(result.kpiSummary.totalExpense).toBe(450000);
		expect(result.kpiSummary.balance).toBe(150000);
		expect(result.kpiSummary.monthlyAvgExpense).toBe(225000);
		expect(result.kpiSummary.monthCount).toBe(2);
	});

	it("データがない場合は全てゼロの KPI を返す", async () => {
		const { usecase } = createUsecase();

		const result = await usecase.execute();

		expect(result.kpiSummary.totalIncome).toBe(0);
		expect(result.kpiSummary.totalExpense).toBe(0);
		expect(result.kpiSummary.balance).toBe(0);
		expect(result.kpiSummary.monthlyAvgExpense).toBe(0);
		expect(result.kpiSummary.monthCount).toBe(0);
	});

	it("未割当カテゴリを正しく算出する", async () => {
		const { usecase, transactionRepo, budgetRepo } = createUsecase();
		vi.mocked(transactionRepo.getMonthlyAggregation).mockResolvedValue([]);
		vi.mocked(transactionRepo.getCategoryBreakdown).mockResolvedValue([
			{ majorCategory: "食費", minorCategory: "外食", total: 30000, count: 10 },
			{ majorCategory: "水道・光熱費", minorCategory: "電気代", total: 10000, count: 1 },
		]);

		const budgetItem: BudgetItemWithMappings = {
			id: "1",
			name: "電気代",
			monthlyAmount: 10000,
			cycleType: "monthly_fixed",
			sortOrder: 100,
			createdAt: new Date(),
			updatedAt: new Date(),
			mappings: [
				{
					id: "m1",
					budgetItemId: "1",
					majorCategory: "水道・光熱費",
					minorCategory: "電気代",
					createdAt: new Date(),
				},
			],
		};
		vi.mocked(budgetRepo.findAllWithMappings).mockResolvedValue([budgetItem]);

		const result = await usecase.execute();

		expect(result.unmappedCategories).toHaveLength(1);
		expect(result.unmappedCategories[0].minorCategory).toBe("外食");
	});

	it("投信積立行の月次実績を正しく集計する", async () => {
		const { usecase, transactionRepo } = createUsecase();
		vi.mocked(transactionRepo.getMonthlyAggregation).mockResolvedValue([
			{ month: "2025-04", totalIncome: 300000, totalExpense: 200000 },
			{ month: "2025-05", totalIncome: 300000, totalExpense: 250000 },
		]);
		vi.mocked(transactionRepo.getCategoryBreakdown).mockResolvedValue([]);
		vi.mocked(transactionRepo.getMonthlyInvestmentTransferTrend).mockResolvedValue([
			{ month: "2025-04", total: 50000 },
			{ month: "2025-05", total: 50000 },
		]);

		const result = await usecase.execute();

		expect(result.investmentRow.monthlyActuals).toEqual({
			"2025-04": 50000,
			"2025-05": 50000,
		});
		expect(result.investmentRow.totalActual).toBe(100000);
	});

	it("投信積立データがない場合は空の investmentRow を返す", async () => {
		const { usecase } = createUsecase();

		const result = await usecase.execute();

		expect(result.investmentRow.monthlyActuals).toEqual({});
		expect(result.investmentRow.totalActual).toBe(0);
	});

	it("予算対比レポートの差額と達成率を正しく計算する", async () => {
		const { usecase, transactionRepo, budgetRepo } = createUsecase();
		vi.mocked(transactionRepo.getMonthlyAggregation).mockResolvedValue([
			{ month: "2025-04", totalIncome: 300000, totalExpense: 200000 },
			{ month: "2025-05", totalIncome: 300000, totalExpense: 250000 },
		]);
		vi.mocked(transactionRepo.getCategoryBreakdown).mockResolvedValue([
			{ majorCategory: "水道・光熱費", minorCategory: "電気代", total: 18000, count: 2 },
		]);
		vi.mocked(transactionRepo.getMonthlyTrendByCategory).mockResolvedValue([
			{ month: "2025-04", total: 8000 },
			{ month: "2025-05", total: 10000 },
		]);

		const budgetItem: BudgetItemWithMappings = {
			id: "1",
			name: "電気代",
			monthlyAmount: 10000,
			cycleType: "monthly_fixed",
			sortOrder: 100,
			createdAt: new Date(),
			updatedAt: new Date(),
			mappings: [
				{
					id: "m1",
					budgetItemId: "1",
					majorCategory: "水道・光熱費",
					minorCategory: "電気代",
					createdAt: new Date(),
				},
			],
		};
		vi.mocked(budgetRepo.findAllWithMappings).mockResolvedValue([budgetItem]);

		const result = await usecase.execute();

		expect(result.budgetReport).toHaveLength(1);
		const row = result.budgetReport[0];
		expect(row.totalActual).toBe(18000);
		// 2ヶ月分の予算: 10000 * 2 = 20000
		expect(row.totalBudget).toBe(20000);
		// 差額: 予算 - 実績 = 20000 - 18000 = 2000
		expect(row.difference).toBe(2000);
		// 達成率: (実績 / 予算) * 100 = 90
		expect(row.achievementRate).toBe(90);
	});
});
