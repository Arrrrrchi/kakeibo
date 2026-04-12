"use server";

import { revalidatePath } from "next/cache";
import { PrismaTransactionRepository } from "@/server/repositories/prisma-transaction.repository";
import { ManageTransactionUsecase } from "@/server/usecases/manage-transaction.usecase";
import type { ActionResult } from "@/types/action";
import type { Transaction, TransactionUpdateInput } from "@/types/transaction";

export async function updateTransaction(
	id: string,
	input: TransactionUpdateInput,
): Promise<ActionResult<Transaction>> {
	try {
		const usecase = new ManageTransactionUsecase(new PrismaTransactionRepository());
		const transaction = await usecase.updateTransaction(id, input);
		revalidatePath("/dashboard");
		return { success: true, data: transaction };
	} catch (error) {
		console.error(error);
		if (error instanceof Error) {
			return { success: false, error: error.message };
		}
		return { success: false, error: "取引の更新に失敗しました" };
	}
}
