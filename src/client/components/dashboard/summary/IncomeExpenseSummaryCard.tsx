import { formatCurrency } from "@/client/lib/format";
import type { DashboardOverview } from "@/types/dashboard";

type Props = {
	overview: DashboardOverview;
};

type ExpenseRateLevel = "good" | "warn" | "alert";

export function getExpenseRateLevel(rate: number): ExpenseRateLevel {
	if (rate <= 0.8) return "good";
	if (rate <= 1.0) return "warn";
	return "alert";
}

function formatPeriodLabel(yearMonth: string): string {
	// "2025-01" or "2025-01-01" → "2025/01"
	const parts = yearMonth.split("-");
	const year = parts[0];
	const month = parts[1];
	return `${year}/${month}`;
}

const RATE_COLOR: Record<ExpenseRateLevel, string> = {
	good: "text-emerald-500",
	warn: "text-amber-500",
	alert: "text-red-500",
};

type CommentConfig = {
	headline: string;
	supplement: string;
};

const COMMENT: Record<ExpenseRateLevel, CommentConfig> = {
	good: {
		headline: "✨ 支出率が8割以内に抑えられています",
		supplement: "順調に貯蓄できています。この調子を維持しましょう。",
	},
	warn: {
		headline: "⚠️ 支出率が8〜10割の範囲です",
		supplement: "収支はほぼ均衡しています。支出を見直す余地があります。",
	},
	alert: {
		headline: "🚨 支出が収入を超えています",
		supplement: "早急に支出を見直してください。",
	},
};

export function IncomeExpenseSummaryCard({ overview }: Props) {
	const { period, mappedIncome, totalExpense, expenseRate } = overview;

	const fromLabel = formatPeriodLabel(period.from);
	const toLabel = formatPeriodLabel(period.to);
	const periodLabel = `${fromLabel} ～ ${toLabel}`;

	const ratePercent = Math.round(expenseRate * 100);
	const level = getExpenseRateLevel(expenseRate);
	const rateColor = RATE_COLOR[level];
	const comment = COMMENT[level];

	return (
		<div className="rounded-2xl bg-white shadow-sm p-6 md:p-8">
			<div className="flex items-center justify-between mb-6">
				<h2 className="text-lg font-semibold text-gray-800">収支実績</h2>
				<span className="text-sm text-gray-500">{periodLabel}</span>
			</div>

			<div className="flex items-center justify-center gap-8 mb-6">
				<div className="text-center">
					<p className="text-xs text-gray-500 mb-1">予算内収入</p>
					<p className="text-xl font-semibold text-gray-800">{formatCurrency(mappedIncome)}</p>
				</div>

				<div className="text-center">
					<p className={`text-7xl font-bold ${rateColor}`}>{ratePercent}%</p>
				</div>

				<div className="text-center">
					<p className="text-xs text-gray-500 mb-1">支出</p>
					<p className="text-xl font-semibold text-gray-800">{formatCurrency(totalExpense)}</p>
				</div>
			</div>

			<div className="rounded-xl bg-gray-50 p-4">
				<p className="font-medium text-gray-800 mb-1">{comment.headline}</p>
				<p className="text-sm text-gray-600">{comment.supplement}</p>
			</div>
		</div>
	);
}
