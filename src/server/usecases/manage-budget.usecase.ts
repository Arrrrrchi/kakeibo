import type { IBudgetRepository } from "@/server/repositories/interfaces/budget-repository.interface"
import type { BudgetFormData, BudgetItem } from "@/types/budget"

export class ManageBudgetUsecase {
	constructor(private readonly budgetRepository: IBudgetRepository) {}

	async createBudget(data: BudgetFormData): Promise<BudgetItem> {
		return this.budgetRepository.create(data)
	}

	async updateBudget(id: string, data: BudgetFormData): Promise<BudgetItem> {
		return this.budgetRepository.update(id, data)
	}

	async deleteBudget(id: string): Promise<void> {
		return this.budgetRepository.delete(id)
	}
}
