"use server"

import { revalidatePath } from "next/cache"
import { parseMoneyforwardCsv } from "@/server/lib/csv-parser"
import { PrismaTransactionRepository } from "@/server/repositories/prisma-transaction.repository"
import { ImportTransactionsUsecase } from "@/server/usecases/import-transactions.usecase"

type ImportCsvResult = {
	success: boolean
	importedCount: number
	error?: string
}

export async function importCsv(formData: FormData): Promise<ImportCsvResult> {
	const file = formData.get("file") as File | null
	if (!file) {
		return { success: false, importedCount: 0, error: "ファイルが選択されていません" }
	}

	if (file.size > 10 * 1024 * 1024) {
		return { success: false, importedCount: 0, error: "ファイルサイズが大きすぎます" }
	}

	const buffer = Buffer.from(await file.arrayBuffer())
	const transactions = await parseMoneyforwardCsv(buffer)
	const usecase = new ImportTransactionsUsecase(new PrismaTransactionRepository())
	const importedCount = await usecase.execute(transactions)

	revalidatePath("/dashboard")
	return { success: true, importedCount }
}
