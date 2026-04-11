"use server";

import { PrismaTransactionRepository } from "@/server/repositories/prisma-transaction.repository";
import type { ActionResult } from "@/types/action";
import type { CategoryMapping } from "@/types/budget";
import type { Transaction } from "@/types/transaction";

export async function getTransactionsByBudgetItemMonth(
	mappings: CategoryMapping[],
	month: string,
): Promise<ActionResult<Transaction[]>> {
	try {
		const repo = new PrismaTransactionRepository();
		const results = await Promise.all(
			mappings.map((m) => repo.findByCategoryAndMonth(m.majorCategory, m.minorCategory, month)),
		);
		const transactions = results
			.flat()
			.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
		return { success: true, data: transactions };
	} catch {
		return { success: false, error: "取引データの取得に失敗しました" };
	}
}
