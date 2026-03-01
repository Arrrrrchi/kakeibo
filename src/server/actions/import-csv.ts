"use server"

import { revalidatePath } from "next/cache"
import { parseMoneyforwardCsv } from "@/server/lib/csv-parser"
import { PrismaTransactionRepository } from "@/server/repositories/prisma-transaction.repository"
import { ImportTransactionsUsecase } from "@/server/usecases/import-transactions.usecase"
import type { ActionResult } from "@/types/action"

export async function importCsv(
	formData: FormData,
): Promise<ActionResult<{ importedCount: number }>> {
	const file = formData.get("file") as File | null
	if (!file) {
		return { success: false, error: "ファイルが選択されていません" }
	}

	if (file.size > 10 * 1024 * 1024) {
		return { success: false, error: "ファイルサイズが大きすぎます（上限10MB）" }
	}

	try {
		const buffer = Buffer.from(await file.arrayBuffer())
		const transactions = await parseMoneyforwardCsv(buffer)

		if (transactions.length === 0) {
			return { success: false, error: "インポートできるデータがありませんでした" }
		}

		const usecase = new ImportTransactionsUsecase(new PrismaTransactionRepository())
		const importedCount = await usecase.execute(transactions)

		revalidatePath("/dashboard")
		return { success: true, data: { importedCount } }
	} catch {
		return { success: false, error: "CSVファイルの形式が正しくありません" }
	}
}
