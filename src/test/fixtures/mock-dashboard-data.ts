import type { DashboardData } from "@/types/dashboard";

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
		investmentRow: { label: "投信積立 (SBI証券)", monthlyActuals: {}, totalActual: 0 },
		overview: {
			period: { from: "2025-01", to: "2025-12", monthCount: 12 },
			totalIncome: 3600000,
			totalExpense: 2345678,
			totalInvestment: 0,
			mappedIncome: 3600000,
			unmappedIncome: 0,
			expenseRate: 0.65,
			savingsRate: 0.35,
			monthlyAvgIncome: 300000,
			monthlyAvgExpense: 195473,
			byCycleType: {
				monthly_fixed: 800000,
				monthly_variable: 1000000,
				irregular_fixed: 200000,
				irregular_variable: 300000,
				unclassified: 45678,
			},
			breakdownByBudgetItem: [],
			breakdownByCycleType: [
				{
					key: "monthly_fixed",
					label: "毎月の固定支出",
					amount: 800000,
					ratio: 0.34,
					color: "#3b82f6",
				},
				{
					key: "monthly_variable",
					label: "毎月の変動支出",
					amount: 1000000,
					ratio: 0.43,
					color: "#eab308",
				},
				{
					key: "irregular_fixed",
					label: "単発の固定支出",
					amount: 200000,
					ratio: 0.09,
					color: "#f97316",
				},
				{
					key: "irregular_variable",
					label: "単発の変動支出",
					amount: 300000,
					ratio: 0.13,
					color: "#a855f7",
				},
				{
					key: "unclassified",
					label: "未分類",
					amount: 45678,
					ratio: 0.02,
					color: "#9ca3af",
				},
			],
		},
		...overrides,
	};
}
