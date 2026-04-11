import type {
	CategoryBreakdown,
	MonthlyAggregation,
	Transaction,
	TransactionCreateInput,
} from "@/types/transaction";

export type ITransactionRepository = {
	upsertMany(transactions: TransactionCreateInput[]): Promise<number>;
	getMonthlyAggregation(): Promise<MonthlyAggregation[]>;
	getCategoryBreakdown(): Promise<CategoryBreakdown[]>;
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
	): Promise<{ month: string; total: number }[]>;
	getMonthlyInvestmentTransferTrend(
		descriptionPrefix: string,
	): Promise<{ month: string; total: number }[]>;
};
