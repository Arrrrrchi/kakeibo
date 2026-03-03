"use server";

import { revalidatePath } from "next/cache";
import { PrismaBudgetRepository } from "@/server/repositories/prisma-budget.repository";
import { ManageBudgetUsecase } from "@/server/usecases/manage-budget.usecase";
import type { ActionResult } from "@/types/action";

export async function deleteBudget(id: string): Promise<ActionResult> {
	try {
		const usecase = new ManageBudgetUsecase(new PrismaBudgetRepository());
		await usecase.deleteBudget(id);

		revalidatePath("/dashboard");
		return { success: true, data: undefined };
	} catch {
		return { success: false, error: "データの削除に失敗しました" };
	}
}
