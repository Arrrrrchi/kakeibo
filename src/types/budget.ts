import type { BudgetCategoryMappingModel } from "@/generated/prisma/models/BudgetCategoryMapping"
import type { BudgetItemModel } from "@/generated/prisma/models/BudgetItem"
import type { CycleType } from "@/generated/prisma/enums"

export type BudgetItem = BudgetItemModel

export type BudgetCategoryMapping = BudgetCategoryMappingModel

export type BudgetItemWithMappings = BudgetItem & {
	mappings: BudgetCategoryMapping[]
}

export type BudgetFormData = {
	name: string
	monthlyAmount: number
	cycleType: CycleType
}
