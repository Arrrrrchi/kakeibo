import type { IBudgetRepository } from "@/server/repositories/interfaces/budget-repository.interface"
import type { ITransactionRepository } from "@/server/repositories/interfaces/transaction-repository.interface"
import type { BudgetItemWithMappings } from "@/types/budget"
import type { Transaction } from "@/types/transaction"

export type BudgetDetail = {
	budgetItem: BudgetItemWithMappings
	transactions: Transaction[]
}

export class GetBudgetDetailUsecase {
	constructor(
		private readonly budgetRepository: IBudgetRepository,
		private readonly transactionRepository: ITransactionRepository,
	) {}

	async execute(budgetItemId: string): Promise<BudgetDetail | null> {
		const budgetItem = await this.budgetRepository.findById(budgetItemId)
		if (!budgetItem) return null

		const transactionsByCategory = await Promise.all(
			budgetItem.mappings.map((mapping) =>
				this.transactionRepository.findByCategory(
					mapping.majorCategory,
					mapping.minorCategory,
				),
			),
		)
		const transactions = transactionsByCategory.flat()

		return { budgetItem, transactions }
	}
}
