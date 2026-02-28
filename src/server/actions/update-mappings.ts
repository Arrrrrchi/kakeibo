"use server"

import { revalidatePath } from "next/cache"
import { PrismaMappingRepository } from "@/server/repositories/prisma-mapping.repository"
import { UpdateMappingUsecase } from "@/server/usecases/update-mapping.usecase"

type UpdateMappingsResult = {
	success: boolean
	error?: string
}

export async function updateMappings(
	budgetItemId: string,
	categories: { majorCategory: string; minorCategory: string }[],
): Promise<UpdateMappingsResult> {
	const usecase = new UpdateMappingUsecase(new PrismaMappingRepository())
	await usecase.execute(budgetItemId, categories)

	revalidatePath("/dashboard")
	return { success: true }
}
