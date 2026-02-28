"use client"

import { formatCurrency, formatPercent } from "@/client/lib/format"
import type { CategoryBreakdown } from "@/types/transaction"
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"

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

type CategoryPieChartProps = {
	data: CategoryBreakdown[]
}

function groupByMajorCategory(data: CategoryBreakdown[]): { name: string; value: number }[] {
	const grouped = new Map<string, number>()
	for (const item of data) {
		const current = grouped.get(item.majorCategory) ?? 0
		grouped.set(item.majorCategory, current + item.total)
	}
	return Array.from(grouped.entries())
		.map(([name, value]) => ({ name, value }))
		.sort((a, b) => b.value - a.value)
}

export function CategoryPieChart({ data }: CategoryPieChartProps) {
	if (data.length === 0) {
		return <p className="text-sm text-gray-400 text-center py-8">データがありません</p>
	}

	const grouped = groupByMajorCategory(data)
	const total = grouped.reduce((sum, item) => sum + item.value, 0)

	return (
		<ResponsiveContainer width="100%" height={300}>
			<PieChart>
				<Pie
					data={grouped}
					cx="50%"
					cy="50%"
					innerRadius={60}
					outerRadius={100}
					dataKey="value"
					label={({ name, value }) => `${name} ${formatPercent((value / total) * 100)}`}
				>
					{grouped.map((_, index) => (
						<Cell key={`cell-${grouped[index].name}`} fill={COLORS[index % COLORS.length]} />
					))}
				</Pie>
				<Tooltip formatter={(value: number) => formatCurrency(value)} />
				<Legend />
			</PieChart>
		</ResponsiveContainer>
	)
}
