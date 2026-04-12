import "server-only";

import { PrismaTransactionRepository } from "@/server/repositories/prisma-transaction.repository";
import { QueryTransactionCategoriesUsecase } from "@/server/usecases/query-transaction-categories.usecase";
import type { TransactionCategoryOption } from "@/types/transaction";

export async function loadTransactionCategories(): Promise<TransactionCategoryOption[]> {
	const usecase = new QueryTransactionCategoriesUsecase(new PrismaTransactionRepository());
	return usecase.execute();
}
