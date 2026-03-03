import "server-only";

import { prisma } from "@/server/lib/prisma";
import type { IMappingRepository } from "@/server/repositories/interfaces/mapping-repository.interface";
import type { BudgetCategoryMapping } from "@/types/budget";

export class PrismaMappingRepository implements IMappingRepository {
	async findByBudgetItemId(budgetItemId: string): Promise<BudgetCategoryMapping[]> {
		return prisma.budgetCategoryMapping.findMany({
			where: { budgetItemId },
		});
	}

	async replaceAll(
		budgetItemId: string,
		categories: { majorCategory: string; minorCategory: string }[],
	): Promise<void> {
		await prisma.$transaction([
			prisma.budgetCategoryMapping.deleteMany({
				where: { budgetItemId },
			}),
			...categories.map((cat) =>
				prisma.budgetCategoryMapping.create({
					data: {
						budgetItemId,
						majorCategory: cat.majorCategory,
						minorCategory: cat.minorCategory,
					},
				}),
			),
		]);
	}

	async findUnmappedCategories(
		allCategories: { majorCategory: string; minorCategory: string }[],
	): Promise<{ majorCategory: string; minorCategory: string }[]> {
		const mappedCategories = await prisma.budgetCategoryMapping.findMany({
			select: { majorCategory: true, minorCategory: true },
		});

		const mappedSet = new Set(mappedCategories.map((m) => `${m.majorCategory}|${m.minorCategory}`));

		return allCategories.filter((c) => !mappedSet.has(`${c.majorCategory}|${c.minorCategory}`));
	}
}
