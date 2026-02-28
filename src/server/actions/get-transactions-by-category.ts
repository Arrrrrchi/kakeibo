"use server"

import { PrismaTransactionRepository } from "@/server/repositories/prisma-transaction.repository"
import type { Transaction } from "@/types/transaction"

type GetTransactionsByCategoryResult = {
	transactions: Transaction[]
	monthlyTrend: { month: string; total: number }[]
}

export async function getTransactionsByCategory(
	majorCategory: string,
	minorCategory: string,
): Promise<GetTransactionsByCategoryResult> {
	const repo = new PrismaTransactionRepository()
	const [transactions, monthlyTrend] = await Promise.all([
		repo.findByCategory(majorCategory, minorCategory),
		repo.getMonthlyTrendByCategory(majorCategory, minorCategory),
	])

	return { transactions, monthlyTrend }
}
