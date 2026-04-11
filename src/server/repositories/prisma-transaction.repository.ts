import "server-only";

import { prisma } from "@/server/lib/prisma";
import type { ITransactionRepository } from "@/server/repositories/interfaces/transaction-repository.interface";
import type { DateRange } from "@/types/dashboard";
import type {
	CategoryBreakdown,
	MonthlyAggregation,
	Transaction,
	TransactionCreateInput,
} from "@/types/transaction";

export class PrismaTransactionRepository implements ITransactionRepository {
	async upsertMany(transactions: TransactionCreateInput[]): Promise<number> {
		if (transactions.length === 0) return 0;

		const result = await prisma.transaction.createMany({
			data: transactions,
			skipDuplicates: true,
		});

		return result.count;
	}

	async getMonthlyAggregation(dateRange?: DateRange): Promise<MonthlyAggregation[]> {
		const results = dateRange
			? await prisma.$queryRaw<{ month: string; total_income: bigint; total_expense: bigint }[]>`
				SELECT
					to_char(date, 'YYYY-MM') AS month,
					COALESCE(SUM(CASE WHEN is_income = true THEN amount ELSE 0 END), 0) AS total_income,
					COALESCE(SUM(CASE WHEN is_income = false THEN amount ELSE 0 END), 0) AS total_expense
				FROM transactions
				WHERE is_transfer = false
					AND date >= ${`${dateRange.from}-01`}::date
					AND date < (${`${dateRange.to}-01`}::date + interval '1 month')
				GROUP BY to_char(date, 'YYYY-MM')
				ORDER BY month
			`
			: await prisma.$queryRaw<{ month: string; total_income: bigint; total_expense: bigint }[]>`
				SELECT
					to_char(date, 'YYYY-MM') AS month,
					COALESCE(SUM(CASE WHEN is_income = true THEN amount ELSE 0 END), 0) AS total_income,
					COALESCE(SUM(CASE WHEN is_income = false THEN amount ELSE 0 END), 0) AS total_expense
				FROM transactions
				WHERE is_transfer = false
				GROUP BY to_char(date, 'YYYY-MM')
				ORDER BY month
			`;

		return results.map((r) => ({
			month: r.month,
			totalIncome: Number(r.total_income),
			totalExpense: Number(r.total_expense),
		}));
	}

	async getCategoryBreakdown(dateRange?: DateRange): Promise<CategoryBreakdown[]> {
		const results = dateRange
			? await prisma.$queryRaw<
					{
						major_category: string;
						minor_category: string;
						total: bigint;
						count: bigint;
					}[]
				>`
				SELECT
					major_category,
					minor_category,
					SUM(amount) AS total,
					COUNT(*) AS count
				FROM transactions
				WHERE is_income = false AND is_transfer = false
					AND date >= ${`${dateRange.from}-01`}::date
					AND date < (${`${dateRange.to}-01`}::date + interval '1 month')
				GROUP BY major_category, minor_category
				ORDER BY total DESC
			`
			: await prisma.$queryRaw<
					{
						major_category: string;
						minor_category: string;
						total: bigint;
						count: bigint;
					}[]
				>`
				SELECT
					major_category,
					minor_category,
					SUM(amount) AS total,
					COUNT(*) AS count
				FROM transactions
				WHERE is_income = false AND is_transfer = false
				GROUP BY major_category, minor_category
				ORDER BY total DESC
			`;

		return results.map((r) => ({
			majorCategory: r.major_category,
			minorCategory: r.minor_category,
			total: Number(r.total),
			count: Number(r.count),
		}));
	}

	async findByCategory(majorCategory: string, minorCategory: string): Promise<Transaction[]> {
		return prisma.transaction.findMany({
			where: { majorCategory, minorCategory },
			orderBy: { date: "desc" },
		});
	}

	async findByCategoryAndMonth(
		majorCategory: string,
		minorCategory: string,
		month: string,
	): Promise<Transaction[]> {
		return prisma.$queryRaw<Transaction[]>`
			SELECT id, date, description, amount, major_category AS "majorCategory",
				minor_category AS "minorCategory", institution, memo,
				moneyforward_id AS "moneyforwardId", is_income AS "isIncome",
				is_transfer AS "isTransfer", import_hash AS "importHash",
				created_at AS "createdAt", updated_at AS "updatedAt"
			FROM transactions
			WHERE major_category = ${majorCategory}
				AND minor_category = ${minorCategory}
				AND to_char(date, 'YYYY-MM') = ${month}
			ORDER BY date DESC
		`;
	}

	async getDistinctCategories(): Promise<{ majorCategory: string; minorCategory: string }[]> {
		const results = await prisma.$queryRaw<{ major_category: string; minor_category: string }[]>`
			SELECT DISTINCT major_category, minor_category
			FROM transactions
			WHERE is_income = false
			ORDER BY major_category, minor_category
		`;

		return results.map((r) => ({
			majorCategory: r.major_category,
			minorCategory: r.minor_category,
		}));
	}

	async getMonthlyTrendByCategory(
		majorCategory: string,
		minorCategory: string,
		dateRange?: DateRange,
	): Promise<{ month: string; total: number }[]> {
		const results = dateRange
			? await prisma.$queryRaw<{ month: string; total: bigint }[]>`
				SELECT
					to_char(date, 'YYYY-MM') AS month,
					SUM(amount) AS total
				FROM transactions
				WHERE major_category = ${majorCategory}
					AND minor_category = ${minorCategory}
					AND date >= ${`${dateRange.from}-01`}::date
					AND date < (${`${dateRange.to}-01`}::date + interval '1 month')
				GROUP BY to_char(date, 'YYYY-MM')
				ORDER BY month
			`
			: await prisma.$queryRaw<{ month: string; total: bigint }[]>`
				SELECT
					to_char(date, 'YYYY-MM') AS month,
					SUM(amount) AS total
				FROM transactions
				WHERE major_category = ${majorCategory}
					AND minor_category = ${minorCategory}
				GROUP BY to_char(date, 'YYYY-MM')
				ORDER BY month
			`;

		return results.map((r) => ({
			month: r.month,
			total: Number(r.total),
		}));
	}

	async getMonthlyInvestmentTransferTrend(
		descriptionPrefix: string,
		dateRange?: DateRange,
	): Promise<{ month: string; total: number }[]> {
		const pattern = `${descriptionPrefix}%`;
		const results = dateRange
			? await prisma.$queryRaw<{ month: string; total: bigint }[]>`
				SELECT
					to_char(date, 'YYYY-MM') AS month,
					SUM(amount) AS total
				FROM transactions
				WHERE is_transfer = true
					AND description LIKE ${pattern}
					AND date >= ${`${dateRange.from}-01`}::date
					AND date < (${`${dateRange.to}-01`}::date + interval '1 month')
				GROUP BY to_char(date, 'YYYY-MM')
				ORDER BY month
			`
			: await prisma.$queryRaw<{ month: string; total: bigint }[]>`
				SELECT
					to_char(date, 'YYYY-MM') AS month,
					SUM(amount) AS total
				FROM transactions
				WHERE is_transfer = true
					AND description LIKE ${pattern}
				GROUP BY to_char(date, 'YYYY-MM')
				ORDER BY month
			`;

		return results.map((r) => ({
			month: r.month,
			total: Number(r.total),
		}));
	}
}
