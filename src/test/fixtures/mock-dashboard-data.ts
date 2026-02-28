import type { DashboardData } from "@/types/dashboard"

export function createMockDashboardData(overrides?: Partial<DashboardData>): DashboardData {
	return {
		kpiSummary: {
			totalIncome: 3600000,
			totalExpense: 2345678,
			balance: 1254322,
			monthlyAvgExpense: 195473,
			monthCount: 12,
		},
		monthlyTrend: [
			{ month: "2025-04", totalIncome: 300000, totalExpense: 200000 },
			{ month: "2025-05", totalIncome: 310000, totalExpense: 220000 },
			{ month: "2025-06", totalIncome: 280000, totalExpense: 190000 },
		],
		categoryBreakdown: [
			{ majorCategory: "食費", minorCategory: "食料品", total: 30000, count: 10 },
			{ majorCategory: "食費", minorCategory: "外食", total: 15000, count: 5 },
			{ majorCategory: "住宅", minorCategory: "家賃", total: 80000, count: 1 },
		],
		budgetItems: [],
		unmappedCategories: [],
		budgetReport: [],
		...overrides,
	}
}
