import type { IBudgetRepository } from "@/server/repositories/interfaces/budget-repository.interface";
import type { IMappingRepository } from "@/server/repositories/interfaces/mapping-repository.interface";
import type { ITransactionRepository } from "@/server/repositories/interfaces/transaction-repository.interface";
import type { BudgetItemWithMappings } from "@/types/budget";
import type {
	BudgetReportRow,
	DashboardData,
	DateRange,
	InvestmentRow,
	KpiSummary,
} from "@/types/dashboard";
import type { CategoryBreakdown, MonthlyAggregation } from "@/types/transaction";

export class GetDashboardSummaryUsecase {
	constructor(
		private readonly transactionRepository: ITransactionRepository,
		private readonly budgetRepository: IBudgetRepository,
		readonly _mappingRepository: IMappingRepository,
	) {}

	async execute(dateRange?: DateRange): Promise<DashboardData> {
		const [monthlyTrend, categoryBreakdown, budgetItems] = await Promise.all([
			this.transactionRepository.getMonthlyAggregation(dateRange),
			this.transactionRepository.getCategoryBreakdown(dateRange),
			this.budgetRepository.findAllWithMappings(),
		]);

		const kpiSummary = this.calculateKpi(monthlyTrend);
		const unmappedCategories = this.findUnmappedCategories(categoryBreakdown, budgetItems);
		const [budgetReport, investmentRow] = await Promise.all([
			this.buildBudgetReport(budgetItems, monthlyTrend, dateRange),
			this.buildInvestmentRow(dateRange),
		]);

		// TODO: Step 3 で buildOverview() に置き換える
		const overview = {
			period: { from: "", to: "", monthCount: 0 },
			totalIncome: 0,
			totalExpense: 0,
			totalInvestment: 0,
			mappedIncome: 0,
			unmappedIncome: 0,
			expenseRate: 0,
			savingsRate: 0,
			monthlyAvgIncome: 0,
			monthlyAvgExpense: 0,
			byCycleType: {
				monthly_fixed: 0,
				monthly_variable: 0,
				irregular_fixed: 0,
				irregular_variable: 0,
				unclassified: 0,
			},
			breakdownByBudgetItem: [],
			breakdownByCycleType: [],
		};

		return {
			kpiSummary,
			monthlyTrend,
			categoryBreakdown,
			budgetItems,
			unmappedCategories,
			budgetReport,
			investmentRow,
			overview,
		};
	}

	private calculateKpi(monthlyTrend: MonthlyAggregation[]): KpiSummary {
		const monthCount = monthlyTrend.length;
		const totalIncome = monthlyTrend.reduce((sum, m) => sum + m.totalIncome, 0);
		const totalExpense = monthlyTrend.reduce((sum, m) => sum + m.totalExpense, 0);

		return {
			totalIncome,
			totalExpense,
			balance: totalIncome - totalExpense,
			monthlyAvgExpense: monthCount > 0 ? Math.round(totalExpense / monthCount) : 0,
			monthCount,
		};
	}

	private findUnmappedCategories(
		categoryBreakdown: CategoryBreakdown[],
		budgetItems: BudgetItemWithMappings[],
	): CategoryBreakdown[] {
		const mappedSet = new Set<string>();
		for (const item of budgetItems) {
			for (const mapping of item.mappings) {
				mappedSet.add(`${mapping.majorCategory}|${mapping.minorCategory}`);
			}
		}

		return categoryBreakdown.filter((c) => !mappedSet.has(`${c.majorCategory}|${c.minorCategory}`));
	}

	private async buildInvestmentRow(dateRange?: DateRange): Promise<InvestmentRow> {
		const trend = await this.transactionRepository.getMonthlyInvestmentTransferTrend(
			"SBI証券",
			dateRange,
		);
		const monthlyActuals: Record<string, number> = {};
		let totalActual = 0;
		for (const entry of trend) {
			monthlyActuals[entry.month] = entry.total;
			totalActual += entry.total;
		}
		return { label: "投信積立 (SBI証券)", monthlyActuals, totalActual };
	}

	private async buildBudgetReport(
		budgetItems: BudgetItemWithMappings[],
		monthlyTrend: MonthlyAggregation[],
		dateRange?: DateRange,
	): Promise<BudgetReportRow[]> {
		const monthCount = monthlyTrend.length;

		const reports: BudgetReportRow[] = [];

		for (const budgetItem of budgetItems) {
			const monthlyActuals: Record<string, number> = {};
			let totalActual = 0;

			for (const mapping of budgetItem.mappings) {
				const trend = await this.transactionRepository.getMonthlyTrendByCategory(
					mapping.majorCategory,
					mapping.minorCategory,
					dateRange,
				);
				for (const entry of trend) {
					monthlyActuals[entry.month] = (monthlyActuals[entry.month] ?? 0) + entry.total;
					totalActual += entry.total;
				}
			}

			const totalBudget = budgetItem.monthlyAmount * monthCount;
			const difference = totalBudget - totalActual;
			const achievementRate = totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0;

			reports.push({
				budgetItem,
				monthlyActuals,
				totalActual,
				totalBudget,
				difference,
				achievementRate,
			});
		}

		return reports;
	}
}
