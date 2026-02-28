import type { BudgetItemWithMappings } from "@/types/budget"
import type { CategoryBreakdown, MonthlyAggregation } from "@/types/transaction"

export type KpiSummary = {
	totalIncome: number
	totalExpense: number
	balance: number
	monthlyAvgExpense: number
	monthCount: number
}

export type BudgetReportRow = {
	budgetItem: BudgetItemWithMappings
	monthlyActuals: Record<string, number>
	totalActual: number
	totalBudget: number
	difference: number
	achievementRate: number
}

export type DashboardData = {
	kpiSummary: KpiSummary
	monthlyTrend: MonthlyAggregation[]
	categoryBreakdown: CategoryBreakdown[]
	budgetItems: BudgetItemWithMappings[]
	unmappedCategories: CategoryBreakdown[]
	budgetReport: BudgetReportRow[]
}
