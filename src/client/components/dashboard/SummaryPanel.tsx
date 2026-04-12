import { BreakdownCard } from "@/client/components/dashboard/summary/BreakdownCard";
import { DetailDataCard } from "@/client/components/dashboard/summary/DetailDataCard";
import { IncomeExpenseSummaryCard } from "@/client/components/dashboard/summary/IncomeExpenseSummaryCard";
import type { DashboardData } from "@/types/dashboard";

type SummaryPanelProps = {
	data: DashboardData;
};

export function SummaryPanel({ data }: SummaryPanelProps) {
	const { overview } = data;

	return (
		<div className="flex flex-col gap-6">
			<IncomeExpenseSummaryCard overview={overview} />

			<div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
				<div className="lg:col-span-3">
					<BreakdownCard
						byBudgetItem={overview.breakdownByBudgetItem}
						byCycleType={overview.breakdownByCycleType}
						monthlyAvgExpense={overview.monthlyAvgExpense}
					/>
				</div>
				<div className="lg:col-span-2">
					<DetailDataCard overview={overview} />
				</div>
			</div>
		</div>
	);
}
