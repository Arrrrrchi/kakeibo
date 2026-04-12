import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	createMockBudgetRepository,
	createMockMappingRepository,
	createMockTransactionRepository,
} from "@/test/helpers/mock-repositories";
import type { BudgetItemWithMappings } from "@/types/budget";
import type { DateRange } from "@/types/dashboard";
import { GetDashboardSummaryUsecase } from "./get-dashboard-summary.usecase";

function createUsecase() {
	const transactionRepo = createMockTransactionRepository();
	const budgetRepo = createMockBudgetRepository();
	const mappingRepo = createMockMappingRepository();
	const usecase = new GetDashboardSummaryUsecase(transactionRepo, budgetRepo, mappingRepo);
	return { usecase, transactionRepo, budgetRepo, mappingRepo };
}

describe("GetDashboardSummaryUsecase", () => {
	beforeEach(() => vi.clearAllMocks());
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

	it("dateRangeを渡すと全リポジトリメソッドに伝播する", async () => {
		const { usecase, transactionRepo, budgetRepo } = createUsecase();
		const dateRange: DateRange = { from: "2024-01", to: "2024-12" };

		vi.mocked(transactionRepo.getMonthlyAggregation).mockResolvedValue([
			{ month: "2024-01", totalIncome: 300000, totalExpense: 200000 },
		]);
		vi.mocked(transactionRepo.getCategoryBreakdown).mockResolvedValue([]);

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

		await usecase.execute(dateRange);

		expect(transactionRepo.getMonthlyAggregation).toHaveBeenCalledWith(dateRange);
		expect(transactionRepo.getCategoryBreakdown).toHaveBeenCalledWith(dateRange);
		expect(transactionRepo.getMonthlyTrendByCategory).toHaveBeenCalledWith(
			"水道・光熱費",
			"電気代",
			dateRange,
		);
		expect(transactionRepo.getMonthlyInvestmentTransferTrend).toHaveBeenCalledWith(
			"SBI証券",
			dateRange,
		);
	});

	it("dateRangeを渡さない場合は全リポジトリメソッドにundefinedが渡される", async () => {
		const { usecase, transactionRepo, budgetRepo } = createUsecase();

		vi.mocked(transactionRepo.getMonthlyAggregation).mockResolvedValue([]);
		vi.mocked(transactionRepo.getCategoryBreakdown).mockResolvedValue([]);

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

		await usecase.execute();

		expect(transactionRepo.getMonthlyAggregation).toHaveBeenCalledWith(undefined);
		expect(transactionRepo.getCategoryBreakdown).toHaveBeenCalledWith(undefined);
		expect(transactionRepo.getMonthlyTrendByCategory).toHaveBeenCalledWith(
			"水道・光熱費",
			"電気代",
			undefined,
		);
		expect(transactionRepo.getMonthlyInvestmentTransferTrend).toHaveBeenCalledWith(
			"SBI証券",
			undefined,
		);
	});

	describe("buildOverview", () => {
		it("収入なしのとき expenseRate / savingsRate がゼロでエラーにならない", async () => {
			const { usecase, transactionRepo, budgetRepo } = createUsecase();
			vi.mocked(transactionRepo.getMonthlyAggregation).mockResolvedValue([
				{ month: "2025-04", totalIncome: 0, totalExpense: 50000 },
			]);
			vi.mocked(transactionRepo.getCategoryBreakdown).mockResolvedValue([
				{ majorCategory: "食費", minorCategory: "外食", total: 50000, count: 5 },
			]);
			vi.mocked(budgetRepo.findAllWithMappings).mockResolvedValue([]);

			const result = await usecase.execute();

			expect(result.overview.expenseRate).toBe(0);
			expect(result.overview.savingsRate).toBe(0);
		});

		it("全カテゴリがマッピング済みのとき byCycleType.unclassified が 0 になる", async () => {
			const { usecase, transactionRepo, budgetRepo } = createUsecase();
			vi.mocked(transactionRepo.getMonthlyAggregation).mockResolvedValue([
				{ month: "2025-04", totalIncome: 300000, totalExpense: 100000 },
			]);
			vi.mocked(transactionRepo.getCategoryBreakdown).mockResolvedValue([
				{ majorCategory: "食費", minorCategory: "外食", total: 30000, count: 5 },
				{ majorCategory: "水道・光熱費", minorCategory: "電気代", total: 10000, count: 1 },
			]);

			const budgetItems: BudgetItemWithMappings[] = [
				{
					id: "b1",
					name: "食費",
					monthlyAmount: 30000,
					cycleType: "monthly_variable",
					sortOrder: 1,
					createdAt: new Date(),
					updatedAt: new Date(),
					mappings: [
						{
							id: "m1",
							budgetItemId: "b1",
							majorCategory: "食費",
							minorCategory: "外食",
							createdAt: new Date(),
						},
					],
				},
				{
					id: "b2",
					name: "電気代",
					monthlyAmount: 10000,
					cycleType: "monthly_fixed",
					sortOrder: 2,
					createdAt: new Date(),
					updatedAt: new Date(),
					mappings: [
						{
							id: "m2",
							budgetItemId: "b2",
							majorCategory: "水道・光熱費",
							minorCategory: "電気代",
							createdAt: new Date(),
						},
					],
				},
			];
			vi.mocked(budgetRepo.findAllWithMappings).mockResolvedValue(budgetItems);

			const result = await usecase.execute();

			expect(result.overview.byCycleType.unclassified).toBe(0);
		});

		it("マッピングされないカテゴリは unclassified にフォールバックされる", async () => {
			const { usecase, transactionRepo, budgetRepo } = createUsecase();
			vi.mocked(transactionRepo.getMonthlyAggregation).mockResolvedValue([
				{ month: "2025-04", totalIncome: 300000, totalExpense: 80000 },
			]);
			vi.mocked(transactionRepo.getCategoryBreakdown).mockResolvedValue([
				{ majorCategory: "食費", minorCategory: "外食", total: 30000, count: 5 },
				{ majorCategory: "趣味", minorCategory: "ゲーム", total: 50000, count: 3 },
			]);

			const budgetItems: BudgetItemWithMappings[] = [
				{
					id: "b1",
					name: "食費",
					monthlyAmount: 30000,
					cycleType: "monthly_variable",
					sortOrder: 1,
					createdAt: new Date(),
					updatedAt: new Date(),
					mappings: [
						{
							id: "m1",
							budgetItemId: "b1",
							majorCategory: "食費",
							minorCategory: "外食",
							createdAt: new Date(),
						},
					],
				},
			];
			vi.mocked(budgetRepo.findAllWithMappings).mockResolvedValue(budgetItems);

			const result = await usecase.execute();

			expect(result.overview.byCycleType.unclassified).toBe(50000);
		});

		it("4つの CycleType すべてに支出があるとき各バケットに正しく分類される", async () => {
			const { usecase, transactionRepo, budgetRepo } = createUsecase();
			vi.mocked(transactionRepo.getMonthlyAggregation).mockResolvedValue([
				{ month: "2025-04", totalIncome: 500000, totalExpense: 160000 },
			]);
			vi.mocked(transactionRepo.getCategoryBreakdown).mockResolvedValue([
				{ majorCategory: "住居費", minorCategory: "家賃", total: 80000, count: 1 },
				{ majorCategory: "食費", minorCategory: "外食", total: 30000, count: 10 },
				{ majorCategory: "保険", minorCategory: "年払い生命保険", total: 40000, count: 1 },
				{ majorCategory: "旅行", minorCategory: "国内旅行", total: 10000, count: 1 },
			]);

			const budgetItems: BudgetItemWithMappings[] = [
				{
					id: "b1",
					name: "家賃",
					monthlyAmount: 80000,
					cycleType: "monthly_fixed",
					sortOrder: 1,
					createdAt: new Date(),
					updatedAt: new Date(),
					mappings: [
						{
							id: "m1",
							budgetItemId: "b1",
							majorCategory: "住居費",
							minorCategory: "家賃",
							createdAt: new Date(),
						},
					],
				},
				{
					id: "b2",
					name: "食費",
					monthlyAmount: 30000,
					cycleType: "monthly_variable",
					sortOrder: 2,
					createdAt: new Date(),
					updatedAt: new Date(),
					mappings: [
						{
							id: "m2",
							budgetItemId: "b2",
							majorCategory: "食費",
							minorCategory: "外食",
							createdAt: new Date(),
						},
					],
				},
				{
					id: "b3",
					name: "年払い保険",
					monthlyAmount: 3333,
					cycleType: "irregular_fixed",
					sortOrder: 3,
					createdAt: new Date(),
					updatedAt: new Date(),
					mappings: [
						{
							id: "m3",
							budgetItemId: "b3",
							majorCategory: "保険",
							minorCategory: "年払い生命保険",
							createdAt: new Date(),
						},
					],
				},
				{
					id: "b4",
					name: "旅行費",
					monthlyAmount: 5000,
					cycleType: "irregular_variable",
					sortOrder: 4,
					createdAt: new Date(),
					updatedAt: new Date(),
					mappings: [
						{
							id: "m4",
							budgetItemId: "b4",
							majorCategory: "旅行",
							minorCategory: "国内旅行",
							createdAt: new Date(),
						},
					],
				},
			];
			vi.mocked(budgetRepo.findAllWithMappings).mockResolvedValue(budgetItems);

			const result = await usecase.execute();

			expect(result.overview.byCycleType.monthly_fixed).toBe(80000);
			expect(result.overview.byCycleType.monthly_variable).toBe(30000);
			expect(result.overview.byCycleType.irregular_fixed).toBe(40000);
			expect(result.overview.byCycleType.irregular_variable).toBe(10000);
			expect(result.overview.byCycleType.unclassified).toBe(0);
		});

		it("breakdownByBudgetItem の合計 + unclassified が totalExpense と一致する", async () => {
			const { usecase, transactionRepo, budgetRepo } = createUsecase();
			vi.mocked(transactionRepo.getMonthlyAggregation).mockResolvedValue([
				{ month: "2025-04", totalIncome: 300000, totalExpense: 90000 },
			]);
			vi.mocked(transactionRepo.getCategoryBreakdown).mockResolvedValue([
				{ majorCategory: "食費", minorCategory: "外食", total: 30000, count: 5 },
				{ majorCategory: "趣味", minorCategory: "ゲーム", total: 60000, count: 3 },
			]);

			const budgetItems: BudgetItemWithMappings[] = [
				{
					id: "b1",
					name: "食費",
					monthlyAmount: 30000,
					cycleType: "monthly_variable",
					sortOrder: 1,
					createdAt: new Date(),
					updatedAt: new Date(),
					mappings: [
						{
							id: "m1",
							budgetItemId: "b1",
							majorCategory: "食費",
							minorCategory: "外食",
							createdAt: new Date(),
						},
					],
				},
			];
			vi.mocked(budgetRepo.findAllWithMappings).mockResolvedValue(budgetItems);

			const result = await usecase.execute();

			const items = result.overview.breakdownByBudgetItem;
			const sumOfItems = items.reduce((s, item) => s + item.amount, 0);
			expect(sumOfItems).toBe(result.overview.totalExpense);
		});

		it("breakdownByCycleType は常に 5 要素で末尾が unclassified になる", async () => {
			const { usecase, transactionRepo, budgetRepo } = createUsecase();
			vi.mocked(transactionRepo.getMonthlyAggregation).mockResolvedValue([
				{ month: "2025-04", totalIncome: 300000, totalExpense: 50000 },
			]);
			vi.mocked(transactionRepo.getCategoryBreakdown).mockResolvedValue([
				{ majorCategory: "食費", minorCategory: "外食", total: 30000, count: 5 },
				{ majorCategory: "趣味", minorCategory: "ゲーム", total: 20000, count: 2 },
			]);

			const budgetItems: BudgetItemWithMappings[] = [
				{
					id: "b1",
					name: "食費",
					monthlyAmount: 30000,
					cycleType: "monthly_variable",
					sortOrder: 1,
					createdAt: new Date(),
					updatedAt: new Date(),
					mappings: [
						{
							id: "m1",
							budgetItemId: "b1",
							majorCategory: "食費",
							minorCategory: "外食",
							createdAt: new Date(),
						},
					],
				},
			];
			vi.mocked(budgetRepo.findAllWithMappings).mockResolvedValue(budgetItems);

			const result = await usecase.execute();

			const breakdown = result.overview.breakdownByCycleType;
			expect(breakdown).toHaveLength(5);
			expect(breakdown[4].key).toBe("unclassified");
		});

		it("overview の期間情報と集計値が正しく計算される", async () => {
			const { usecase, transactionRepo, budgetRepo } = createUsecase();
			const dateRange: DateRange = { from: "2025-01", to: "2025-03" };
			vi.mocked(transactionRepo.getMonthlyAggregation).mockResolvedValue([
				{ month: "2025-01", totalIncome: 300000, totalExpense: 200000 },
				{ month: "2025-02", totalIncome: 310000, totalExpense: 210000 },
				{ month: "2025-03", totalIncome: 320000, totalExpense: 220000 },
			]);
			vi.mocked(transactionRepo.getCategoryBreakdown).mockResolvedValue([]);
			vi.mocked(budgetRepo.findAllWithMappings).mockResolvedValue([]);

			const result = await usecase.execute(dateRange);

			expect(result.overview.period.from).toBe("2025-01");
			expect(result.overview.period.to).toBe("2025-03");
			expect(result.overview.period.monthCount).toBe(3);
			expect(result.overview.totalIncome).toBe(930000);
			expect(result.overview.totalExpense).toBe(630000);
			expect(result.overview.monthlyAvgIncome).toBe(310000);
			expect(result.overview.monthlyAvgExpense).toBe(210000);
		});

		it("expenseRate と savingsRate が正しく計算される", async () => {
			const { usecase, transactionRepo, budgetRepo } = createUsecase();
			vi.mocked(transactionRepo.getMonthlyAggregation).mockResolvedValue([
				{ month: "2025-04", totalIncome: 400000, totalExpense: 300000 },
			]);
			vi.mocked(transactionRepo.getCategoryBreakdown).mockResolvedValue([]);
			vi.mocked(budgetRepo.findAllWithMappings).mockResolvedValue([]);
			vi.mocked(transactionRepo.getMonthlyInvestmentTransferTrend).mockResolvedValue([
				{ month: "2025-04", total: 50000 },
			]);

			const result = await usecase.execute();

			// expenseRate = 300000 / 400000 = 0.75
			expect(result.overview.expenseRate).toBeCloseTo(0.75);
			// savingsRate = (400000 - 300000 - 50000) / 400000 = 0.125
			expect(result.overview.savingsRate).toBeCloseTo(0.125);
		});

		it("mappedIncome は totalIncome と等しく unmappedIncome は 0 になる（暫定実装）", async () => {
			const { usecase, transactionRepo, budgetRepo } = createUsecase();
			vi.mocked(transactionRepo.getMonthlyAggregation).mockResolvedValue([
				{ month: "2025-04", totalIncome: 300000, totalExpense: 200000 },
			]);
			vi.mocked(transactionRepo.getCategoryBreakdown).mockResolvedValue([]);
			vi.mocked(budgetRepo.findAllWithMappings).mockResolvedValue([]);

			const result = await usecase.execute();

			expect(result.overview.mappedIncome).toBe(300000);
			expect(result.overview.unmappedIncome).toBe(0);
		});
	});
});
