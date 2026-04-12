import type { ITransactionRepository } from "@/server/repositories/interfaces/transaction-repository.interface";
import type { TransactionCategoryOption } from "@/types/transaction";

export class QueryTransactionCategoriesUsecase {
	constructor(private readonly repo: ITransactionRepository) {}

	async execute(): Promise<TransactionCategoryOption[]> {
		return this.repo.getDistinctCategories();
	}
}
