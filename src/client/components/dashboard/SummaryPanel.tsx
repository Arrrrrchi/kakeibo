"use client"

import { CategoryPieChart } from "@/client/components/charts/CategoryPieChart"
import { MonthlyTrendChart } from "@/client/components/charts/MonthlyTrendChart"
import { StackedBarChart } from "@/client/components/charts/StackedBarChart"
import { Card } from "@/client/components/ui/Card"
import { KpiCard } from "@/client/components/ui/KpiCard"
import { formatCurrency } from "@/client/lib/format"
import type { DashboardData } from "@/types/dashboard"

type SummaryPanelProps = {
	data: DashboardData
}

export function SummaryPanel({ data }: SummaryPanelProps) {
	const { kpiSummary, monthlyTrend, categoryBreakdown } = data

	return (
		<div className="space-y-6">
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
				<KpiCard label="総収入" value={formatCurrency(kpiSummary.totalIncome)} color="green" />
				<KpiCard label="総支出" value={formatCurrency(kpiSummary.totalExpense)} color="red" />
				<KpiCard
					label="収支差額"
					value={formatCurrency(kpiSummary.balance)}
					color={kpiSummary.balance >= 0 ? "green" : "red"}
				/>
				<KpiCard
					label="月平均支出"
					value={formatCurrency(kpiSummary.monthlyAvgExpense)}
					sub={`${kpiSummary.monthCount}ヶ月分`}
					color="orange"
				/>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<Card title="月次収支トレンド">
					<MonthlyTrendChart data={monthlyTrend} />
				</Card>
				<Card title="カテゴリ別支出">
					<CategoryPieChart data={categoryBreakdown} />
				</Card>
			</div>

			<Card title="カテゴリ別月次推移">
				<StackedBarChart data={monthlyTrend} categoryData={categoryBreakdown} />
			</Card>
		</div>
	)
}
