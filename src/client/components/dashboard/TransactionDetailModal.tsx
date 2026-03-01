"use client"

import { useEffect, useState } from "react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import type { Transaction } from "@/types/transaction"
import { getTransactionsByCategory } from "@/server/actions/get-transactions-by-category"
import { formatCurrency, formatMonth } from "@/client/lib/format"
import { Modal } from "@/client/components/ui/Modal"

type TransactionDetailModalProps = {
	majorCategory: string
	minorCategory: string
	isOpen: boolean
	onClose: () => void
}

type MonthlyTrendItem = {
	month: string
	total: number
}

export function TransactionDetailModal({
	majorCategory,
	minorCategory,
	isOpen,
	onClose,
}: TransactionDetailModalProps) {
	const [transactions, setTransactions] = useState<Transaction[]>([])
	const [monthlyTrend, setMonthlyTrend] = useState<MonthlyTrendItem[]>([])
	const [loading, setLoading] = useState(false)

	useEffect(() => {
		if (!isOpen) return
		setLoading(true)
		getTransactionsByCategory(majorCategory, minorCategory)
			.then((result) => {
				setTransactions(result.transactions)
				setMonthlyTrend(result.monthlyTrend)
			})
			.finally(() => setLoading(false))
	}, [isOpen, majorCategory, minorCategory])

	if (!isOpen) return null

	const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0)
	const monthCount = monthlyTrend.length || 1
	const monthlyAvg = Math.round(totalAmount / monthCount)

	const sortedTransactions = [...transactions].sort(
		(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
	)

	const chartData = monthlyTrend.map((m) => ({
		month: formatMonth(m.month),
		total: m.total,
	}))

	return (
		<Modal isOpen={isOpen} onClose={onClose} title={`${majorCategory} / ${minorCategory}`}>
			{loading ? (
				<div className="flex items-center justify-center py-8">
					<div className="text-gray-400 text-sm">読み込み中...</div>
				</div>
			) : (
				<div className="space-y-4">
					{chartData.length > 0 && (
						<div>
							<h4 className="text-xs font-semibold text-gray-500 mb-2">月別推移</h4>
							<div className="h-40">
								<ResponsiveContainer width="100%" height="100%">
									<BarChart data={chartData}>
										<XAxis dataKey="month" tick={{ fontSize: 11 }} />
										<YAxis tick={{ fontSize: 11 }} />
										<Tooltip
											formatter={(value: number) => [formatCurrency(value), "支出"]}
										/>
										<Bar dataKey="total" fill="#2980b9" radius={[2, 2, 0, 0]} />
									</BarChart>
								</ResponsiveContainer>
							</div>
						</div>
					)}

					<div className="grid grid-cols-3 gap-2 bg-gray-50 rounded-lg p-3">
						<div className="text-center">
							<div className="text-xs text-gray-500">合計</div>
							<div className="text-sm font-semibold">{formatCurrency(totalAmount)}</div>
						</div>
						<div className="text-center">
							<div className="text-xs text-gray-500">月平均</div>
							<div className="text-sm font-semibold">{formatCurrency(monthlyAvg)}</div>
						</div>
						<div className="text-center">
							<div className="text-xs text-gray-500">件数</div>
							<div className="text-sm font-semibold">{transactions.length}件</div>
						</div>
					</div>

					<div>
						<h4 className="text-xs font-semibold text-gray-500 mb-2">取引一覧</h4>
						<div className="overflow-auto max-h-60">
							<table className="w-full text-xs">
								<thead>
									<tr className="text-gray-500 border-b">
										<th className="text-left py-1 px-2">日付</th>
										<th className="text-left py-1 px-2">内容</th>
										<th className="text-right py-1 px-2">金額</th>
										<th className="text-left py-1 px-2">金融機関</th>
									</tr>
								</thead>
								<tbody>
									{sortedTransactions.map((t) => (
										<tr key={t.id} className="border-b hover:bg-gray-50">
											<td className="py-1 px-2 whitespace-nowrap">
												{new Date(t.date).toLocaleDateString("ja-JP")}
											</td>
											<td className="py-1 px-2">{t.description}</td>
											<td className="py-1 px-2 text-right whitespace-nowrap">
												{formatCurrency(t.amount)}
											</td>
											<td className="py-1 px-2 text-gray-500">{t.institution ?? "-"}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			)}
		</Modal>
	)
}
