"use server"

import { revalidatePath } from "next/cache"
import { PrismaMappingRepository } from "@/server/repositories/prisma-mapping.repository"
import { UpdateMappingUsecase } from "@/server/usecases/update-mapping.usecase"
import type { ActionResult } from "@/types/action"

export async function updateMappings(
	budgetItemId: string,
	categories: { majorCategory: string; minorCategory: string }[],
): Promise<ActionResult> {
	try {
		const usecase = new UpdateMappingUsecase(new PrismaMappingRepository())
		await usecase.execute(budgetItemId, categories)

		revalidatePath("/dashboard")
		return { success: true, data: undefined }
	} catch {
		return { success: false, error: "マッピングの更新に失敗しました" }
	}
}
