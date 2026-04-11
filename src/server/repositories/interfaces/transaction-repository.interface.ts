import type { DateRange } from "@/types/dashboard";
import type {
	CategoryBreakdown,
	MonthlyAggregation,
	Transaction,
	TransactionCreateInput,
} from "@/types/transaction";

export type ITransactionRepository = {
	upsertMany(transactions: TransactionCreateInput[]): Promise<number>;
	getMonthlyAggregation(dateRange?: DateRange): Promise<MonthlyAggregation[]>;
	getCategoryBreakdown(dateRange?: DateRange): Promise<CategoryBreakdown[]>;
	findByCategory(majorCategory: string, minorCategory: string): Promise<Transaction[]>;
	findByCategoryAndMonth(
		majorCategory: string,
		minorCategory: string,
		month: string,
	): Promise<Transaction[]>;
	getDistinctCategories(): Promise<{ majorCategory: string; minorCategory: string }[]>;
	getMonthlyTrendByCategory(
		majorCategory: string,
		minorCategory: string,
		dateRange?: DateRange,
	): Promise<{ month: string; total: number }[]>;
	getMonthlyInvestmentTransferTrend(
		descriptionPrefix: string,
		dateRange?: DateRange,
	): Promise<{ month: string; total: number }[]>;
};
