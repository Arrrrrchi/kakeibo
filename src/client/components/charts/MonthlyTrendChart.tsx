"use client"

import { formatCompactCurrency, formatCurrency, formatMonth } from "@/client/lib/format"
import type { MonthlyAggregation } from "@/types/transaction"
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

type MonthlyTrendChartProps = {
	data: MonthlyAggregation[]
}

export function MonthlyTrendChart({ data }: MonthlyTrendChartProps) {
	if (data.length === 0) {
		return <p className="text-sm text-gray-400 text-center py-8">データがありません</p>
	}

	const chartData = data.map((d) => ({
		month: formatMonth(d.month),
		収入: d.totalIncome,
		支出: d.totalExpense,
	}))

	return (
		<ResponsiveContainer width="100%" height={300}>
			<BarChart data={chartData}>
				<CartesianGrid strokeDasharray="3 3" />
				<XAxis dataKey="month" tick={{ fontSize: 12 }} />
				<YAxis tickFormatter={(v: number) => formatCompactCurrency(v)} tick={{ fontSize: 12 }} />
				<Tooltip formatter={(value: number) => formatCurrency(value)} />
				<Legend />
				<Bar dataKey="収入" fill="#22c55e" />
				<Bar dataKey="支出" fill="#ef4444" />
			</BarChart>
		</ResponsiveContainer>
	)
}
