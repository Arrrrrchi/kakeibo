import "server-only"

import { prisma } from "@/server/lib/prisma"
import type { IBudgetRepository } from "@/server/repositories/interfaces/budget-repository.interface"
import type { BudgetFormData, BudgetItem, BudgetItemWithMappings } from "@/types/budget"

export class PrismaBudgetRepository implements IBudgetRepository {
	async findAll(): Promise<BudgetItem[]> {
		return prisma.budgetItem.findMany({
			orderBy: { sortOrder: "asc" },
		})
	}

	async findAllWithMappings(): Promise<BudgetItemWithMappings[]> {
		return prisma.budgetItem.findMany({
			include: { mappings: true },
			orderBy: { sortOrder: "asc" },
		})
	}

	async findById(id: string): Promise<BudgetItemWithMappings | null> {
		return prisma.budgetItem.findUnique({
			where: { id },
			include: { mappings: true },
		})
	}

	async create(data: BudgetFormData): Promise<BudgetItem> {
		return prisma.budgetItem.create({
			data: {
				name: data.name,
				monthlyAmount: data.monthlyAmount,
				cycleType: data.cycleType,
			},
		})
	}

	async update(id: string, data: BudgetFormData): Promise<BudgetItem> {
		return prisma.budgetItem.update({
			where: { id },
			data: {
				name: data.name,
				monthlyAmount: data.monthlyAmount,
				cycleType: data.cycleType,
			},
		})
	}

	async delete(id: string): Promise<void> {
		await prisma.budgetItem.delete({ where: { id } })
	}

	async updateSortOrder(items: { id: string; sortOrder: number }[]): Promise<void> {
		await prisma.$transaction(
			items.map((item) =>
				prisma.budgetItem.update({
					where: { id: item.id },
					data: { sortOrder: item.sortOrder },
				}),
			),
		)
	}
}
