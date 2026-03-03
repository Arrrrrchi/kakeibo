"use server";

import { revalidatePath } from "next/cache";
import type { CycleType } from "@/generated/prisma/enums";
import { PrismaBudgetRepository } from "@/server/repositories/prisma-budget.repository";
import { ManageBudgetUsecase } from "@/server/usecases/manage-budget.usecase";
import type { ActionResult } from "@/types/action";

const VALID_CYCLE_TYPES: CycleType[] = [
	"monthly_fixed",
	"monthly_variable",
	"irregular_fixed",
	"irregular_variable",
];

export async function upsertBudget(formData: FormData): Promise<ActionResult> {
	const id = formData.get("id") as string | null;
	const name = (formData.get("name") as string).trim();
	const monthlyAmount = Number(formData.get("monthlyAmount"));
	const cycleType = formData.get("cycleType") as CycleType;

	if (!name || name.length > 50) {
		return { success: false, error: "費目名は1〜50文字で入力してください" };
	}
	if (!Number.isInteger(monthlyAmount) || monthlyAmount < 0) {
		return { success: false, error: "月額予算は0以上の整数で入力してください" };
	}
	if (!VALID_CYCLE_TYPES.includes(cycleType)) {
		return { success: false, error: "無効な周期タイプです" };
	}

	try {
		const usecase = new ManageBudgetUsecase(new PrismaBudgetRepository());

		if (id) {
			await usecase.updateBudget(id, { name, monthlyAmount, cycleType });
		} else {
			await usecase.createBudget({ name, monthlyAmount, cycleType });
		}

		revalidatePath("/dashboard");
		return { success: true, data: undefined };
	} catch {
		return { success: false, error: "データの保存に失敗しました" };
	}
}
