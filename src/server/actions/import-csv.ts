"use server"

import { revalidatePath } from "next/cache"
import { parseMoneyforwardCsv } from "@/server/lib/csv-parser"
import { PrismaTransactionRepository } from "@/server/repositories/prisma-transaction.repository"
import { ImportTransactionsUsecase } from "@/server/usecases/import-transactions.usecase"
import type { ActionResult, FileResult, MultiImportResult } from "@/types/action"

const MAX_TOTAL_SIZE = 50 * 1024 * 1024

export async function importCsvFiles(formData: FormData): Promise<ActionResult<MultiImportResult>> {
	const files = formData.getAll("files") as File[]

	if (files.length === 0) {
		return { success: false, error: "ファイルが選択されていません" }
	}

	const totalSize = files.reduce((sum, f) => sum + f.size, 0)
	if (totalSize > MAX_TOTAL_SIZE) {
		return { success: false, error: "ファイルサイズが大きすぎます（合計上限50MB）" }
	}

	const usecase = new ImportTransactionsUsecase(new PrismaTransactionRepository())
	const fileResults: FileResult[] = []
	let totalImported = 0

	for (const file of files) {
		try {
			const buffer = Buffer.from(await file.arrayBuffer())
			const transactions = await parseMoneyforwardCsv(buffer)

			if (transactions.length === 0) {
				fileResults.push({
					fileName: file.name,
					success: false,
					error: "インポートできるデータがありませんでした",
				})
				continue
			}

			const importedCount = await usecase.execute(transactions)
			totalImported += importedCount
			fileResults.push({ fileName: file.name, success: true, importedCount })
		} catch {
			fileResults.push({
				fileName: file.name,
				success: false,
				error: "CSVファイルの形式が正しくありません",
			})
		}
	}

	if (totalImported === 0 && fileResults.every((r) => !r.success)) {
		return { success: false, error: "すべてのファイルでインポートできるデータがありませんでした" }
	}

	revalidatePath("/dashboard")
	return { success: true, data: { totalImported, fileResults } }
}
