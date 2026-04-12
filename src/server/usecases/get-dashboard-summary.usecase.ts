import {
	CYCLE_TYPE_ORDER,
	getCycleTypeColor,
	getCycleTypeLabel,
	UNCLASSIFIED_COLOR,
	UNCLASSIFIED_KEY,
	UNCLASSIFIED_LABEL,
} from "@/client/lib/cycle-type";
import type { CycleType } from "@/generated/prisma/enums";
import type { IBudgetRepository } from "@/server/repositories/interfaces/budget-repository.interface";
import type { IMappingRepository } from "@/server/repositories/interfaces/mapping-repository.interface";
import type { ITransactionRepository } from "@/server/repositories/interfaces/transaction-repository.interface";
import type { BudgetItemWithMappings } from "@/types/budget";
import type {
	BreakdownItem,
	BudgetReportRow,
	DashboardData,
	DashboardOverview,
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

		const overview = this.buildOverview(
			monthlyTrend,
			categoryBreakdown,
			budgetItems,
			investmentRow,
			dateRange,
		);

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

	private buildOverview(
		monthlyTrend: MonthlyAggregation[],
		categoryBreakdown: CategoryBreakdown[],
		budgetItems: BudgetItemWithMappings[],
		investmentRow: InvestmentRow,
		dateRange?: DateRange,
	): DashboardOverview {
		const monthCount = monthlyTrend.length;
		const totalIncome = monthlyTrend.reduce((sum, m) => sum + m.totalIncome, 0);
		const totalExpense = monthlyTrend.reduce((sum, m) => sum + m.totalExpense, 0);
		const totalInvestment = investmentRow.totalActual;

		// 暫定実装: スキーマに収入カテゴリの予算マッピング区別がないため全収入を mappedIncome とする
		// TODO: 将来、予算マッピングに基づく区別（収入カテゴリの budgetItems マッピング）を検討
		const mappedIncome = totalIncome;
		const unmappedIncome = 0;

		const expenseRate = totalIncome > 0 ? totalExpense / totalIncome : 0;
		const savingsRate =
			totalIncome > 0 ? (totalIncome - totalExpense - totalInvestment) / totalIncome : 0;
		const monthlyAvgIncome = monthCount > 0 ? totalIncome / monthCount : 0;
		const monthlyAvgExpense = monthCount > 0 ? totalExpense / monthCount : 0;

		// (majorCategory, minorCategory) → CycleType のマップを構築
		const categoryToCycleType = new Map<string, CycleType>();
		// budgetItemId → budgetItem のマップ（breakdownByBudgetItem 用）
		const categoryToBudgetItemId = new Map<string, string>();

		for (const item of budgetItems) {
			for (const mapping of item.mappings) {
				const key = `${mapping.majorCategory}|${mapping.minorCategory}`;
				categoryToCycleType.set(key, item.cycleType);
				categoryToBudgetItemId.set(key, item.id);
			}
		}

		// byCycleType: 支出カテゴリを CycleType バケットに振り分け
		const byCycleType: DashboardOverview["byCycleType"] = {
			monthly_fixed: 0,
			monthly_variable: 0,
			irregular_fixed: 0,
			irregular_variable: 0,
			unclassified: 0,
		};

		for (const cat of categoryBreakdown) {
			const key = `${cat.majorCategory}|${cat.minorCategory}`;
			const cycleType = categoryToCycleType.get(key);
			if (cycleType !== undefined) {
				byCycleType[cycleType] += cat.total;
			} else {
				byCycleType.unclassified += cat.total;
			}
		}

		// breakdownByBudgetItem: budgetItem ごとに紐づくカテゴリの実績合計を算出
		const budgetItemAmounts = new Map<string, number>();
		for (const item of budgetItems) {
			budgetItemAmounts.set(item.id, 0);
		}

		let unclassifiedAmount = 0;
		for (const cat of categoryBreakdown) {
			const catKey = `${cat.majorCategory}|${cat.minorCategory}`;
			const budgetItemId = categoryToBudgetItemId.get(catKey);
			if (budgetItemId !== undefined) {
				budgetItemAmounts.set(budgetItemId, (budgetItemAmounts.get(budgetItemId) ?? 0) + cat.total);
			} else {
				unclassifiedAmount += cat.total;
			}
		}

		const breakdownByBudgetItem: BreakdownItem[] = [];
		for (const item of budgetItems) {
			const amount = budgetItemAmounts.get(item.id) ?? 0;
			const ratio = totalExpense > 0 ? amount / totalExpense : 0;
			breakdownByBudgetItem.push({
				key: item.id,
				label: item.name,
				amount,
				ratio,
				color: "",
			});
		}
		// 未分類は末尾に固定（amount=0 でも含める）
		breakdownByBudgetItem.push({
			key: UNCLASSIFIED_KEY,
			label: UNCLASSIFIED_LABEL,
			amount: unclassifiedAmount,
			ratio: totalExpense > 0 ? unclassifiedAmount / totalExpense : 0,
			color: "",
		});

		// breakdownByCycleType: 5 バケット固定（末尾に unclassified）
		const breakdownByCycleType: BreakdownItem[] = CYCLE_TYPE_ORDER.map((cycleType) => {
			const amount = byCycleType[cycleType];
			return {
				key: cycleType,
				label: getCycleTypeLabel(cycleType),
				amount,
				ratio: totalExpense > 0 ? amount / totalExpense : 0,
				color: getCycleTypeColor(cycleType),
			};
		});
		breakdownByCycleType.push({
			key: UNCLASSIFIED_KEY,
			label: UNCLASSIFIED_LABEL,
			amount: byCycleType.unclassified,
			ratio: totalExpense > 0 ? byCycleType.unclassified / totalExpense : 0,
			color: UNCLASSIFIED_COLOR,
		});

		// period: dateRange があればそれを使い、なければ monthlyTrend から導出
		const periodFrom = dateRange?.from ?? monthlyTrend[0]?.month ?? "";
		const periodTo = dateRange?.to ?? monthlyTrend[monthlyTrend.length - 1]?.month ?? "";

		return {
			period: { from: periodFrom, to: periodTo, monthCount },
			totalIncome,
			totalExpense,
			totalInvestment,
			mappedIncome,
			unmappedIncome,
			expenseRate,
			savingsRate,
			monthlyAvgIncome,
			monthlyAvgExpense,
			byCycleType,
			breakdownByBudgetItem,
			breakdownByCycleType,
		};
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
