"use client"

import {
	Bar,
	BarChart,
	CartesianGrid,
	Legend,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts"
import { formatCompactCurrency, formatCurrency, formatMonth } from "@/client/lib/format"
import type { CategoryBreakdown, MonthlyAggregation } from "@/types/transaction"

const COLORS = [
	"#3b82f6",
	"#ef4444",
	"#22c55e",
	"#f59e0b",
	"#8b5cf6",
	"#ec4899",
	"#06b6d4",
	"#f97316",
	"#6366f1",
	"#14b8a6",
]

type StackedBarChartProps = {
	data: MonthlyAggregation[]
	categoryData: CategoryBreakdown[]
}

function buildStackedData(
	monthlyData: MonthlyAggregation[],
	categoryData: CategoryBreakdown[],
): { chartData: Record<string, string | number>[]; categories: string[] } {
	const categoryTotals = new Map<string, number>()
	for (const item of categoryData) {
		const current = categoryTotals.get(item.majorCategory) ?? 0
		categoryTotals.set(item.majorCategory, current + item.total)
	}

	const grandTotal = Array.from(categoryTotals.values()).reduce((s, v) => s + v, 0)
	const categories = Array.from(categoryTotals.keys()).sort(
		(a, b) => (categoryTotals.get(b) ?? 0) - (categoryTotals.get(a) ?? 0),
	)

	const chartData = monthlyData.map((m) => {
		const row: Record<string, string | number> = { month: formatMonth(m.month) }
		for (const cat of categories) {
			const ratio = grandTotal > 0 ? (categoryTotals.get(cat) ?? 0) / grandTotal : 0
			row[cat] = Math.round(m.totalExpense * ratio)
		}
		return row
	})

	return { chartData, categories }
}

export function StackedBarChart({ data, categoryData }: StackedBarChartProps) {
	if (data.length === 0 || categoryData.length === 0) {
		return <p className="text-sm text-gray-400 text-center py-8">データがありません</p>
	}

	const { chartData, categories } = buildStackedData(data, categoryData)

	return (
		<div aria-label="カテゴリ別月次推移チャート" role="img">
			<ResponsiveContainer width="100%" height={350}>
				<BarChart data={chartData}>
					<CartesianGrid strokeDasharray="3 3" />
					<XAxis dataKey="month" tick={{ fontSize: 12 }} />
					<YAxis tickFormatter={(v: number) => formatCompactCurrency(v)} tick={{ fontSize: 12 }} />
					<Tooltip formatter={(value) => formatCurrency(Number(value))} />
					<Legend />
					{categories.map((cat, index) => (
						<Bar key={cat} dataKey={cat} stackId="a" fill={COLORS[index % COLORS.length]} />
					))}
				</BarChart>
			</ResponsiveContainer>
		</div>
	)
}
