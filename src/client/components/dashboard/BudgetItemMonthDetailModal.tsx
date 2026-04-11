"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/client/components/ui/Modal";
import { formatCurrency, formatMonth } from "@/client/lib/format";
import { getTransactionsByBudgetItemMonth } from "@/server/actions/get-transactions-by-budget-item-month";
import type { CategoryMapping } from "@/types/budget";
import type { Transaction } from "@/types/transaction";

type BudgetItemMonthDetailModalProps = {
	budgetItemName: string;
	mappings: CategoryMapping[];
	month: string;
	onClose: () => void;
};

export function BudgetItemMonthDetailModal({
	budgetItemName,
	mappings,
	month,
	onClose,
}: BudgetItemMonthDetailModalProps) {
	const [transactions, setTransactions] = useState<Transaction[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		setLoading(true);
		setError(null);
		getTransactionsByBudgetItemMonth(mappings, month)
			.then((result) => {
				if (result.success) {
					setTransactions(result.data);
				} else {
					setError(result.error);
				}
			})
			.finally(() => setLoading(false));
	}, [mappings, month]);

	const total = transactions.reduce((sum, t) => sum + t.amount, 0);

	return (
		<Modal isOpen={true} onClose={onClose} title={`${budgetItemName} — ${formatMonth(month)}`}>
			{loading ? (
				<div className="flex items-center justify-center py-8">
					<div className="text-gray-400 text-sm">読み込み中...</div>
				</div>
			) : error ? (
				<div className="py-8 text-center text-red-500 text-sm">{error}</div>
			) : transactions.length === 0 ? (
				<div className="py-8 text-center text-gray-400 text-sm">取引がありません</div>
			) : (
				<div className="space-y-3">
					<div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
						<span className="text-xs text-gray-500">合計</span>
						<span className="text-sm font-semibold">{formatCurrency(total)}</span>
					</div>
					<div className="overflow-auto max-h-80">
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
								{transactions.map((t) => (
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
			)}
		</Modal>
	);
}
