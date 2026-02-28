"use server"

import { revalidatePath } from "next/cache"
import { PrismaBudgetRepository } from "@/server/repositories/prisma-budget.repository"
import { ManageBudgetUsecase } from "@/server/usecases/manage-budget.usecase"

type DeleteBudgetResult = {
	success: boolean
	error?: string
}

export async function deleteBudget(id: string): Promise<DeleteBudgetResult> {
	const usecase = new ManageBudgetUsecase(new PrismaBudgetRepository())
	await usecase.deleteBudget(id)

	revalidatePath("/dashboard")
	return { success: true }
}
