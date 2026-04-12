"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/client/components/ui/Modal";
import { formatCurrency, formatMonth } from "@/client/lib/format";
import type { CategoryMapping } from "@/types/budget";
import type { Transaction, TransactionCategoryOption } from "@/types/transaction";
import { EditableTransactionRow } from "./EditableTransactionRow";

type TransactionJson = {
	id: string;
	date: string;
	description: string;
	amount: number;
	majorCategory: string;
	minorCategory: string;
	institution: string | null;
	memo: string | null;
	moneyforwardId: string | null;
	isIncome: boolean;
	isTransfer: boolean;
	importHash: string;
	createdAt: string;
	updatedAt: string;
};

function isTransactionJson(v: unknown): v is TransactionJson {
	if (typeof v !== "object" || v === null) return false;
	const r = v as Record<string, unknown>;
	return (
		typeof r.id === "string" &&
		typeof r.date === "string" &&
		typeof r.description === "string" &&
		typeof r.amount === "number" &&
		typeof r.majorCategory === "string" &&
		typeof r.minorCategory === "string" &&
		(r.institution === null || typeof r.institution === "string") &&
		(r.moneyforwardId === null || typeof r.moneyforwardId === "string") &&
		(r.memo === null || typeof r.memo === "string") &&
		typeof r.isTransfer === "boolean" &&
		typeof r.importHash === "string" &&
		typeof r.isIncome === "boolean" &&
		typeof r.createdAt === "string" &&
		typeof r.updatedAt === "string"
	);
}

type BudgetItemMonthDetailModalProps = {
	budgetItemName: string;
	mappings: CategoryMapping[];
	month: string;
	categoryOptions: TransactionCategoryOption[];
	onClose: () => void;
};

export function BudgetItemMonthDetailModal({
	budgetItemName,
	mappings,
	month,
	categoryOptions,
	onClose,
}: BudgetItemMonthDetailModalProps) {
	const [transactions, setTransactions] = useState<Transaction[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let ignore = false;
		const controller = new AbortController();

		setLoading(true);
		setError(null);

		const params = new URLSearchParams({
			mappings: JSON.stringify(mappings),
			month,
		});

		fetch(`/api/transactions?${params.toString()}`, { signal: controller.signal })
			.then(async (res) => {
				if (ignore) return;
				const body: unknown = await res.json();
				if (ignore) return;

				if (!res.ok) {
					const errMsg =
						typeof body === "object" &&
						body !== null &&
						"error" in body &&
						typeof (body as Record<string, unknown>).error === "string"
							? (body as { error: string }).error
							: "取引データの取得に失敗しました";
					setError(errMsg);
					return;
				}

				if (!Array.isArray(body) || !body.every(isTransactionJson)) {
					setError("レスポンスの形式が不正です");
					return;
				}

				setTransactions(
					body.map((t) => ({
						...t,
						date: new Date(t.date),
						createdAt: new Date(t.createdAt),
						updatedAt: new Date(t.updatedAt),
					})),
				);
			})
			.catch((e) => {
				if (ignore) return;
				if (e instanceof DOMException && e.name === "AbortError") return;
				setError("取引の読み込みに失敗しました");
			})
			.finally(() => {
				if (!ignore) setLoading(false);
			});

		return () => {
			ignore = true;
			controller.abort();
		};
	}, [mappings, month]);

	const total = transactions.reduce((sum, t) => sum + t.amount, 0);

	const handleUpdated = (updated: Transaction) => {
		setTransactions((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
	};

	const handleDeleted = (id: string) => {
		setTransactions((prev) => prev.filter((t) => t.id !== id));
	};

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
					<div className="overflow-auto">
						<table className="w-full text-xs min-w-[700px]">
							<thead>
								<tr className="text-gray-500 border-b">
									<th className="text-left py-1 px-2">日付</th>
									<th className="text-left py-1 px-2">内容</th>
									<th className="text-right py-1 px-2">金額</th>
									<th className="text-left py-1 px-2">カテゴリ</th>
									<th className="text-left py-1 px-2">メモ</th>
									<th className="text-left py-1 px-2">振替</th>
									<th className="text-left py-1 px-2" />
								</tr>
							</thead>
							<tbody>
								{transactions.map((t) => (
									<EditableTransactionRow
										key={t.id}
										transaction={t}
										categoryOptions={categoryOptions}
										onUpdated={handleUpdated}
										onDeleted={handleDeleted}
									/>
								))}
							</tbody>
						</table>
					</div>
				</div>
			)}
		</Modal>
	);
}
