import type { ITransactionRepository } from "@/server/repositories/interfaces/transaction-repository.interface";
import type { TransactionCreateInput } from "@/types/transaction";

export class ImportTransactionsUsecase {
	constructor(private readonly transactionRepository: ITransactionRepository) {}

	async execute(transactions: TransactionCreateInput[]): Promise<number> {
		return this.transactionRepository.upsertMany(transactions);
	}
}
