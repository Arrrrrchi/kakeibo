import {
	CYCLE_TYPE_COLOR,
	CYCLE_TYPE_LABEL,
	CYCLE_TYPE_ORDER,
	UNCLASSIFIED_COLOR,
	UNCLASSIFIED_LABEL,
} from "@/client/lib/cycle-type";
import { formatCurrency } from "@/client/lib/format";
import type { DashboardOverview } from "@/types/dashboard";

type Props = {
	overview: DashboardOverview;
};

type RowProps = {
	label: string;
	value: string;
	bold?: boolean;
	indent?: boolean;
	color?: string;
	valueClassName?: string;
	"data-testid"?: string;
};

function Row({
	label,
	value,
	bold,
	indent,
	color,
	valueClassName,
	"data-testid": testId,
}: RowProps) {
	return (
		<div className={`flex items-center justify-between ${indent ? "pl-4" : ""} py-1`}>
			<dt
				className={`flex items-center gap-2 text-sm ${bold ? "font-semibold text-gray-800" : "text-gray-600"}`}
			>
				{color !== undefined && (
					<span
						className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
						style={{ backgroundColor: color }}
					/>
				)}
				{label}
			</dt>
			<dd
				className={`text-sm tabular-nums ${bold ? "font-semibold text-gray-800" : "text-gray-700"} ${valueClassName ?? ""}`}
				data-testid={testId}
			>
				{value}
			</dd>
		</div>
	);
}

export function DetailDataCard({ overview }: Props) {
	const {
		totalIncome,
		totalExpense,
		totalInvestment,
		mappedIncome,
		unmappedIncome,
		expenseRate,
		savingsRate,
		byCycleType,
	} = overview;

	const savings = totalIncome - totalExpense - totalInvestment;
	const savingsPlusInvestment = savings + totalInvestment;
	const expenseRatePercent = Math.round(expenseRate * 100);
	const savingsRatePercent = Math.round(savingsRate * 100);

	const savingsNegative = savings < 0;
	const savingsRateNegative = savingsRate < 0;

	return (
		<div className="rounded-2xl bg-white shadow-sm p-6">
			<h2 className="text-lg font-semibold text-gray-800 mb-6">詳細データ</h2>

			{/* セクション1: 総収入 */}
			<dl>
				<Row label="総収入" value={formatCurrency(totalIncome)} bold />
				<Row label="予算内収入" value={formatCurrency(mappedIncome)} indent />
				<Row label="予算外収入" value={formatCurrency(unmappedIncome)} indent />
			</dl>

			{/* セクション2: 総支出 */}
			<dl className="mt-6 border-t border-gray-100 pt-6">
				<Row label="総支出" value={formatCurrency(totalExpense)} bold />
				{CYCLE_TYPE_ORDER.map((cycleType) => (
					<Row
						key={cycleType}
						label={CYCLE_TYPE_LABEL[cycleType]}
						value={formatCurrency(byCycleType[cycleType])}
						indent
						color={CYCLE_TYPE_COLOR[cycleType]}
					/>
				))}
				{byCycleType.unclassified > 0 && (
					<Row
						label={UNCLASSIFIED_LABEL}
						value={formatCurrency(byCycleType.unclassified)}
						indent
						color={UNCLASSIFIED_COLOR}
					/>
				)}
			</dl>

			{/* セクション3: 総投資 + 貯蓄 */}
			<dl className="mt-6 border-t border-gray-100 pt-6">
				<Row label="総投資" value={formatCurrency(totalInvestment)} bold />
				<Row label="支出率" value={`${expenseRatePercent}%`} indent />
				<Row
					label="貯金額"
					value={formatCurrency(savings)}
					indent
					valueClassName={savingsNegative ? "text-red-500" : undefined}
					data-testid="savings-amount"
				/>
				<Row label="貯金・投資合計" value={formatCurrency(savingsPlusInvestment)} indent />
				<Row
					label="貯蓄率"
					value={`${savingsRatePercent}%`}
					indent
					valueClassName={savingsRateNegative ? "text-red-500" : undefined}
					data-testid="savings-rate"
				/>
			</dl>
		</div>
	);
}
