"use server"

import { PrismaTransactionRepository } from "@/server/repositories/prisma-transaction.repository"
import type { ActionResult } from "@/types/action"
import type { Transaction } from "@/types/transaction"

type TransactionsByCategoryData = {
	transactions: Transaction[]
	monthlyTrend: { month: string; total: number }[]
}

export async function getTransactionsByCategory(
	majorCategory: string,
	minorCategory: string,
): Promise<ActionResult<TransactionsByCategoryData>> {
	try {
		const repo = new PrismaTransactionRepository()
		const [transactions, monthlyTrend] = await Promise.all([
			repo.findByCategory(majorCategory, minorCategory),
			repo.getMonthlyTrendByCategory(majorCategory, minorCategory),
		])

		return { success: true, data: { transactions, monthlyTrend } }
	} catch {
		return { success: false, error: "取引データの取得に失敗しました" }
	}
}
