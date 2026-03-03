import { Fragment } from "react";
import { formatCurrency, formatMonth } from "@/client/lib/format";
import type { CycleType } from "@/generated/prisma/enums";
import type { BudgetReportRow, InvestmentRow } from "@/types/dashboard";

type ReportPanelProps = {
	budgetReport: BudgetReportRow[];
	months: string[];
	investmentRow: InvestmentRow;
};

const CYCLE_TYPE_ORDER: { key: CycleType; label: string }[] = [
	{ key: "monthly_fixed", label: "毎月・固定" },
	{ key: "monthly_variable", label: "毎月・変動" },
	{ key: "irregular_fixed", label: "不定期・固定" },
	{ key: "irregular_variable", label: "不定期・変動" },
];

export function ReportPanel({ budgetReport, months, investmentRow }: ReportPanelProps) {
	if (budgetReport.length === 0) {
		return (
			<div className="bg-white rounded-xl p-8 shadow-sm text-center text-gray-400">
				データがありません
			</div>
		);
	}

	const totalBudget = budgetReport.reduce((sum, row) => sum + row.totalBudget, 0);
	const totalActual = budgetReport.reduce((sum, row) => sum + row.totalActual, 0);
	const totalDifference = totalBudget - totalActual;
	const overBudgetCount = budgetReport.filter((row) => row.difference < 0).length;

	const groupedRows = CYCLE_TYPE_ORDER.map((cycle) => ({
		...cycle,
		rows: budgetReport.filter((row) => row.budgetItem.cycleType === cycle.key),
	})).filter((group) => group.rows.length > 0);

	return (
		<div className="space-y-4">
			<div className="bg-white rounded-xl p-4 shadow-sm">
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
					<div>
						<div className="text-gray-500">予算合計</div>
						<div className="font-semibold text-lg">{formatCurrency(totalBudget)}</div>
					</div>
					<div>
						<div className="text-gray-500">実績合計</div>
						<div className="font-semibold text-lg">{formatCurrency(totalActual)}</div>
					</div>
					<div>
						<div className="text-gray-500">差額</div>
						<div
							className={`font-semibold text-lg ${totalDifference >= 0 ? "text-green-600" : "text-red-600"}`}
						>
							{totalDifference >= 0 ? "+" : ""}
							{formatCurrency(totalDifference)}
						</div>
					</div>
					<div>
						<div className="text-gray-500">超過項目</div>
						<div
							className={`font-semibold text-lg ${overBudgetCount > 0 ? "text-red-600" : "text-green-600"}`}
						>
							{overBudgetCount}項目
						</div>
					</div>
				</div>
			</div>

			<div className="bg-white rounded-xl shadow-sm overflow-auto">
				<table className="w-full text-sm">
					<thead>
						<tr className="bg-[#1a1a2e] text-white">
							<th className="sticky left-0 bg-[#1a1a2e] px-4 py-3 text-left font-medium whitespace-nowrap">
								費目
							</th>
							{months.map((m) => (
								<th
									key={m}
									className="px-4 py-3 text-right font-medium whitespace-nowrap min-w-[70px]"
								>
									{formatMonth(m)}
								</th>
							))}
							<th className="px-4 py-3 text-right font-medium whitespace-nowrap">合計</th>
							<th className="px-4 py-3 text-right font-medium whitespace-nowrap">予算</th>
							<th className="px-4 py-3 text-right font-medium whitespace-nowrap">差額</th>
							<th className="px-4 py-3 text-right font-medium whitespace-nowrap">達成率</th>
						</tr>
					</thead>
					<tbody>
						{groupedRows.map((group) => (
							<Fragment key={group.key}>
								<tr>
									<td
										colSpan={months.length + 5}
										className="bg-[#34495e] text-white text-xs font-medium px-4 py-2"
									>
										{group.label}
									</td>
								</tr>
								{group.rows.map((row) => (
									<tr key={row.budgetItem.id} className="border-b hover:bg-gray-50">
										<td className="sticky left-0 bg-white px-4 py-3 font-medium whitespace-nowrap">
											{row.budgetItem.name}
										</td>
										{months.map((m) => (
											<td key={m} className="px-4 py-3 text-right whitespace-nowrap">
												{row.monthlyActuals[m] ? formatCurrency(row.monthlyActuals[m]) : "-"}
											</td>
										))}
										<td className="px-4 py-3 text-right font-medium whitespace-nowrap">
											{formatCurrency(row.totalActual)}
										</td>
										<td className="px-4 py-3 text-right whitespace-nowrap">
											{formatCurrency(row.totalBudget)}
										</td>
										<td
											className={`px-4 py-3 text-right font-semibold whitespace-nowrap ${
												row.difference >= 0 ? "text-green-600" : "text-red-600"
											}`}
										>
											{row.difference >= 0 ? "" : ""}
											{formatCurrency(row.difference)}
										</td>
										<td
											className={`px-4 py-3 text-right whitespace-nowrap ${
												row.achievementRate > 100 ? "text-red-600" : "text-green-600"
											}`}
										>
											{row.achievementRate.toFixed(1)}%
										</td>
									</tr>
								))}
							</Fragment>
						))}
						<tr className="bg-gray-100 font-semibold border-t-2">
							<td className="sticky left-0 bg-gray-100 px-4 py-3">総合計</td>
							{months.map((m) => {
								const monthTotal = budgetReport.reduce(
									(sum, row) => sum + (row.monthlyActuals[m] ?? 0),
									0,
								);
								return (
									<td key={m} className="px-4 py-3 text-right whitespace-nowrap">
										{formatCurrency(monthTotal)}
									</td>
								);
							})}
							<td className="px-4 py-3 text-right whitespace-nowrap">
								{formatCurrency(totalActual)}
							</td>
							<td className="px-4 py-3 text-right whitespace-nowrap">
								{formatCurrency(totalBudget)}
							</td>
							<td
								className={`px-4 py-3 text-right whitespace-nowrap ${totalDifference >= 0 ? "text-green-600" : "text-red-600"}`}
							>
								{formatCurrency(totalDifference)}
							</td>
							<td className="px-4 py-3 text-right whitespace-nowrap">
								{totalBudget > 0 ? `${((totalActual / totalBudget) * 100).toFixed(1)}%` : "-"}
							</td>
						</tr>
						<tr className="border-t-2 bg-blue-50">
							<td className="sticky left-0 bg-blue-50 px-4 py-3 font-medium whitespace-nowrap">
								{investmentRow.label}
							</td>
							{months.map((m) => (
								<td key={m} className="px-4 py-3 text-right whitespace-nowrap">
									{investmentRow.monthlyActuals[m]
										? formatCurrency(investmentRow.monthlyActuals[m])
										: "-"}
								</td>
							))}
							<td className="px-4 py-3 text-right font-medium whitespace-nowrap">
								{investmentRow.totalActual > 0 ? formatCurrency(investmentRow.totalActual) : "-"}
							</td>
							<td className="px-4 py-3 text-right whitespace-nowrap">-</td>
							<td className="px-4 py-3 text-right whitespace-nowrap">-</td>
							<td className="px-4 py-3 text-right whitespace-nowrap">-</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>
	);
}
