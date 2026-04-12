"use server";

import { revalidatePath } from "next/cache";
import { PrismaTransactionRepository } from "@/server/repositories/prisma-transaction.repository";
import { ManageTransactionUsecase } from "@/server/usecases/manage-transaction.usecase";
import type { ActionResult } from "@/types/action";

export async function deleteTransaction(id: string): Promise<ActionResult<void>> {
	if (!id) {
		return { success: false, error: "取引IDが指定されていません" };
	}

	try {
		const usecase = new ManageTransactionUsecase(new PrismaTransactionRepository());
		await usecase.deleteTransaction(id);

		revalidatePath("/dashboard");
		return { success: true, data: undefined };
	} catch (error) {
		console.error(error);
		return { success: false, error: "取引の削除に失敗しました" };
	}
}
