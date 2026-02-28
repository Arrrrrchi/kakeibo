import type { BudgetCategoryMapping } from "@/types/budget"

export type IMappingRepository = {
	findByBudgetItemId(budgetItemId: string): Promise<BudgetCategoryMapping[]>
	replaceAll(
		budgetItemId: string,
		categories: { majorCategory: string; minorCategory: string }[],
	): Promise<void>
	findUnmappedCategories(
		allCategories: { majorCategory: string; minorCategory: string }[],
	): Promise<{ majorCategory: string; minorCategory: string }[]>
}
