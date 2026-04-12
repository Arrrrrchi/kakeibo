import type { BudgetItemWithMappings } from "@/types/budget";
import type { CategoryBreakdown, MonthlyAggregation } from "@/types/transaction";

export type DateRange = {
	from: string; // "YYYY-MM"
	to: string; // "YYYY-MM"（from 以上）
};

export type BreakdownItem = {
	key: string; // budgetItemId | CycleType | "unclassified"
	label: string;
	amount: number; // 正の支出額
	ratio: number; // 0..1
	color: string; // HEX
};

export type DashboardOverview = {
	period: { from: string; to: string; monthCount: number };
	totalIncome: number;
	totalExpense: number;
	totalInvestment: number;
	mappedIncome: number; // 予算マッピング済み収入
	unmappedIncome: number; // 予算外収入
	expenseRate: number; // totalExpense / totalIncome（incomeが0なら0）
	savingsRate: number; // (income - expense - investment) / income（incomeが0なら0）
	monthlyAvgIncome: number;
	monthlyAvgExpense: number;
	byCycleType: {
		monthly_fixed: number;
		monthly_variable: number;
		irregular_fixed: number;
		irregular_variable: number;
		unclassified: number;
	};
	breakdownByBudgetItem: BreakdownItem[];
	breakdownByCycleType: BreakdownItem[];
};

export type KpiSummary = {
	totalIncome: number;
	totalExpense: number;
	balance: number;
	monthlyAvgExpense: number;
	monthCount: number;
};

export type BudgetReportRow = {
	budgetItem: BudgetItemWithMappings;
	monthlyActuals: Record<string, number>;
	totalActual: number;
	totalBudget: number;
	difference: number;
	achievementRate: number;
};

export type InvestmentRow = {
	label: string;
	monthlyActuals: Record<string, number>;
	totalActual: number;
};

export type DashboardData = {
	kpiSummary: KpiSummary;
	monthlyTrend: MonthlyAggregation[];
	categoryBreakdown: CategoryBreakdown[];
	budgetItems: BudgetItemWithMappings[];
	unmappedCategories: CategoryBreakdown[];
	budgetReport: BudgetReportRow[];
	investmentRow: InvestmentRow;
	overview: DashboardOverview;
};
