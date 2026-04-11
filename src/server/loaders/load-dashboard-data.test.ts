import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadDashboardData } from "@/server/loaders/load-dashboard-data";
import type { DateRange } from "@/types/dashboard";

const mockExecute = vi.fn();

vi.mock("@/server/repositories/prisma-transaction.repository", () => ({
	PrismaTransactionRepository: class {},
}));

vi.mock("@/server/repositories/prisma-budget.repository", () => ({
	PrismaBudgetRepository: class {},
}));

vi.mock("@/server/repositories/prisma-mapping.repository", () => ({
	PrismaMappingRepository: class {},
}));

vi.mock("@/server/usecases/get-dashboard-summary.usecase", () => ({
	GetDashboardSummaryUsecase: class {
		execute = mockExecute;
	},
}));

describe("loadDashboardData", () => {
	beforeEach(() => vi.clearAllMocks());

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
		};
		mockExecute.mockResolvedValue(mockData);

		const result = await loadDashboardData();

		expect(mockExecute).toHaveBeenCalled();
		expect(result).toEqual(mockData);
	});

	it("dateRange を渡すと usecase.execute(dateRange) に伝播する", async () => {
		const dateRange: DateRange = { from: "2024-01", to: "2024-12" };
		mockExecute.mockResolvedValue({});

		await loadDashboardData(dateRange);

		expect(mockExecute).toHaveBeenCalledWith(dateRange);
	});

	it("dateRange 未指定時は usecase.execute(undefined) が呼ばれる", async () => {
		mockExecute.mockResolvedValue({});

		await loadDashboardData();

		expect(mockExecute).toHaveBeenCalledWith(undefined);
	});
});
